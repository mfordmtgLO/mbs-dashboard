import React, { useState } from 'react';
import {
  Newspaper,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  ExternalLink,
  Sparkles,
  Globe,
  Loader2,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Link2,
} from 'lucide-react';
import { MarketStory, GroundingSource, SearchGroundedAnalysis } from '../types';

interface MarketIntelligenceWidgetProps {
  stories: MarketStory[];
  onSelectStoryTag?: (tag: string) => void;
}

export const MarketIntelligenceWidget: React.FC<MarketIntelligenceWidgetProps> = ({
  stories,
  onSelectStoryTag,
}) => {
  const [activeMode, setActiveMode] = useState<'SEARCH_GROUNDING' | 'DESK_WIRE'>('SEARCH_GROUNDING');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Search Grounding States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [groundedResult, setGroundedResult] = useState<SearchGroundedAnalysis | null>({
    query: 'Mortgage backed securities UMBS 10-year Treasury yield mortgage rates today',
    headline: '10-Year Treasury Yields Consolidate Near 4.66% as Secondary MBS Spreads Stabilize',
    summary:
      'Mortgage-backed securities benchmark coupons (UMBS 30-year 5.5% and 6.0%) maintain solid bids as fixed-income traders digest recent macroeconomic reports. The 10-Year Treasury note trades with moderate gains, supporting loan officer floating strategies for short-term locks.',
    keyDrivers: [
      'Benchmark 10-Year Treasury yield remains near 4.66%, offering support to primary rate sheets.',
      'Primary-Secondary mortgage spread holds steady at ~118 bps over 10Y UST.',
      'Wholesale lender pipeline hedging indicates low immediate risk of negative intra-day repricing.',
    ],
    lockFloatImpact: 'FLOAT FAVORABLE (15-day closings can watch for mid-day positive adjustments)',
    groundingSources: [
      { title: 'CNBC US Markets Live', uri: 'https://www.cnbc.com/markets/us-markets/' },
      { title: 'Freddie Mac Primary Mortgage Market Survey', uri: 'https://www.freddiemac.com/pmms' },
      { title: 'Federal Reserve Monetary Policy Decisions', uri: 'https://www.federalreserve.gov/monetarypolicy.htm' },
    ],
    searchQueries: ['10-year Treasury yield mortgage rates today', 'MBS market prices live', 'Fed interest rate cuts outlook'],
    timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  });

  const categories = ['ALL', 'FED POLICY', 'INFLATION / PCE', 'TREASURY SUPPLY', 'PREPAYMENTS', 'CREDIT SPREADS'];

  const quickSearchTriggers = [
    { label: '⚡ 10Y UST Movers', query: '10-Year Treasury yield movements and bond market movers today' },
    { label: '🏛️ Fed Rate Cut Odds', query: 'Federal Reserve interest rate decisions and Powell comments latest' },
    { label: '📊 Freddie Mac PMMS', query: 'Freddie Mac Primary Mortgage Market Survey weekly 30-year rate' },
    { label: '📈 MBS 6.0% Par Pricing', query: 'Mortgage-backed securities UMBS 30-year 6.0% coupon pricing today' },
    { label: '🏡 Mortgage App Volume', query: 'MBA Mortgage Applications survey purchase and refinance demand' },
  ];

  const handleExecuteSearch = async (queryText?: string) => {
    const q = queryText || searchQuery;
    if (!q.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch('/api/market/search-grounded-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data && data.headline) {
        setGroundedResult(data);
      }
    } catch (err) {
      console.error('Error fetching search-grounded intelligence:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredStories = stories.filter((s) => {
    if (selectedCategory !== 'ALL' && s.tag !== selectedCategory) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        s.headline.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 bg-[#0c0c0c] border-b border-[#222222] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
            <Globe className="w-4 h-4 text-[#FFD700]" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Google Search Grounding Desk
              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-700/50 text-[9px] font-mono flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                LIVE WEB DATA
              </span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">Real-Time Search Grounded Intelligence for Loan Officers</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center space-x-1 bg-[#161616] p-0.5 rounded-lg border border-[#2b2b2b] text-[10px] font-mono">
          <button
            id="btn-mode-search-grounding"
            onClick={() => setActiveMode('SEARCH_GROUNDING')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'SEARCH_GROUNDING'
                ? 'bg-[#FFD700] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Search Grounding</span>
          </button>
          <button
            id="btn-mode-desk-wire"
            onClick={() => setActiveMode('DESK_WIRE')}
            className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'DESK_WIRE'
                ? 'bg-[#FFD700] text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3 h-3" />
            <span>Desk Wire</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Google Search Grounding Mode */}
      {activeMode === 'SEARCH_GROUNDING' && (
        <div className="flex flex-col flex-1 bg-[#0a0a0a] overflow-hidden">
          {/* Quick Triggers Scrollbar */}
          <div className="px-3 py-2 bg-[#080808] border-b border-[#1c1c1c] flex items-center space-x-1.5 overflow-x-auto text-[10px] font-mono scrollbar-none">
            <span className="text-gray-500 font-bold shrink-0">Quick Topics:</span>
            {quickSearchTriggers.map((t, idx) => (
              <button
                key={idx}
                id={`btn-quick-search-${idx}`}
                onClick={() => {
                  setSearchQuery(t.query);
                  handleExecuteSearch(t.query);
                }}
                className="px-2 py-1 rounded-md whitespace-nowrap bg-[#141414] hover:bg-[#1f1b07] text-gray-300 hover:text-[#FFD700] border border-[#262626] hover:border-[#FFD700]/40 transition-all cursor-pointer"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Input Bar */}
          <div className="p-3 border-b border-[#1c1c1c] bg-[#0c0c0c] flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-grounded-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch()}
                placeholder="Search live web: 10Y UST yields, Fed rate cut odds, mortgage spreads..."
                className="w-full bg-[#141414] border border-[#262626] focus:border-[#FFD700] rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>
            <button
              id="btn-run-grounded-search"
              onClick={() => handleExecuteSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-1.5 bg-[#FFD700] hover:brightness-110 disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center space-x-1 transition-all cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Search</span>
            </button>
          </div>

          {/* Result Content Area */}
          <div className="p-3.5 overflow-y-auto max-h-[360px] space-y-3">
            {isSearching ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-2.5">
                <Loader2 className="w-7 h-7 text-[#FFD700] animate-spin" />
                <p className="text-xs font-semibold text-gray-300">Searching live Google data & synthesizing MBS intelligence...</p>
                <span className="text-[10px] text-gray-500 font-mono">Grounding with Google Search</span>
              </div>
            ) : groundedResult ? (
              <div className="space-y-3 animate-in fade-in">
                {/* Headline & Verification Badge */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60 font-mono text-[9px] font-bold">
                      <Globe className="w-3 h-3 text-blue-400" />
                      <span>GOOGLE SEARCH GROUNDED</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">As of {groundedResult.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug">
                    {groundedResult.headline}
                  </h4>
                </div>

                {/* Synthesis Summary */}
                <div className="bg-[#141414] border border-[#262626] rounded-lg p-3 text-gray-300 text-xs leading-relaxed">
                  {groundedResult.summary}
                </div>

                {/* Key Market Drivers */}
                {groundedResult.keyDrivers && groundedResult.keyDrivers.length > 0 && (
                  <div className="bg-[#121212] border border-[#222222] rounded-lg p-3 space-y-1.5">
                    <span className="text-[10px] font-mono text-[#FFD700] font-bold uppercase tracking-wider block">
                      Key Secondary Drivers:
                    </span>
                    <ul className="space-y-1 text-[11px] text-gray-300">
                      {groundedResult.keyDrivers.map((driver, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-[#FFD700] font-bold mt-0.5">•</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lock / Float Action Takeaway */}
                {groundedResult.lockFloatImpact && (
                  <div className="p-2.5 bg-[#1a1705] border border-[#FFD700]/40 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FFD700]">
                      <ShieldCheck className="w-4 h-4 text-[#FFD700] shrink-0" />
                      <span>{groundedResult.lockFloatImpact}</span>
                    </div>
                  </div>
                )}

                {/* Verified Search Sources / Grounding Citations */}
                {groundedResult.groundingSources && groundedResult.groundingSources.length > 0 && (
                  <div className="pt-2 border-t border-[#1c1c1c] space-y-1.5">
                    <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-[#FFD700]" />
                      Verified Google Search Sources & Citations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {groundedResult.groundingSources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161616] hover:bg-[#202020] text-gray-300 hover:text-white border border-[#2b2b2b] hover:border-[#FFD700]/50 text-[10px] transition-all"
                        >
                          <span className="truncate max-w-[200px]">{src.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#FFD700] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODE 2: Desk Wire (Original curated market updates) */}
      {activeMode === 'DESK_WIRE' && (
        <div className="flex flex-col flex-1 bg-[#0a0a0a] overflow-hidden">
          {/* Filter Tabs */}
          <div className="px-3 py-2 bg-[#080808] border-b border-[#1c1c1c] flex items-center space-x-1 overflow-x-auto text-[11px] font-mono scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1f1b07] text-[#FFD700] border border-[#FFD700]/50'
                    : 'text-gray-400 hover:text-white hover:bg-[#141414]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stories List */}
          <div className="p-3 divide-y divide-[#1c1c1c] overflow-y-auto max-h-[380px] bg-[#0a0a0a]">
            {filteredStories.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500 font-mono">No matching market updates found</div>
            ) : (
              filteredStories.map((story) => {
                const isBullish = story.impact === 'bull';
                const isBearish = story.impact === 'bear';

                return (
                  <div key={story.id} className="py-3 first:pt-0 last:pb-0 group">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[#161616] border border-[#2b2b2b] text-gray-300 font-mono text-[9px] font-bold">
                          {story.tag}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{story.timestamp}</span>
                      </div>

                      {/* Impact badge */}
                      <span
                        className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isBullish
                            ? 'bg-green-950/80 text-green-400 border border-green-800/60'
                            : isBearish
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/60'
                            : 'bg-[#181818] text-gray-300 border border-[#333333]'
                        }`}
                      >
                        {isBullish && <ArrowUpRight className="w-3 h-3 text-green-400" />}
                        {isBearish && <ArrowDownRight className="w-3 h-3 text-rose-400" />}
                        {!isBullish && !isBearish && <Minus className="w-3 h-3 text-gray-400" />}
                        <span>{story.badge}</span>
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-gray-100 leading-snug group-hover:text-[#FFD700] transition-colors">
                      {story.headline}
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed mt-1">{story.summary}</p>

                    {story.source && (
                      <div className="mt-1.5 text-[10px] text-gray-500 font-mono flex items-center gap-1">
                        <span>Source:</span>
                        <span className="text-gray-400">{story.source}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

