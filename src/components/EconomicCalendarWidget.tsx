import React from 'react';
import { Calendar, AlertCircle, Clock, TrendingUp, Info } from 'lucide-react';
import { EconomicRelease } from '../types';

interface EconomicCalendarWidgetProps {
  events: EconomicRelease[];
}

export const EconomicCalendarWidget: React.FC<EconomicCalendarWidgetProps> = ({ events }) => {
  const getImpactBadge = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return 'bg-[#FF0000]/20 text-rose-300 border-[#FF0000]/60 font-bold';
      case 'MEDIUM':
        return 'bg-[#2a2106] text-[#FFD700] border-[#FFD700]/50 font-medium';
      case 'LOW':
        return 'bg-[#141414] text-gray-400 border-[#262626]';
    }
  };

  const getBondImpactBadge = (impact: EconomicRelease['bondImpact']) => {
    switch (impact) {
      case 'BULLISH':
        return 'text-green-400 font-bold bg-green-950/70 px-2 py-0.5 rounded border border-green-800';
      case 'BEARISH':
        return 'text-rose-400 font-bold bg-rose-950/70 px-2 py-0.5 rounded border border-rose-800';
      case 'NEUTRAL':
        return 'text-gray-300 bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#2e2e2e]';
      default:
        return 'text-gray-500 font-mono';
    }
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-[#FFD700]/10 text-[#FFD700]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">High-Impact Economic Calendar</h3>
            <p className="text-[11px] text-gray-400">Macro Data Releases Influencing Bond Yields & MBS Pricing</p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#FFD700] px-2 py-1 rounded bg-[#1c1605] border border-[#FFD700]/40">
          FOMC & Inflation Watch
        </span>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#080808] text-gray-400 font-mono text-[11px] uppercase border-b border-[#222222]">
            <tr>
              <th className="px-4 py-2.5">Date & Time</th>
              <th className="px-4 py-2.5">Indicator / Release</th>
              <th className="px-4 py-2.5">Impact</th>
              <th className="px-4 py-2.5">Consensus</th>
              <th className="px-4 py-2.5">Previous</th>
              <th className="px-4 py-2.5">Bond Bias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e1e] font-mono text-gray-200 bg-[#0e0e0e]">
            {events.map((evt) => (
              <tr key={evt.id} id={`econ-row-${evt.id}`} className="hover:bg-[#161616] transition-all">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-bold text-white">{evt.date}</div>
                  <div className="text-[11px] text-gray-400">{evt.time} EST</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-gray-100 font-sans">{evt.indicator}</div>
                  <div className="text-[11px] text-gray-400 font-sans line-clamp-1">{evt.notes}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${getImpactBadge(evt.impactLevel)}`}>
                    {evt.impactLevel}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-300 font-semibold">{evt.consensus}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-400">{evt.previous}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[11px]">{getBondImpactBadge(evt.bondImpact)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
