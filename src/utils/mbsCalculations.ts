/**
 * Mortgage-Backed Securities (MBS) Financial Conversion and Utilities
 */

// Convert decimal to standard Wall Street 32nds fractional notation (e.g., 99.515625 -> "99-16+")
export function decimalTo32nds(price: number): string {
  const whole = Math.floor(price);
  const remainder = price - whole;
  const in32nds = remainder * 32;
  const whole32nds = Math.floor(in32nds);
  const fracOf32 = in32nds - whole32nds;

  let plusOrTick = '';
  if (fracOf32 >= 0.7) {
    plusOrTick = '+'; // 1/2 of 32nd (often written with '+')
  } else if (fracOf32 >= 0.4) {
    plusOrTick = '+';
  } else if (fracOf32 >= 0.2) {
    plusOrTick = '';
  }

  const padded32 = whole32nds.toString().padStart(2, '0');
  return `${whole}-${padded32}${plusOrTick}`;
}

// Convert 32nds notation back to decimal
export function parse32nds(notation: string): number {
  const parts = notation.trim().split('-');
  if (parts.length !== 2) return parseFloat(notation) || 100;
  const whole = parseInt(parts[0], 10);
  let fracPart = parts[1];
  let half = 0;
  if (fracPart.endsWith('+')) {
    half = 0.5;
    fracPart = fracPart.slice(0, -1);
  }
  const thirtySeconds = parseInt(fracPart, 10) + half;
  return whole + thirtySeconds / 32;
}

// Format Basis Points
export function formatBps(bps: number): string {
  const prefix = bps > 0 ? '+' : '';
  return `${prefix}${bps.toFixed(1)} bps`;
}

export function formatChange32nds(change32nds: number): string {
  const prefix = change32nds > 0 ? '+' : '';
  const abs = Math.abs(change32nds);
  const whole = Math.floor(abs);
  const frac = abs - whole >= 0.5 ? '+' : '';
  return `${prefix}${whole}/32${frac}`;
}

// Compute Dollar Impact on specific loan amount
export function computeLoanDollarImpact(loanAmount: number, changeBps: number): {
  dollarValue: number;
  rateEquivalent: number;
  monthlyPmtImpact: number;
} {
  // 100 bps = 1.00% of loan balance in discount points / lender credit
  const dollarValue = (loanAmount * (changeBps / 100)) / 100;
  // Approximate rule of thumb: ~35-40 bps in price moves note rate by 1/8th (0.125%)
  const rateEquivalent = (changeBps / 30) * 0.125;
  
  // Approximate monthly payment impact on a standard 30yr fixed (roughly $6.50 per $1k balance at ~6.5%)
  const monthlyPmtImpact = (loanAmount / 1000) * (rateEquivalent * 0.65);

  return {
    dollarValue,
    rateEquivalent,
    monthlyPmtImpact: Math.abs(monthlyPmtImpact),
  };
}

// Compute model-derived MBS price based on 10Y Benchmark Yield, Duration, and OAS
export function deriveMbsPrice(coupon: number, duration: number, y10Yield: number, histOasBp: number): number {
  const mbsYield = y10Yield + histOasBp / 100;
  const rawPrice = 100 + duration * (coupon - mbsYield);
  return Math.max(70, Math.min(116, rawPrice));
}

// Deep Analysis: Synthesize 10Y Treasury Yield + MBS Coupon Pricing into Reprice Risk and Mortgage Rate Direction
export interface RepriceAnalysisResult {
  status: 'POSITIVE_REPRICE' | 'NEUTRAL_HOLD' | 'NEGATIVE_REPRICE_RISK';
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  headline: string;
  rateOutlook: 'Likely to Drop / Improve' | 'Neutral / Steady' | 'Likely to Rise / Worsen';
  rateOutlookColor: string;
  repriceProbability: number;
  originatorGuidance: string;
  explanation: string;
  tenYearAssessment: string;
  mbsAssessment: string;
  estimatedRateSheetShift: string;
}

export function analyze10yAndMbsRepriceOutlook(
  y10Yield: number,
  y10ChangeBps: number,
  mbsChangeBps: number
): RepriceAnalysisResult {
  // Financial truth:
  // 1. Yield down (negative changeBps on 10Y) + MBS price up (positive changeBps on MBS) = POSITIVE REPRICE / IMPROVING RATES
  // 2. Yield up (positive changeBps on 10Y) + MBS price down (negative changeBps on MBS) = NEGATIVE REPRICE RISK / WORSENING RATES

  const isYieldDown = y10ChangeBps < -0.5;
  const isYieldUp = y10ChangeBps > 0.5;
  const isMbsUp = mbsChangeBps > 2.0;
  const isMbsDown = mbsChangeBps < -2.0;

  if (isYieldDown || isMbsUp) {
    const strength = Math.min(95, Math.round(55 + Math.abs(y10ChangeBps) * 4 + Math.max(0, mbsChangeBps) * 0.8));
    const isStrong = Math.abs(y10ChangeBps) >= 3.0 || mbsChangeBps >= 10.0;

    return {
      status: 'POSITIVE_REPRICE',
      badgeColor: 'text-green-400',
      badgeBg: 'bg-green-950/80',
      badgeBorder: 'border-green-700/80',
      headline: isStrong
        ? 'High Probability of Positive Lender Reprice (Rates Improving)'
        : 'Positive Rate Sheet Bias (Favorable Float Conditions)',
      rateOutlook: 'Likely to Drop / Improve',
      rateOutlookColor: 'text-green-400',
      repriceProbability: strength,
      originatorGuidance: 'FLOAT STRATEGY ACTIVE — Lenders likely to reissue improved rate sheets with lower rates/points.',
      explanation: `The 10-Year Treasury yield is down ${Math.abs(y10ChangeBps).toFixed(1)} bps to ${y10Yield.toFixed(3)}% while MBS coupon prices are ${mbsChangeBps >= 0 ? '+' : ''}${mbsChangeBps.toFixed(1)} bps higher. Falling bond yields combined with rising MBS prices expand lender origination margins, driving primary mortgage rates lower and opening windows for positive mid-day reprices.`,
      tenYearAssessment: `10Y Yield at ${y10Yield.toFixed(3)}% (${y10ChangeBps.toFixed(1)} bps) — Bullish downward yield trajectory`,
      mbsAssessment: `MBS Coupons up +${Math.max(0, mbsChangeBps).toFixed(1)} bps (+${Math.max(0, Math.round(mbsChangeBps * 0.32))}/32nds) — Wholesale pricing gaining strength`,
      estimatedRateSheetShift: `~0.050% to 0.125% lower note rate (or +0.15 to +0.35 in lender credit / price improvement)`,
    };
  }

  if (isYieldUp || isMbsDown) {
    const strength = Math.min(95, Math.round(55 + Math.abs(y10ChangeBps) * 4 + Math.abs(Math.min(0, mbsChangeBps)) * 0.8));
    const isSevere = y10ChangeBps >= 3.0 || mbsChangeBps <= -10.0;

    return {
      status: 'NEGATIVE_REPRICE_RISK',
      badgeColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/80',
      badgeBorder: 'border-rose-700/80',
      headline: isSevere
        ? 'High Negative Reprice Risk Alert (Rates Worsening)'
        : 'Cautious Negative Reprice Warning',
      rateOutlook: 'Likely to Rise / Worsen',
      rateOutlookColor: 'text-rose-400',
      repriceProbability: strength,
      originatorGuidance: 'LOCK FLOATING LOANS — Protect pipeline against worsening mid-day rate sheet pullbacks.',
      explanation: `The 10-Year Treasury yield surged +${y10ChangeBps.toFixed(1)} bps to ${y10Yield.toFixed(3)}% while MBS coupon prices declined ${mbsChangeBps.toFixed(1)} bps. Rising bond yields compress lender margins, forcing secondary desks to recall rate sheets and reissue higher interest rates or increased discount points.`,
      tenYearAssessment: `10Y Yield at ${y10Yield.toFixed(3)}% (+${y10ChangeBps.toFixed(1)} bps) — Bearish yield spike`,
      mbsAssessment: `MBS Coupons down ${mbsChangeBps.toFixed(1)} bps (${Math.round(mbsChangeBps * 0.32)}/32nds) — Pipeline value deteriorating`,
      estimatedRateSheetShift: `~0.050% to 0.125% higher note rate (or -0.15 to -0.35 in lender price worsening)`,
    };
  }

  return {
    status: 'NEUTRAL_HOLD',
    badgeColor: 'text-amber-400',
    badgeBg: 'bg-amber-950/80',
    badgeBorder: 'border-amber-700/80',
    headline: 'Stable Range-Bound Market (Low Immediate Reprice Risk)',
    rateOutlook: 'Neutral / Steady',
    rateOutlookColor: 'text-amber-400',
    repriceProbability: 25,
    originatorGuidance: 'HOLD / TARGETED LOCK — Yields and MBS prices holding tight within standard morning baseline bands.',
    explanation: `The 10-Year Treasury yield (${y10Yield.toFixed(3)}%) and MBS coupon prices are fluctuating within tight daily thresholds (±1-2 bps). Lenders will likely hold morning rate sheets without intraday changes unless afternoon Treasury auctions or Fed commentary breaks the channel.`,
    tenYearAssessment: `10Y Yield steady at ${y10Yield.toFixed(3)}% (${y10ChangeBps >= 0 ? '+' : ''}${y10ChangeBps.toFixed(1)} bps)`,
    mbsAssessment: `MBS Coupons steady (${mbsChangeBps >= 0 ? '+' : ''}${mbsChangeBps.toFixed(1)} bps)`,
    estimatedRateSheetShift: 'No immediate rate sheet changes anticipated',
  };
}

// Parse Treasury.gov Daily XML Feed
export function parseTreasuryXml(xmlText: string) {
  try {
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    if (!entries.length) return null;
    const last = entries[entries.length - 1];

    function getVal(tag: string): number | null {
      for (const t of [tag, 'd:' + tag, 'm:' + tag]) {
        const el = last.querySelector(t);
        if (el && el.textContent?.trim()) {
          const val = parseFloat(el.textContent);
          if (!isNaN(val)) return val;
        }
      }
      const nl = last.getElementsByTagName(tag);
      if (nl.length && nl[0].textContent) {
        const val = parseFloat(nl[0].textContent);
        if (!isNaN(val)) return val;
      }
      return null;
    }

    const y10 = getVal('BC_10YEAR');
    if (y10 === null) return null;

    const y2 = getVal('BC_2YEAR');
    const y3m = getVal('BC_3MONTH');
    const y5 = getVal('BC_5YEAR');
    const y30 = getVal('BC_30YEAR');
    const y6m = getVal('BC_6MONTH');
    const y1 = getVal('BC_1YEAR');
    const y7 = getVal('BC_7YEAR');
    const y20 = getVal('BC_20YEAR');

    const dateEl = last.querySelector('NEW_DATE') || last.querySelector('d\\:NEW_DATE');
    const dateStr = dateEl?.textContent?.slice(0, 10) || 'Today';

    return {
      y3m,
      y6m,
      y1,
      y2,
      y5,
      y7,
      y10,
      y20,
      y30,
      curve2y10y: y2 !== null ? +(y10 - y2).toFixed(3) : null,
      source: 'treasury.gov LIVE',
      asOf: dateStr,
    };
  } catch (err) {
    console.warn('Failed to parse Treasury XML:', err);
    return null;
  }
}

// Generate realistic initial intraday candlestick dataset for MBS 5.5% coupon
export function generateIntradayData(basePrice: number = 99.50, numPoints: number = 40) {
  const data = [];
  let currentPrice = basePrice;
  const startTime = new Date();
  startTime.setHours(8, 0, 0, 0); // 8:00 AM Eastern market open

  for (let i = 0; i < numPoints; i++) {
    const time = new Date(startTime.getTime() + i * 15 * 60 * 1000); // 15-min intervals
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Random walk with mean reversion
    const delta = (Math.random() - 0.48) * 0.08;
    const open = currentPrice;
    const close = +(open + delta).toFixed(4);
    const high = +(Math.max(open, close) + Math.random() * 0.04).toFixed(4);
    const low = +(Math.min(open, close) - Math.random() * 0.04).toFixed(4);
    const volume = Math.floor(1200 + Math.random() * 3400);

    currentPrice = close;

    data.push({
      time: timeStr,
      timestamp: time.getTime(),
      open,
      high,
      low,
      close,
      volume,
      priceFormatted: decimalTo32nds(close),
    });
  }

  // Calculate moving averages & Bollinger bands
  for (let i = 0; i < data.length; i++) {
    const slice5 = data.slice(Math.max(0, i - 5), i + 1);
    const slice15 = data.slice(Math.max(0, i - 15), i + 1);
    
    const avg5 = slice5.reduce((sum, d) => sum + d.close, 0) / slice5.length;
    const avg15 = slice15.reduce((sum, d) => sum + d.close, 0) / slice15.length;
    
    const variance = slice5.reduce((sum, d) => sum + Math.pow(d.close - avg5, 2), 0) / slice5.length;
    const stdDev = Math.sqrt(variance);

    (data[i] as any).sma50 = +avg5.toFixed(4);
    (data[i] as any).sma200 = +avg15.toFixed(4);
    (data[i] as any).upperBand = +(avg5 + stdDev * 1.8).toFixed(4);
    (data[i] as any).lowerBand = +(avg5 - stdDev * 1.8).toFixed(4);
  }

  return data;
}
