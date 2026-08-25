import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  Bell,
  Sliders,
  ShieldAlert,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TradingSessionType } from '../types';

interface VolatilityControlBarProps {
  currentSession: TradingSessionType;
  onToggleSession: () => void;
  current10YYield: number;
  dailyBaseline10Y: number;
  afterHoursBaseline10Y: number;
  thresholdBps: number;
  onTriggerTestAlert: (direction: 'SPIKE_UP' | 'DROP_DOWN', customDelta?: number) => void;
  onOpenDrawer: () => void;
  alertCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VolatilityControlBar: React.FC<VolatilityControlBarProps> = ({
  currentSession,
  onToggleSession,
  current10YYield,
  dailyBaseline10Y,
  afterHoursBaseline10Y,
  thresholdBps,
  onTriggerTestAlert,
  onOpenDrawer,
  alertCount,
  soundEnabled,
  onToggleSound,
}) => {
  const activeBaseline = currentSession === 'LIVE_DAILY' ? dailyBaseline10Y : afterHoursBaseline10Y;
  const currentDeltaBps = +((current10YYield - activeBaseline) * 100).toFixed(1);
  const isApproachingThreshold = Math.abs(currentDeltaBps) >= thresholdBps;
  const isSpike = currentDeltaBps > 0;

  return (
    <div className="bg-[#0e0e0e] border border-[#222222] rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Left: Session Indicator & 10Y Yield Gauge */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Session Badge */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-bold ${
            currentSession === 'LIVE_DAILY'
              ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
              : 'bg-indigo-950/40 border-indigo-600/60 text-indigo-300'
          }`}
        >
          {currentSession === 'LIVE_DAILY' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span className="uppercase text-[11px]">
            {currentSession === 'LIVE_DAILY' ? 'Live Daily Bond Session' : 'After-Hours 10Y Window'}
          </span>
          <span className="text-[9px] px-1 rounded bg-black/40 text-gray-400">
            {currentSession === 'LIVE_DAILY' ? 'Pre-Close' : 'Overnight CME'}
          </span>
        </div>

        {/* 10Y Yield Metric */}
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-gray-400">10Y Benchmark CMT:</span>
          <span className="text-white font-bold text-sm">{current10YYield.toFixed(3)}%</span>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400">Session Shift:</span>
          <span
            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
              currentDeltaBps > 0
                ? 'bg-red-950/80 text-red-400 border border-red-800/60'
                : currentDeltaBps < 0
                ? 'bg-green-950/80 text-green-400 border border-green-800/60'
                : 'bg-[#181818] text-gray-400'
            }`}
          >
            {currentDeltaBps > 0 ? `+${currentDeltaBps.toFixed(1)}` : currentDeltaBps.toFixed(1)} bps
          </span>
        </div>

        {/* Rule explanation badge & Smoothed Delay Indicator */}
        <div className="hidden xl:flex items-center space-x-2 text-[11px] text-gray-400">
          <div className="flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Threshold: ±{thresholdBps.toFixed(1)} bps</span>
          </div>
          <span className="text-gray-600">•</span>
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-[#161616] border border-[#2a2a2a] text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pacing: 7s Delayed Smoothing (Stable EMA)</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Action Controls & Simulator Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle Session */}
        <button
          id="btn-toggle-trading-session"
          onClick={onToggleSession}
          className="px-2.5 py-1 bg-[#181818] hover:bg-[#222222] border border-[#333333] text-gray-300 hover:text-white rounded-lg transition-all flex items-center space-x-1 cursor-pointer text-[11px]"
          title="Switch between Regular Daily Session and After-Hours Trading Window"
        >
          {currentSession === 'LIVE_DAILY' ? (
            <>
              <Moon className="w-3 h-3 text-indigo-400" />
              <span>Switch to After-Hours</span>
            </>
          ) : (
            <>
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Switch to Live Daily</span>
            </>
          )}
        </button>

        {/* Test Trigger: +3.4 bps Spike (Red Alert) */}
        <button
          id="btn-simulate-red-spike"
          onClick={() => onTriggerTestAlert('SPIKE_UP', 3.4)}
          className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-300 hover:text-white rounded-lg transition-all flex items-center space-x-1 cursor-pointer text-[11px] font-bold shadow-sm"
          title="Simulate 10Y Yield Spike > +3bps (Red Alert)"
        >
          <TrendingUp className="w-3 h-3 text-red-400" />
          <span>Simulate +3.4bp Spike (Red)</span>
        </button>

        {/* Test Trigger: -3.6 bps Rally (Green Alert) */}
        <button
          id="btn-simulate-green-rally"
          onClick={() => onTriggerTestAlert('DROP_DOWN', -3.6)}
          className="px-2.5 py-1 bg-green-950/80 hover:bg-green-900 border border-green-700/80 text-green-300 hover:text-white rounded-lg transition-all flex items-center space-x-1 cursor-pointer text-[11px] font-bold shadow-sm"
          title="Simulate 10Y Yield Drop > -3bps (Green Alert)"
        >
          <TrendingDown className="w-3 h-3 text-green-400" />
          <span>Simulate -3.6bp Drop (Green)</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            soundEnabled
              ? 'bg-green-950/60 border-green-700/60 text-green-300'
              : 'bg-[#181818] border-[#2c2c2c] text-gray-400'
          }`}
          title={soundEnabled ? 'Chime Sound Enabled' : 'Chime Sound Muted'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Volatility Alert Hub / Drawer Button */}
        <button
          id="btn-open-volatility-drawer"
          onClick={onOpenDrawer}
          className="px-2.5 py-1 bg-[#221b06] hover:bg-[#2c2308] border border-[#FFD700]/50 text-[#FFD700] rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold"
        >
          <Bell className="w-3.5 h-3.5 text-[#FFD700]" />
          <span>Alert Log</span>
          {alertCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-black">
              {alertCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
