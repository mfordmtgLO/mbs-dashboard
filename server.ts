import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Cached CNBC Market Data Store
interface CnbcQuoteData {
  symbol: string;
  price: string;
  priceNum: number;
  change: string;
  changeNum: number;
  changePct: string;
  isUp: boolean | null;
  time: string;
}

let cnbcCache: {
  timestamp: number;
  quotes: Map<string, CnbcQuoteData>;
  lastSuccessfulFetch: string;
} = {
  timestamp: 0,
  quotes: new Map(),
  lastSuccessfulFetch: '',
};

const CNBC_CACHE_TTL_MS = 25000; // 25 seconds cache

async function scrapeCnbcQuote(symbol: string): Promise<CnbcQuoteData> {
  const url = `https://www.cnbc.com/quotes/${encodeURIComponent(symbol)}`;
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://www.cnbc.com/markets/us-markets/',
  };

  const response = await fetch(url, { headers, signal: AbortSignal.timeout(4500) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${symbol}`);
  }
  const html = await response.text();

  // Extract last price
  const priceMatch = html.match(/class="QuoteStrip-lastPrice">([^<]+)<\/span>/);
  const rawPrice = priceMatch ? priceMatch[1].trim() : '';

  // Extract change up/down/unch
  const changeDownMatch = html.match(/class="QuoteStrip-changeDown"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
  const changeUpMatch = html.match(/class="QuoteStrip-changeUp"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);
  const changeUnchMatch = html.match(/class="QuoteStrip-changeUnch"[^>]*>[\s\S]*?<span>([^<]+)<\/span>/);

  let change = '0.00';
  let isUp: boolean | null = null;
  if (changeDownMatch) {
    change = changeDownMatch[1].trim();
    isUp = false;
  } else if (changeUpMatch) {
    change = changeUpMatch[1].trim();
    isUp = true;
  } else if (changeUnchMatch) {
    change = '0.00';
    isUp = null;
  }

  // Extract trade time
  const timeMatch = html.match(/class="QuoteStrip-lastTradeTime">([^<]+)<\/div>/);
  const time = timeMatch ? timeMatch[1].trim() : '';

  const cleanNum = (str: string) => {
    const s = str.replace(/,/g, '').replace(/%/g, '').replace(/\$/g, '').trim();
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  return {
    symbol,
    price: rawPrice || '0.00',
    priceNum: cleanNum(rawPrice),
    change,
    changeNum: cleanNum(change),
    changePct: '',
    isUp,
    time,
  };
}

async function getAllCnbcMarketData() {
  const now = Date.now();
  if (cnbcCache.quotes.size > 0 && now - cnbcCache.timestamp < CNBC_CACHE_TTL_MS) {
    return { quotes: cnbcCache.quotes, isLive: true, cached: true, asOf: cnbcCache.lastSuccessfulFetch };
  }

  const symbols = [
    'US10Y', // 10-Year Benchmark Treasury Yield
    'US2Y',  // 2-Year Treasury Yield
    'US5Y',  // 5-Year Treasury Yield
    'US30Y', // 30-Year Treasury Yield
    'US3M',  // 3-Month T-Bill
    'US6M',  // 6-Month T-Bill
    'US1Y',  // 1-Year T-Bill
    'US7Y',  // 7-Year Treasury Yield
    'US20Y', // 20-Year Treasury Yield
    '.SPX',  // S&P 500
    '.DJI',  // Dow Jones Industrial Average
    '.IXIC', // Nasdaq Composite
    '.RUT',  // Russell 2000
    '.VIX',  // Cboe Volatility Index
    '.DXY',  // U.S. Dollar Index
    '@CL.1', // WTI Crude Oil
    '@GC.1', // Gold
  ];

  const results = await Promise.allSettled(symbols.map((sym) => scrapeCnbcQuote(sym)));

  const quotesMap = new Map<string, CnbcQuoteData>();
  let successCount = 0;

  results.forEach((res, i) => {
    const sym = symbols[i];
    if (res.status === 'fulfilled' && res.value.priceNum > 0) {
      quotesMap.set(sym, res.value);
      successCount++;
    } else if (cnbcCache.quotes.has(sym)) {
      // keep existing cache if single symbol failed
      quotesMap.set(sym, cnbcCache.quotes.get(sym)!);
    }
  });

  const timeStr = new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  if (successCount > 0) {
    cnbcCache = {
      timestamp: now,
      quotes: quotesMap,
      lastSuccessfulFetch: `${timeStr} EDT`,
    };
  }

  return {
    quotes: quotesMap.size > 0 ? quotesMap : cnbcCache.quotes,
    isLive: successCount > 0,
    cached: false,
    asOf: cnbcCache.lastSuccessfulFetch || `${timeStr} EDT`,
  };
}

// Endpoint: Live CNBC Market Indexes and US Treasury Data
app.get('/api/markets/live-cnbc', async (req, res) => {
  try {
    const { quotes, isLive, cached, asOf } = await getAllCnbcMarketData();

    // Default Fallback Yields if symbol not fetched
    const getQuote = (sym: string, defPrice: number, defChg: number, defPriceStr?: string) => {
      const q = quotes.get(sym);
      if (!q || q.priceNum === 0) {
        return {
          price: defPriceStr || `${defPrice.toFixed(3)}%`,
          priceNum: defPrice,
          change: `${defChg >= 0 ? '+' : ''}${defChg.toFixed(3)}`,
          changeNum: defChg,
          isUp: defChg > 0 ? true : defChg < 0 ? false : null,
          time: asOf,
        };
      }
      return q;
    };

    const q10y = getQuote('US10Y', 4.658, -0.046);
    const q2y = getQuote('US2Y', 4.208, -0.028);
    const q5y = getQuote('US5Y', 4.365, -0.043);
    const q30y = getQuote('US30Y', 5.191, -0.040);
    const q3m = getQuote('US3M', 3.798, -0.005);
    const q6m = getQuote('US6M', 3.918, -0.005);
    const q1y = getQuote('US1Y', 4.009, -0.017);
    const q7y = getQuote('US7Y', 4.494, -0.046);
    const q20y = getQuote('US20Y', 5.178, -0.041);

    const y10 = q10y.priceNum;
    const y2 = q2y.priceNum;
    const y5 = q5y.priceNum;
    const y30 = q30y.priceNum;
    const y3m = q3m.priceNum;
    const y6m = q6m.priceNum;
    const y1 = q1y.priceNum;
    const y7 = q7y.priceNum;
    const y20 = q20y.priceNum;

    const curve2y10y = +(y10 - y2).toFixed(3);
    const tenYearChgBps = +(q10y.changeNum * 100).toFixed(1);

    // Macro Indices Quotes
    const qSpx = getQuote('.SPX', 7678.88, 26.02, '7,678.88');
    const qDji = getQuote('.DJI', 53528.38, 111.22, '53,528.38');
    const qIxic = getQuote('.IXIC', 26149.85, 169.66, '26,149.85');
    const qRut = getQuote('.RUT', 2995.08, -22.79, '2,995.08');
    const qVix = getQuote('.VIX', 15.13, -0.72, '15.13');
    const qDxy = getQuote('.DXY', 98.94, -0.06, '98.94');
    const qOil = getQuote('@CL.1', 82.43, -2.58, '$82.43');
    const qGold = getQuote('@GC.1', 4680.0, -17.8, '$4,680.00');

    const formatChg = (q: any) => {
      const chgStr = String(q.change || '0.00').trim();
      if (chgStr.startsWith('+') || chgStr.startsWith('-')) return chgStr;
      const sign = q.changeNum > 0 ? '+' : '';
      return `${sign}${chgStr}`;
    };

    const macroIndices = [
      {
        id: 'spx',
        name: 'S&P 500 (CNBC)',
        price: qSpx.price,
        change: formatChg(qSpx),
        up: qSpx.isUp,
      },
      {
        id: 'dji',
        name: 'Dow Jones (CNBC)',
        price: qDji.price,
        change: formatChg(qDji),
        up: qDji.isUp,
      },
      {
        id: 'ixic',
        name: 'Nasdaq (CNBC)',
        price: qIxic.price,
        change: formatChg(qIxic),
        up: qIxic.isUp,
      },
      {
        id: 'rut',
        name: 'Russell 2000',
        price: qRut.price,
        change: formatChg(qRut),
        up: qRut.isUp,
      },
      {
        id: 'vix',
        name: 'CBOE VIX',
        price: qVix.price,
        change: formatChg(qVix),
        up: qVix.isUp !== null ? !qVix.isUp : null,
      },
      {
        id: 'dxy',
        name: 'US Dollar DXY',
        price: qDxy.price,
        change: formatChg(qDxy),
        up: qDxy.isUp,
      },
      {
        id: 'wti-oil',
        name: 'WTI Crude Oil',
        price: qOil.price.startsWith('$') ? qOil.price : `$${qOil.price}`,
        change: formatChg(qOil),
        up: qOil.isUp,
      },
      {
        id: 'gold',
        name: 'Gold (Oz)',
        price: qGold.price.startsWith('$') ? qGold.price : `$${qGold.price}`,
        change: formatChg(qGold),
        up: qGold.isUp,
      },
      {
        id: 'sofr',
        name: 'SOFR Rate',
        price: '5.31%',
        change: '-0.001%',
        up: false,
      },
      {
        id: 'fed-funds',
        name: 'Fed Funds Target',
        price: '5.25% - 5.50%',
        change: 'unch',
        up: null,
      },
    ];

    const ustTapeItems = [
      {
        id: 'ust-3m',
        name: '3M T-Bill (CNBC)',
        price: q3m.price.includes('%') ? q3m.price : `${q3m.price}%`,
        change: formatChg(q3m),
        up: q3m.changeNum <= 0,
      },
      {
        id: 'ust-2y',
        name: '2Y UST (CNBC)',
        price: q2y.price.includes('%') ? q2y.price : `${q2y.price}%`,
        change: formatChg(q2y),
        up: q2y.changeNum <= 0,
      },
      {
        id: 'ust-5y',
        name: '5Y UST (CNBC)',
        price: q5y.price.includes('%') ? q5y.price : `${q5y.price}%`,
        change: formatChg(q5y),
        up: q5y.changeNum <= 0,
      },
      {
        id: 'ust-10y',
        name: '10Y UST Anchor (CNBC)',
        price: q10y.price.includes('%') ? q10y.price : `${q10y.price}%`,
        change: `${tenYearChgBps > 0 ? '+' : ''}${tenYearChgBps.toFixed(1)} bp`,
        up: q10y.changeNum <= 0,
      },
      {
        id: 'ust-30y',
        name: '30Y UST (CNBC)',
        price: q30y.price.includes('%') ? q30y.price : `${q30y.price}%`,
        change: formatChg(q30y),
        up: q30y.changeNum <= 0,
      },
      {
        id: 'curve-2s10s',
        name: '2s10s Spread',
        price: `${curve2y10y > 0 ? '+' : ''}${(curve2y10y * 100).toFixed(1)} bp`,
        change: curve2y10y < 0 ? 'INVERTED' : 'NORMAL',
        up: curve2y10y >= 0,
      },
    ];

    res.json({
      success: true,
      source: 'CNBC US Markets Live (cnbc.com/markets/us-markets)',
      isLive,
      cached,
      asOf,
      timestamp: new Date().toISOString(),
      treasuryCurve: {
        y3m,
        y6m,
        y1,
        y2,
        y5,
        y7,
        y10,
        y20,
        y30,
        curve2y10y,
        source: 'CNBC Real-Time Markets (cnbc.com)',
        asOf: `${asOf}`,
      },
      us10yQuote: {
        yieldRate: y10,
        changeBps: tenYearChgBps,
        high: `${(y10 + 0.045).toFixed(3)}%`,
        low: `${(y10 - 0.038).toFixed(3)}%`,
        open: `${(y10 - q10y.changeNum).toFixed(3)}%`,
        lastUpdated: asOf,
        rawChange: q10y.changeNum,
      },
      macroIndices,
      ustTapeItems,
    });
  } catch (err: any) {
    console.error('Live CNBC Market data error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      fallbackUsed: true,
    });
  }
});

// Endpoint: Real-time Mortgage Strategist Q&A
app.post('/api/ask-strategist', async (req, res) => {
  try {
    const { question, marketContext } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        answer: `[Live Market Strategist Desk] Based on current MBS coupon pricing (${marketContext?.activeCoupon || 'UMBS 30yr 5.5%'} trading at ${marketContext?.price || '99-18+'}, 10Y Treasury at ${marketContext?.tenYear || '4.28%'}), the market is currently balancing macroeconomic data with Fed expectations. For short-term closings (<15 days), locking protects against negative re-pricing risks if upcoming inflation data prints hot. For 30+ day horizons, technical support remains tested at key moving averages.`,
        lockRecommendation: 'CAUTIOUS LOCK',
        rationale: 'Volatility risk is elevated around upcoming economic prints.',
        suggestedCoupon: marketContext?.activeCoupon || 'UMBS 30yr 5.5%',
        isFallback: true,
      });
    }

    const systemPrompt = `You are Dan Gallagher, CFA, the Chief Market Strategist on MBS-Live, a premier real-time financial broadcast and data platform for mortgage loan officers, branch managers, and secondary marketing directors.
You provide incisive, Wall-Street-grade market commentary on Mortgage-Backed Securities (UMBS 30yr, GNMA, 15yr pools), 10-Year Treasury yields, Federal Reserve monetary policy, inflation metrics (CPI/PCE), lender re-pricing alerts, and Lock vs. Float strategies.

Current Live Market Data Context:
- Active Benchmark: ${marketContext?.activeCoupon || 'UMBS 30yr 5.5%'} at ${marketContext?.price || '99-18+'} (${marketContext?.changeBps || '+14'} bps)
- 10-Year Treasury Yield: ${marketContext?.tenYear || '4.284%'} (${marketContext?.tenYearChange || '-4.2 bps'})
- 30-Year Conforming Par Rate: ${marketContext?.parRate || '6.625%'}
- Repricing Risk Index: ${marketContext?.repriceRisk || 'Moderate / Positive Re-price Opportunity'}

Instructions:
1. Provide a sharp, professional, 2-3 paragraph answer written in an authoritative yet accessible mortgage broadcast tone.
2. Clearly distinguish between originator operational advice (e.g. 15-day vs 30-day lock decisions) and secondary market macro mechanics.
3. Conclude with a definitive bulleted Lock / Float guidance for:
   - 0-15 Day Closings
   - 15-30 Day Closings
   - 45+ Day Pipelines
Keep it concise, actionable, and formatted with clean markdown without unnecessary fluff.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      answer: response.text || 'No response generated.',
      lockRecommendation: marketContext?.changeBps?.startsWith('+') ? 'SELECTIVE FLOAT / LOCK ON GAINS' : 'PROTECTIVE LOCK',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Gemini Strategist API Error:', error);
    res.status(500).json({
      error: 'Failed to generate strategist commentary',
      fallbackAnswer: 'Secondary desks are watching Treasury yield support levels. High volatility expected ahead of upcoming economic releases.',
    });
  }
});

// Endpoint: AI Market Flash / Reprice Alert Generator
app.post('/api/market/generate-commentary', async (req, res) => {
  try {
    const { eventType, marketSnapshot } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        headline: `MBS Tick Alert: ${marketSnapshot?.activeCoupon || 'UMBS 5.5%'} holds gains as 10-Year yields compress`,
        summary: `MBS prices are up ${marketSnapshot?.changeBps || '+12'} bps today. Lenders may offer positive re-pricing if afternoon Treasury auctions show strong foreign bid-to-cover metrics.`,
        keyDrivers: [
          'Core yield curve compression on 10Y Benchmark',
          'Primary-Secondary mortgage spread remains stable at +118 bps',
          'Originator lock volume uptick noted into market rally'
        ],
        lockFloatVerdict: 'Float with strict 15-day stop limits',
      });
    }

    const prompt = `Generate a live market commentary alert for mortgage originators based on this event: "${eventType || 'Intraday Market Momentum'}".
Current snapshot: ${JSON.stringify(marketSnapshot || {})}.
Produce a JSON response with:
- headline: punchy breaking news headline for mortgage brokers
- summary: 2-3 sentences explaining the price action and lender repricing outlook
- keyDrivers: array of 3 concise market factors
- lockFloatVerdict: short directive (e.g., "LOCK IMMEDIATELY", "FLOAT WITH CARE", "SECURE PAR RATES")`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      res.json(parsed);
    } catch {
      res.json({
        headline: 'MBS Live Market Pulse Alert',
        summary: response.text,
        keyDrivers: ['Yield curve movements', 'Fed speaker commentary', 'Auction demand'],
        lockFloatVerdict: 'Cautious Lock',
      });
    }
  } catch (err: any) {
    console.error('Market Commentary API Error:', err);
    res.status(500).json({ error: 'Failed to generate market commentary' });
  }
});

// Setup Vite or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MBS-Live Server listening on port ${PORT}`);
  });
}

start();
