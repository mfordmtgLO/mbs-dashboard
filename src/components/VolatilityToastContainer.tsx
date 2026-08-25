import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  X,
  Clock,
  ExternalLink,
  ShieldAlert,
  Volume2,
  VolumeX,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
} from 'lucide-react';
import { VolatilityAlert, TradingSessionType } from '../types';

interface VolatilityToastContainerProps {
  alerts: VolatilityAlert[];
  onDismiss: (id: string) => void;
  onSelectAction?: (alert: VolatilityAlert, action: 'chart' | 'calculator' | 'lock') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VolatilityToastContainer: React.FC<VolatilityToastContainerProps> = ({
  alerts,
  onDismiss,
  onSelectAction,
  soundEnabled,
  onToggleSound,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
      {alerts.map((alert) => (
        <VolatilityToastItem
          key={alert.id}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
          onSelectAction={onSelectAction}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      ))}
    </div>
  );
};

interface VolatilityToastItemProps {
  alert: VolatilityAlert;
  onDismiss: () => void;
  onSelectAction?: (alert: VolatilityAlert, action: 'chart' | 'calculator' | 'lock') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const VolatilityToastItem: React.FC<VolatilityToastItemProps> = ({
  alert,
  onDismiss,
  onSelectAction,
  soundEnabled,
  onToggleSound,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isSpikeRed = alert.direction === 'SPIKE_UP';
  const isAfterHours = alert.session === 'AFTER_HOURS';

  // Auto-dismiss countdown after 12 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = 100;
    const totalDuration = 12000;
    const decrement = (interval / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto w-full rounded-xl border shadow-2xl overflow-hidden transition-all duration-300 transform translate-y-0 animate-bounce-short ${
        isSpikeRed
          ? 'bg-gradient-to-br from-[#200707] via-[#160505] to-[#0c0404] border-[#dc2626] shadow-red-950/80 ring-1 ring-red-500/50'
          : 'bg-gradient-to-br from-[#061e0e] via-[#05170b] to-[#030d06] border-[#16a34a] shadow-green-950/80 ring-1 ring-green-500/50'
      }`}
    >
      {/* Top Banner Tag & Controls */}
      <div
        className={`px-3.5 py-1.5 flex items-center justify-between border-b ${
          isSpikeRed
            ? 'bg-red-950/90 border-red-800/80 text-red-200'
            : 'bg-green-950/90 border-green-800/80 text-green-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          {/* Pulsing beacon */}
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isSpikeRed ? 'bg-red-400' : 'bg-green-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isSpikeRed ? 'bg-red-500' : 'bg-green-500'
              }`}
            ></span>
          </span>

          <span
            className={`font-mono text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              isSpikeRed
                ? 'bg-red-900/80 border-red-500 text-white'
                : 'bg-green-900/80 border-green-500 text-white'
            }`}
          >
            {isSpikeRed ? 'VOLATILITY SPIKE ALERT' : 'VOLATILITY RALLY ALERT'}
          </span>

          {/* Session Tag */}
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isAfterHours
                ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-300'
                : 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
            }`}
          >
            {isAfterHours ? '🌙 AFTER-HOURS WINDOW' : '☀️ LIVE DAILY (PRE-CLOSE)'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={onToggleSound}
            className="p-1 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Alert Chime On' : 'Alert Chime Muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body Content */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isSpikeRed
                  ? 'bg-red-900/30 border-red-600/60 text-red-400'
                  : 'bg-green-900/30 border-green-600/60 text-green-400'
              }`}
            >
              {isSpikeRed ? (
                <TrendingUp className="w-5 h-5 animate-pulse text-red-400" />
              ) : (
                <TrendingDown className="w-5 h-5 animate-pulse text-green-400" />
              )}
            </div>
            <div>
              <h4
                className={`text-sm font-black font-mono tracking-tight leading-tight ${
                  isSpikeRed ? 'text-red-300' : 'text-green-300'
                }`}
              >
                10Y Yield {alert.deltaBps > 0 ? `+${alert.deltaBps.toFixed(1)}` : alert.deltaBps.toFixed(1)} bps Movement
              </h4>
              <p className="text-[11px] font-mono text-gray-300">
                10Y CMT: <strong className="text-white">{alert.currentYield.toFixed(3)}%</strong> (Baseline: {alert.baselineYield.toFixed(3)}%)
              </p>
            </div>
          </div>

          <div
            className={`text-right px-2.5 py-1 rounded-lg border font-mono ${
              isSpikeRed
                ? 'bg-red-950/70 border-red-700/60 text-red-300'
                : 'bg-green-950/70 border-green-700/60 text-green-300'
            }`}
          >
            <span className="text-[10px] uppercase block font-bold text-gray-400">Delta</span>
            <span className="text-base font-black">
              {alert.deltaBps > 0 ? `+${alert.deltaBps.toFixed(1)}` : alert.deltaBps.toFixed(1)} bp
            </span>
          </div>
        </div>

        {/* Narrative & Mortgage Impact */}
        <p className="text-xs text-gray-200 leading-relaxed font-sans">
          {alert.message}
        </p>

        {/* Impact & Pipeline Advice Pill */}
        <div
          className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-2 ${
            isSpikeRed
              ? 'bg-red-950/40 border-red-800/60 text-red-200'
              : 'bg-green-950/40 border-green-800/60 text-green-200'
          }`}
        >
          <div className="flex items-center space-x-1.5">
            {isSpikeRed ? (
              <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            )}
            <span className="font-bold">{alert.marketImpact}</span>
          </div>
          <span className="text-[10px] text-gray-400">{alert.timestamp}</span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {isSpikeRed ? (
            <button
              onClick={() => onSelectAction && onSelectAction(alert, 'lock')}
              className="flex-1 py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer shadow"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Guidance</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectAction && onSelectAction(alert, 'calculator')}
              className="flex-1 py-1.5 px-2 bg-green-600 hover:bg-green-500 text-white font-mono text-[11px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer shadow"
            >
              <Unlock className="w-3 h-3" />
              <span>Float Strategy</span>
            </button>
          )}

          <button
            onClick={() => onSelectAction && onSelectAction(alert, 'chart')}
            className="py-1.5 px-3 bg-[#181818] hover:bg-[#252525] border border-[#333333] text-gray-300 hover:text-white font-mono text-[11px] font-medium rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
          >
            <span>View 10Y Chart</span>
          </button>
        </div>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      <div className="w-full bg-[#161616] h-1">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            isSpikeRed ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
