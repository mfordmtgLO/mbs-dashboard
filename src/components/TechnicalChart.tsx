import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, BarChart2, Eye, DollarSign, Calculator, HelpCircle, Layers } from 'lucide-react';
import { MBSQuote, IntradayCandle } from '../types';
import { decimalTo32nds, computeLoanDollarImpact } from '../utils/mbsCalculations';

interface TechnicalChartProps {
  quote: MBSQuote;
  intradayData: IntradayCandle[];
}

export const TechnicalChart: React.FC<TechnicalChartProps> = ({ quote, intradayData }) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1d'>('15m');
  const [showSma50, setShowSma50] = useState<boolean>(true);
  const [showSma200, setShowSma200] = useState<boolean>(true);
  const [showBands, setShowBands] = useState<boolean>(true);
  const [calcLoanAmount, setCalcLoanAmount] = useState<number>(500000);

  const impact = computeLoanDollarImpact(calcLoanAmount, quote.changeBps);

  // Determine domain bounds
  const prices = intradayData.map((d) => d.close);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden flex flex-col">
      {/* Chart Header */}
      <div className="p-4 bg-[#0c0c0c] border-b border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white font-mono">{quote.symbol} Intraday Technicals</h3>
            <span className="px-2 py-0.5 rounded bg-[#FFD700]/15 border border-[#FFD700]/40 text-[#FFD700] text-xs font-mono font-bold">
              {quote.priceFormatted} ({quote.changeBps > 0 ? '+' : ''}{quote.changeBps.toFixed(1)} bps)
            </span>
          </div>
          <p className="text-xs text-gray-400">Institutional Volume & Moving Average Overlay (50 SMA / 200 EMA)</p>
        </div>

        {/* Timeframe & Indicators Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#080808] p-1 rounded-lg border border-[#222222] text-xs font-mono">
            {(['1m', '5m', '15m', '1d'] as const).map((tf) => (
              <button
                key={tf}
                id={`btn-tf-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md uppercase transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-[#FFD700] text-black font-bold shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Indicator toggles */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <button
              id="btn-toggle-sma50"
              onClick={() => setShowSma50(!showSma50)}
              className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
                showSma50
                  ? 'bg-[#2a2106] border-[#FFD700] text-[#FFD700] font-bold'
                  : 'bg-[#080808] border-[#222222] text-gray-500'
              }`}
            >
              50 SMA
            </button>
            <button
              id="btn-toggle-sma200"
              onClick={() => setShowSma200(!showSma200)}
              className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
                showSma200
                  ? 'bg-[#21112b] border-purple-600 text-purple-300 font-bold'
                  : 'bg-[#080808] border-[#222222] text-gray-500'
              }`}
            >
              200 EMA
            </button>
            <button
              id="btn-toggle-bands"
              onClick={() => setShowBands(!showBands)}
              className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
                showBands
                  ? 'bg-[#08222b] border-cyan-600 text-cyan-300 font-bold'
                  : 'bg-[#080808] border-[#222222] text-gray-500'
              }`}
            >
              Bollinger
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Recharts Stage */}
      <div className="h-72 sm:h-80 w-full p-3 bg-[#080808]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={intradayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradientGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#555555"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              orientation="right"
              stroke="#555555"
              tick={{ fontSize: 11, fontFamily: 'monospace' }}
              tickLine={false}
              tickFormatter={(val) => decimalTo32nds(val)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as IntradayCandle;
                  return (
                    <div className="bg-[#111111] border border-[#333333] p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1">
                      <div className="text-[#FFD700] font-bold border-b border-[#222222] pb-1">
                        Time: {label}
                      </div>
                      <div className="text-white">
                        Price (32nds): <span className="font-bold text-green-400">{decimalTo32nds(data.close)}</span>
                      </div>
                      <div className="text-gray-300">
                        Decimal: <span className="font-bold">{data.close.toFixed(4)}</span>
                      </div>
                      <div className="text-gray-400">
                        Vol: <span className="text-gray-200">{data.volume.toLocaleString()} contracts</span>
                      </div>
                      {showSma50 && data.sma50 && (
                        <div className="text-[#FFD700] text-[11px]">
                          50 SMA: {decimalTo32nds(data.sma50)}
                        </div>
                      )}
                      {showSma200 && data.sma200 && (
                        <div className="text-purple-400 text-[11px]">
                          200 EMA: {decimalTo32nds(data.sma200)}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Bollinger Bands */}
            {showBands && (
              <>
                <Line
                  type="monotone"
                  dataKey="upperBand"
                  stroke="#06b6d4"
                  strokeDasharray="2 2"
                  dot={false}
                  strokeWidth={1}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBand"
                  stroke="#06b6d4"
                  strokeDasharray="2 2"
                  dot={false}
                  strokeWidth={1}
                />
              </>
            )}

            {/* Moving Averages */}
            {showSma50 && (
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#FFD700"
                dot={false}
                strokeWidth={1.5}
              />
            )}
            {showSma200 && (
              <Line
                type="monotone"
                dataKey="sma200"
                stroke="#a855f7"
                dot={false}
                strokeWidth={1.5}
              />
            )}

            {/* Main Price Area in Luxury Gold */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="#FFD700"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#priceGradientGold)"
            />

            {/* Reference Line for Opening Price */}
            <ReferenceLine
              y={intradayData[0]?.open || 99.5}
              stroke="#666666"
              strokeDasharray="3 3"
              label={{
                value: 'Session Open',
                fill: '#888888',
                fontSize: 10,
                position: 'left',
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Originator Real-Time Dollar Impact Bar */}
      <div className="p-3.5 bg-[#0c0c0c] border-t border-[#222222] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-[#FFD700]" />
          <span className="font-bold text-gray-200">Loan Officer Dollar Impact:</span>
          <div className="flex items-center space-x-1 bg-[#141414] px-2 py-1 rounded-md border border-[#262626] font-mono">
            <span className="text-gray-500">$</span>
            <input
              id="input-calc-loan-amt"
              type="number"
              value={calcLoanAmount}
              onChange={(e) => setCalcLoanAmount(Number(e.target.value) || 0)}
              className="bg-transparent w-24 text-white font-bold focus:outline-none"
              step={50000}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">Pricing Gain/Loss:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                impact.dollarValue >= 0
                  ? 'bg-green-950 text-green-400 border border-green-800/80'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/80'
              }`}
            >
              {impact.dollarValue >= 0 ? '+' : '-'}${Math.abs(Math.round(impact.dollarValue)).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">Note Rate Shift:</span>
            <span className="text-[#FFD700] font-bold">
              ~{Math.abs(impact.rateEquivalent).toFixed(3)}% {impact.dollarValue >= 0 ? 'Improvement' : 'Worse'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
