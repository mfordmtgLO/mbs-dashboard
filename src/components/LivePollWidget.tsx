import React from 'react';
import { BarChart3, CheckCircle2, Users, Radio, Sparkles } from 'lucide-react';
import { LivePoll } from '../types';

interface LivePollWidgetProps {
  poll: LivePoll;
  onVote: (pollId: string, optionId: string) => void;
}

export const LivePollWidget: React.FC<LivePollWidgetProps> = ({ poll, onVote }) => {
  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] p-5 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#FFD700] uppercase tracking-wider">
          <BarChart3 className="w-4 h-4 text-[#FFD700]" />
          <span>LIVE ORIGINATOR PULSE POLL</span>
        </div>
        <span className="flex items-center space-x-1.5 text-xs text-gray-400 font-mono">
          <Users className="w-3.5 h-3.5 text-green-400" />
          <span className="font-bold text-gray-200">{poll.totalVotes} Votes</span>
        </span>
      </div>

      <div>
        <h3 className="text-sm sm:text-base font-bold text-white mb-1">{poll.question}</h3>
        <p className="text-xs text-gray-400">{poll.subtitle}</p>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {poll.options.map((opt) => {
          const isSelected = poll.userVotedId === opt.id;
          return (
            <button
              key={opt.id}
              id={`poll-opt-${opt.id}`}
              onClick={() => onVote(poll.id, opt.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-[#221c06] border-[#FFD700] ring-1 ring-[#FFD700]/50'
                  : 'bg-[#080808] border-[#222222] hover:border-[#333333] hover:bg-[#141414]'
              }`}
            >
              {/* Animated progress background bar */}
              <div
                style={{ width: `${opt.percentage}%` }}
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  isSelected ? 'bg-[#FFD700]/20' : 'bg-[#1c1c1c] group-hover:bg-[#252525]'
                }`}
              ></div>

              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-200 flex items-center gap-2">
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#FFD700] shrink-0" />}
                  {opt.text}
                </span>
                <span className="font-mono font-bold text-[#FFD700] ml-2">
                  {opt.percentage}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
