import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  ShieldAlert,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Info,
} from 'lucide-react';
import { MBSQuote } from '../types';

interface MbsTickerBoardProps {
  quotes: MBSQuote[];
  selectedQuoteId: string;
  onSelectQuote: (id: string) => void;
  isSimulatingTicks: boolean;
  setIsSimulatingTicks: (val: boolean) => void;
  anchorY10Yield?: number;
}

export const MbsTickerBoard: React.FC<MbsTickerBoardProps> = ({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  isSimulatingTicks,
  setIsSimulatingTicks,
  anchorY10Yield = 4.284,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [displayFormat, setDisplayFormat] = useState<'32nds' | 'decimal'>('32nds');
  const [filterAgency, setFilterAgency] = useState<'ALL' | 'FNMA' | 'FHLMC' | 'GNMA' | 'BENCHMARK'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate max volume for relative volume bars
  const maxVol = Math.max(...quotes.map((q) => q.volBillions || 1.0), 6.8);

  const filteredQuotes = quotes.filter((q) => {
    // Agency Filter
    if (filterAgency === 'FNMA' && q.agency !== 'FNMA') return false;
    if (filterAgency === 'FHLMC' && q.agency !== 'FHLMC') return false;
    if (filterAgency === 'GNMA' && q.agency !== 'GNMA') return false;
    if (filterAgency === 'BENCHMARK' && q.agency !== 'UST' && q.agency !== 'SPREAD') return false;

    // Search Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        q.symbol.toLowerCase().includes(query) ||
        q.name.toLowerCase().includes(query) ||
        (q.agency && q.agency.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden">
      {/* Board Header */}
      <div className="p-4 bg-[#0c0c0c] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Agency MBS TBA Pricing Matrix & Depth
              <span className="px-2 py-0.5 rounded bg-green-950/80 text-green-400 border border-green-800/80 text-[10px] font-mono font-bold">
                STREAMING
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Institutional TBA Prices anchored to 10Y UST CMT ({anchorY10Yield.toFixed(3)}%) + Historical Agency OAS Spreads
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center bg-[#080808] p-1 rounded-lg border border-[#222222]">
            <button
              id="btn-view-table"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#FFD700] text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
              title="Matrix Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#FFD700] text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Format Toggle: 32nds vs Decimal */}
          <div className="flex items-center bg-[#080808] p-1 rounded-lg border border-[#222222] text-xs">
            <button
              id="btn-format-32nds"
              onClick={() => setDisplayFormat('32nds')}
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                displayFormat === '32nds'
                  ? 'bg-[#FFD700] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              32nds (Wall St)
            </button>
            <button
              id="btn-format-decimal"
              onClick={() => setDisplayFormat('decimal')}
              className={`px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
                displayFormat === 'decimal'
                  ? 'bg-[#FFD700] text-black shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Decimal
            </button>
          </div>

          {/* Tick Simulator Toggle */}
          <button
            id="btn-toggle-tick-sim"
            onClick={() => setIsSimulatingTicks(!isSimulatingTicks)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold font-mono flex items-center space-x-1.5 transition-all cursor-pointer ${
              isSimulatingTicks
                ? 'bg-[#152417] border-green-700/80 text-green-400'
                : 'bg-[#161616] border-[#333333] text-gray-400'
            }`}
            title="Toggle Live Simulated Price Ticks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingTicks ? 'animate-spin text-green-400' : ''}`} />
            <span className="hidden sm:inline">{isSimulatingTicks ? 'Live Ticks' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Strip */}
      <div className="px-4 py-2 bg-[#0a0a0a] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs">
          {(['ALL', 'FNMA', 'FHLMC', 'GNMA', 'BENCHMARK'] as const).map((agency) => (
            <button
              key={agency}
              onClick={() => setFilterAgency(agency)}
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                filterAgency === agency
                  ? 'bg-[#221c06] text-[#FFD700] border border-[#FFD700]/50'
                  : 'text-gray-400 hover:text-white hover:bg-[#141414] border border-transparent'
              }`}
            >
              {agency === 'ALL' ? 'All Pools' : agency === 'BENCHMARK' ? 'Treasuries & Spreads' : `${agency} TBA`}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter coupon, pool, rate..."
            className="w-full bg-[#141414] border border-[#262626] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#FFD700]"
          />
        </div>
      </div>

      {/* Reprice Alert Bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-[#142316] via-[#111111] to-[#0c0c0c] border-b border-[#222222] flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-green-400 animate-pulse" />
          <span className="font-bold text-gray-200">Wholesale Lender Reprice Probability:</span>
          <span className="px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-600/50 font-mono font-bold">
            78% POSITIVE REPRICING
          </span>
        </div>
        <div className="text-gray-400 text-[11px] font-mono hidden md:block">
          Avg Reprice Threshold: ±15 bps | Active 5.5% Benchmark: <span className="text-green-400 font-bold">+18.2 bps</span>
        </div>
      </div>

      {/* Main View: Table vs Grid */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#080808] text-gray-400 font-mono text-[11px] uppercase border-b border-[#222222]">
              <tr>
                <th className="px-4 py-3">Coupon / Pool</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Day Chg</th>
                <th className="px-4 py-3 text-right">Yield %</th>
                <th className="px-4 py-3 text-right">Duration</th>
                <th className="px-4 py-3 text-right">OAS (bp)</th>
                <th className="px-4 py-3 text-right">Gross Spread</th>
                <th className="px-4 py-3 text-left">Trading Vol</th>
                <th className="px-4 py-3 text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c] font-mono text-gray-200 bg-[#0e0e0e]">
              {filteredQuotes.map((q) => {
                const isSelected = q.id === selectedQuoteId;
                const isUp = q.change32nds >= 0;
                const isTreasury = q.category === 'TREASURY';
                const isSpread = q.category === 'SPREAD';
                const volWidth = q.volBillions ? Math.min(80, Math.round((q.volBillions / maxVol) * 75)) : 15;

                return (
                  <tr
                    key={q.id}
                    id={`table-row-${q.id}`}
                    onClick={() => onSelectQuote(q.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1b08] hover:bg-[#252009] border-l-2 border-[#FFD700]'
                        : 'hover:bg-[#151515]'
                    }`}
                  >
                    {/* Symbol & Name */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"></span>}
                        <span>{q.symbol}</span>
                      </div>
                      <div className="text-[10px] text-gray-400">{q.name}</div>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-2.5 text-right font-bold text-white text-sm whitespace-nowrap">
                      {displayFormat === '32nds'
                        ? q.priceFormatted
                        : isTreasury || isSpread
                        ? q.priceFormatted
                        : q.price.toFixed(3)}
                    </td>

                    {/* Day Change */}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          isUp
                            ? 'text-green-400 bg-green-950/60 border border-green-800/50'
                            : 'text-rose-400 bg-rose-950/60 border border-rose-800/50'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {!isTreasury && !isSpread
                          ? `${q.change32nds}/32`
                          : `${q.changeBps.toFixed(1)} bps`}
                      </span>
                    </td>

                    {/* Yield */}
                    <td className="px-4 py-2.5 text-right text-[#FFD700] font-semibold whitespace-nowrap">
                      {q.yieldRate.toFixed(3)}%
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-2.5 text-right text-gray-300 whitespace-nowrap">
                      {q.duration ? `${q.duration.toFixed(1)}y` : '—'}
                    </td>

                    {/* OAS */}
                    <td className="px-4 py-2.5 text-right text-purple-400 whitespace-nowrap">
                      {q.histOas ? `${q.histOas} bp` : '—'}
                    </td>

                    {/* Gross Spread */}
                    <td className="px-4 py-2.5 text-right text-blue-400 whitespace-nowrap">
                      {q.grossSpreadBps !== undefined ? `+${q.grossSpreadBps} bp` : '—'}
                    </td>

                    {/* Volume Bar */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#222222] h-2 rounded overflow-hidden">
                          <div
                            className="bg-blue-500/70 h-full rounded"
                            style={{ width: `${volWidth}px` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {q.volBillions ? `${q.volBillions.toFixed(2)}B` : q.volume}
                        </span>
                      </div>
                    </td>

                    {/* Mini SVG Sparkline */}
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      {q.sparkline && q.sparkline.length > 1 ? (
                        <svg className="w-16 h-5 inline-block" viewBox="0 0 60 20">
                          {(() => {
                            const min = Math.min(...q.sparkline);
                            const max = Math.max(...q.sparkline);
                            const range = max - min || 0.01;
                            const pts = q.sparkline
                              .map((v, i) => {
                                const x = (i / (q.sparkline.length - 1)) * 56 + 2;
                                const y = 18 - ((v - min) / range) * 14;
                                return `${x},${y}`;
                              })
                              .join(' ');
                            const isLineUp = q.sparkline[q.sparkline.length - 1] >= q.sparkline[0];
                            return (
                              <polyline
                                fill="none"
                                stroke={isLineUp ? '#22c55e' : '#ef4444'}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                points={pts}
                              />
                            );
                          })()}
                        </svg>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0a0a0a]">
          {filteredQuotes.map((q) => {
            const isSelected = q.id === selectedQuoteId;
            const isUp = q.change32nds >= 0;
            const isTreasury = q.category === 'TREASURY';
            const isSpread = q.category === 'SPREAD';

            return (
              <div
                key={q.id}
                id={`quote-card-${q.id}`}
                onClick={() => onSelectQuote(q.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#181818] border-[#FFD700] ring-1 ring-[#FFD700]/50 shadow-lg shadow-[#FFD700]/10'
                    : 'bg-[#111111] border-[#222222] hover:bg-[#161616] hover:border-[#333333]'
                }`}
              >
                {/* Card Top: Symbol & Category */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-white font-mono tracking-tight flex items-center gap-1.5">
                      {q.symbol}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]"></span>}
                    </span>
                    <p className="text-[10px] text-gray-400 truncate max-w-[170px]">{q.name}</p>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#080808] border border-[#222222] text-gray-400">
                    {q.agency || q.category.replace('_', ' ')}
                  </span>
                </div>

                {/* Card Middle: Price & Delta */}
                <div className="my-2.5 flex items-baseline justify-between">
                  <div className="text-xl font-black font-mono tracking-tight text-white">
                    {displayFormat === '32nds'
                      ? q.priceFormatted
                      : isTreasury || isSpread
                      ? q.priceFormatted
                      : q.price.toFixed(3)}
                  </div>

                  <div
                    className={`flex items-center space-x-0.5 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                      isUp
                        ? 'bg-green-950/80 text-green-400 border border-green-800/80'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                    }`}
                  >
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>
                      {!isTreasury && !isSpread
                        ? `${isUp ? '+' : ''}${q.change32nds}/32`
                        : `${isUp ? '+' : ''}${q.changeBps.toFixed(1)} bps`}
                    </span>
                  </div>
                </div>

                {/* Card Bottom: Duration, Yield, OAS */}
                <div className="pt-2 border-t border-[#1e1e1e] flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <div>
                    <span className="text-gray-500">Yield: </span>
                    <span className="text-[#FFD700] font-semibold">{q.yieldRate.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Net: </span>
                    <span className={isUp ? 'text-green-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isUp ? '+' : ''}{q.changeBps.toFixed(1)} bps
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pricing Methodology Footer Banner */}
      <div className="p-3 bg-[#080808] border-t border-[#222222] flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-400 gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>
            Model: <strong className="text-gray-200">Price = 100 + duration × (coupon − yield)</strong> | MBS yield = 10Y CMT + OAS spread
          </span>
        </div>
        <div className="text-gray-500">
          Wall Street TBA Benchmark • ±0.5 bp Intraday Tick Engine Active
        </div>
      </div>
    </div>
  );
};
