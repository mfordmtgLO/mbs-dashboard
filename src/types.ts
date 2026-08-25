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
