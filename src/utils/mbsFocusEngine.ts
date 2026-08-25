import { MBSQuote } from '../types';
import { decimalTo32nds } from './mbsCalculations';

export interface MbsFocusRegime {
  id: 'RALLY_LOW' | 'NORMAL_CURRENT' | 'BEAR_HIGH' | 'DEEP_RALLY';
  title: string;
  subtitle: string;
  lowKeyCoupon: number;
  coreKeyCoupon: number;
  upperKeyCoupon: number;
  lowerThreshold10Y: number; // 10Y yield below which we roll down to lower regime
  upperThreshold10Y: number; // 10Y yield above which we roll up to higher regime
  estimatedParMortgageRate: number;
  noteRateRangeLow: string;
  noteRateRangeCore: string;
  noteRateRangeUpper: string;
  traderFocusSummary: string;
}

export const MBS_FOCUS_REGIMES: Record<string, MbsFocusRegime> = {
  DEEP_RALLY: {
    id: 'DEEP_RALLY',
    title: 'Deep Rally Tier (4.5% / 5.0% / 5.5%)',
    subtitle: '10Y Yield < 3.70% — Refinance Wave Focus',
    lowKeyCoupon: 4.5,
    coreKeyCoupon: 5.0,
    upperKeyCoupon: 5.5,
    lowerThreshold10Y: 0,
    upperThreshold10Y: 3.70,
    estimatedParMortgageRate: 5.625,
    noteRateRangeLow: '5.125% – 5.375%',
    noteRateRangeCore: '5.625% – 5.875%',
    noteRateRangeUpper: '6.125% – 6.375%',
    traderFocusSummary: 'Sub-6% mortgage note rates active. Origination volume heavily concentrated in 5.0% par coupon.',
  },
  RALLY_LOW: {
    id: 'RALLY_LOW',
    title: 'Rally Transition Tier (5.0% / 5.5% / 6.0%)',
    subtitle: '10Y Yield 3.70% – 4.20% — Improving Market Regime',
    lowKeyCoupon: 5.0,
    coreKeyCoupon: 5.5,
    upperKeyCoupon: 6.0,
    lowerThreshold10Y: 3.70,
    upperThreshold10Y: 4.20,
    estimatedParMortgageRate: 6.125,
    noteRateRangeLow: '5.625% – 5.875%',
    noteRateRangeCore: '6.125% – 6.375%',
    noteRateRangeUpper: '6.625% – 6.875%',
    traderFocusSummary: 'MBS trading volume shifts down to 5.5% benchmark as retail mortgage rates approach 6.00%.',
  },
  NORMAL_CURRENT: {
    id: 'NORMAL_CURRENT',
    title: 'Current Production Tier (5.5% / 6.0% / 6.5%)',
    subtitle: '10Y Yield 4.20% – 4.75% — Primary Benchmark Regime',
    lowKeyCoupon: 5.5,
    coreKeyCoupon: 6.0,
    upperKeyCoupon: 6.5,
    lowerThreshold10Y: 4.20,
    upperThreshold10Y: 4.75,
    estimatedParMortgageRate: 6.625,
    noteRateRangeLow: '6.125% – 6.375%',
    noteRateRangeCore: '6.625% – 6.875%',
    noteRateRangeUpper: '7.125% – 7.375%',
    traderFocusSummary: 'Standard institutional desk benchmark. 6.0% is primary par coupon (closest to 101), 5.5% is discount cushion, 6.5% is premium credit.',
  },
  BEAR_HIGH: {
    id: 'BEAR_HIGH',
    title: 'High Yield Tier (6.0% / 6.5% / 7.0%)',
    subtitle: '10Y Yield > 4.75% — Elevated Yield Regime',
    lowKeyCoupon: 6.0,
    coreKeyCoupon: 6.5,
    upperKeyCoupon: 7.0,
    lowerThreshold10Y: 4.75,
    upperThreshold10Y: 9.99,
    estimatedParMortgageRate: 7.250,
    noteRateRangeLow: '6.625% – 6.875%',
    noteRateRangeCore: '7.125% – 7.375%',
    noteRateRangeUpper: '7.625% – 7.875%',
    traderFocusSummary: 'Bearish bond sell-off pushes secondary origination pricing to 6.5% par and 7.0% premium pools.',
  },
};

/**
 * Automatically determine the MBS focus regime from the 10Y Treasury yield
 */
export function getFocusRegimeByYield(y10Yield: number): MbsFocusRegime {
  if (y10Yield < 3.70) return MBS_FOCUS_REGIMES.DEEP_RALLY;
  if (y10Yield < 4.20) return MBS_FOCUS_REGIMES.RALLY_LOW;
  if (y10Yield <= 4.75) return MBS_FOCUS_REGIMES.NORMAL_CURRENT;
  return MBS_FOCUS_REGIMES.BEAR_HIGH;
}

/**
 * Generate the focused 3-coupon suite (Low Key, Core Key, Upper Key) for FNMA + GNMA + 10Y UST + Spread
 */
export function generateFocusedQuotes(
  regime: MbsFocusRegime,
  y10Yield: number = 4.660,
  y10ChangeBps: number = -4.4
): MBSQuote[] {
  const { lowKeyCoupon, coreKeyCoupon, upperKeyCoupon } = regime;

  // Calculate base price for core coupon based on yield & coupon relationship
  // Core coupon trading around 100.8 - 101.4
  // Change in MBS price is roughly proportional to 10Y yield drop: -1 bp on 10Y ≈ +4 to 5 bps on MBS
  const mbsDayChangeBps = Math.round(-y10ChangeBps * 3.8);
  const mbsDayChange32nds = Math.round(mbsDayChangeBps * 0.32);

  // Helper to build quote
  const buildQuote = (
    agency: 'FNMA' | 'GNMA',
    coupon: number,
    role: 'LOW_KEY' | 'CORE_KEY' | 'UPPER_KEY'
  ): MBSQuote => {
    const isFnma = agency === 'FNMA';
    const id = `${agency.toLowerCase()}${Math.round(coupon * 10)}`;
    const symbol = `${agency} 30Y ${coupon.toFixed(1)}%`;
    const roleLabel =
      role === 'CORE_KEY'
        ? 'Core Key Benchmark'
        : role === 'LOW_KEY'
        ? 'Low Key Cushion'
        : 'Upper Key Premium';
    const name = `${isFnma ? 'Fannie Mae' : 'Ginnie Mae II'} 30Y ${coupon.toFixed(1)}% (${roleLabel})`;

    // Price formula: Core is near 101.0. Each 0.5% coupon difference is ~1.5 - 1.8 points in price
    const diffFromCore = coupon - coreKeyCoupon;
    const agencyAdjustment = isFnma ? 0 : 0.35; // GNMA trades slightly higher due to govt guarantee
    const basePrice = 101.125 + diffFromCore * 3.125 + agencyAdjustment;
    
    // Spread adjustments
    const duration = +(3.8 - (coupon - 5.0) * 0.5).toFixed(1);
    const histOas = Math.round(22 - (coupon - 5.0) * 4);
    const yieldRate = +(y10Yield + (histOas / 100) - (coupon - 6.0) * 0.05).toFixed(3);
    const volBillions = role === 'CORE_KEY' ? (isFnma ? 6.8 : 1.62) : role === 'LOW_KEY' ? (isFnma ? 4.2 : 1.15) : (isFnma ? 5.4 : 1.45);

    const price = +basePrice.toFixed(4);
    const priceFormatted = decimalTo32nds(price);
    const change32nds = role === 'CORE_KEY' ? mbsDayChange32nds : role === 'LOW_KEY' ? mbsDayChange32nds + 3 : Math.max(1, mbsDayChange32nds - 2);
    const changeBps = +(change32nds / 0.32).toFixed(1);

    const highDec = price + 0.1875;
    const lowDec = price - 0.21875;
    const openDec = price - (change32nds / 32);

    return {
      id,
      symbol,
      name,
      agency,
      category: isFnma ? 'UMBS_30Y' : 'GNMA_30Y',
      price,
      priceFormatted,
      change32nds,
      changeBps,
      yieldRate,
      yieldChange: +(y10ChangeBps * 0.45).toFixed(1),
      duration,
      histOas,
      grossSpreadBps: histOas,
      volBillions,
      high: decimalTo32nds(highDec),
      low: decimalTo32nds(lowDec),
      open: decimalTo32nds(openDec),
      volume: `$${volBillions.toFixed(2)}B`,
      couponRate: coupon,
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' EST',
      sparkline: [
        +(price - 0.30).toFixed(2),
        +(price - 0.22).toFixed(2),
        +(price - 0.15).toFixed(2),
        +(price - 0.08).toFixed(2),
        +(price - 0.02).toFixed(2),
        +price.toFixed(2),
      ],
    };
  };

  const fnmaLow = buildQuote('FNMA', lowKeyCoupon, 'LOW_KEY');
  const fnmaCore = buildQuote('FNMA', coreKeyCoupon, 'CORE_KEY');
  const fnmaUpper = buildQuote('FNMA', upperKeyCoupon, 'UPPER_KEY');

  const gnmaLow = buildQuote('GNMA', lowKeyCoupon, 'LOW_KEY');
  const gnmaCore = buildQuote('GNMA', coreKeyCoupon, 'CORE_KEY');
  const gnmaUpper = buildQuote('GNMA', upperKeyCoupon, 'UPPER_KEY');

  const ust10Y: MBSQuote = {
    id: 'us-10y-treasury',
    symbol: '10Y TREASURY',
    name: 'US 10-Year Benchmark Treasury Yield',
    agency: 'UST',
    category: 'TREASURY',
    price: y10Yield,
    priceFormatted: `${y10Yield.toFixed(3)}%`,
    change32nds: y10ChangeBps < 0 ? -Math.round(Math.abs(y10ChangeBps)) : Math.round(y10ChangeBps),
    changeBps: y10ChangeBps,
    yieldRate: y10Yield,
    yieldChange: y10ChangeBps,
    duration: 8.5,
    grossSpreadBps: 0,
    high: `${(y10Yield + 0.045).toFixed(3)}%`,
    low: `${(y10Yield - 0.038).toFixed(3)}%`,
    open: `${(y10Yield - y10ChangeBps / 100).toFixed(3)}%`,
    volume: '$84B',
    couponRate: 4.50,
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' EST',
    sparkline: [
      +(y10Yield + 0.04).toFixed(3),
      +(y10Yield + 0.03).toFixed(3),
      +(y10Yield + 0.02).toFixed(3),
      +(y10Yield + 0.01).toFixed(3),
      +y10Yield.toFixed(3),
    ],
  };

  const mortgageSpread: MBSQuote = {
    id: 'mortgage-spread',
    symbol: 'PRIMARY SPREAD',
    name: 'Primary Mortgage vs 10Y UST Spread',
    agency: 'SPREAD',
    category: 'SPREAD',
    price: 2.34,
    priceFormatted: '+234 bps',
    change32nds: -1,
    changeBps: -1.5,
    yieldRate: 2.34,
    yieldChange: -1.5,
    duration: 0,
    grossSpreadBps: 234,
    high: '+238 bps',
    low: '+232 bps',
    open: '+235 bps',
    volume: 'N/A',
    couponRate: 0,
    lastUpdated: 'Live Market Open',
    sparkline: [236, 235, 235, 234, 234],
  };

  return [
    fnmaLow,
    fnmaCore,
    fnmaUpper,
    gnmaLow,
    gnmaCore,
    gnmaUpper,
    ust10Y,
    mortgageSpread,
  ];
}
