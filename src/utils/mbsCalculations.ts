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
