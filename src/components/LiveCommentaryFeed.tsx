import React, { useState } from 'react';
import { MessageSquare, Flame, ShieldAlert, Sparkles, Send, ThumbsUp, Pin, Tag, Radio, Filter } from 'lucide-react';
import { CommentaryMessage, MBSQuote } from '../types';

interface LiveCommentaryFeedProps {
  commentaries: CommentaryMessage[];
  onAddCommentary: (msg: CommentaryMessage) => void;
  activeQuote: MBSQuote;
  onOpenAiModal: () => void;
}

export const LiveCommentaryFeed: React.FC<LiveCommentaryFeedProps> = ({
  commentaries,
  onAddCommentary,
  activeQuote,
  onOpenAiModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'reprice_alert' | 'lock_guidance' | 'economic_flash'>('all');
  const [quickInput, setQuickInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filtered = commentaries.filter((c) => {
    if (filterType === 'all') return true;
    return c.type === filterType;
  });

  const handleSendQuickComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    setIsSubmitting(true);
    const userMsg: CommentaryMessage = {
      id: `comm-user-${Date.now()}`,
      author: 'Live Originator Desk',
      role: 'Loan Officer Desk',
      badge: 'TRADING_FLOOR',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: quickInput.trim(),
      type: 'market_update',
      impact: 'neutral',
      likes: 1,
    };
    onAddCommentary(userMsg);
    setQuickInput('');
    setIsSubmitting(false);
  };

  const getBadgeStyle = (badge?: string) => {
    switch (badge) {
      case 'CHIEF_STRATEGIST':
        return 'bg-[#2a2106] text-[#FFD700] border-[#FFD700]/50';
      case 'SECONDARY_DESK':
        return 'bg-[#152417] text-green-300 border-green-700/60';
      case 'REPRICING_ALERT':
        return 'bg-[#FF0000]/20 text-rose-300 border-[#FF0000]/60 animate-pulse';
      case 'FED_WATCH':
        return 'bg-[#21112b] text-purple-300 border-purple-700/60';
      default:
        return 'bg-[#1a1a1a] text-gray-300 border-[#333333]';
    }
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden flex flex-col h-full max-h-[640px]">
      {/* Header */}
      <div className="p-4 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[#FFD700]/10 text-[#FFD700]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Expert Desk Stream
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
            </h3>
            <p className="text-[11px] text-gray-400">Live Commentary & Repricing Intelligence</p>
          </div>
        </div>

        {/* AI Ask Button */}
        <button
          id="btn-feed-ai-ask"
          onClick={onOpenAiModal}
          className="px-2.5 py-1 rounded-md text-xs font-bold bg-gradient-to-r from-[#FFD700] to-[#E5C100] text-black flex items-center space-x-1 shadow-sm hover:brightness-110 transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-black" />
          <span>Ask Strategist</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 bg-[#080808] border-b border-[#222222] flex items-center space-x-1.5 overflow-x-auto text-[11px] font-medium scrollbar-none">
        <button
          id="filter-all"
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer ${
            filterType === 'all' ? 'bg-[#FFD700] text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          All Stream
        </button>
        <button
          id="filter-reprice"
          onClick={() => setFilterType('reprice_alert')}
          className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer ${
            filterType === 'reprice_alert' ? 'bg-[#FF0000] text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          🚨 Reprice Alerts
        </button>
        <button
          id="filter-lock"
          onClick={() => setFilterType('lock_guidance')}
          className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer ${
            filterType === 'lock_guidance' ? 'bg-[#222222] text-[#FFD700] border border-[#FFD700]/50' : 'text-gray-400 hover:text-white'
          }`}
        >
          🔒 Lock / Float
        </button>
        <button
          id="filter-econ"
          onClick={() => setFilterType('economic_flash')}
          className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] tracking-wider transition-all cursor-pointer ${
            filterType === 'economic_flash' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          📊 Economic Flash
        </button>
      </div>

      {/* Scrolling Commentary Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-[#1e1e1e] bg-[#0c0c0c]">
        {filtered.map((item) => (
          <div
            key={item.id}
            id={`commentary-item-${item.id}`}
            className={`pt-3 first:pt-0 transition-all ${
              item.pinned ? 'bg-[#151515] p-3 rounded-xl border border-[#FFD700]/40 shadow-sm' : ''
            }`}
          >
            {/* Top metadata */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2">
                {item.pinned && <Pin className="w-3 h-3 text-[#FFD700]" />}
                <span className="text-xs font-bold text-white">{item.author}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 text-[9px] font-mono font-bold rounded border uppercase ${getBadgeStyle(item.badge)}`}>
                    {item.badge.replace('_', ' ')}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-gray-500">{item.timestamp}</span>
            </div>

            {/* Content */}
            <p className="text-xs text-gray-300 leading-relaxed">{item.content}</p>

            {/* Footer / Actions */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    item.likes += 1;
                    onAddCommentary({ ...item });
                  }}
                  className="flex items-center space-x-1 hover:text-[#FFD700] transition-all cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="font-mono">{item.likes}</span>
                </button>
              </div>

              {item.type === 'reprice_alert' && (
                <span className="text-[10px] font-mono text-[#FFD700] font-bold bg-[#261f06] px-1.5 py-0.5 rounded border border-[#FFD700]/40">
                  Lender Action Window: 45m
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Community Desk Input */}
      <form onSubmit={handleSendQuickComment} className="p-3 bg-[#0c0c0c] border-t border-[#222222] flex items-center space-x-2">
        <input
          id="input-desk-comment"
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="Share trading floor observation or rate sheet tip..."
          className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
        />
        <button
          id="btn-submit-desk-comment"
          type="submit"
          disabled={isSubmitting || !quickInput.trim()}
          className="p-2 rounded-lg bg-[#FFD700] hover:brightness-110 disabled:opacity-50 text-black font-bold transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
