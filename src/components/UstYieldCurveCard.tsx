import React from 'react';
import { TrendingUp, RefreshCw, Activity, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { TreasuryCurveData } from '../types';

interface UstYieldCurveCardProps {
  curveData: TreasuryCurveData;
  isLoadingLive?: boolean;
  onRefreshLive?: () => void;
}

export const UstYieldCurveCard: React.FC<UstYieldCurveCardProps> = ({
  curveData,
  isLoadingLive = false,
  onRefreshLive,
}) => {
  const curvePoints = [
    { label: '3M', val: curveData.y3m ?? 5.345, dur: '0.25y' },
    { label: '6M', val: curveData.y6m ?? 5.120, dur: '0.5y' },
    { label: '1Y', val: curveData.y1 ?? 4.880, dur: '1.0y' },
    { label: '2Y', val: curveData.y2 ?? 4.412, dur: '2.0y' },
    { label: '5Y', val: curveData.y5 ?? 4.195, dur: '5.0y' },
    { label: '7Y', val: curveData.y7 ?? 4.240, dur: '7.0y' },
    { label: '10Y', val: curveData.y10 ?? 4.284, dur: '10.0y', isAnchor: true },
    { label: '20Y', val: curveData.y20 ?? 4.580, dur: '20.0y' },
    { label: '30Y', val: curveData.y30 ?? 4.512, dur: '30.0y' },
  ];

  const minYield = Math.min(...curvePoints.map((p) => p.val)) - 0.2;
  const maxYield = Math.max(...curvePoints.map((p) => p.val)) + 0.2;
  const yieldRange = maxYield - minYield || 1;

  const isInverted = (curveData.curve2y10y ?? -0.128) < 0;

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-md bg-blue-950/60 border border-blue-800/60 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              US Treasury Yield Curve
              <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-700/50 text-[9px] font-mono">
                {curveData.source}
              </span>
            </h3>
            <p className="text-[10px] text-gray-400 font-mono">As of: {curveData.asOf}</p>
          </div>
        </div>

        {onRefreshLive && (
          <button
            onClick={onRefreshLive}
            disabled={isLoadingLive}
            className="p-1.5 rounded-lg bg-[#161616] hover:bg-[#222222] border border-[#2c2c2c] text-gray-300 text-xs font-mono flex items-center space-x-1 transition-all cursor-pointer"
            title="Fetch latest from Treasury.gov"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingLive ? 'animate-spin text-[#FFD700]' : ''}`} />
            <span className="hidden sm:inline text-[10px]">Sync</span>
          </button>
        )}
      </div>

      {/* 2s10s Spread Indicator */}
      <div className="px-4 py-2 bg-[#080808] border-b border-[#1a1a1a] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-[11px]">2Y / 10Y Curve Spread:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              isInverted
                ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                : 'bg-green-950/70 text-green-400 border border-green-800/60'
            }`}
          >
            {curveData.curve2y10y !== null && curveData.curve2y10y !== undefined
              ? `${curveData.curve2y10y > 0 ? '+' : ''}${(curveData.curve2y10y * 100).toFixed(1)} bp (${isInverted ? 'INVERTED' : 'NORMAL'})`
              : '-12.8 bp (INVERTED)'}
          </span>
        </div>
        <div className="text-[11px] text-gray-400">
          Anchor 10Y: <strong className="text-white">{curveData.y10?.toFixed(3) ?? '4.284'}%</strong>
        </div>
      </div>

      {/* Yield Curve SVG Graph */}
      <div className="p-4 bg-[#0a0a0a]">
        <div className="w-full h-24 relative">
          <svg className="w-full h-full" viewBox="0 0 360 80" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="360" y2="20" stroke="#1f1f1f" strokeDasharray="3 3" />
            <line x1="0" y1="50" x2="360" y2="50" stroke="#1f1f1f" strokeDasharray="3 3" />

            {/* Gradient area */}
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area path */}
            {(() => {
              const pts = curvePoints.map((p, i) => {
                const x = (i / (curvePoints.length - 1)) * 340 + 10;
                const y = 70 - ((p.val - minYield) / yieldRange) * 55;
                return { x, y };
              });
              const polyPoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
              const areaPath = `M ${pts[0].x} 75 L ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${pts[pts.length - 1].x} 75 Z`;

              return (
                <>
                  <path d={areaPath} fill="url(#curveGradient)" />
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polyPoints}
                  />
                  {pts.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={curvePoints[idx].isAnchor ? '4' : '2.5'}
                        fill={curvePoints[idx].isAnchor ? '#FFD700' : '#60a5fa'}
                        stroke="#080808"
                        strokeWidth="1.5"
                      />
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        {/* Curve Points Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 mt-2 pt-2 border-t border-[#1c1c1c]">
          {curvePoints.map((cp) => (
            <div
              key={cp.label}
              className={`text-center p-1 rounded font-mono ${
                cp.isAnchor
                  ? 'bg-[#1e1b08] border border-[#FFD700]/40'
                  : 'bg-[#111111] border border-[#1f1f1f]'
              }`}
            >
              <div className={`text-[10px] ${cp.isAnchor ? 'text-[#FFD700] font-bold' : 'text-gray-400'}`}>
                {cp.label}
              </div>
              <div className="text-[11px] font-bold text-white">{cp.val.toFixed(2)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
