import React, { useState } from 'react';
import {
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  Clock,
  Lock,
  Unlock,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { VolatilityAlert, TradingSessionType } from '../types';

interface VolatilityAlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alertsHistory: VolatilityAlert[];
  onClearHistory: () => void;
  currentSession: TradingSessionType;
  onToggleSession: () => void;
  thresholdBps: number;
  onSetThresholdBps: (val: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerTestAlert: (direction: 'SPIKE_UP' | 'DROP_DOWN', customDelta?: number) => void;
  current10YYield: number;
  dailyBaseline10Y: number;
  afterHoursBaseline10Y: number;
}

export const VolatilityAlertsDrawer: React.FC<VolatilityAlertsDrawerProps> = ({
  isOpen,
  onClose,
  alertsHistory,
  onClearHistory,
  currentSession,
  onToggleSession,
  thresholdBps,
  onSetThresholdBps,
  soundEnabled,
  onToggleSound,
  onTriggerTestAlert,
  current10YYield,
  dailyBaseline10Y,
  afterHoursBaseline10Y,
}) => {
  const [filterSession, setFilterSession] = useState<'ALL' | 'LIVE_DAILY' | 'AFTER_HOURS'>('ALL');
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'SPIKE_UP' | 'DROP_DOWN'>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alertsHistory.filter((alert) => {
    if (filterSession !== 'ALL' && alert.session !== filterSession) return false;
    if (filterDirection !== 'ALL' && alert.direction !== filterDirection) return false;
    return true;
  });

  const activeBaseline = currentSession === 'LIVE_DAILY' ? dailyBaseline10Y : afterHoursBaseline10Y;
  const currentDeltaBps = +((current10YYield - activeBaseline) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f0f0f] border-l border-[#262626] text-gray-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#080808] border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-red-400">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  10Y Volatility & Reprice Desk
                  <span className="px-1.5 py-0.2 rounded bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[9px] font-mono">
                    ±{thresholdBps.toFixed(1)} bp RULE
                  </span>
                </h3>
                <p className="text-[11px] text-gray-400 font-mono">
                  Live & After-Hours Intraday Yield Shift Monitor
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1c1c1c] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Session Status & Live Gauge */}
          <div className="p-4 bg-[#141414] border-b border-[#222222] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {currentSession === 'LIVE_DAILY' ? (
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
                <span className="text-xs font-mono font-bold text-white uppercase">
                  {currentSession === 'LIVE_DAILY'
                    ? '☀️ Live Daily Session (Pre-Close)'
                    : '🌙 After-Hours Trading Window'}
                </span>
              </div>

              {/* Session Switcher */}
              <button
                onClick={onToggleSession}
                className="px-2.5 py-1 rounded bg-[#1f1f1f] hover:bg-[#2c2c2c] border border-[#333333] text-[10px] font-mono text-gray-300 font-bold transition-all cursor-pointer"
              >
                Switch to {currentSession === 'LIVE_DAILY' ? 'After-Hours' : 'Live Daily'}
              </button>
            </div>

            {/* Current Metrics Card */}
            <div className="grid grid-cols-3 gap-2 bg-[#0a0a0a] p-2.5 rounded-lg border border-[#202020] font-mono text-center">
              <div>
                <span className="text-[9px] text-gray-500 uppercase block">10Y Current</span>
                <span className="text-xs font-black text-white">{current10YYield.toFixed(3)}%</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase block">Session Open</span>
                <span className="text-xs font-bold text-gray-300">{activeBaseline.toFixed(3)}%</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-500 uppercase block">Session Shift</span>
                <span
                  className={`text-xs font-black ${
                    currentDeltaBps > 0
                      ? 'text-red-400'
                      : currentDeltaBps < 0
                      ? 'text-green-400'
                      : 'text-gray-400'
                  }`}
                >
                  {currentDeltaBps > 0 ? `+${currentDeltaBps.toFixed(1)}` : currentDeltaBps.toFixed(1)} bp
                </span>
              </div>
            </div>

            {/* Threshold & Sound Settings */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <div className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="text-gray-400 text-[11px]">Trigger Threshold:</span>
                <select
                  value={thresholdBps}
                  onChange={(e) => onSetThresholdBps(parseFloat(e.target.value))}
                  className="bg-[#0a0a0a] border border-[#333333] rounded px-2 py-0.5 text-xs text-[#FFD700] font-bold focus:outline-none"
                >
                  <option value={2.0}>±2.0 bps (High Sensitivity)</option>
                  <option value={2.5}>±2.5 bps (Moderate)</option>
                  <option value={3.0}>±3.0 bps (Standard Mandate)</option>
                  <option value={4.0}>±4.0 bps (Major Events)</option>
                  <option value={5.0}>±5.0 bps (Wholesale Shock)</option>
                </select>
              </div>

              <button
                onClick={onToggleSound}
                className={`p-1.5 rounded flex items-center space-x-1 border cursor-pointer ${
                  soundEnabled
                    ? 'bg-green-950/70 border-green-700/60 text-green-300'
                    : 'bg-[#181818] border-[#2c2c2c] text-gray-400'
                }`}
                title={soundEnabled ? 'Chime Sound Enabled' : 'Sound Muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{soundEnabled ? 'Chime ON' : 'MUTED'}</span>
              </button>
            </div>
          </div>

          {/* Test Trigger Simulator Strip */}
          <div className="p-3 bg-[#0a0a0a] border-b border-[#222222] space-y-2">
            <div className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center justify-between">
              <span>Instant Test Simulation Triggers:</span>
              <span className="text-gray-500">Fires Real Toast</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onTriggerTestAlert('SPIKE_UP', 3.4)}
                className="py-1.5 px-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/80 text-red-200 font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow"
              >
                <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                <span>Test +3.4 bp Spike (Red)</span>
              </button>

              <button
                onClick={() => onTriggerTestAlert('DROP_DOWN', -3.6)}
                className="py-1.5 px-2.5 rounded-lg bg-green-950/80 hover:bg-green-900 border border-green-700/80 text-green-200 font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow"
              >
                <TrendingDown className="w-3.5 h-3.5 text-green-400" />
                <span>Test -3.6 bp Rally (Green)</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center space-x-1">
              <span className="text-gray-500 mr-1">Filter:</span>
              {(['ALL', 'LIVE_DAILY', 'AFTER_HOURS'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSession(s)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    filterSession === s
                      ? 'bg-[#222222] text-[#FFD700] font-bold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s === 'LIVE_DAILY' ? 'Daily' : 'After-Hrs'}
                </button>
              ))}
            </div>

            {alertsHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-gray-500 hover:text-rose-400 transition-colors flex items-center space-x-1 cursor-pointer text-[10px]"
                title="Clear alert log"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear Log</span>
              </button>
            )}
          </div>

          {/* Alert History Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#080808]">
            {filteredAlerts.length === 0 ? (
              <div className="py-16 text-center text-gray-500 font-mono space-y-2">
                <CheckCircle2 className="w-8 h-8 text-green-500/40 mx-auto" />
                <p className="text-xs">No volatility alerts recorded in this session filter.</p>
                <p className="text-[10px] text-gray-600">
                  Alerts automatically trigger when 10Y moves &gt; ±{thresholdBps} bps.
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSpikeRed = alert.direction === 'SPIKE_UP';
                const isAfter = alert.session === 'AFTER_HOURS';

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isSpikeRed
                        ? 'bg-[#180808] border-red-900/60 hover:border-red-600/80'
                        : 'bg-[#08180c] border-green-900/60 hover:border-green-600/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${
                            isSpikeRed
                              ? 'bg-red-950 text-red-300 border-red-800'
                              : 'bg-green-950 text-green-300 border-green-800'
                          }`}
                        >
                          {isSpikeRed ? '▲ YIELD SPIKE' : '▼ YIELD RALLY'}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {isAfter ? '🌙 After-Hours' : '☀️ Live Daily'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{alert.timestamp}</span>
                    </div>

                    <div className="flex items-baseline justify-between mb-1">
                      <h4
                        className={`text-xs font-bold font-mono ${
                          isSpikeRed ? 'text-red-300' : 'text-green-300'
                        }`}
                      >
                        {alert.headline}
                      </h4>
                      <span
                        className={`text-xs font-mono font-black ${
                          isSpikeRed ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {alert.deltaBps > 0 ? `+${alert.deltaBps.toFixed(1)}` : alert.deltaBps.toFixed(1)} bp
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 leading-snug font-sans mb-2">
                      {alert.message}
                    </p>

                    <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span>Rate Impact: <strong className={isSpikeRed ? 'text-red-400' : 'text-green-400'}>{alert.marketImpact}</strong></span>
                      <span className="text-gray-500">10Y: {alert.currentYield.toFixed(3)}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 bg-[#080808] border-t border-[#222222] text-[10px] font-mono text-gray-500 text-center">
            MBS-Live Institutional Volatility Engine • Pre-Close & After-Hours CME CME Active
          </div>
        </div>
      </div>
    </div>
  );
};
