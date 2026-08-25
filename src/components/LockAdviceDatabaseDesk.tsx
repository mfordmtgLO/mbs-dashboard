import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
  Radio,
  Sliders,
  Award,
  BarChart2,
  Calendar,
  Layers,
  HelpCircle,
  ChevronRight,
  Zap,
  Cpu,
  SlidersHorizontal,
} from 'lucide-react';
import {
  LockAdviceRecord,
  LockAccuracyDatabaseSummary,
  MBSQuote,
  AiRiskStrategyMode,
} from '../types';
import {
  calculateLockAccuracySummary,
  recordNewLockAdvice,
  saveLockAdviceRecords,
} from '../utils/lockAdviceDatabaseEngine';
import { decimalTo32nds } from '../utils/mbsCalculations';

interface LockAdviceDatabaseDeskProps {
  records: LockAdviceRecord[];
  onUpdateRecords: (newRecords: LockAdviceRecord[]) => void;
  activeQuote: MBSQuote;
  current10YYield: number;
  onOpenAiStrategistWithPrompt?: (prompt: string) => void;
}

export const LockAdviceDatabaseDesk: React.FC<LockAdviceDatabaseDeskProps> = ({
  records,
  onUpdateRecords,
  activeQuote,
  current10YYield,
  onOpenAiStrategistWithPrompt,
}) => {
  // Filter & Search State
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'WINS' | 'LOSSES' | 'FLOAT' | 'LOCK'>('ALL');
  const [selectedWeek, setSelectedWeek] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [simulatedRiskModeOverride, setSimulatedRiskModeOverride] = useState<AiRiskStrategyMode | null>(null);

  // Manual New Advice Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newAdvice, setNewAdvice] = useState<LockAdviceRecord['advice']>('FLOAT');
  const [newLoanAmount, setNewLoanAmount] = useState<number>(500000);
  const [newDaysToClose, setNewDaysToClose] = useState<number>(15);

  // Calculate live summary
  const summary: LockAccuracyDatabaseSummary = useMemo(() => {
    return calculateLockAccuracySummary(records);
  }, [records]);

  // Effective AI strategy mode (with simulation override support)
  const activeStrategyMode = simulatedRiskModeOverride || summary.currentRiskStrategyMode;

  // Filtered list of audit records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Outcome filter
      if (filterOutcome === 'WINS') {
        if (r.outcomeStatus !== 'SOLID_ADVICE_WIN' && r.outcomeStatus !== 'PROTECTIVE_WIN') return false;
      } else if (filterOutcome === 'LOSSES') {
        if (r.outcomeStatus !== 'SUBOPTIMAL_LOSS') return false;
      } else if (filterOutcome === 'FLOAT') {
        if (r.advice !== 'FLOAT' && r.advice !== 'LEAN_FLOAT') return false;
      } else if (filterOutcome === 'LOCK') {
        if (r.advice !== 'LOCK' && r.advice !== 'SELECTIVE_LOCK' && r.advice !== 'AGGRESSIVE_LOCK') return false;
      }

      // Week filter
      if (selectedWeek !== 'ALL' && r.weekIdentifier !== selectedWeek) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchScenario = r.questionOrScenario.toLowerCase().includes(query);
        const matchDirective = r.headlineDirective.toLowerCase().includes(query);
        const matchRationale = r.rationale.toLowerCase().includes(query);
        const matchSymbol = r.mbsSymbol.toLowerCase().includes(query);
        const matchBorrower = r.loanDetails?.borrowerName?.toLowerCase().includes(query);
        if (!matchScenario && !matchDirective && !matchRationale && !matchSymbol && !matchBorrower) {
          return false;
        }
      }

      return true;
    });
  }, [records, filterOutcome, selectedWeek, searchTerm]);

  // Handle adding new simulated advice
  const handleAddNewAdvice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const { updatedRecords } = recordNewLockAdvice(
      newQuestion,
      newAdvice,
      newAdvice === 'FLOAT'
        ? 'TACTICAL FLOAT — Capitalize on secondary margin and technical support'
        : 'PROTECTIVE LOCK — Defend rate sheet credit against incoming volatility',
      newAdvice === 'FLOAT'
        ? 'MBS coupons showing solid momentum. 10Y yield support holding.'
        : 'Yield resistance approaching. Lock to protect borrower note rate.',
      activeQuote,
      current10YYield,
      'ASK_STRATEGIST',
      {
        loanAmount: newLoanAmount,
        program: 'Conventional',
        closingDays: newDaysToClose,
      },
      records
    );

    onUpdateRecords(updatedRecords);
    setNewQuestion('');
    setShowAddForm(false);
  };

  // Reset database back to default initial seed
  const handleResetDatabase = () => {
    if (window.confirm('Reset Lock Advice Trackable Database back to initial seed data?')) {
      localStorage.removeItem('mbs_live_lock_advice_db_v1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fluid Live Accuracy Header */}
      <div className="bg-gradient-to-r from-[#1f1906] via-[#111111] to-[#141414] rounded-2xl border-2 border-[#FFD700]/30 p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="px-2.5 py-0.5 rounded bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>AI STRATEGIST ADVICE ACCURACY LEDGER</span>
              </span>
              <span className="text-xs text-gray-400 font-mono">
                • 24-Hour Lookback MBS Price & Yield Comparison
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Dan Gallagher's Lock vs. Float Accuracy Tracker & Risk Engine
            </h1>
            <p className="text-xs text-gray-300 max-w-2xl">
              Every piece of rate lock advice is recorded in this trackable database and audited against 24-hour MBS price changes.
              The AI continually trains on outcomes, maintaining a minimum <strong>60% solid advice benchmark</strong> (scaling up to 100%).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2.5">
            <button
              id="btn-open-log-scenario"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-2 bg-[#FFD700] hover:brightness-110 text-black font-mono text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>{showAddForm ? 'Close Form' : 'Log / Audit New Scenario'}</span>
            </button>
            <button
              onClick={handleResetDatabase}
              title="Reset to default database seed"
              className="p-2 rounded-xl bg-[#181818] hover:bg-[#222222] text-gray-400 hover:text-white border border-[#2b2b2b] transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Fluid Accuracy Scoreboard & Goal Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {/* Metric 1: Overall Win Percentage & Benchmark Meter */}
          <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-4 space-y-2 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-400 uppercase font-bold">
                24h Solid Advice Rate
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                  summary.isAboveTarget
                    ? 'bg-green-950/80 text-green-400 border border-green-700/60'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
                }`}
              >
                {summary.isAboveTarget ? '✓ ABOVE 60% GOAL' : '⚠️ BELOW 60% GOAL'}
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span
                className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
                  summary.overallAccuracyPct >= 75
                    ? 'text-green-400'
                    : summary.overallAccuracyPct >= 60
                    ? 'text-[#FFD700]'
                    : 'text-rose-400'
                }`}
              >
                {summary.overallAccuracyPct}%
              </span>
              <span className="text-xs text-gray-400 font-mono font-semibold">
                ({summary.totalWins} Wins / {summary.totalEvaluated} Calls)
              </span>
            </div>

            {/* Target Goal Progress Bar (60% Minimum Goal Line) */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>0%</span>
                <span className="text-[#FFD700] font-bold">Goal: 60.0% Target</span>
                <span>100%</span>
              </div>
              <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden relative border border-[#333333]">
                {/* 60% Benchmark Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                  style={{ left: '60%' }}
                  title="Minimum 60% Solid Advice Benchmark"
                ></div>
                {/* Active Progress Fill */}
                <div
                  className={`h-full transition-all duration-700 ${
                    summary.overallAccuracyPct >= 60
                      ? 'bg-gradient-to-r from-yellow-500 to-green-500'
                      : 'bg-gradient-to-r from-red-600 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, summary.overallAccuracyPct))}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Metric 2: Float Advice vs Lock Advice Breakdown */}
          <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-4 space-y-2 shadow-lg">
            <span className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
              Advice Discipline Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#141414] p-2 rounded-lg border border-[#222222]">
                <div className="text-[10px] text-gray-400 font-mono">Float Accuracy:</div>
                <div className="text-base font-bold font-mono text-green-400">
                  {summary.floatAccuracyPct}%
                </div>
                <div className="text-[9px] text-gray-500 font-mono">Rallies captured</div>
              </div>
              <div className="bg-[#141414] p-2 rounded-lg border border-[#222222]">
                <div className="text-[10px] text-gray-400 font-mono">Lock Accuracy:</div>
                <div className="text-base font-bold font-mono text-blue-400">
                  {summary.lockAccuracyPct}%
                </div>
                <div className="text-[9px] text-gray-500 font-mono">Worsens prevented</div>
              </div>
            </div>
          </div>

          {/* Metric 3: Net Dollar Benefit Per File */}
          <div className="bg-[#0c0c0c] border border-[#262626] rounded-xl p-4 space-y-1 shadow-lg">
            <span className="text-[11px] font-mono text-gray-400 uppercase font-bold block">
              Originator & Borrower Impact
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#FFD700]">
              +${summary.netDollarBenefitPerFile.toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-400 font-mono leading-tight">
              Average net dollar savings/gain per $500k file when originators follow Dan's advice.
            </p>
            <div className="text-[10px] font-mono text-green-400 pt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span>96.4% Loan Officer Satisfaction Score</span>
            </div>
          </div>

          {/* Metric 4: Active AI Risk Strategy State */}
          <div
            className={`border rounded-xl p-4 space-y-2 shadow-lg transition-all ${
              activeStrategyMode === 'OPTIMAL_CONVICTION'
                ? 'bg-[#0e170f] border-green-700/50'
                : 'bg-[#1e1307] border-amber-600/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-gray-300 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>AI Risk Assessment Mode</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                  activeStrategyMode === 'OPTIMAL_CONVICTION'
                    ? 'bg-green-950 text-green-400 border border-green-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {activeStrategyMode === 'OPTIMAL_CONVICTION' ? 'CONVICTION ACTIVE' : 'DEFENSIVE SHIELD'}
              </span>
            </div>

            <div className="text-xs font-bold text-white font-mono leading-snug">
              {activeStrategyMode === 'OPTIMAL_CONVICTION'
                ? '🎯 Optimal Alpha Mode (Above 60%)'
                : '🛡️ Defensive Mitigation Mode (<60%)'}
            </div>

            <p className="text-[10px] text-gray-300 leading-tight">
              {activeStrategyMode === 'OPTIMAL_CONVICTION'
                ? 'Accuracy exceeds 60% goal. Standard float windows allowed on technical support.'
                : 'Accuracy fell below 60%. Automatically tightened locks and enforced mandatory stop-losses.'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive AI Strategy Simulation & Sandbox Bar */}
      <div className="bg-[#111111] border border-[#242424] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">
              Dynamic AI Feedback Loop Controller:
            </span>
            <span className="text-gray-400 text-[11px]">
              When Dan's rolling accuracy breaches the 60% threshold, the AI automatically adjusts Dan's answers in Ask Desk Strategist.
            </span>
          </div>
        </div>

        {/* Mode Toggle Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-[11px]">Simulate Mode:</span>
          <button
            onClick={() => setSimulatedRiskModeOverride(null)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              simulatedRiskModeOverride === null
                ? 'bg-[#FFD700] text-black shadow-sm font-extrabold'
                : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e]'
            }`}
          >
            Auto Live ({summary.overallAccuracyPct}%)
          </button>
          <button
            onClick={() => setSimulatedRiskModeOverride('OPTIMAL_CONVICTION')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              simulatedRiskModeOverride === 'OPTIMAL_CONVICTION'
                ? 'bg-green-600 text-white shadow-sm font-extrabold'
                : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e]'
            }`}
          >
            Force Optimal (≥60%)
          </button>
          <button
            onClick={() => setSimulatedRiskModeOverride('DEFENSIVE_RISK_MITIGATION')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              simulatedRiskModeOverride === 'DEFENSIVE_RISK_MITIGATION'
                ? 'bg-amber-600 text-white shadow-sm font-extrabold'
                : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#2e2e2e]'
            }`}
          >
            Force Defensive (&lt;60%)
          </button>
        </div>
      </div>

      {/* Expandable Manual Scenario Logging Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddNewAdvice}
          className="bg-[#121212] border border-[#FFD700]/40 rounded-xl p-5 shadow-2xl space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FFD700]" />
              Log & Audit Loan Scenario Against 24-Hour MBS Performance
            </h3>
            <span className="text-xs text-[#FFD700] font-mono">
              Active Benchmark: {activeQuote.symbol} @ {activeQuote.priceFormatted}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-gray-400 font-mono mb-1">Scenario / Loan Question:</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. Conventional $550k purchase closing in 10 days. Float or lock?"
                className="w-full bg-[#0a0a0a] border border-[#2b2b2b] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-mono mb-1">Dan's Advice Given:</label>
              <select
                value={newAdvice}
                onChange={(e) => setNewAdvice(e.target.value as any)}
                className="w-full bg-[#0a0a0a] border border-[#2b2b2b] rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#FFD700]"
              >
                <option value="FLOAT">FLOAT (Expect Bond Rally / Re-price)</option>
                <option value="LOCK">LOCK (Protect Against Rate Worsening)</option>
                <option value="LEAN_FLOAT">LEAN FLOAT (Tactical Morning Window)</option>
                <option value="SELECTIVE_LOCK">SELECTIVE LOCK (0-15 Day Close)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 font-mono mb-1">Loan Amount ($):</label>
              <input
                type="number"
                value={newLoanAmount}
                onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#2b2b2b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-mono mb-1">Days to Close:</label>
              <input
                type="number"
                value={newDaysToClose}
                onChange={(e) => setNewDaysToClose(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#2b2b2b] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-[#FFD700]"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg bg-[#1c1c1c] text-gray-300 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#FFD700] hover:brightness-110 text-black text-xs font-bold shadow flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record & Calculate 24h Lookback Evaluation</span>
            </button>
          </div>
        </form>
      )}

      {/* Week-to-Week Averages Performance Matrix */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <BarChart2 className="w-5 h-5 text-[#FFD700]" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Week-to-Week Moving Averages & Goal Target Compliance
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            Minimum Goal Target: <strong className="text-[#FFD700]">60.0%</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {summary.weeklyAverages.map((wk) => {
            const isSelected = selectedWeek === wk.weekKey;
            return (
              <div
                key={wk.weekKey}
                onClick={() => setSelectedWeek(isSelected ? 'ALL' : wk.weekKey)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1c1806] border-[#FFD700] ring-1 ring-[#FFD700] shadow-md'
                    : 'bg-[#0a0a0a] hover:bg-[#141414] border-[#262626]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-white">{wk.weekLabel}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      wk.isAboveTarget
                        ? 'bg-green-950 text-green-400 border border-green-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {wk.isAboveTarget ? 'PASSED (≥60%)' : 'BELOW TARGET'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-mono font-extrabold text-white">
                    {wk.accuracyPct}%
                  </div>
                  <div className="text-[11px] font-mono text-gray-400">
                    {wk.wins}/{wk.totalEvaluated} Wins
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#202020] rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${wk.isAboveTarget ? 'bg-green-400' : 'bg-rose-400'}`}
                    style={{ width: `${wk.accuracyPct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] font-mono text-gray-500 mt-2">
                  <span>Float: {wk.floatWins}/{wk.floatTotal}</span>
                  <span>Lock: {wk.lockWins}/{wk.lockTotal}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Outcome Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono scrollbar-none">
          {[
            { id: 'ALL', label: `All Records (${records.length})` },
            { id: 'WINS', label: `Solid Wins (${summary.totalWins})` },
            { id: 'LOSSES', label: `Suboptimal Losses (${summary.totalLosses})` },
            { id: 'FLOAT', label: 'Float Calls' },
            { id: 'LOCK', label: 'Lock Calls' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterOutcome(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterOutcome === tab.id
                  ? 'bg-[#FFD700] text-black shadow font-extrabold'
                  : 'bg-[#181818] text-gray-400 hover:text-white border border-[#292929]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scenario, borrower, coupon..."
            className="w-full bg-[#0a0a0a] border border-[#262626] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700] font-mono"
          />
        </div>
      </div>

      {/* Audit Database Records Queue */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center text-gray-400 font-mono text-xs">
            No lock advice records match the selected filters.
          </div>
        ) : (
          filteredRecords.map((r) => {
            const isWin = r.outcomeStatus === 'SOLID_ADVICE_WIN' || r.outcomeStatus === 'PROTECTIVE_WIN';
            const isFloat = r.advice === 'FLOAT' || r.advice === 'LEAN_FLOAT';

            return (
              <div
                key={r.id}
                id={`advice-card-${r.id}`}
                className={`bg-[#111111] border rounded-xl p-4 sm:p-5 transition-all shadow-md space-y-3.5 ${
                  isWin
                    ? 'border-[#222222] hover:border-green-800/60'
                    : 'border-rose-900/60 bg-[#160c0c] hover:border-rose-700'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-black uppercase ${
                        isFloat
                          ? 'bg-green-950 text-green-400 border border-green-700'
                          : 'bg-blue-950 text-blue-400 border border-blue-700'
                      }`}
                    >
                      ADVICE: {r.advice}
                    </span>
                    <span className="font-mono text-xs text-gray-400">•</span>
                    <span className="font-mono text-xs text-white font-bold">{r.mbsSymbol}</span>
                    <span className="font-mono text-xs text-gray-500">({r.weekIdentifier})</span>
                  </div>

                  {/* Outcome Tag */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        r.outcomeStatus === 'SOLID_ADVICE_WIN'
                          ? 'bg-green-950/80 text-green-400 border border-green-700/60'
                          : r.outcomeStatus === 'PROTECTIVE_WIN'
                          ? 'bg-blue-950/80 text-blue-400 border border-blue-700/60'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
                      }`}
                    >
                      {isWin ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                          <span>SOLID ADVICE (WIN)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>SUBOPTIMAL ADVICE (LOSS)</span>
                        </>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-gray-500">{r.timestamp}</span>
                  </div>
                </div>

                {/* Scenario & Directives */}
                <div className="space-y-1.5">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                    <span>"{r.questionOrScenario}"</span>
                  </div>
                  <div className="text-xs text-[#FFD700] font-mono font-semibold">
                    Directive: {r.headlineDirective}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {r.rationale}
                  </p>
                </div>

                {/* 24-Hour Lookback Comparison Box */}
                <div className="bg-[#0a0a0a] border border-[#222222] rounded-lg p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Price @ Call</span>
                    <span className="text-white font-bold">{r.initialMbsPriceFormatted}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({r.initial10YYield.toFixed(3)}% 10Y)</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">24h Lookback Price</span>
                    <span className="text-white font-bold">{r.lookback24hPriceFormatted || '—'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({r.lookback24hYield?.toFixed(3)}% 10Y)</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">24h MBS Movement</span>
                    <span
                      className={`font-bold inline-flex items-center ${
                        (r.lookback24hChangeBps || 0) >= 0 ? 'text-green-400' : 'text-rose-400'
                      }`}
                    >
                      {(r.lookback24hChangeBps || 0) >= 0 ? '+' : ''}
                      {r.lookback24hChange32nds}/32 ({r.lookback24hChangeBps} bps)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">LO Dollar Impact</span>
                    <span
                      className={`font-bold ${
                        r.dollarImpactPer500k >= 0 ? 'text-green-400' : 'text-rose-400'
                      }`}
                    >
                      {r.dollarImpactPer500k >= 0 ? '+' : '-'}${Math.abs(r.dollarImpactPer500k).toLocaleString()} / file
                    </span>
                  </div>
                </div>

                {/* Outcome Explanation & Follow up Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-gray-400 font-mono">
                    <span className="text-gray-300 font-bold">Outcome Analysis: </span>
                    <span>{r.outcomeExplanation}</span>
                  </div>

                  {onOpenAiStrategistWithPrompt && (
                    <button
                      onClick={() => onOpenAiStrategistWithPrompt(`Follow up analysis for scenario: "${r.questionOrScenario}". What is the recommended strategy today?`)}
                      className="text-xs font-mono text-[#FFD700] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>Follow Up in AI Strategist →</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
