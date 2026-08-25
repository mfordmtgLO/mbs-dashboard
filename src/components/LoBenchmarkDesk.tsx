import React, { useState, useMemo } from 'react';
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
  Gauge,
  Star,
  Plus,
  Trash2,
  FileSpreadsheet,
  Save,
  Grid,
  Filter,
  RefreshCw,
  X,
} from 'lucide-react';
import { MBSQuote, TreasuryCurveData } from '../types';
import { computeLoanDollarImpact, decimalTo32nds, analyze10yAndMbsRepriceOutlook } from '../utils/mbsCalculations';
import { getFocusRegimeByYield, MBS_FOCUS_REGIMES, MbsFocusRegime, getOrCreateQuoteForCoupon } from '../utils/mbsFocusEngine';
import { LoClientPortfolioDesk } from './LoClientPortfolioDesk';

interface LoBenchmarkDeskProps {
  quotes: MBSQuote[];
  treasuryCurve: TreasuryCurveData;
  selectedQuoteId: string;
  onSelectQuote: (id: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export type WatchlistPresetType =
  | 'DYNAMIC_TRIAD'
  | 'PRODUCTION_ALL'
  | 'HIGH_RATE_REFI'
  | 'LEGACY_LOW'
  | 'CUSTOM'
  | 'PORTFOLIO_SYNC';

export const WATCHLIST_PRESETS: Record<
  WatchlistPresetType,
  { label: string; description: string; coupons: number[] }
> = {
  DYNAMIC_TRIAD: {
    label: '🎯 Dynamic Par Triad (5.5, 6.0, 6.5)',
    description: 'Active secondary production focus aligned with prevailing 10Y yield regime',
    coupons: [5.5, 6.0, 6.5],
  },
  PRODUCTION_ALL: {
    label: '📋 Full Production Suite (5.0 – 7.0)',
    description: 'Wide coverage across active conventional and government production lines',
    coupons: [5.0, 5.5, 6.0, 6.5, 7.0],
  },
  HIGH_RATE_REFI: {
    label: '🔥 High-Rate Refi Radar (6.5 – 8.0)',
    description: 'Targeted monitoring for 2023-2024 peak origination refinance opportunities',
    coupons: [6.5, 7.0, 7.5, 8.0],
  },
  LEGACY_LOW: {
    label: '🏛️ 2020–2022 Low Rate Legacy (3.0 – 4.5)',
    description: 'Pre-hike pandemic low coupon pools and historical runoff tracking',
    coupons: [3.0, 3.5, 4.0, 4.5],
  },
  CUSTOM: {
    label: '⭐ My Custom Watchlist',
    description: 'Custom tailored selection of Fannie Mae & Ginnie Mae coupons',
    coupons: [5.0, 5.5, 6.0, 6.5, 7.0, 7.5],
  },
  PORTFOLIO_SYNC: {
    label: '📁 Synced from Client Portfolio',
    description: 'Auto-populated from uploaded loan officer closed pipeline',
    coupons: [5.5, 6.0, 6.5, 7.0],
  },
};

const ALL_STANDARD_COUPONS = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

export const LoBenchmarkDesk: React.FC<LoBenchmarkDeskProps> = ({
  quotes,
  treasuryCurve,
  selectedQuoteId,
  onSelectQuote,
  onNavigateToTab,
}) => {
  // Top-level Navigation Mode
  const [activeDeskView, setActiveDeskView] = useState<'benchmarks' | 'portfolio_crm' | 'custom_matrix'>('benchmarks');

  // Watchlist & Coupon Controls
  const [activePreset, setActivePreset] = useState<WatchlistPresetType>('DYNAMIC_TRIAD');
  const [customCoupons, setCustomCoupons] = useState<number[]>([5.0, 5.5, 6.0, 6.5, 7.0, 7.5]);
  const [portfolioSyncedCoupons, setPortfolioSyncedCoupons] = useState<number[]>([5.5, 6.0, 6.5, 7.0]);
  const [newCustomInput, setNewCustomInput] = useState<string>('');
  const [savedWatchlistName, setSavedWatchlistName] = useState<string>('');
  const [watchlistSaveFeedback, setWatchlistSaveFeedback] = useState<string | null>(null);

  // File Sizer & Display Mode
  const [loanAmount, setLoanAmount] = useState<number>(500000);
  const [customLoanInput, setCustomLoanInput] = useState<string>('500,000');
  const [pipelineCount, setPipelineCount] = useState<number>(1);
  const [displayMode, setDisplayMode] = useState<'32nds' | 'decimal'>('32nds');
  const [overrideRegimeId, setOverrideRegimeId] = useState<string | null>(null);

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

  const current10Y = treasuryCurve.y10 ?? tenYearUst.yieldRate ?? 4.660;
  const is10YDown = (tenYearUst.changeBps || 0) <= 0; // yields dropping is GREEN for MBS / loan pricing

  // Dynamic Regime Calculation (similar to Barry Habib / MBS Highway focus shifts)
  const activeRegime: MbsFocusRegime = overrideRegimeId
    ? MBS_FOCUS_REGIMES[overrideRegimeId] || MBS_FOCUS_REGIMES.NORMAL_CURRENT
    : getFocusRegimeByYield(current10Y);

  // Active Monitored Coupons based on selected preset
  const activeCoupons = useMemo(() => {
    if (activePreset === 'DYNAMIC_TRIAD') {
      return [activeRegime.lowKeyCoupon, activeRegime.coreKeyCoupon, activeRegime.upperKeyCoupon];
    }
    if (activePreset === 'CUSTOM') {
      return customCoupons;
    }
    if (activePreset === 'PORTFOLIO_SYNC') {
      return portfolioSyncedCoupons;
    }
    return WATCHLIST_PRESETS[activePreset]?.coupons || [5.5, 6.0, 6.5];
  }, [activePreset, activeRegime, customCoupons, portfolioSyncedCoupons]);

  // Generate / Retrieve Quotes for All Monitored Coupons
  const monitoredFnmaQuotes = useMemo(() => {
    return activeCoupons.map((c) =>
      getOrCreateQuoteForCoupon('FNMA', c, quotes, current10Y, tenYearUst.changeBps || -4.4)
    );
  }, [activeCoupons, quotes, current10Y, tenYearUst.changeBps]);

  const monitoredGnmaQuotes = useMemo(() => {
    return activeCoupons.map((c) =>
      getOrCreateQuoteForCoupon('GNMA', c, quotes, current10Y, tenYearUst.changeBps || -4.4)
    );
  }, [activeCoupons, quotes, current10Y, tenYearUst.changeBps]);

  // Core benchmark quote for composite calculations
  const coreMbs = monitoredFnmaQuotes.find((q) => q.couponRate === activeRegime.coreKeyCoupon) || monitoredFnmaQuotes[0];
  const coreMbsChangeBps = coreMbs?.changeBps ?? (is10YDown ? 15.4 : -12.0);

  // Deep Analysis synthesis
  const repriceOutlook = analyze10yAndMbsRepriceOutlook(
    current10Y,
    tenYearUst.changeBps || 0,
    coreMbsChangeBps
  );

  const presetAmounts = [300000, 400000, 500000, 650000, 750000, 1000000];

  const handleSelectLoanAmount = (amt: number) => {
    setLoanAmount(amt);
    setCustomLoanInput(amt.toLocaleString());
  };

  const handleCustomLoanChange = (valStr: string) => {
    setCustomLoanInput(valStr);
    const cleaned = Number(valStr.replace(/[^0-9]/g, ''));
    if (!isNaN(cleaned) && cleaned > 0) {
      setLoanAmount(cleaned);
    }
  };

  // Toggle a coupon in the custom list
  const handleToggleCoupon = (coupon: number) => {
    if (activePreset !== 'CUSTOM') {
      setActivePreset('CUSTOM');
    }
    setCustomCoupons((prev) => {
      if (prev.includes(coupon)) {
        if (prev.length <= 1) return prev; // keep at least one
        return prev.filter((c) => c !== coupon).sort((a, b) => a - b);
      } else {
        return [...prev, coupon].sort((a, b) => a - b);
      }
    });
  };

  // Add arbitrary custom coupon (e.g. 5.125 or 7.875)
  const handleAddCustomCoupon = () => {
    const parsed = parseFloat(newCustomInput);
    if (!isNaN(parsed) && parsed >= 1.0 && parsed <= 12.0) {
      if (!customCoupons.includes(parsed)) {
        setCustomCoupons((prev) => [...prev, parsed].sort((a, b) => a - b));
        setActivePreset('CUSTOM');
      }
      setNewCustomInput('');
    }
  };

  // Sync from Client Portfolio CRM
  const handleSyncPortfolioCoupons = (coupons: number[]) => {
    setPortfolioSyncedCoupons(coupons);
    setActivePreset('PORTFOLIO_SYNC');
    setActiveDeskView('benchmarks');
    setWatchlistSaveFeedback(`Synced ${coupons.length} coupons from your client portfolio to the Live Trading Desk!`);
    setTimeout(() => setWatchlistSaveFeedback(null), 4000);
  };

  const formatPrice = (q?: MBSQuote) => {
    if (!q) return '—';
    if (displayMode === '32nds') {
      return q.priceFormatted || decimalTo32nds(q.price);
    }
    return q.price.toFixed(3);
  };

  const formatDayShift = (q?: MBSQuote) => {
    if (!q) return { primary: '+0/32', secondary: '+0.0 bp', isUp: true };
    const isUp = (q.change32nds ?? 0) >= 0 || (q.changeBps ?? 0) >= 0;
    const prefix = isUp ? '+' : '';

    if (displayMode === '32nds') {
      return {
        primary: `${prefix}${q.change32nds ?? 0}/32`,
        secondary: `(${prefix}${(q.changeBps ?? 0).toFixed(1)} bp)`,
        isUp,
      };
    } else {
      const decimalChange = (q.changeBps ?? 0) / 100;
      return {
        primary: `${prefix}${decimalChange.toFixed(3)} pts`,
        secondary: `(${prefix}${(q.changeBps ?? 0).toFixed(1)} bps)`,
        isUp,
      };
    }
  };

  const renderCouponCard = (
    quote: MBSQuote | undefined,
    agencyLabel: 'CONVENTIONAL' | 'GOVERNMENT'
  ) => {
    if (!quote) return null;
    const isSelected = quote.id === selectedQuoteId;
    const shift = formatDayShift(quote);
    const isUp = shift.isUp;
    const impact = computeLoanDollarImpact(loanAmount, quote.changeBps);
    const pipelineTotalImpact = impact.dollarValue * pipelineCount;

    const isGov = agencyLabel === 'GOVERNMENT';
    const tagBg = isGov ? 'bg-teal-950/60 border-teal-700/50 text-teal-300' : 'bg-blue-950/60 border-blue-700/50 text-blue-300';
    const isCore = quote.couponRate === activeRegime.coreKeyCoupon;
    const isLow = quote.couponRate === activeRegime.lowKeyCoupon;
    const isUpper = quote.couponRate === activeRegime.upperKeyCoupon;

    // Estimate matching borrower note rate for this coupon
    const noteRateEstimate = isGov
      ? `${(quote.couponRate + 0.375).toFixed(3)}% – ${(quote.couponRate + 0.625).toFixed(3)}%`
      : `${(quote.couponRate + 0.625).toFixed(3)}% – ${(quote.couponRate + 0.875).toFixed(3)}%`;

    return (
      <div
        key={quote.id}
        id={`lo-coupon-card-${quote.id}`}
        onClick={() => onSelectQuote(quote.id)}
        className={`relative p-3.5 rounded-xl border transition-all cursor-pointer group ${
          isSelected
            ? 'bg-[#1e1b0a] border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-1 ring-[#FFD700]'
            : isCore
            ? 'bg-[#151515] hover:bg-[#1a1a1a] border-[#FFD700]/50 shadow-md'
            : 'bg-[#111111] hover:bg-[#161616] border-[#252525]'
        }`}
      >
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="font-mono font-extrabold text-sm text-white">{quote.symbol}</span>
            {isCore && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/60 tracking-wider flex items-center gap-1">
                <span>★ CORE KEY</span>
              </span>
            )}
            {isLow && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950/60 text-purple-300 border border-purple-800/50 tracking-wider">
                LOW KEY (Cushion)
              </span>
            )}
            {isUpper && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50 tracking-wider">
                UPPER KEY (Premium)
              </span>
            )}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${tagBg}`}>
            Note: {noteRateEstimate}
          </span>
        </div>

        {/* Live Price & Day Movement */}
        <div className="flex items-baseline justify-between gap-2 my-1.5">
          <div>
            <div className="text-[10px] uppercase font-mono text-gray-400 flex items-center gap-1">
              <span>TBA Price</span>
              <span className="text-[9px] text-gray-500 font-mono">({displayMode.toUpperCase()})</span>
            </div>
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
              <span>{shift.primary}</span>
              <span className="ml-1 opacity-80 text-[10px]">{shift.secondary}</span>
            </div>
          </div>
        </div>

        {/* Loan Officer Dollar Impact Pill */}
        <div className="mt-2.5 pt-2 border-t border-[#222222] space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 text-[11px] flex items-center gap-1 font-mono">
              <DollarSign className="w-3 h-3 text-[#FFD700]" />
              <span>${(loanAmount / 1000).toFixed(0)}k file impact:</span>
            </span>
            <span
              className={`font-mono font-bold text-xs ${
                isUp ? 'text-green-400' : 'text-rose-400'
              }`}
            >
              {isUp ? '+' : '-'}${Math.abs(Math.round(impact.dollarValue)).toLocaleString()}
              <span className="text-[10px] text-gray-400 font-normal ml-1">
                ({isUp ? 'gain' : 'cost'})
              </span>
            </span>
          </div>

          {pipelineCount > 1 && (
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 bg-[#0a0a0a] px-2 py-0.5 rounded border border-[#202020]">
              <span>{pipelineCount} Files (${((loanAmount * pipelineCount) / 1000000).toFixed(2)}M):</span>
              <span className={`font-bold ${isUp ? 'text-green-400' : 'text-rose-400'}`}>
                {isUp ? '+' : '-'}${Math.abs(Math.round(pipelineTotalImpact)).toLocaleString()}
              </span>
            </div>
          )}
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
    <div className="bg-[#0e0e0e] rounded-2xl border-2 border-[#FFD700]/30 shadow-2xl overflow-hidden space-y-0">
      {/* Top Main Navigation Tabs */}
      <div className="p-3 bg-[#080808] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            id="tab-btn-benchmarks"
            onClick={() => setActiveDeskView('benchmarks')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeDeskView === 'benchmarks'
                ? 'bg-[#FFD700] text-black shadow-md font-extrabold'
                : 'bg-[#151515] text-gray-300 hover:text-white border border-[#2b2b2b]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>📊 Live Benchmark Desk</span>
          </button>

          <button
            id="tab-btn-portfolio-crm"
            onClick={() => setActiveDeskView('portfolio_crm')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeDeskView === 'portfolio_crm'
                ? 'bg-blue-600 text-white shadow-md font-extrabold border-blue-500'
                : 'bg-[#151515] text-gray-300 hover:text-white border border-[#2b2b2b]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FFD700]" />
            <span>📁 Client Portfolio & Refi CRM (CSV/Excel)</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-[#FFD700] text-[9px] font-bold">
              AI MAPPING
            </span>
          </button>

          <button
            id="tab-btn-custom-matrix"
            onClick={() => setActiveDeskView('custom_matrix')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeDeskView === 'custom_matrix'
                ? 'bg-purple-600 text-white shadow-md font-extrabold border-purple-500'
                : 'bg-[#151515] text-gray-300 hover:text-white border border-[#2b2b2b]'
            }`}
          >
            <Star className="w-4 h-4 text-[#FFD700]" />
            <span>⭐ Watchlist Builder & Matrix ({activeCoupons.length} Coupons)</span>
          </button>
        </div>

        {/* Global LO Configs: Loan Sizer & 32nds Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Loan Sizer Dropdown */}
          <div className="flex items-center space-x-1.5 bg-[#141414] p-1.5 rounded-xl border border-[#292929]">
            <DollarSign className="w-4 h-4 text-[#FFD700]" />
            <span className="text-[11px] font-mono text-gray-400 mr-1 hidden sm:inline">File Sizer:</span>
            <select
              id="lo-loan-amount-select"
              value={loanAmount}
              onChange={(e) => handleSelectLoanAmount(Number(e.target.value))}
              className="bg-[#0a0a0a] text-white text-xs font-mono font-bold px-2 py-1 rounded-lg border border-[#333333] focus:outline-none focus:border-[#FFD700] cursor-pointer"
            >
              {presetAmounts.map((amt) => (
                <option key={amt} value={amt}>
                  ${(amt / 1000).toFixed(0)}k Loan
                </option>
              ))}
            </select>
          </div>

          {/* 32nds vs Decimal Toggle */}
          <div className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#292929] text-xs">
            <button
              id="lo-toggle-32nds"
              onClick={() => setDisplayMode('32nds')}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                displayMode === '32nds'
                  ? 'bg-[#FFD700] text-black shadow-md font-extrabold ring-1 ring-[#FFD700]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>32nds</span>
            </button>
            <button
              id="lo-toggle-decimal"
              onClick={() => setDisplayMode('decimal')}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                displayMode === 'decimal'
                  ? 'bg-[#FFD700] text-black shadow-md font-extrabold ring-1 ring-[#FFD700]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Decimal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save / Feedback Toast */}
      {watchlistSaveFeedback && (
        <div className="px-4 py-2 bg-green-950/90 border-b border-green-700/60 text-green-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{watchlistSaveFeedback}</span>
          </div>
          <button onClick={() => setWatchlistSaveFeedback(null)} className="text-green-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1 & VIEW 3: Benchmark Desk OR Watchlist Matrix */}
      {activeDeskView !== 'portfolio_crm' && (
        <>
          {/* Watchlist Presets & Interactive Coupon Quick-Toggle Bar */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-[#171407] via-[#111111] to-[#0c0c0c] border-b border-[#2a2612] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      MBS Watchlist Preset:
                    </span>
                    <span className="text-xs font-mono text-[#FFD700] font-bold">
                      {WATCHLIST_PRESETS[activePreset]?.label || activePreset}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {WATCHLIST_PRESETS[activePreset]?.description}
                  </p>
                </div>
              </div>

              {/* Watchlist Preset Selector Tabs */}
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 font-mono text-xs">
                {(Object.keys(WATCHLIST_PRESETS) as WatchlistPresetType[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => setActivePreset(presetKey)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activePreset === presetKey
                        ? 'bg-[#FFD700] text-black shadow-sm font-extrabold ring-1 ring-[#FFD700]'
                        : 'bg-[#181818] text-gray-400 hover:text-white border border-[#2e2e2e]'
                    }`}
                  >
                    {presetKey === 'DYNAMIC_TRIAD'
                      ? '🎯 Focused 3-Pack'
                      : presetKey === 'PRODUCTION_ALL'
                      ? '📋 5.0–7.0 Production'
                      : presetKey === 'HIGH_RATE_REFI'
                      ? '🔥 6.5–8.0 Refi'
                      : presetKey === 'LEGACY_LOW'
                      ? '🏛️ 3.0–4.5 Legacy'
                      : presetKey === 'PORTFOLIO_SYNC'
                      ? '📁 Synced Pipeline'
                      : '⭐ Custom'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Coupon Chip Toggles (Click to Add / Remove any coupon) */}
            <div className="pt-2 border-t border-[#242424] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">
                  Active Coupons:
                </span>
                {ALL_STANDARD_COUPONS.map((cpn) => {
                  const isMonitored = activeCoupons.includes(cpn);
                  return (
                    <button
                      key={cpn}
                      onClick={() => handleToggleCoupon(cpn)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                        isMonitored
                          ? 'bg-[#FFD700] text-black border border-[#FFD700] shadow-xs'
                          : 'bg-[#161616] text-gray-400 hover:text-gray-200 border border-[#2b2b2b]'
                      }`}
                      title={isMonitored ? `Click to remove ${cpn}% coupon` : `Click to add ${cpn}% coupon`}
                    >
                      {isMonitored && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      <span>{cpn.toFixed(1)}%</span>
                    </button>
                  );
                })}

                {/* Add Custom Coupon Input */}
                <div className="flex items-center space-x-1 ml-1">
                  <input
                    type="number"
                    step="0.125"
                    value={newCustomInput}
                    onChange={(e) => setNewCustomInput(e.target.value)}
                    placeholder="+ Custom %"
                    className="w-20 bg-[#161616] border border-[#333333] rounded px-1.5 py-0.5 text-[10px] text-white focus:outline-none focus:border-[#FFD700]"
                  />
                  <button
                    onClick={handleAddCustomCoupon}
                    className="px-2 py-0.5 rounded bg-[#242424] hover:bg-[#333333] text-[#FFD700] text-[10px] font-bold"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Quick Jump to CSV Import */}
              <button
                onClick={() => setActiveDeskView('portfolio_crm')}
                className="text-[#FFD700] hover:underline flex items-center space-x-1 text-[11px]"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Upload Client Closings (CSV/Excel) →</span>
              </button>
            </div>
          </div>

          {/* Reprice Risk Gauge Bar */}
          <div className="px-4 py-3 bg-[#121212] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-white">
                    Reprice Risk Outlook:
                  </span>
                  <span
                    className={`text-xs font-mono font-extrabold ${
                      repriceOutlook.status === 'POSITIVE_REPRICE'
                        ? 'text-green-400'
                        : repriceOutlook.status === 'NEGATIVE_REPRICE_RISK'
                        ? 'text-rose-400'
                        : 'text-[#FFD700]'
                    }`}
                  >
                    {repriceOutlook.headline} ({repriceOutlook.repriceProbability}% probability)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-mono">
                  {repriceOutlook.explanation}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-gray-400">Origination Directive:</span>
              <span className="px-2 py-0.5 rounded bg-[#1f1a07] text-[#FFD700] border border-[#FFD700]/40 font-bold">
                {repriceOutlook.originatorGuidance}
              </span>
            </div>
          </div>

          {/* Main 3-Pillar / Multi-Coupon Grid */}
          <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-11 gap-4 bg-[#0a0a0a]">
            {/* Pillar 1: 👑 10Y Benchmark Treasury Yield (3 cols on lg) */}
            <div className="lg:col-span-3 bg-[#121212] rounded-xl border border-[#262626] p-4 flex flex-col justify-between shadow-lg">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-mono font-extrabold text-sm text-white">10Y BENCHMARK</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e1b07] text-[#FFD700] border border-[#FFD700]/40">
                    UST YIELD
                  </span>
                </div>

                {/* Live Yield Display */}
                <div className="my-3 space-y-1">
                  <div className="text-[10px] uppercase font-mono text-gray-400">Current Yield Rate</div>
                  <div className="text-3xl font-mono font-extrabold text-white tracking-tight flex items-baseline justify-between">
                    <span>{current10Y.toFixed(3)}%</span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        is10YDown
                          ? 'bg-green-950 text-green-400 border border-green-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {tenYearUst.changeBps && tenYearUst.changeBps > 0 ? '+' : ''}
                      {(tenYearUst.changeBps ?? -4.4).toFixed(1)} bp
                    </span>
                  </div>
                </div>

                {/* Day Range */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#202020] font-mono text-[11px]">
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
                        : '+0.452%'}
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
                    FANNIE MAE UMBS ({monitoredFnmaQuotes.length} Coupons)
                  </span>
                </div>

                {/* Monitored Conventional Coupons */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {monitoredFnmaQuotes.map((q) => renderCouponCard(q, 'CONVENTIONAL'))}
                </div>
              </div>

              <div className="mt-3 text-[11px] text-gray-400 font-mono bg-[#0c0c0c] p-2 rounded-lg border border-[#1f1f1f] flex items-center justify-between">
                <span>Primary Conventional Driver:</span>
                <span className="text-[#FFD700] font-bold">FNMA {activeRegime.coreKeyCoupon}% (★ Core Key)</span>
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
                    GINNIE MAE II (FHA/VA) ({monitoredGnmaQuotes.length} Coupons)
                  </span>
                </div>

                {/* Monitored Government Coupons */}
                <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {monitoredGnmaQuotes.map((q) => renderCouponCard(q, 'GOVERNMENT'))}
                </div>
              </div>

              <div className="mt-3 text-[11px] text-gray-400 font-mono bg-[#0c0c0c] p-2 rounded-lg border border-[#1f1f1f] flex items-center justify-between">
                <span>Primary Government Driver:</span>
                <span className="text-teal-400 font-bold">GNMA II {activeRegime.coreKeyCoupon}% (★ Core Key)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Client Portfolio & Refi CRM Engine */}
      {activeDeskView === 'portfolio_crm' && (
        <div className="p-4 bg-[#0a0a0a]">
          <LoClientPortfolioDesk
            quotes={quotes}
            current10YYield={current10Y}
            onSyncPortfolioCouponsToWatchlist={handleSyncPortfolioCoupons}
            onSelectCouponForChart={(sym) => {
              const matched = quotes.find((q) => q.symbol.includes(sym));
              if (matched) onSelectQuote(matched.id);
            }}
          />
        </div>
      )}

      {/* Bottom Action Bar */}
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
