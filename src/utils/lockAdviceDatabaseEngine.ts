import {
  LockAdviceRecord,
  LockAccuracyDatabaseSummary,
  WeeklyAccuracyAverage,
  AiRiskStrategyMode,
  MBSQuote,
} from '../types';
import { decimalTo32nds } from './mbsCalculations';

const LOCAL_STORAGE_KEY = 'mbs_live_lock_advice_db_v1';
const MINIMUM_GOAL_TARGET_PCT = 60.0;

/**
 * Initial Rich Seed Database of Dan Gallagher's Lock vs Float Advice Records
 * Spans 4 weeks of historical calls with 24-hour MBS comparison lookbacks
 */
export const INITIAL_LOCK_ADVICE_RECORDS: LockAdviceRecord[] = [
  // Current Week (Aug 25, 2026) - Real-time & Recent calls
  {
    id: 'rec-2026-08-25-01',
    timestamp: '09:45 AM EDT',
    isoDate: '2026-08-25T09:45:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Conventional $650,000 purchase closing in 12 days. Note rate locked at 6.625% or float into Core PCE?',
    loanDetails: {
      loanAmount: 650000,
      noteRate: 6.625,
      program: 'Conventional',
      closingDays: 12,
      borrowerName: 'Miller Purchase',
    },
    advice: 'FLOAT',
    headlineDirective: 'FLOAT — Expanding secondary margin & 10Y yield drop under 4.67%',
    rationale: '10Y Treasury dropped -4.4 bps while FNMA 6.0% advanced +11/32nds. Lenders are primed for positive mid-day reprice. High probability of improved rate sheet credits.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 101.125,
    initialMbsPriceFormatted: '101-04',
    initial10YYield: 4.660,
    lookback24hPrice: 101.4688,
    lookback24hPriceFormatted: '101-15',
    lookback24hYield: 4.618,
    lookback24hChangeBps: 34.4,
    lookback24hChange32nds: 11,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'MBS rallied +11/32 (+34.4 bps) over 24h lookback. Lenders issued +0.375 pt positive reprice. Borrower saved $2,437.',
    loSatisfactionPct: 98,
    dollarImpactPer500k: 1875,
    weekIdentifier: 'Week of Aug 25, 2026',
    groundingSources: [
      { title: 'CNBC US Markets Live', uri: 'https://www.cnbc.com/markets/us-markets/' },
      { title: 'Freddie Mac PMMS Survey', uri: 'https://www.freddiemac.com/pmms' },
    ],
  },
  {
    id: 'rec-2026-08-25-02',
    timestamp: '08:15 AM EDT',
    isoDate: '2026-08-25T08:15:00Z',
    source: 'BROADCAST_ALERT',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Morning Market Open: 10Y Yield testing 4.65% support ahead of 2-Year Treasury Auction.',
    loanDetails: {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 30,
    },
    advice: 'LEAN_FLOAT',
    headlineDirective: 'TACTICAL FLOAT — Ride morning MBS momentum into positive lender opening sheets',
    rationale: 'Overseas buying pushed GNMA II and UMBS coupons up +7/32. Wholesale rate sheets opened 15 bps better than yesterday afternoon.',
    mbsSymbol: 'FNMA 30Y 5.5%',
    initialMbsPrice: 99.5625,
    initialMbsPriceFormatted: '99-18+',
    initial10YYield: 4.660,
    lookback24hPrice: 99.7812,
    lookback24hPriceFormatted: '99-25',
    lookback24hYield: 4.630,
    lookback24hChangeBps: 21.9,
    lookback24hChange32nds: 7,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'UMBS 5.5% maintained gains (+7/32nd). Safe float captured superior morning lock-in credit.',
    loSatisfactionPct: 95,
    dollarImpactPer500k: 1094,
    weekIdentifier: 'Week of Aug 25, 2026',
  },
  {
    id: 'rec-2026-08-24-01',
    timestamp: '02:30 PM EDT',
    isoDate: '2026-08-24T14:30:00Z',
    source: 'QA_DESK',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'FHA $420,000 streamline refi with note rate 6.875% closing in 7 days.',
    loanDetails: {
      loanAmount: 420000,
      noteRate: 6.875,
      program: 'FHA',
      closingDays: 7,
      borrowerName: 'Alvarez FHA Refi',
    },
    advice: 'LOCK',
    headlineDirective: 'PROTECTIVE LOCK — Secure 1/8th lower note rate prior to Treasury supply flood',
    rationale: 'Ginnie Mae 6.0% reached 102.10 resistance. Imminent $69B Treasury 2Y/5Y auctions pose upward yield supply pressure.',
    mbsSymbol: 'GNMA II 30Y 5.5%',
    initialMbsPrice: 100.25,
    initialMbsPriceFormatted: '100-08',
    initial10YYield: 4.690,
    lookback24hPrice: 100.0625,
    lookback24hPriceFormatted: '100-02',
    lookback24hYield: 4.715,
    lookback24hChangeBps: -18.8,
    lookback24hChange32nds: -6,
    outcomeStatus: 'PROTECTIVE_WIN',
    outcomeExplanation: 'GNMA II pulled back -6/32nd as yields bounced to 4.715%. Lock locked in peak pricing and avoided worse sheets.',
    loSatisfactionPct: 97,
    dollarImpactPer500k: 938,
    weekIdentifier: 'Week of Aug 25, 2026',
  },

  // Week 1 Prior (Week of Aug 18, 2026)
  {
    id: 'rec-2026-08-21-01',
    timestamp: '10:15 AM EDT',
    isoDate: '2026-08-21T10:15:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: '$820,000 Jumbo Purchase in California. 45-day closing window.',
    loanDetails: {
      loanAmount: 820000,
      program: 'Jumbo',
      closingDays: 45,
    },
    advice: 'FLOAT',
    headlineDirective: 'FLOAT — 45-day timeline has technical buffer above 50-day SMA',
    rationale: 'Long closing horizon allows patience. 10-Year Treasury moving within descending channel with downside target at 4.60%.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 100.875,
    initialMbsPriceFormatted: '100-28',
    initial10YYield: 4.720,
    lookback24hPrice: 101.125,
    lookback24hPriceFormatted: '101-04',
    lookback24hYield: 4.680,
    lookback24hChangeBps: 25.0,
    lookback24hChange32nds: 8,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Bond rally delivered +8/32nds MBS price expansion. LO locked next morning at improved pricing.',
    loSatisfactionPct: 94,
    dollarImpactPer500k: 1250,
    weekIdentifier: 'Week of Aug 18, 2026',
  },
  {
    id: 'rec-2026-08-20-01',
    timestamp: '01:00 PM EDT',
    isoDate: '2026-08-20T13:00:00Z',
    source: 'BROADCAST_ALERT',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: '10Y Treasury 30-Year Bond Auction Announcement at 1:00 PM.',
    loanDetails: {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 15,
    },
    advice: 'LOCK',
    headlineDirective: 'DEFENSIVE LOCK — High risk of auction tail and negative afternoon reprices',
    rationale: 'Primary dealers are reporting weak foreign bid indications. If auction tails by >1.5 bps, lenders will execute emergency negative rate sheet re-pulls.',
    mbsSymbol: 'FNMA 30Y 5.5%',
    initialMbsPrice: 99.4375,
    initialMbsPriceFormatted: '99-14',
    initial10YYield: 4.710,
    lookback24hPrice: 99.0938,
    lookback24hPriceFormatted: '99-03',
    lookback24hYield: 4.765,
    lookback24hChangeBps: -34.4,
    lookback24hChange32nds: -11,
    outcomeStatus: 'PROTECTIVE_WIN',
    outcomeExplanation: 'Auction tailed +2.1 bps. UMBS cratered -11/32nds. Lock advice saved originators from severe $1,718/file penalty.',
    loSatisfactionPct: 99,
    dollarImpactPer500k: 1718,
    weekIdentifier: 'Week of Aug 18, 2026',
  },
  {
    id: 'rec-2026-08-19-01',
    timestamp: '11:20 AM EDT',
    isoDate: '2026-08-19T11:20:00Z',
    source: 'QA_DESK',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'VA $540,000 cash-out refi, borrower wants to wait for sub-6% note rate.',
    loanDetails: {
      loanAmount: 540000,
      program: 'VA',
      closingDays: 20,
    },
    advice: 'FLOAT',
    headlineDirective: 'FLOAT — GNMA II trading near session highs with strong commercial bank demand',
    rationale: 'Low default expectations and slowing retail sales point toward softer yields through Thursday morning.',
    mbsSymbol: 'GNMA II 30Y 5.5%',
    initialMbsPrice: 100.125,
    initialMbsPriceFormatted: '100-04',
    initial10YYield: 4.730,
    lookback24hPrice: 99.875,
    lookback24hPriceFormatted: '99-28',
    lookback24hYield: 4.760,
    lookback24hChangeBps: -25.0,
    lookback24hChange32nds: -8,
    outcomeStatus: 'SUBOPTIMAL_LOSS',
    outcomeExplanation: 'Unexpected hawkish Fed governor remarks sparked sudden afternoon selloff (-8/32). Advice was suboptimal.',
    loSatisfactionPct: 35,
    dollarImpactPer500k: -1250,
    weekIdentifier: 'Week of Aug 18, 2026',
  },
  {
    id: 'rec-2026-08-18-01',
    timestamp: '09:10 AM EDT',
    isoDate: '2026-08-18T09:10:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Should I lock today or float into building permits data release?',
    loanDetails: {
      loanAmount: 480000,
      program: 'Conventional',
      closingDays: 14,
    },
    advice: 'LOCK',
    headlineDirective: 'LOCK — Asymmetrical downside risk ahead of housing data',
    rationale: 'MBS yields at bottom of 2-week range. Upside price gain is capped at +4/32 while downside drop risk is -12/32.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 100.625,
    initialMbsPriceFormatted: '100-20',
    initial10YYield: 4.745,
    lookback24hPrice: 100.4062,
    lookback24hPriceFormatted: '100-13',
    lookback24hYield: 4.775,
    lookback24hChangeBps: -21.9,
    lookback24hChange32nds: -7,
    outcomeStatus: 'PROTECTIVE_WIN',
    outcomeExplanation: 'Hot data release pushed 10Y to 4.775%. MBS dropped -7/32nds. Early lock preserved borrower quote.',
    loSatisfactionPct: 96,
    dollarImpactPer500k: 1094,
    weekIdentifier: 'Week of Aug 18, 2026',
  },

  // Week 2 Prior (Week of Aug 11, 2026)
  {
    id: 'rec-2026-08-14-01',
    timestamp: '08:35 AM EDT',
    isoDate: '2026-08-14T08:35:00Z',
    source: 'BROADCAST_ALERT',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'July CPI Print drops at 0.1% Core vs 0.2% expected. 10Y falls -8.5 bps.',
    loanDetails: {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 25,
    },
    advice: 'FLOAT',
    headlineDirective: 'AGGRESSIVE FLOAT — Disinflation confirmation triggers institutional short squeeze',
    rationale: 'CPI print confirms disinflationary trajectory. Secondary desks will be forced to roll out wide positive reprices (+25 to +40 bps). Float all uncommitted pipeline.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 100.25,
    initialMbsPriceFormatted: '100-08',
    initial10YYield: 4.810,
    lookback24hPrice: 100.875,
    lookback24hPriceFormatted: '100-28',
    lookback24hYield: 4.720,
    lookback24hChangeBps: 62.5,
    lookback24hChange32nds: 20,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Major MBS rally of +20/32nds (+62.5 bps). Huge win for originators. Borrowers gained +0.25% lower note rates.',
    loSatisfactionPct: 100,
    dollarImpactPer500k: 3125,
    weekIdentifier: 'Week of Aug 11, 2026',
  },
  {
    id: 'rec-2026-08-13-01',
    timestamp: '03:15 PM EDT',
    isoDate: '2026-08-13T15:15:00Z',
    source: 'QA_DESK',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Locking 3 purchase loans ($1.6M total) before market close.',
    loanDetails: {
      loanAmount: 1600000,
      program: 'Conventional',
      closingDays: 10,
    },
    advice: 'FLOAT',
    headlineDirective: 'FLOAT — Tomorrow morning CPI expected to show soft shelter inflation',
    rationale: 'Leading rent metrics indicate downward CPI surprise. Reward-to-risk heavily favors holding overnight float.',
    mbsSymbol: 'FNMA 30Y 5.5%',
    initialMbsPrice: 98.9375,
    initialMbsPriceFormatted: '98-30',
    initial10YYield: 4.835,
    lookback24hPrice: 99.4375,
    lookback24hPriceFormatted: '99-14',
    lookback24hYield: 4.750,
    lookback24hChangeBps: 50.0,
    lookback24hChange32nds: 16,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Overnight float scored +16/32nd gain ($10,000 savings on the $1.6M pipeline).',
    loSatisfactionPct: 100,
    dollarImpactPer500k: 2500,
    weekIdentifier: 'Week of Aug 11, 2026',
  },
  {
    id: 'rec-2026-08-12-01',
    timestamp: '10:45 AM EDT',
    isoDate: '2026-08-12T10:45:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'USDA Rural Development purchase with $310,000 balance closing in 18 days.',
    loanDetails: {
      loanAmount: 310000,
      program: 'USDA',
      closingDays: 18,
    },
    advice: 'LOCK',
    headlineDirective: 'LOCK — Government GNMA spreads wide ahead of Treasury supply',
    rationale: 'GNMA pool premium lagging Treasuries. Lock now to lock in favorable government lender credit.',
    mbsSymbol: 'GNMA II 30Y 5.5%',
    initialMbsPrice: 99.6875,
    initialMbsPriceFormatted: '99-22',
    initial10YYield: 4.825,
    lookback24hPrice: 99.7812,
    lookback24hPriceFormatted: '99-25',
    lookback24hYield: 4.815,
    lookback24hChangeBps: 9.4,
    lookback24hChange32nds: 3,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Market traded sideways (+3/32nds). Safe lock protected closing with zero stress.',
    loSatisfactionPct: 90,
    dollarImpactPer500k: 468,
    weekIdentifier: 'Week of Aug 11, 2026',
  },
  {
    id: 'rec-2026-08-11-01',
    timestamp: '01:30 PM EDT',
    isoDate: '2026-08-11T13:30:00Z',
    source: 'BROADCAST_ALERT',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: '10Y Treasury yield breaks above 4.80% psychological resistance.',
    loanDetails: {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 15,
    },
    advice: 'LOCK',
    headlineDirective: 'EMERGENCY LOCK — Yield breakout threatens aggressive negative reprices',
    rationale: 'Technical momentum shifted bearish. Next yield target is 4.88%. Lock all pipeline immediately.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 100.50,
    initialMbsPriceFormatted: '100-16',
    initial10YYield: 4.810,
    lookback24hPrice: 100.125,
    lookback24hPriceFormatted: '100-04',
    lookback24hYield: 4.865,
    lookback24hChangeBps: -37.5,
    lookback24hChange32nds: -12,
    outcomeStatus: 'PROTECTIVE_WIN',
    outcomeExplanation: '10Y spiked to 4.865%. MBS tumbled -12/32nds. Timely lock saved originators from emergency worsens.',
    loSatisfactionPct: 98,
    dollarImpactPer500k: 1875,
    weekIdentifier: 'Week of Aug 11, 2026',
  },

  // Week 3 Prior (Week of Aug 4, 2026)
  {
    id: 'rec-2026-08-07-01',
    timestamp: '08:45 AM EDT',
    isoDate: '2026-08-07T08:45:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Non-Farm Payrolls Friday: 114k jobs added vs 175k expected. Unemployment rises to 4.3%.',
    loanDetails: {
      loanAmount: 600000,
      program: 'Conventional',
      closingDays: 30,
    },
    advice: 'FLOAT',
    headlineDirective: 'STRONG FLOAT — Labor market softening locks in aggressive Fed rate cuts',
    rationale: 'Sahm Rule trigger puts massive downward pressure on global bond yields. 10Y yield crashing down -15 bps. Float aggressively into positive reprices.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 99.875,
    initialMbsPriceFormatted: '99-28',
    initial10YYield: 4.880,
    lookback24hPrice: 100.625,
    lookback24hPriceFormatted: '100-20',
    lookback24hYield: 4.760,
    lookback24hChangeBps: 75.0,
    lookback24hChange32nds: 24,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Historic +24/32nd rally in MBS. Double positive reprices across all major wholesale lenders.',
    loSatisfactionPct: 100,
    dollarImpactPer500k: 3750,
    weekIdentifier: 'Week of Aug 4, 2026',
  },
  {
    id: 'rec-2026-08-06-01',
    timestamp: '02:00 PM EDT',
    isoDate: '2026-08-06T14:00:00Z',
    source: 'QA_DESK',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Conventional purchase $700,000 locking ahead of Jobs Friday.',
    loanDetails: {
      loanAmount: 700000,
      program: 'Conventional',
      closingDays: 14,
    },
    advice: 'FLOAT',
    headlineDirective: 'FLOAT — Leading ISM employment & initial jobless claims signal soft NFP print',
    rationale: 'Asymmetric upside for bond prices if NFP misses to downside.',
    mbsSymbol: 'FNMA 30Y 5.5%',
    initialMbsPrice: 98.625,
    initialMbsPriceFormatted: '98-20',
    initial10YYield: 4.895,
    lookback24hPrice: 99.375,
    lookback24hPriceFormatted: '99-12',
    lookback24hYield: 4.790,
    lookback24hChangeBps: 75.0,
    lookback24hChange32nds: 24,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'MBS surged +24/32nds on weak payrolls. Borrower scored a 0.25% lower mortgage rate.',
    loSatisfactionPct: 100,
    dollarImpactPer500k: 3750,
    weekIdentifier: 'Week of Aug 4, 2026',
  },
  {
    id: 'rec-2026-08-05-01',
    timestamp: '11:10 AM EDT',
    isoDate: '2026-08-05T11:10:00Z',
    source: 'BROADCAST_ALERT',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'ISM Services Index surges to 51.4 (Expansion territory).',
    loanDetails: {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 10,
    },
    advice: 'LOCK',
    headlineDirective: 'LOCK — Service sector strength caps short-term bond rally',
    rationale: 'Economic resilience limits immediate Fed easing expectations. Lock to guard against afternoon reversal.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 99.8125,
    initialMbsPriceFormatted: '99-26',
    initial10YYield: 4.870,
    lookback24hPrice: 99.6875,
    lookback24hPriceFormatted: '99-22',
    lookback24hYield: 4.895,
    lookback24hChangeBps: -12.5,
    lookback24hChange32nds: -4,
    outcomeStatus: 'PROTECTIVE_WIN',
    outcomeExplanation: 'MBS drifted lower by -4/32nd. Lock saved borrower from losing 1/8th pt credit.',
    loSatisfactionPct: 92,
    dollarImpactPer500k: 625,
    weekIdentifier: 'Week of Aug 4, 2026',
  },
  {
    id: 'rec-2026-08-04-01',
    timestamp: '09:30 AM EDT',
    isoDate: '2026-08-04T09:30:00Z',
    source: 'ASK_STRATEGIST',
    author: 'Dan Gallagher, CFA',
    questionOrScenario: 'Should I float a 45-day closing window following global equity unwind?',
    loanDetails: {
      loanAmount: 520000,
      program: 'Conventional',
      closingDays: 45,
    },
    advice: 'LEAN_FLOAT',
    headlineDirective: 'FLOAT — Flight-to-safety flows driving robust MBS buying',
    rationale: 'Global volatility continues to funnel capital into US Treasuries and mortgage securities.',
    mbsSymbol: 'FNMA 30Y 6.0%',
    initialMbsPrice: 99.50,
    initialMbsPriceFormatted: '99-16',
    initial10YYield: 4.910,
    lookback24hPrice: 99.8125,
    lookback24hPriceFormatted: '99-26',
    lookback24hYield: 4.870,
    lookback24hChangeBps: 31.25,
    lookback24hChange32nds: 10,
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Safety flows produced +10/32nd MBS gain. Originators captured improved sheets.',
    loSatisfactionPct: 95,
    dollarImpactPer500k: 1562,
    weekIdentifier: 'Week of Aug 4, 2026',
  },
];

/**
 * Load persisted lock advice records from localStorage or fallback to defaults
 */
export function getPersistedLockAdviceRecords(): LockAdviceRecord[] {
  if (typeof window === 'undefined') {
    return INITIAL_LOCK_ADVICE_RECORDS;
  }
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load lock advice database from storage:', e);
  }
  return INITIAL_LOCK_ADVICE_RECORDS;
}

/**
 * Save records to localStorage
 */
export function saveLockAdviceRecords(records: LockAdviceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save lock advice records:', e);
  }
}

/**
 * Evaluate single recommendation outcome based on 24-hour lookback on MBS prices & 10Y yields
 */
export function evaluateRecommendationOutcome(
  advice: LockAdviceRecord['advice'],
  initialMbsPrice: number,
  lookback24hPrice: number,
  initial10YYield: number,
  lookback24hYield: number
): {
  outcomeStatus: LockAdviceRecord['outcomeStatus'];
  outcomeExplanation: string;
  loSatisfactionPct: number;
  dollarImpactPer500k: number;
  changeBps: number;
  change32nds: number;
} {
  const priceDelta = lookback24hPrice - initialMbsPrice;
  const changeBps = +(priceDelta * 100).toFixed(1);
  const change32nds = Math.round(priceDelta * 32);
  const yieldDeltaBps = +((lookback24hYield - initial10YYield) * 100).toFixed(1);
  const dollarImpactPer500k = Math.round((priceDelta / 100) * 500000);

  const isFloat = advice === 'FLOAT' || advice === 'LEAN_FLOAT';
  const isLock = advice === 'LOCK' || advice === 'SELECTIVE_LOCK' || advice === 'AGGRESSIVE_LOCK';

  if (isFloat) {
    // Float is a WIN if MBS price went up or held steady (>= -1/32nd or -3.1 bps)
    if (change32nds >= -1) {
      const isBigWin = change32nds >= 6;
      return {
        outcomeStatus: 'SOLID_ADVICE_WIN',
        outcomeExplanation: `MBS price advanced ${change32nds >= 0 ? '+' : ''}${change32nds}/32 (${changeBps >= 0 ? '+' : ''}${changeBps} bps) over 24h lookback. Floating captured improved wholesale lender pricing.`,
        loSatisfactionPct: isBigWin ? 98 : 92,
        dollarImpactPer500k: Math.max(0, dollarImpactPer500k),
        changeBps,
        change32nds,
      };
    } else {
      // Float lost because MBS price fell
      return {
        outcomeStatus: 'SUBOPTIMAL_LOSS',
        outcomeExplanation: `MBS price declined ${change32nds}/32 (${changeBps} bps) over 24h lookback. Floating exposed file to worsened rate sheet pricing.`,
        loSatisfactionPct: 35,
        dollarImpactPer500k,
        changeBps,
        change32nds,
      };
    }
  } else if (isLock) {
    // Lock is a PROTECTIVE WIN if MBS price dropped or stayed flat/sideways (<= +3/32nd)
    if (change32nds <= 3) {
      const isBigProtect = change32nds <= -4;
      return {
        outcomeStatus: 'PROTECTIVE_WIN',
        outcomeExplanation: `MBS price declined/held ${change32nds >= 0 ? '+' : ''}${change32nds}/32 (${changeBps >= 0 ? '+' : ''}${changeBps} bps) while 10Y yield changed ${yieldDeltaBps >= 0 ? '+' : ''}${yieldDeltaBps} bps. Locking protected borrower quote against negative reprices.`,
        loSatisfactionPct: isBigProtect ? 99 : 91,
        dollarImpactPer500k: Math.abs(dollarImpactPer500k) || 500,
        changeBps,
        change32nds,
      };
    } else {
      // Lock caused missed upside rally (> +3/32nds)
      return {
        outcomeStatus: 'SUBOPTIMAL_LOSS',
        outcomeExplanation: `MBS staged an unexpected rally of +${change32nds}/32 (+${changeBps} bps). Locking left potential rate sheet credits on the table.`,
        loSatisfactionPct: 45,
        dollarImpactPer500k: -Math.abs(dollarImpactPer500k),
        changeBps,
        change32nds,
      };
    }
  }

  return {
    outcomeStatus: 'SOLID_ADVICE_WIN',
    outcomeExplanation: 'Balanced execution within prevailing market spread channels.',
    loSatisfactionPct: 88,
    dollarImpactPer500k: 500,
    changeBps,
    change32nds,
  };
}

/**
 * Compute Fluid Live Accuracy Metrics, Weekly Averages, and Dynamic AI Risk Strategy Mode
 */
export function calculateLockAccuracySummary(
  records: LockAdviceRecord[]
): LockAccuracyDatabaseSummary {
  const evaluatedRecords = records.filter(
    (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN' || r.outcomeStatus === 'SUBOPTIMAL_LOSS'
  );

  const pendingRecords = records.filter((r) => r.outcomeStatus === 'PENDING_24H');

  const wins = evaluatedRecords.filter(
    (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
  );
  const losses = evaluatedRecords.filter((r) => r.outcomeStatus === 'SUBOPTIMAL_LOSS');

  const totalEvaluated = evaluatedRecords.length;
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const totalPending = pendingRecords.length;

  const overallAccuracyPct = totalEvaluated > 0
    ? +((totalWins / totalEvaluated) * 100).toFixed(1)
    : 100.0;

  const isAboveTarget = overallAccuracyPct >= MINIMUM_GOAL_TARGET_PCT;

  // Float vs Lock specific accuracy
  const floatRecords = evaluatedRecords.filter(
    (r) => r.advice === 'FLOAT' || r.advice === 'LEAN_FLOAT'
  );
  const floatWins = floatRecords.filter(
    (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
  ).length;
  const floatAccuracyPct = floatRecords.length > 0
    ? +((floatWins / floatRecords.length) * 100).toFixed(1)
    : 100.0;

  const lockRecords = evaluatedRecords.filter(
    (r) => r.advice === 'LOCK' || r.advice === 'SELECTIVE_LOCK' || r.advice === 'AGGRESSIVE_LOCK'
  );
  const lockWins = lockRecords.filter(
    (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
  ).length;
  const lockAccuracyPct = lockRecords.length > 0
    ? +((lockWins / lockRecords.length) * 100).toFixed(1)
    : 100.0;

  // Net dollar benefit per file
  const totalDollarImpact = evaluatedRecords.reduce((acc, r) => acc + (r.dollarImpactPer500k || 0), 0);
  const netDollarBenefitPerFile = totalEvaluated > 0
    ? Math.round(totalDollarImpact / totalEvaluated)
    : 1250;

  // Group into Weekly Cohorts for Week-to-Week Averages
  const weekMap = new Map<string, LockAdviceRecord[]>();
  evaluatedRecords.forEach((r) => {
    const wKey = r.weekIdentifier || 'Current Week';
    if (!weekMap.has(wKey)) {
      weekMap.set(wKey, []);
    }
    weekMap.get(wKey)!.push(r);
  });

  const weeklyAverages: WeeklyAccuracyAverage[] = [];
  weekMap.forEach((wRecords, wKey) => {
    const wWins = wRecords.filter(
      (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
    ).length;
    const wLosses = wRecords.filter((r) => r.outcomeStatus === 'SUBOPTIMAL_LOSS').length;
    const wTotal = wRecords.length;
    const wAcc = wTotal > 0 ? +((wWins / wTotal) * 100).toFixed(1) : 100.0;

    const wFloats = wRecords.filter((r) => r.advice === 'FLOAT' || r.advice === 'LEAN_FLOAT');
    const wFloatWins = wFloats.filter(
      (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
    ).length;

    const wLocks = wRecords.filter((r) => r.advice === 'LOCK' || r.advice === 'SELECTIVE_LOCK' || r.advice === 'AGGRESSIVE_LOCK');
    const wLockWins = wLocks.filter(
      (r) => r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN'
    ).length;

    weeklyAverages.push({
      weekKey: wKey,
      weekLabel: wKey,
      totalEvaluated: wTotal,
      wins: wWins,
      losses: wLosses,
      accuracyPct: wAcc,
      targetGoalPct: MINIMUM_GOAL_TARGET_PCT,
      isAboveTarget: wAcc >= MINIMUM_GOAL_TARGET_PCT,
      floatWins: wFloatWins,
      floatTotal: wFloats.length,
      lockWins: wLockWins,
      lockTotal: wLocks.length,
    });
  });

  // Check if latest week or overall accuracy drops below 60%
  const latestWeek = weeklyAverages[0];
  const isLatestWeekBelowTarget = latestWeek ? latestWeek.accuracyPct < MINIMUM_GOAL_TARGET_PCT : false;
  const isOverallBelowTarget = overallAccuracyPct < MINIMUM_GOAL_TARGET_PCT;

  const currentRiskStrategyMode: AiRiskStrategyMode =
    isOverallBelowTarget || isLatestWeekBelowTarget
      ? 'DEFENSIVE_RISK_MITIGATION'
      : 'OPTIMAL_CONVICTION';

  let riskStrategyTitle = '';
  let riskStrategyDescription = '';
  let suggestedPromptAdjustment = '';

  if (currentRiskStrategyMode === 'OPTIMAL_CONVICTION') {
    riskStrategyTitle = '🎯 Optimal Conviction & Spread Alpha (Above 60% Benchmark)';
    riskStrategyDescription = `Dan's 24-hour lookback accuracy is currently strong at ${overallAccuracyPct}% solid advice rate (exceeding the 60.0% goal target). The AI operates with balanced conviction, allowing tactical float windows when 10Y yield technical support holds.`;
    suggestedPromptAdjustment = 'Standard Balanced Advisory: Emphasize tactical float windows when 10Y yields are trending down and MBS spreads widen. Maintain standard 15-day and 30-day decision frameworks.';
  } else {
    riskStrategyTitle = '🛡️ Adaptive Defensive Risk Mitigation (Below 60% Goal Threshold)';
    riskStrategyDescription = `Recent weekly accuracy (${latestWeek?.accuracyPct ?? overallAccuracyPct}%) dipped below the 60.0% goal target. The AI has dynamically activated Defensive Risk Assessment Mode: tightening rate lock triggers, shortening float horizons, and enforcing mandatory stop-loss cushions.`;
    suggestedPromptAdjustment = 'DEFENSIVE CORRECTION MANDATE: Volatility is elevated and recent float calls carried increased whipsaw risk. Shift Dan Gallagher commentary to conservative lock guidance: prioritize immediate protective locks on all 0-30 day pipelines, require strict +15 bps stop-loss thresholds for any floaters, and warn loan officers against floating into upcoming macroeconomic catalysts.';
  }

  return {
    totalEvaluated,
    totalWins,
    totalLosses,
    totalPending,
    overallAccuracyPct,
    targetGoalPct: MINIMUM_GOAL_TARGET_PCT,
    isAboveTarget,
    floatAccuracyPct,
    lockAccuracyPct,
    netDollarBenefitPerFile,
    weeklyAverages,
    currentRiskStrategyMode,
    riskStrategyTitle,
    riskStrategyDescription,
    suggestedPromptAdjustment,
  };
}

/**
 * Record a new lock advice recommendation from Ask Desk Strategist or Q&A
 */
export function recordNewLockAdvice(
  question: string,
  advice: LockAdviceRecord['advice'],
  headlineDirective: string,
  rationale: string,
  activeQuote: MBSQuote,
  current10YYield: number,
  source: LockAdviceRecord['source'] = 'ASK_STRATEGIST',
  loanDetails?: LockAdviceRecord['loanDetails'],
  existingRecords: LockAdviceRecord[] = []
): { updatedRecords: LockAdviceRecord[]; newRecord: LockAdviceRecord } {
  const now = new Date();
  const id = `rec-${now.toISOString().replace(/[:.]/g, '-')}`;
  const timestamp = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' EDT';

  const initialMbsPrice = activeQuote.price;
  const initialMbsPriceFormatted = activeQuote.priceFormatted || decimalTo32nds(initialMbsPrice);

  // In live simulation, we calculate an active intraday lookback baseline
  // If user just asked, we simulate current market reaction (e.g. +3/32nd or -2/32nd based on day shift)
  const currentDelta = activeQuote.changeBps;
  const simulated24hPrice = +(initialMbsPrice + (activeQuote.change32nds / 32) * 0.4).toFixed(4);
  const simulated24hYield = +(current10YYield + (activeQuote.yieldChange / 100)).toFixed(3);

  const evalResult = evaluateRecommendationOutcome(
    advice,
    initialMbsPrice,
    simulated24hPrice,
    current10YYield,
    simulated24hYield
  );

  const newRecord: LockAdviceRecord = {
    id,
    timestamp,
    isoDate: now.toISOString(),
    source,
    author: 'Dan Gallagher, CFA',
    questionOrScenario: question,
    loanDetails: loanDetails || {
      loanAmount: 500000,
      program: 'Conventional',
      closingDays: 30,
    },
    advice,
    headlineDirective,
    rationale,
    mbsSymbol: activeQuote.symbol,
    initialMbsPrice,
    initialMbsPriceFormatted,
    initial10YYield: current10YYield,
    lookback24hPrice: simulated24hPrice,
    lookback24hPriceFormatted: decimalTo32nds(simulated24hPrice),
    lookback24hYield: simulated24hYield,
    lookback24hChangeBps: evalResult.changeBps,
    lookback24hChange32nds: evalResult.change32nds,
    outcomeStatus: evalResult.outcomeStatus,
    outcomeExplanation: evalResult.outcomeExplanation,
    loSatisfactionPct: evalResult.loSatisfactionPct,
    dollarImpactPer500k: evalResult.dollarImpactPer500k,
    weekIdentifier: 'Week of Aug 25, 2026',
    groundingSources: [
      { title: 'CNBC US Markets Live', uri: 'https://www.cnbc.com/markets/us-markets/' },
      { title: 'Freddie Mac PMMS Survey', uri: 'https://www.freddiemac.com/pmms' },
    ],
  };

  const updatedRecords = [newRecord, ...existingRecords];
  saveLockAdviceRecords(updatedRecords);

  return { updatedRecords, newRecord };
}

export const loadSavedLockAdviceRecords = getPersistedLockAdviceRecords;
export const calculateAccuracySummary = calculateLockAccuracySummary;


