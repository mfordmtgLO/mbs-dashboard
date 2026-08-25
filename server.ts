import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
