import React from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Calculator,
  LineChart,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { VolatilityAlert, MBSQuote } from '../types';

interface VolatilityStrategyModalProps {
  alert: VolatilityAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
  onOpenChart: () => void;
  onAskAi: (promptText: string) => void;
  activeQuote: MBSQuote;
}

export const VolatilityStrategyModal: React.FC<VolatilityStrategyModalProps> = ({
  alert,
  isOpen,
  onClose,
  onOpenCalculator,
  onOpenChart,
  onAskAi,
  activeQuote,
}) => {
  if (!isOpen || !alert) return null;

  const isSpikeRed = alert.direction === 'SPIKE_UP';
  const isYieldDown = alert.deltaBps < 0;

  const aiPrompt = isYieldDown
    ? `The 10Y Treasury yield just dropped ${Math.abs(alert.deltaBps).toFixed(1)} bps to ${alert.currentYield.toFixed(3)}% (Positive Reprice Opportunity). How should I advise clients with 15-day vs 30-day closings on floating today?`
    : `The 10Y Treasury yield just surged +${alert.deltaBps.toFixed(1)} bps to ${alert.currentYield.toFixed(3)}% (Negative Reprice Risk). How quickly should I lock my active pipeline before wholesale lenders pull rate sheets?`;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`bg-[#111111] border rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          isSpikeRed ? 'border-red-600/70 shadow-red-950/80' : 'border-green-600/70 shadow-green-950/80'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            isSpikeRed
              ? 'bg-gradient-to-r from-[#200808] to-[#140505] border-red-800/80'
              : 'bg-gradient-to-r from-[#06200f] to-[#04140a] border-green-800/80'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isSpikeRed
                  ? 'bg-red-900/60 border-red-500/80 text-red-300'
                  : 'bg-green-900/60 border-green-500/80 text-green-300'
              }`}
            >
              {isSpikeRed ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                    isSpikeRed
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-green-950 text-green-300 border-green-700'
                  }`}
                >
                  {isSpikeRed ? 'LOCK MANDATE & REPRICE RISK' : 'FLOAT WINDOW & RALLY STRATEGY'}
                </span>
                <span className="text-xs font-mono text-gray-400">{alert.timestamp}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {isSpikeRed ? 'Defensive Lock Guidance' : 'Tactical Float Advisory'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#222222] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-gray-200">
          {/* Yield Shift Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#0a0a0a] border border-[#222222] flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-mono text-gray-400 font-bold block">
                10Y Treasury Movement
              </span>
              <div className="text-lg font-mono font-black text-white flex items-center space-x-2 mt-0.5">
                <span>{alert.currentYield.toFixed(3)}%</span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    isYieldDown ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                  }`}
                >
                  {alert.deltaBps > 0 ? `+${alert.deltaBps.toFixed(1)}` : alert.deltaBps.toFixed(1)} bps
                </span>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] uppercase text-gray-500 block">Wholesale Outlook</span>
              <span
                className={`text-xs font-bold ${
                  isYieldDown ? 'text-green-400' : 'text-rose-400'
                }`}
              >
                {alert.marketImpact}
              </span>
            </div>
          </div>

          {/* Core Tactical Directive by Horizon */}
          <div className="space-y-2.5">
            <h4 className="text-xs uppercase font-mono text-gray-400 font-bold tracking-wider">
              Recommended Loan Horizon Action Plan
            </h4>

            <div className="space-y-2">
              {/* 0-15 Days */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#282828] flex items-start space-x-3">
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isYieldDown ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">0 - 15 Day Closings:</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isYieldDown
                          ? 'bg-green-950 text-green-300 border border-green-800'
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}
                    >
                      {isYieldDown ? 'FLOAT TO IMPROVE' : 'LOCK IMMEDIATELY'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {isYieldDown
                      ? 'Lenders are expanding margins. Hold closing files for potential positive mid-day rate sheet improvements before 2:00 PM EST.'
                      : 'Wholesale lenders face margin compression. Lock in current note rates before secondary desks issue mid-day rate worsenings.'}
                  </p>
                </div>
              </div>

              {/* 15-30 Days */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#282828] flex items-start space-x-3">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-[#1c1c1c] text-[#FFD700]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">15 - 30 Day Closings:</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      {isYieldDown ? 'CAUTIOUS FLOAT WITH STOPS' : 'SELECTIVE LOCK'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    {isYieldDown
                      ? 'Maintain active float posture with stop-loss set if the 10Y yield bounces back above the baseline.'
                      : 'Lock conservative and payment-sensitive borrowers. Consider float-down renegotiation options if available.'}
                  </p>
                </div>
              </div>

              {/* 30+ Days */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#282828] flex items-start space-x-3">
                <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-[#1c1c1c] text-blue-400">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">30 - 60+ Day Pipeline:</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      TECHNICAL BIAS
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    Evaluate macroeconomic calendar risk (CPI, PCE, FOMC). Lock long-dated commitments where extension fees outweigh potential pricing gains.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#222222] flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => {
              onClose();
              onAskAi(aiPrompt);
            }}
            className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-[#1f1905] hover:bg-[#2e2407] border border-[#FFD700]/50 text-[#FFD700] font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Ask AI Strategist</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenCalculator();
            }}
            className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] text-white font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>Scenario Calculator</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenChart();
            }}
            className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] text-white font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <LineChart className="w-3.5 h-3.5 text-emerald-400" />
            <span>View 10Y Chart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
