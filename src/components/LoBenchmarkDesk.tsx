import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Shield,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  Layers,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Lock,
  Compass,
  Scale,
  Check,
  AlertTriangle,
  Flame,
  Info,
} from 'lucide-react';
import { MBSQuote, TreasuryCurveData } from '../types';
import { computeLoanDollarImpact, decimalTo32nds, analyze10yAndMbsRepriceOutlook } from '../utils/mbsCalculations';

interface LoBenchmarkDeskProps {
  quotes: MBSQuote[];
  treasuryCurve: TreasuryCurveData;
  selectedQuoteId: string;
  onSelectQuote: (id: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LoBenchmarkDesk: React.FC<LoBenchmarkDeskProps> = ({
  quotes,
  treasuryCurve,
  selectedQuoteId,
  onSelectQuote,
  onNavigateToTab,
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [displayMode, setDisplayMode] = useState<'32nds' | 'decimal'>('32nds');

  // Key Trading Instruments
  const tenYearUst = quotes.find((q) => q.id === 'us-10y-treasury') || {
    id: 'us-10y-treasury',
    symbol: '10Y TREASURY',
    name: 'US 10-Year Benchmark Treasury Yield',
    price: treasuryCurve.y10 ?? 4.660,
    priceFormatted: `${(treasuryCurve.y10 ?? 4.660).toFixed(3)}%`,
    change32nds: -4,
    changeBps: -4.4,
    yieldRate: treasuryCurve.y10 ?? 4.660,
    yieldChange: -4.4,
    high: '4.705%',
    low: '4.622%',
    sparkline: [4.70, 4.69, 4.68, 4.67, 4.66, 4.660],
    agency: 'UST',
    category: 'TREASURY' as const,
  };

  // Conventional Fannie Mae 30Y Coupons: 5.5, 6.0, 6.5
  const fnma55 = quotes.find((q) => q.id === 'fnma55' || q.symbol === 'FNMA 30Y 5.5%');
  const fnma60 = quotes.find((q) => q.id === 'fnma60' || q.symbol === 'FNMA 30Y 6.0%');
  const fnma65 = quotes.find((q) => q.id === 'fnma65' || q.symbol === 'FNMA 30Y 6.5%');

  // Government Ginnie Mae II 30Y Coupons: 5.5, 6.0, 6.5
  const gnma55 = quotes.find((q) => q.id === 'gnma55' || q.symbol === 'GNMA II 30Y 5.5%');
  const gnma60 = quotes.find((q) => q.id === 'gnma60' || q.symbol === 'GNMA II 30Y 6.0%');
  const gnma65 = quotes.find((q) => q.id === 'gnma65' || q.symbol === 'GNMA II 30Y 6.5%');

  const current10Y = treasuryCurve.y10 ?? tenYearUst.yieldRate ?? 4.660;
  const is10YDown = (tenYearUst.changeBps || 0) <= 0; // yields dropping is GREEN for MBS / loan pricing

  // Core benchmark MBS coupon for composite reprice calculation (FNMA 6.0% or 5.5%)
  const coreMbs = fnma60 || fnma55 || quotes.find((q) => q.agency === 'FNMA') || quotes[0];
  const coreMbsChangeBps = coreMbs?.changeBps ?? (is10YDown ? 15.4 : -12.0);

  // Deep Analysis synthesis
  const repriceOutlook = analyze10yAndMbsRepriceOutlook(
    current10Y,
    tenYearUst.changeBps || 0,
    coreMbsChangeBps
  );

  const presetAmounts = [300000, 450000, 500000, 650000, 800000, 1000000];

  const formatPrice = (q?: MBSQuote) => {
    if (!q) return '—';
    if (displayMode === '32nds') return q.priceFormatted || decimalTo32nds(q.price);
    return q.price.toFixed(3);
  };

  const renderCouponCard = (
    quote: MBSQuote | undefined,
    couponRate: string,
    targetNoteRate: string,
    isCorePar: boolean,
    agencyLabel: 'CONVENTIONAL' | 'GOVERNMENT'
  ) => {
    if (!quote) return null;
    const isSelected = quote.id === selectedQuoteId;
    const isUp = quote.change32nds >= 0;
    const impact = computeLoanDollarImpact(loanAmount, quote.changeBps);

    const isGov = agencyLabel === 'GOVERNMENT';
    const accentColor = isGov ? 'text-teal-400' : 'text-blue-400';
    const tagBg = isGov ? 'bg-teal-950/60 border-teal-700/50 text-teal-300' : 'bg-blue-950/60 border-blue-700/50 text-blue-300';

    return (
      <div
        id={`lo-coupon-card-${quote.id}`}
        onClick={() => onSelectQuote(quote.id)}
        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group ${
          isSelected
            ? 'bg-[#1e1b0a] border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-1 ring-[#FFD700]'
            : isCorePar
            ? 'bg-[#151515] hover:bg-[#1a1a1a] border-[#FFD700]/40 shadow-md'
            : 'bg-[#111111] hover:bg-[#161616] border-[#252525]'
        }`}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <span className="font-mono font-extrabold text-sm text-white">{quote.symbol}</span>
            {isCorePar && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50 tracking-wider">
                CORE PAR
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${tagBg}`}>
            Note: {targetNoteRate}
          </span>
        </div>

        {/* Live Price & Day Movement */}
        <div className="flex items-baseline justify-between gap-2 my-1.5">
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400">TBA Price</div>
            <div className="text-xl font-extrabold font-mono text-white tracking-tight flex items-baseline gap-1.5">
              <span>{formatPrice(quote)}</span>
              <span className="text-[11px] font-normal text-gray-400">({quote.yieldRate.toFixed(3)}% yld)</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-mono text-gray-400">Day Shift</div>
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                isUp
                  ? 'bg-green-950/80 text-green-400 border border-green-700/60'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              <span>{isUp ? '+' : ''}{quote.change32nds}/32</span>
              <span className="ml-1 opacity-80 text-[10px]">({isUp ? '+' : ''}{quote.changeBps.toFixed(1)} bp)</span>
            </div>
          </div>
        </div>

        {/* Loan Officer Dollar Impact Pill */}
        <div className="mt-2.5 pt-2 border-t border-[#222222] flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">
            Impact on ${(loanAmount / 1000).toFixed(0)}k file:
          </span>
          <span
            className={`font-mono font-bold text-xs ${
              isUp ? 'text-green-400' : 'text-rose-400'
            }`}
          >
            {isUp ? '+' : '-'}${Math.abs(Math.round(impact.dollarValue)).toLocaleString()}
            <span className="text-[10px] text-gray-400 font-normal ml-1">
              ({isUp ? 'pricing gain' : 'cost increase'})
            </span>
          </span>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex items-center text-[#FFD700] text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            ACTIVE
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#0e0e0e] rounded-2xl border-2 border-[#FFD700]/30 shadow-2xl overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171407] via-[#111111] to-[#0c0c0c] border-b border-[#2a2612] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] shadow-md shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FFD700] text-black font-mono font-extrabold text-[10px] uppercase tracking-wider">
                LOAN OFFICER TRADING DESK
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                CORE PRODUCTION SUITE
              </span>
              <span className="px-2 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-800 text-[10px] font-mono font-bold">
                ● LIVE TICK FEED
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
              10Y Treasury & Core 5.5, 6.0, 6.5 Production Coupons
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 max-w-2xl">
              Real-time benchmark movements driving today's wholesale rate sheets for Conventional (Fannie 30Y) and Government (Ginnie II 30Y FHA/VA) originations.
            </p>
          </div>
        </div>

        {/* Global LO Configs: Pipeline Loan Amount & Display Format */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Loan Sizer */}
          <div className="flex items-center space-x-1.5 bg-[#141414] p-1.5 rounded-xl border border-[#292929]">
            <DollarSign className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">File Sizer:</span>
            <select
              id="lo-loan-amount-select"
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="bg-[#0a0a0a] text-white text-xs font-mono font-bold px-2 py-1 rounded-lg border border-[#333333] focus:outline-none focus:border-[#FFD700] cursor-pointer"
            >
              {presetAmounts.map((amt) => (
                <option key={amt} value={amt}>
                  ${(amt / 1000).toFixed(0)}k Loan
                </option>
              ))}
            </select>
          </div>

          {/* 32nds vs Decimal */}
          <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#292929] text-xs">
            <button
              id="lo-toggle-32nds"
              onClick={() => setDisplayMode('32nds')}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                displayMode === '32nds'
                  ? 'bg-[#FFD700] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              32nds
            </button>
            <button
              id="lo-toggle-decimal"
              onClick={() => setDisplayMode('decimal')}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                displayMode === 'decimal'
                  ? 'bg-[#FFD700] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Decimal
            </button>
          </div>
        </div>
      </div>

      {/* Deep Analysis: 10Y Yield & MBS Coupon Dual-Signal Correlation & Reprice Desk */}
      <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#0c0c0c]/80">
        <div className="bg-gradient-to-r from-[#141414] via-[#161616] to-[#121212] rounded-xl border border-[#2c2c2c] p-4 sm:p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#242424]">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
                  10Y Treasury & MBS Reprice Dynamics Analysis
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                    DUAL SIGNAL ENGINE
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Synthesized correlation of benchmark yields and wholesale MBS pricing for mortgage loan originators.
                </p>
              </div>
            </div>

            {/* Reprice Status Badge */}
            <div className="flex items-center space-x-2">
              <div
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold flex items-center space-x-2 ${repriceOutlook.badgeBg} ${repriceOutlook.badgeBorder} ${repriceOutlook.badgeColor}`}
              >
                {repriceOutlook.status === 'POSITIVE_REPRICE' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : repriceOutlook.status === 'NEGATIVE_REPRICE_RISK' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Info className="w-4 h-4 text-amber-400" />
                )}
                <span>{repriceOutlook.headline}</span>
              </div>
            </div>
          </div>

          {/* Dual Signal Comparison & Strategic Outcome Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-3.5">
            {/* Signal 1: 10Y Benchmark UST */}
            <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#202020] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-gray-400 font-bold">Signal 1: 10Y Benchmark</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    is10YDown
                      ? 'bg-green-950 text-green-300 border border-green-800/60'
                      : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  }`}
                >
                  {is10YDown ? 'YIELD DOWN (BULLISH)' : 'YIELD UP (BEARISH)'}
                </span>
              </div>
              <div className="text-lg font-mono font-extrabold text-white flex items-baseline justify-between">
                <span>{current10Y.toFixed(3)}%</span>
                <span className={`text-xs font-bold ${is10YDown ? 'text-green-400' : 'text-rose-400'}`}>
                  {tenYearUst.changeBps > 0 ? '+' : ''}{tenYearUst.changeBps.toFixed(1)} bps
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                {is10YDown
                  ? 'Lower Treasury yield lowers the cost of capital, reducing rate sheet note rates.'
                  : 'Higher Treasury yield drives bond yields up and pressures rate sheets.'}
              </p>
            </div>

            {/* Signal 2: Production MBS Coupons */}
            <div className="p-3.5 rounded-xl bg-[#0e0e0e] border border-[#202020] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-mono text-gray-400 font-bold">Signal 2: 30Y MBS Coupons</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    coreMbsChangeBps >= 0
                      ? 'bg-green-950 text-green-300 border border-green-800/60'
                      : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  }`}
                >
                  {coreMbsChangeBps >= 0 ? 'PRICE UP (BULLISH)' : 'PRICE DOWN (BEARISH)'}
                </span>
              </div>
              <div className="text-lg font-mono font-extrabold text-white flex items-baseline justify-between">
                <span>{coreMbs?.symbol || 'FNMA 30Y 6.0%'}</span>
                <span className={`text-xs font-bold ${coreMbsChangeBps >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {coreMbsChangeBps >= 0 ? '+' : ''}{coreMbs?.change32nds ?? 5}/32 (+{coreMbsChangeBps.toFixed(1)} bp)
                </span>
              </div>
              <p className="text-[11px] text-gray-400 leading-tight">
                {coreMbsChangeBps >= 0
                  ? 'Higher MBS coupon prices increase wholesale secondary value, improving lender credits.'
                  : 'Lower MBS coupon prices erode lender margins and increase borrower costs.'}
              </p>
            </div>

            {/* Synthesis: Combined Market Consequence */}
            <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2c2c2c] space-y-1.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono text-[#FFD700] font-bold">Rate Sheet Forecast</span>
                  <span className="text-[10px] font-mono text-gray-400">Confidence: {repriceOutlook.repriceProbability}%</span>
                </div>
                <div className="text-sm font-mono font-extrabold mt-1">
                  <span className={repriceOutlook.rateOutlookColor}>
                    Mortgage Rates: {repriceOutlook.rateOutlook}
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-[#202020] text-[11px] text-gray-300 font-mono">
                Est. Rate Sheet Shift: <strong className="text-white">{repriceOutlook.estimatedRateSheetShift}</strong>
              </div>
            </div>
          </div>

          {/* Deep Narrative Explanation */}
          <div className="p-3 rounded-lg bg-[#080808] border border-[#1e1e1e] flex items-start space-x-2.5 text-xs text-gray-300 leading-relaxed">
            <Info className="w-4 h-4 text-[#FFD700] shrink-0 mt-0.5" />
            <div>
              <p>{repriceOutlook.explanation}</p>
              <div className="mt-1 font-mono text-[11px] text-[#FFD700] font-bold">
                RECOMMENDED STRATEGY: {repriceOutlook.originatorGuidance}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Pillar Grids: 10Y Benchmark UST | Conventional Fannie Mae | Government Ginnie Mae */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Pillar 1: 🏛️ US 10-Year Benchmark Treasury (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#121212] rounded-xl border border-[#262626] p-4 flex flex-col justify-between shadow-lg">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
                <span className="font-mono font-extrabold text-sm text-white">US 10Y BENCHMARK</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-950/60 text-green-300 border border-green-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                CNBC LIVE
              </span>
            </div>

            {/* Yield Large Callout */}
            <div className="my-4">
              <div className="text-xs uppercase font-mono text-gray-400">10-Year Treasury Yield</div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  {current10Y.toFixed(3)}%
                </div>
                <div
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                    is10YDown
                      ? 'bg-green-950/80 text-green-400 border border-green-700/60'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
                  }`}
                >
                  {is10YDown ? (
                    <TrendingDown className="w-4 h-4 mr-1 text-green-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-1 text-rose-400" />
                  )}
                  <span>{tenYearUst.changeBps > 0 ? '+' : ''}{tenYearUst.changeBps.toFixed(1)} bps</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {is10YDown ? (
                  <span className="text-green-400 font-semibold">
                    ▼ 10Y Yield falling & MBS coupons rising = Mortgage rates dropping/improving (Positive reprice opportunity)
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold">
                    ▲ 10Y Yield surging & MBS coupons falling = Mortgage rates rising/worsening (Negative reprice risk)
                  </span>
                )}
              </p>
            </div>

            {/* 10Y Quick Technical Metrics */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#222222] text-center font-mono">
              <div>
                <div className="text-[9px] uppercase text-gray-500">Day Open</div>
                <div className="text-xs font-bold text-gray-200">{tenYearUst.open || '4.704%'}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-500">Day Low</div>
                <div className="text-xs font-bold text-green-400">{tenYearUst.low || '4.622%'}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-gray-500">Day High</div>
                <div className="text-xs font-bold text-rose-400">{tenYearUst.high || '4.705%'}</div>
              </div>
            </div>

            {/* Par Mortgage Correlation Box */}
            <div className="mt-3.5 p-3 rounded-lg bg-[#161616] border border-[#262626] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">Est. 30Y Primary Par:</span>
                <span className="text-[#FFD700] font-mono font-bold">~6.625%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">Primary Spread vs 10Y:</span>
                <span className="text-blue-400 font-mono font-bold">+234 bps</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">2Y / 10Y Curve Spread:</span>
                <span className="text-purple-400 font-mono font-bold">
                  {treasuryCurve.curve2y10y !== null && treasuryCurve.curve2y10y !== undefined
                    ? `${treasuryCurve.curve2y10y > 0 ? '+' : ''}${treasuryCurve.curve2y10y.toFixed(3)}%`
                    : '-0.128%'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Select 10Y */}
          <button
            id="btn-select-10y-benchmark"
            onClick={() => onSelectQuote('us-10y-treasury')}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              selectedQuoteId === 'us-10y-treasury'
                ? 'bg-[#FFD700] text-black shadow-md'
                : 'bg-[#1c1c1c] text-gray-300 hover:bg-[#252525] border border-[#333333]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{selectedQuoteId === 'us-10y-treasury' ? '10Y Selected for Chart' : 'Inspect 10Y Chart & Spreads'}</span>
          </button>
        </div>

        {/* Pillar 2: 🔵 Conventional Fannie Mae 30Y (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#121212] rounded-xl border border-[#262626] p-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="font-mono font-extrabold text-sm text-white">CONVENTIONAL 30Y</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                FANNIE MAE UMBS
              </span>
            </div>

            {/* Coupons: 5.5%, 6.0%, 6.5% */}
            <div className="space-y-2.5">
              {renderCouponCard(fnma55, '5.5%', '6.125% – 6.375%', false, 'CONVENTIONAL')}
              {renderCouponCard(fnma60, '6.0%', '6.625% – 6.875%', true, 'CONVENTIONAL')}
              {renderCouponCard(fnma65, '6.5%', '7.125% – 7.375%', false, 'CONVENTIONAL')}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-400 font-mono bg-[#0c0c0c] p-2 rounded-lg border border-[#1f1f1f] flex items-center justify-between">
            <span>Primary Conventional Driver:</span>
            <span className="text-[#FFD700] font-bold">FNMA 6.0% (Core Par)</span>
          </div>
        </div>

        {/* Pillar 3: 🔴 Government Ginnie Mae II 30Y FHA/VA (4 cols on lg) */}
        <div className="lg:col-span-4 bg-[#121212] rounded-xl border border-[#262626] p-4 flex flex-col justify-between shadow-lg">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                <span className="font-mono font-extrabold text-sm text-white">GOVERNMENT 30Y</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950/80 text-teal-300 border border-teal-800/60">
                GINNIE MAE II (FHA/VA)
              </span>
            </div>

            {/* Coupons: 5.5%, 6.0%, 6.5% */}
            <div className="space-y-2.5">
              {renderCouponCard(gnma55, '5.5%', '5.875% – 6.125%', false, 'GOVERNMENT')}
              {renderCouponCard(gnma60, '6.0%', '6.375% – 6.625%', true, 'GOVERNMENT')}
              {renderCouponCard(gnma65, '6.5%', '6.875% – 7.125%', false, 'GOVERNMENT')}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-gray-400 font-mono bg-[#0c0c0c] p-2 rounded-lg border border-[#1f1f1f] flex items-center justify-between">
            <span>Primary Government Driver:</span>
            <span className="text-teal-400 font-bold">GNMA II 6.0% (Core Par)</span>
          </div>
        </div>

      </div>

      {/* Bottom Quick-Action Bar for Loan Officers */}
      <div className="px-4 py-3 bg-[#0a0a0a] border-t border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-gray-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>Originator Rule of Thumb:</span>
          <span className="text-gray-200 hidden md:inline">
            A ~32/32 (1.00 pt) MBS price swing ≈ 0.250% shift in borrower note rate sheet pricing.
          </span>
        </div>

        {onNavigateToTab && (
          <div className="flex items-center space-x-2">
            <button
              id="lo-btn-open-calc"
              onClick={() => onNavigateToTab('calculator')}
              className="px-3 py-1 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] text-gray-200 hover:text-[#FFD700] font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Mortgage Pipeline Calculator</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="lo-btn-open-charts"
              onClick={() => onNavigateToTab('charts')}
              className="px-3 py-1 rounded-lg bg-[#FFD700]/10 hover:bg-[#FFD700]/20 border border-[#FFD700]/40 text-[#FFD700] font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Full Depth Matrix & Charts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
