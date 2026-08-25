import React, { useState } from 'react';
import { Newspaper, Tag, ArrowUpRight, ArrowDownRight, Minus, Search, ExternalLink, Bookmark } from 'lucide-react';
import { MarketStory } from '../types';

interface MarketIntelligenceWidgetProps {
  stories: MarketStory[];
  onSelectStoryTag?: (tag: string) => void;
}

export const MarketIntelligenceWidget: React.FC<MarketIntelligenceWidgetProps> = ({
  stories,
  onSelectStoryTag,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const categories = ['ALL', 'FED POLICY', 'INFLATION / PCE', 'TREASURY SUPPLY', 'PREPAYMENTS', 'CREDIT SPREADS'];

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
      <div className="p-3.5 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Market Intelligence & Flash Wire
              <span className="px-1.5 py-0.2 rounded bg-green-950 text-green-400 border border-green-700/50 text-[9px] font-mono">
                DESK FEED
              </span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">Live Secondary Market Drivers & Macro Impact Analysis</p>
          </div>
        </div>
      </div>

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
  );
};
