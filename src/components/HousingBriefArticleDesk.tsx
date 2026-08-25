import React, { useState } from 'react';
import {
  Newspaper,
  ExternalLink,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
} from 'lucide-react';
import { HOUSING_BRIEF_ARTICLES, HousingBriefArticle } from '../data/housingBriefArticles';

interface HousingBriefArticleDeskProps {
  onOpenArticleUrl?: (url: string) => void;
}

export const HousingBriefArticleDesk: React.FC<HousingBriefArticleDeskProps> = ({
  onOpenArticleUrl,
}) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    HOUSING_BRIEF_ARTICLES[0].id // Defaults to the most recent article
  );

  const selectedArticle =
    HOUSING_BRIEF_ARTICLES.find((a) => a.id === selectedArticleId) ||
    HOUSING_BRIEF_ARTICLES[0];

  const isLatest = selectedArticle.id === HOUSING_BRIEF_ARTICLES[0].id;

  const getImpactBadge = (impact: HousingBriefArticle['marketImpact']) => {
    switch (impact) {
      case 'bullish':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-950/80 text-green-400 border border-green-700/60">
            <ArrowUpRight className="w-3 h-3 text-green-400" />
            <span>BULLISH / RATE RELIEF</span>
          </span>
        );
      case 'bearish':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-700/60">
            <ArrowDownRight className="w-3 h-3 text-rose-400" />
            <span>BEARISH / HIGHER YIELDS</span>
          </span>
        );
      case 'reprice_warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-700/60">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>REPRICE RISK ALERT</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1e1e1e] text-gray-300 border border-[#333333]">
            <span>NEUTRAL / CONSOLIDATION</span>
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: HousingBriefArticle['category']) => {
    switch (cat) {
      case 'MBS Morning':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/60';
      case 'MBS Recap':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
      case 'MBS Alert':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/60 animate-pulse';
    }
  };

  return (
    <div
      id="housingbrief-intelligence-desk"
      className="bg-[#0f0f0f] rounded-2xl border-2 border-[#333333] shadow-2xl overflow-hidden"
    >
      {/* Top Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#171407] via-[#121212] to-[#0c0c0c] border-b border-[#282412] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] shrink-0 shadow-md">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FFD700] text-black font-mono font-extrabold text-[10px] uppercase tracking-wider">
                FEATURED HOUSINGBRIEF & MBS LIVE FEED
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
                5 MOST RECENT WIRE REPORTS
              </span>
              <span className="px-2 py-0.5 rounded bg-green-950 text-green-400 border border-green-800 text-[10px] font-mono font-bold">
                NEWEST → OLDEST
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight flex items-center gap-2">
              <span>Secondary Market Commentary & Wire</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 max-w-2xl">
              Curated market intelligence, Treasury buyback analysis, and rate sheet reprice alerts directly sourced from HousingBrief.com and MBS Live.
            </p>
          </div>
        </div>

        {/* Direct Original Link */}
        <a
          id="btn-open-housingbrief-direct"
          href={selectedArticle.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] border border-[#383838] hover:border-[#FFD700]/60 text-gray-200 hover:text-[#FFD700] text-xs font-mono font-bold transition-all shadow-md group cursor-pointer"
        >
          <span>Open on HousingBrief.com</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
      </div>

      {/* Main 2-Column Content Layout: 5 Articles Selector (Left/Top) + Featured Active Article (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#222222]">
        
        {/* Left Column: 5 Most Recent Articles List (Newest to Oldest) - 4 cols on lg */}
        <div className="lg:col-span-5 bg-[#0a0a0a] p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#202020]">
              <span className="font-mono text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFD700]" />
                Recent 5 Articles (Click to View)
              </span>
              <span className="text-[10px] font-mono text-gray-500">1 (Newest) - 5 (Oldest)</span>
            </div>

            {/* 5 Article Cards */}
            <div className="space-y-2.5">
              {HOUSING_BRIEF_ARTICLES.map((article, index) => {
                const isSelected = article.id === selectedArticleId;
                const isFirst = index === 0;

                return (
                  <div
                    key={article.id}
                    id={`housingbrief-item-${index + 1}`}
                    onClick={() => setSelectedArticleId(article.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#1a1708] border-[#FFD700] shadow-md ring-1 ring-[#FFD700]'
                        : 'bg-[#111111] hover:bg-[#161616] border-[#222222] hover:border-[#383838]'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold ${
                            isFirst
                              ? 'bg-[#FFD700] text-black'
                              : isSelected
                              ? 'bg-[#FFD700]/30 text-[#FFD700]'
                              : 'bg-[#222222] text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${getCategoryBadge(
                            article.category
                          )}`}
                        >
                          {article.category}
                        </span>

                        {isFirst && (
                          <span className="px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-700/60 text-[9px] font-mono font-extrabold tracking-wider flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 text-red-400" />
                            FEATURED
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                        {article.publishedTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                        isSelected
                          ? 'text-[#FFD700]'
                          : 'text-gray-200 group-hover:text-white'
                      }`}
                    >
                      {article.title}
                    </h4>

                    {/* Snippet */}
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                      {article.summary}
                    </p>

                    {/* Bottom strip */}
                    <div className="mt-2 pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-gray-500 truncate max-w-[180px]">
                        By {article.author}
                      </span>
                      <span
                        className={`font-bold flex items-center space-x-1 ${
                          isSelected ? 'text-[#FFD700]' : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                      >
                        <span>{isSelected ? 'Reading Now' : 'Read Article'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-[#141414] border border-[#222222] text-[11px] text-gray-400 font-mono flex items-center justify-between">
            <span>Archive Source:</span>
            <a
              href="https://housingbrief.com/Article/archive/mbs/5422cc85becf1e23a41598ec?fcb=False"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FFD700] hover:underline flex items-center gap-1 font-bold"
            >
              <span>View Full MBS Archive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Column: Full Featured Article Reading View (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#121212] p-4 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Article Top Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#222222]">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getCategoryBadge(
                    selectedArticle.category
                  )}`}
                >
                  {selectedArticle.category}
                </span>
                {getImpactBadge(selectedArticle.marketImpact)}
                {isLatest && (
                  <span className="px-2 py-0.5 rounded bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50 text-[10px] font-mono font-bold">
                    ★ MOST RECENT
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                <span>{selectedArticle.publishedTime}</span>
              </div>
            </div>

            {/* Big Headline */}
            <h1 className="text-base sm:text-xl font-extrabold text-white leading-tight tracking-tight">
              {selectedArticle.title}
            </h1>

            {/* Author Attribution */}
            <div className="flex items-center space-x-2.5 mt-2 mb-4 text-xs font-mono text-gray-400">
              <div className="w-6 h-6 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center text-[#FFD700] font-bold text-xs">
                MG
              </div>
              <div>
                <span className="text-gray-200 font-bold">{selectedArticle.author}</span>
                <span className="text-gray-500 ml-1.5 hidden sm:inline">({selectedArticle.authorTitle})</span>
              </div>
            </div>

            {/* Key Takeaways Callout Box */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#18160c] border border-[#3b3414] mb-5">
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-[#FFD700] mb-2 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#FFD700]" />
                <span>Secondary Desk Key Takeaways</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-300 font-sans">
                {selectedArticle.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-[#FFD700] font-mono font-bold mt-0.5">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Full Body Paragraphs */}
            <div className="space-y-3.5 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
              {selectedArticle.fullBody.map((paragraph, pIdx) => (
                <p key={pIdx} className="bg-[#0e0e0e]/50 p-2.5 rounded-lg border border-[#1c1c1c]">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Originator Lock/Float Advisory Pill */}
            {selectedArticle.lockFloatGuidance && (
              <div className="mt-5 p-3 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#FFD700] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-mono font-bold text-[#FFD700] uppercase">
                    Originator Lock / Float Recommendation:
                  </div>
                  <div className="text-xs text-gray-200 mt-0.5">
                    {selectedArticle.lockFloatGuidance}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-6 pt-4 border-t border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-gray-500" />
              <span>Target Benchmark:</span>
              <span className="text-gray-200 font-bold">{selectedArticle.targetMbsBenchmark}</span>
            </div>

            <a
              id="housingbrief-view-original-btn"
              href={selectedArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-[#FFD700] hover:bg-[#ffe135] text-black font-mono font-bold text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <span>View Source on HousingBrief.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
