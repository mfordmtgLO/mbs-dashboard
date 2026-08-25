import React from 'react';
import { Radio, Bell, Volume2, VolumeX, ShieldAlert, Sparkles, TrendingUp, Users, Clock, Sun, Moon } from 'lucide-react';
import { MBSQuote, TradingSessionType } from '../types';

interface NavbarProps {
  activeTab: 'studio' | 'charts' | 'articles' | 'qa' | 'calculator' | 'calendar';
  setActiveTab: (tab: 'studio' | 'charts' | 'articles' | 'qa' | 'calculator' | 'calendar') => void;
  viewerCount: number;
  quotes: MBSQuote[];
  isAudioLive: boolean;
  setIsAudioLive: (val: boolean) => void;
  onOpenAiStrategist: () => void;
  repriceAlertCount: number;
  currentSession?: TradingSessionType;
  onToggleSession?: () => void;
  onOpenVolatilityDrawer?: () => void;
  volatilityAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  viewerCount,
  quotes,
  isAudioLive,
  setIsAudioLive,
  onOpenAiStrategist,
  repriceAlertCount,
  currentSession = 'LIVE_DAILY',
  onToggleSession,
  onOpenVolatilityDrawer,
  volatilityAlertCount = 0,
}) => {
  const benchmarkQuote = quotes.find((q) => q.id === 'umbs-30-55') || quotes[0];
  const tenYear = quotes.find((q) => q.id === 'us-10y-treasury');

  return (
    <header className="sticky top-0 z-50 bg-[#111111] border-b border-[#222222] text-gray-200 shadow-2xl">
      {/* Top Ticker Bar */}
      <div className="bg-[#080808] px-4 py-1.5 text-xs border-b border-[#1a1a1a] flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none">
        <div className="flex items-center space-x-6">
          <div
            onClick={onToggleSession}
            className="flex items-center space-x-2 font-semibold tracking-wide cursor-pointer hover:opacity-90 transition-opacity"
            title="Click to toggle between Live Daily Session and After-Hours Trading Window"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  currentSession === 'LIVE_DAILY' ? 'bg-green-400' : 'bg-indigo-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  currentSession === 'LIVE_DAILY' ? 'bg-green-500' : 'bg-indigo-500'
                }`}
              ></span>
            </span>
            <span
              className={`text-[11px] font-mono tracking-wider uppercase font-bold flex items-center gap-1 ${
                currentSession === 'LIVE_DAILY' ? 'text-green-400' : 'text-indigo-400'
              }`}
            >
              {currentSession === 'LIVE_DAILY' ? (
                <>
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>LIVE DAILY SESSION (PRE-CLOSE)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>AFTER-HOURS 10Y WINDOW</span>
                </>
              )}
            </span>
            <span className="text-[#333333]">|</span>
            <span className="text-gray-400 text-[11px] font-mono">10Y VOLATILITY RULE: ±3.0 bp TOAST</span>
          </div>

          <div className="flex items-center space-x-4">
            {quotes.slice(0, 5).map((q) => {
              const isUp = q.change32nds >= 0;
              return (
                <div key={q.id} className="flex items-center space-x-1.5 font-mono text-[11px]">
                  <span className="text-gray-400 font-medium">{q.symbol}:</span>
                  <span className="text-white font-bold">{q.priceFormatted}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      isUp
                        ? 'bg-green-950/80 text-green-400 border border-green-800/60'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {isUp ? '+' : ''}{q.change32nds}/32 ({isUp ? '+' : ''}{q.changeBps.toFixed(1)} bps)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center space-x-5 pl-4 text-gray-400 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#FFD700]" />
            <span className="text-gray-400">30Y Par Rate:</span>
            <span className="text-white font-bold font-mono">6.625% <span className="text-green-400 text-[10px]">(-0.08%)</span></span>
          </div>
          <div className="w-px h-3.5 bg-[#222222]"></div>
          <div className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-green-400" />
            <span className="text-gray-300 font-mono font-semibold">{viewerCount.toLocaleString()} Pros Active</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo matching Elegant Dark aesthetic */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-[#FFD700] rounded-lg flex items-center justify-center shadow-lg shadow-[#FFD700]/10 flex-shrink-0">
            <div className="w-5 h-5 bg-[#080808] rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full"></div>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-extrabold tracking-tighter text-white">
                MBS<span className="text-[#FFD700]">LIVE</span>
              </span>
              <span className="px-2 py-0.5 bg-[#FF0000] text-[10px] font-black text-white rounded uppercase tracking-widest animate-pulse flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                LIVE
              </span>
            </div>
            <p className="text-[10px] uppercase text-gray-400 font-semibold tracking-wider">
              Institutional Mortgage Rate & Secondary Desk Stream
            </p>
          </div>
        </div>

        {/* Tab Navigation with Elegant Dark Gold Accents */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#0c0c0c] p-1 rounded-xl border border-[#222222]">
          <button
            id="nav-studio"
            onClick={() => setActiveTab('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            Live Studio & Feed
          </button>
          <button
            id="nav-articles"
            onClick={() => setActiveTab('articles')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'articles'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            <span>HousingBrief Wire</span>
            <span className="px-1.5 py-0.2 text-[8px] bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 rounded font-mono font-bold">
              TOP 5
            </span>
          </button>
          <button
            id="nav-charts"
            onClick={() => setActiveTab('charts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            MBS Tick Charts
          </button>
          <button
            id="nav-qa"
            onClick={() => setActiveTab('qa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
              activeTab === 'qa'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            Interactive Q&A
            <span className="ml-1.5 px-1.5 py-0.2 text-[9px] bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 rounded font-mono">
              ON-AIR
            </span>
          </button>
          <button
            id="nav-calculator"
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            Lock vs Float
          </button>
          <button
            id="nav-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-[#1a1a1a] text-[#FFD700] border border-[#FFD700]/40 shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-[#141414]'
            }`}
          >
            Economic Calendar
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* AI Strategist Button */}
          <button
            id="btn-ai-strategist"
            onClick={onOpenAiStrategist}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FFD700] to-[#E5C100] text-black hover:brightness-110 font-bold rounded-lg text-xs shadow-md shadow-[#FFD700]/10 border border-[#FFD700] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline">Ask Desk Strategist</span>
            <span className="px-1 py-0.2 bg-black text-[#FFD700] rounded text-[9px] font-mono font-black">AI</span>
          </button>

          {/* Audio Live commentary toggle */}
          <button
            id="btn-audio-stream"
            onClick={() => setIsAudioLive(!isAudioLive)}
            title={isAudioLive ? 'Live Audio Desk On' : 'Live Audio Desk Muted'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isAudioLive
                ? 'bg-[#1a2e1d] border-green-500/60 text-green-300 shadow-sm shadow-green-500/20'
                : 'bg-[#161616] border-[#333333] text-gray-300 hover:bg-[#202020] hover:text-white'
            }`}
          >
            {isAudioLive ? <Volume2 className="w-4 h-4 text-green-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            <span className="hidden lg:inline font-mono">{isAudioLive ? 'Audio Desk ON' : 'Audio Muted'}</span>
          </button>

          {/* Reprice & Volatility Alert indicator badge */}
          <div className="relative">
            <button
              id="btn-reprice-alerts"
              onClick={onOpenVolatilityDrawer || (() => setActiveTab('studio'))}
              className="p-2 rounded-lg bg-[#161616] hover:bg-[#222222] text-gray-200 border border-[#333333] transition-all cursor-pointer relative"
              title="10Y Volatility & Lender Reprice Alert Desk"
            >
              <Bell className="w-4 h-4 text-[#FFD700]" />
              {(volatilityAlertCount > 0 || repriceAlertCount > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF0000] text-white text-[9px] font-black flex items-center justify-center shadow animate-pulse">
                  {volatilityAlertCount || repriceAlertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
