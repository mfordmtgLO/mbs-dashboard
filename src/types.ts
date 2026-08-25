export interface MBSQuote {
  id: string;
  symbol: string;
  name: string;
  agency?: 'FNMA' | 'FHLMC' | 'GNMA' | 'UST' | 'SPREAD';
  category: 'UMBS_30Y' | 'GNMA_30Y' | 'UMBS_15Y' | 'TREASURY' | 'SPREAD';
  price: number; // decimal representation e.g. 99.5625
  priceFormatted: string; // 32nds representation e.g. "99-18+"
  change32nds: number; // e.g. +14 (in 32nds)
  changeBps: number; // basis point change
  yieldRate: number; // yield %
  yieldChange: number; // yield change in bps
  duration?: number; // modified duration (e.g. 4.0)
  histOas?: number; // historical option-adjusted spread in bp (e.g. 23)
  grossSpreadBps?: number; // spread over 10Y CMT in bp
  volBillions?: number; // volume in $B e.g. 1.78
  high: string;
  low: string;
  open: string;
  volume: string;
  couponRate: number;
  lastUpdated: string;
  sparkline: number[];
}

export interface TreasuryCurveData {
  y3m: number | null;
  y6m?: number | null;
  y1?: number | null;
  y2: number | null;
  y5: number | null;
  y7?: number | null;
  y10: number | null;
  y20?: number | null;
  y30: number | null;
  curve2y10y?: number | null;
  source: string;
  asOf: string;
}

export interface MarketStory {
  id: string;
  tag: string;
  headline: string;
  summary: string;
  impact: 'bull' | 'bear' | 'neut';
  badge: string;
  timestamp: string;
  source?: string;
}

export interface TapeItem {
  id: string;
  name: string;
  price: string;
  change?: string;
  up?: boolean | null;
}

export interface IntradayCandle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma50?: number;
  sma200?: number;
  upperBand?: number;
  lowerBand?: number;
  priceFormatted?: string;
}

export interface LiveStreamHost {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  isSpeaking: boolean;
  status: 'online' | 'presenting' | 'co-host';
}

export interface CommentaryMessage {
  id: string;
  author: string;
  role: string;
  badge?: 'CHIEF_STRATEGIST' | 'SECONDARY_DESK' | 'TRADING_FLOOR' | 'REPRICING_ALERT' | 'FED_WATCH';
  timestamp: string;
  content: string;
  type: 'market_update' | 'reprice_alert' | 'lock_guidance' | 'economic_flash' | 'qa_shoutout';
  impact?: 'bullish' | 'bearish' | 'neutral' | 'critical';
  pinned?: boolean;
  likes: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundedAnalysis {
  query: string;
  headline: string;
  summary: string;
  keyDrivers: string[];
  lockFloatImpact: string;
  groundingSources: GroundingSource[];
  searchQueries: string[];
  timestamp: string;
}

export interface QAQuestion {
  id: string;
  authorName: string;
  authorTitle: string;
  authorCompany: string;
  authorLocation: string;
  question: string;
  category: 'Lock vs Float' | 'Fed Policy' | 'Repricing' | 'Jumbo/Non-QM' | 'Technical Analysis';
  upvotes: number;
  hasUpvoted?: boolean;
  status: 'answering_live' | 'answered' | 'queued';
  answerText?: string;
  answeredBy?: string;
  groundingSources?: GroundingSource[];
  timestamp: string;
  priority?: boolean;
}

export interface LivePoll {
  id: string;
  question: string;
  subtitle: string;
  category: string;
  options: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  totalVotes: number;
  userVotedId?: string;
  isActive: boolean;
}

export interface EconomicRelease {
  id: string;
  time: string;
  date: string;
  indicator: string;
  period: string;
  consensus: string;
  previous: string;
  actual?: string;
  impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  bondImpact: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'PENDING';
  notes: string;
}

export interface RepriceAlertConfig {
  thresholdBps: number;
  soundEnabled: boolean;
  autoLockReminder: boolean;
  pushNotifications: boolean;
}

export type TradingSessionType = 'LIVE_DAILY' | 'AFTER_HOURS';

export interface VolatilityAlert {
  id: string;
  direction: 'SPIKE_UP' | 'DROP_DOWN';
  session: TradingSessionType;
  sessionLabel: string;
  currentYield: number;
  baselineYield: number;
  deltaBps: number; // e.g. +3.4 or -3.6
  timestamp: string;
  headline: string;
  message: string;
  marketImpact: string;
  actionRecommendation: string;
  isRead?: boolean;
}

export type LockAdviceType = 'LOCK' | 'FLOAT' | 'SELECTIVE_LOCK' | 'LEAN_FLOAT' | 'AGGRESSIVE_LOCK';
export type LockOutcomeStatus = 'SOLID_ADVICE_WIN' | 'SUBOPTIMAL_LOSS' | 'PENDING_24H' | 'PROTECTIVE_WIN';
export type AiRiskStrategyMode = 'OPTIMAL_CONVICTION' | 'DEFENSIVE_RISK_MITIGATION';

export interface LockAdviceRecord {
  id: string;
  timestamp: string;
  isoDate: string;
  source: 'ASK_STRATEGIST' | 'QA_DESK' | 'BROADCAST_ALERT' | 'PIPELINE_CALC';
  author: string; // e.g. 'Dan Gallagher, CFA'
  questionOrScenario: string;
  loanDetails?: {
    loanAmount?: number;
    noteRate?: number;
    program?: 'Conventional' | 'FHA' | 'VA' | 'Jumbo' | 'USDA';
    closingDays?: number;
    borrowerName?: string;
  };
  advice: LockAdviceType;
  headlineDirective: string;
  rationale: string;
  mbsSymbol: string; // e.g. 'FNMA 30Y 6.0%'
  initialMbsPrice: number; // decimal e.g. 101.125
  initialMbsPriceFormatted: string; // e.g. '101-04'
  initial10YYield: number; // e.g. 4.660
  lookback24hPrice: number | null; // 24h later price
  lookback24hPriceFormatted: string | null;
  lookback24hYield: number | null;
  lookback24hChangeBps: number | null; // e.g. +14.5 or -18.2
  lookback24hChange32nds: number | null;
  outcomeStatus: LockOutcomeStatus;
  outcomeExplanation: string;
  loSatisfactionPct: number; // e.g. 96
  dollarImpactPer500k: number; // estimated gain / loss per $500k file
  weekIdentifier: string; // e.g. 'Week of Aug 18, 2026'
  groundingSources?: GroundingSource[];
}

export interface WeeklyAccuracyAverage {
  weekKey: string;
  weekLabel: string;
  totalEvaluated: number;
  wins: number;
  losses: number;
  accuracyPct: number;
  targetGoalPct: number; // 60.0
  isAboveTarget: boolean;
  floatWins: number;
  floatTotal: number;
  lockWins: number;
  lockTotal: number;
}

export interface LockAccuracyDatabaseSummary {
  totalEvaluated: number;
  totalWins: number;
  totalLosses: number;
  totalPending: number;
  overallAccuracyPct: number; // e.g. 78.4%
  targetGoalPct: number; // 60.0%
  isAboveTarget: boolean;
  floatAccuracyPct: number;
  lockAccuracyPct: number;
  netDollarBenefitPerFile: number;
  weeklyAverages: WeeklyAccuracyAverage[];
  currentRiskStrategyMode: AiRiskStrategyMode;
  riskStrategyTitle: string;
  riskStrategyDescription: string;
  suggestedPromptAdjustment: string;
}

export type LoanProgramType = 'Conventional' | 'FHA' | 'VA' | 'USDA RD' | 'Jumbo';

export interface CustomMbsWatchlist {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  couponIds: string[]; // e.g. ['umbs-30-50', 'umbs-30-55', 'umbs-30-60', 'umbs-30-65', 'umbs-30-70', 'gnma-30-55', 'gnma-30-60', 'umbs-15-50']
}

export interface ClientLoanClosingRecord {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  propertyAddress: string;
  loanAmount: number;
  purchasePrice: number;
  ltv: number;
  fundedDate: string; // YYYY-MM-DD
  interestRate: number; // e.g. 6.875%
  program: LoanProgramType;
  mbsCouponUsed: string; // e.g. 'UMBS 30yr 6.0%' or 'GNMA II 30yr 6.0%'
  fundedMbsPrice: number; // price at funded date (e.g. 99.75)
  fundedMbsPriceFormatted: string; // e.g. '99-24'
  currentMbsPrice: number; // live price today (e.g. 101.125)
  currentMbsPriceFormatted: string; // e.g. '101-04'
  mbsSpreadChangeBps: number; // e.g. +137.5 bps
  mbsSpreadChange32nds: number; // e.g. +44/32
  translatedRateChangePct: number; // e.g. -0.42% (rate dropped by 42 bps since closing)
  currentImpliedRefiRate: number; // e.g. 6.455%
  refiOpportunityFlag: boolean; // e.g. rate drop > 0.35% makes client hot for refi / cash-out
  monthlySavings: number; // estimated monthly payment savings if refinanced at current market
  annualSavings: number; // annual savings
  clientPhone?: string;
  clientEmail?: string;
  notes?: string;
}

