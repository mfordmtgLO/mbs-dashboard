import React, { useState } from 'react';
import { Calculator, ShieldCheck, AlertTriangle, TrendingUp, DollarSign, Clock, HelpCircle, Layers } from 'lucide-react';
import { MBSQuote } from '../types';
import { computeLoanDollarImpact, decimalTo32nds } from '../utils/mbsCalculations';

interface MortgageProCalculatorProps {
  activeQuote: MBSQuote;
}

export const MortgageProCalculator: React.FC<MortgageProCalculatorProps> = ({ activeQuote }) => {
  const [loanAmount, setLoanAmount] = useState<number>(650000);
  const [noteRate, setNoteRate] = useState<number>(6.625);
  const [closingDays, setClosingDays] = useState<number>(20);
  const [simulatedPriceMove, setSimulatedPriceMove] = useState<number>(activeQuote.changeBps || 15);
  const [borrowerRiskTolerance, setBorrowerRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');

  const impact = computeLoanDollarImpact(loanAmount, simulatedPriceMove);

  // Compute Lock vs Float Decision Matrix
  const getRecommendation = () => {
    if (closingDays <= 7) {
      return {
        verdict: 'MANDATORY LOCK',
        color: 'text-rose-400 bg-rose-950/80 border-rose-800',
        summary: 'Under 7 days to close. Do not gamble on operational or funding delays. Bank current pricing.',
      };
    }
    if (simulatedPriceMove > 20 && borrowerRiskTolerance === 'low') {
      return {
        verdict: 'LOCK ON STRENGTH',
        color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800',
        summary: 'MBS prices are up significantly today. Lock in the discount points gain for conservative borrowers.',
      };
    }
    if (closingDays >= 30 && borrowerRiskTolerance === 'high') {
      return {
        verdict: 'SELECTIVE FLOAT',
        color: 'text-blue-400 bg-blue-950/80 border-blue-800',
        summary: 'Ample time horizon with technical support holding. Maintain tight stop-loss at 50 SMA.',
      };
    }
    return {
      verdict: 'CAUTIOUS FLOAT WITH STOPS',
      color: 'text-amber-400 bg-amber-950/80 border-amber-800',
      summary: 'Float into morning economic releases but set a protective lock threshold if MBS dips >12 bps.',
    };
  };

  const rec = getRecommendation();

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Originator Lock vs. Float Scenario Matrix
            </h2>
            <p className="text-xs text-gray-400">
              Calculate loan-level pricing sensitivity and risk-adjusted lock recommendations
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#1c1605] text-[#FFD700] border border-[#FFD700]/40 text-xs font-mono font-bold">
          Active Benchmark: {activeQuote.symbol}
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0e0e0e]">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Loan Amount */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Loan Amount ($)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-xs font-mono font-bold">
                  $
                </span>
                <input
                  id="calc-loan-amount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value) || 0)}
                  className="w-full bg-[#080808] border border-[#262626] rounded-lg pl-7 pr-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-[#FFD700]"
                  step={25000}
                />
              </div>
            </div>

            {/* Note Rate */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Target Note Rate (%)
              </label>
              <div className="relative">
                <input
                  id="calc-note-rate"
                  type="number"
                  value={noteRate}
                  onChange={(e) => setNoteRate(Number(e.target.value) || 0)}
                  className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-[#FFD700]"
                  step={0.125}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-xs font-mono font-bold">
                  %
                </span>
              </div>
            </div>

            {/* Closing Horizon */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Days to Closing / Funding
              </label>
              <select
                id="calc-closing-days"
                value={closingDays}
                onChange={(e) => setClosingDays(Number(e.target.value))}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#FFD700]"
              >
                <option value={7}>7 Days (Immediate Closing)</option>
                <option value={15}>15 Days (Short Window)</option>
                <option value={30}>30 Days (Standard Horizon)</option>
                <option value={45}>45 Days (Extended Window)</option>
                <option value={60}>60 Days (Long-Term Pipeline)</option>
              </select>
            </div>

            {/* Borrower Risk Tolerance */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Borrower Risk Tolerance
              </label>
              <select
                id="calc-risk-tolerance"
                value={borrowerRiskTolerance}
                onChange={(e) => setBorrowerRiskTolerance(e.target.value as any)}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#FFD700]"
              >
                <option value="low">Low (Conservative - Payment Sensitive)</option>
                <option value="medium">Medium (Balanced Approach)</option>
                <option value="high">High (Aggressive Rate Hunter)</option>
              </select>
            </div>
          </div>

          {/* Intraday Price Move Slider */}
          <div className="bg-[#080808] p-4 rounded-xl border border-[#222222] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-300">Simulate MBS Coupon Price Move:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${simulatedPriceMove >= 0 ? 'bg-green-950 text-green-400 border border-green-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                {simulatedPriceMove >= 0 ? '+' : ''}{simulatedPriceMove} bps
              </span>
            </div>
            <input
              id="slider-price-move"
              type="range"
              min={-50}
              max={50}
              value={simulatedPriceMove}
              onChange={(e) => setSimulatedPriceMove(Number(e.target.value))}
              className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>-50 bps (Severe Reprice Worse)</span>
              <span>0 bps (Parity)</span>
              <span>+50 bps (Rally / Reprice Better)</span>
            </div>
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#080808] rounded-xl border border-[#222222] p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-[#FFD700] uppercase tracking-wider block mb-2">
              FINANCIAL SENSITIVITY IMPACT
            </span>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg">
                <span className="text-[11px] text-gray-400 block">Lender Credit / Cost:</span>
                <span className={`text-lg font-black font-mono ${impact.dollarValue >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {impact.dollarValue >= 0 ? '+' : '-'}${Math.abs(Math.round(impact.dollarValue)).toLocaleString()}
                </span>
              </div>

              <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg">
                <span className="text-[11px] text-gray-400 block">Rate Shift Equivalent:</span>
                <span className="text-lg font-black font-mono text-[#FFD700]">
                  {Math.abs(impact.rateEquivalent).toFixed(3)}%
                </span>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#262626] p-3 rounded-lg text-xs space-y-1 mb-4 font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Principal & Interest (P&I):</span>
                <span className="text-white font-bold">${Math.round((loanAmount / 1000) * 6.4).toLocaleString()}/mo</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Payment Delta:</span>
                <span className="text-[#FFD700] font-bold">~${Math.round(impact.monthlyPmtImpact)}/mo</span>
              </div>
            </div>

            {/* Final AI Recommendation Box */}
            <div className={`p-4 rounded-lg border ${rec.color} space-y-1`}>
              <div className="flex items-center space-x-2 font-mono font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>DECISION: {rec.verdict}</span>
              </div>
              <p className="text-xs text-gray-200 leading-relaxed">{rec.summary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
