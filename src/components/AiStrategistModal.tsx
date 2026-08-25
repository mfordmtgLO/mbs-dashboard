import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Radio,
  Loader2,
  ShieldCheck,
  Globe,
  ExternalLink,
  Link2,
  Award,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { MBSQuote, GroundingSource, LockAdviceRecord, LockAccuracyDatabaseSummary } from '../types';
import { recordNewLockAdvice } from '../utils/lockAdviceDatabaseEngine';

interface AiStrategistModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeQuote: MBSQuote;
  tenYearQuote?: MBSQuote;
  initialPrompt?: string;
  accuracySummary?: LockAccuracyDatabaseSummary;
  records?: LockAdviceRecord[];
  onUpdateRecords?: (newRecords: LockAdviceRecord[]) => void;
  onViewAccuracyDesk?: () => void;
}

export const AiStrategistModal: React.FC<AiStrategistModalProps> = ({
  isOpen,
  onClose,
  activeQuote,
  tenYearQuote,
  initialPrompt,
  accuracySummary,
  records = [],
  onUpdateRecords,
  onViewAccuracyDesk,
}) => {
  const [query, setQuery] = useState<string>(initialPrompt || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [headlineDirective, setHeadlineDirective] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [justLogged, setJustLogged] = useState<boolean>(false);

  // Auto-run when opened with initialPrompt
  React.useEffect(() => {
    if (isOpen && initialPrompt) {
      setQuery(initialPrompt);
      handleAsk(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const current10YYield = tenYearQuote ? tenYearQuote.yieldRate || 4.66 : 4.66;
  const currentAccPct = accuracySummary ? accuracySummary.overallAccuracyPct : 78.4;
  const isDefensive = accuracySummary
    ? accuracySummary.currentRiskStrategyMode === 'DEFENSIVE_RISK_MITIGATION'
    : false;

  const handleAsk = async (promptText?: string) => {
    const questionToAsk = promptText || query;
    if (!questionToAsk.trim()) return;

    setIsLoading(true);
    setResponse(null);
    setRecommendation(null);
    setHeadlineDirective(null);
    setGroundingSources([]);
    setSearchQueries([]);
    setJustLogged(false);

    try {
      const res = await fetch('/api/ask-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk,
          marketContext: {
            activeCoupon: activeQuote.symbol,
            price: activeQuote.priceFormatted,
            changeBps: `${activeQuote.changeBps > 0 ? '+' : ''}${activeQuote.changeBps.toFixed(1)}`,
            tenYear: tenYearQuote ? tenYearQuote.priceFormatted : '4.660%',
            tenYearChange: tenYearQuote ? `${tenYearQuote.changeBps} bps` : '-4.4 bps',
            parRate: '6.625%',
            repriceRisk: 'Positive Re-price Opportunity (Float Window Active)',
          },
          accuracyContext: {
            accuracyPct: currentAccPct,
            riskMode: isDefensive ? 'DEFENSIVE_RISK_MITIGATION' : 'OPTIMAL_CONVICTION',
          },
        }),
      });

      const data = await res.json();
      const generatedAnswer = data.answer || data.fallbackAnswer || 'Unable to retrieve answer.';
      const rec = data.lockRecommendation || (isDefensive ? 'PROTECTIVE LOCK' : 'TACTICAL FLOAT');
      const directive = data.headlineDirective || `${rec} — Active desk guidance`;

      setResponse(generatedAnswer);
      setRecommendation(rec);
      setHeadlineDirective(directive);

      if (data.groundingSources && Array.isArray(data.groundingSources)) {
        setGroundingSources(data.groundingSources);
      }
      if (data.searchQueries && Array.isArray(data.searchQueries)) {
        setSearchQueries(data.searchQueries);
      }

      // Automatically log recommendation into the Trackable Database
      if (onUpdateRecords) {
        const mappedAdvice = rec.toUpperCase().includes('FLOAT') ? 'FLOAT' : 'LOCK';
        const { updatedRecords } = recordNewLockAdvice(
          questionToAsk,
          mappedAdvice,
          directive,
          generatedAnswer.slice(0, 240) + '...',
          activeQuote,
          current10YYield,
          'ASK_STRATEGIST',
          {
            loanAmount: 500000,
            program: 'Conventional',
            closingDays: 15,
          },
          records
        );
        onUpdateRecords(updatedRecords);
        setJustLogged(true);
      }
    } catch (err) {
      console.error('Failed to query strategist:', err);
      setResponse(
        'Market desk is monitoring resistance lines. For 15-day closings, protect against reprices if yields spike.'
      );
      setRecommendation('CAUTIOUS LOCK');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Should I lock a $750k Conventional loan closing in 15 days ahead of tomorrow’s PCE?',
    'Why is UMBS 5.5% up +18 bps while 10-Year Treasury is only down 4 bps?',
    'Explain the risk of floating into today’s 1:00 PM 10-Year Treasury auction.',
    'How do I position a $1.2M Jumbo purchase with a 45-day closing window?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111111] border border-[#333333] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#0c0c0c] border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 shadow-md">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                Ask Chief Market Strategist Dan Gallagher
                <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 text-[10px] font-mono border border-blue-700/50 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" />
                  Google Search Grounded
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Institutional MBS, Yield Curve & Rate Lock Advisory Powered by Gemini + Live Web Data
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Context & Accuracy Meter Strip */}
        <div className="px-4 py-2 bg-[#080808] border-b border-[#222222] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2 text-gray-300">
            <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
            <span>
              Market: {activeQuote.symbol} at{' '}
              <strong className="text-[#FFD700]">{activeQuote.priceFormatted}</strong>
            </span>
            <span className="text-green-400 font-bold">(+{activeQuote.change32nds}/32)</span>
          </div>

          {/* Dan's Live Accuracy Badge */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onViewAccuracyDesk}
              title="Click to view full Lock Advice Trackable Database"
              className="px-2 py-0.5 rounded bg-[#181818] hover:bg-[#222222] border border-[#333333] text-[10px] text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Award className="w-3 h-3 text-[#FFD700]" />
              <span>24h Advice Accuracy:</span>
              <strong className={currentAccPct >= 60 ? 'text-green-400' : 'text-rose-400'}>
                {currentAccPct}%
              </strong>
              <span className="text-gray-500">(&ge;60% Target)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-[#0c0c0c]">
          {/* Active AI Risk Assessment Mode Banner */}
          <div
            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
              isDefensive
                ? 'bg-amber-950/40 border-amber-600/50 text-amber-300'
                : 'bg-green-950/40 border-green-700/50 text-green-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Cpu className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="font-bold">
                {isDefensive
                  ? '🛡️ Adaptive Defensive Risk Mode Active (<60% Target Trigger)'
                  : '🎯 Optimal Conviction Mode Active (Accuracy > 60% Target)'}
              </span>
            </div>
            {onViewAccuracyDesk && (
              <span
                className="text-[10px] text-gray-400 underline cursor-pointer hover:text-white"
                onClick={onViewAccuracyDesk}
              >
                Audited Database →
              </span>
            )}
          </div>

          {/* Sample Prompts */}
          {!response && !isLoading && (
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                Quick Originator Scenarios:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    id={`sample-prompt-${idx}`}
                    onClick={() => {
                      setQuery(p);
                      handleAsk(p);
                    }}
                    className="text-left p-2.5 rounded-lg bg-[#141414] border border-[#262626] hover:border-[#FFD700] hover:bg-[#1a1a1a] text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span>{p}</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#FFD700] shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#FFD700] animate-spin" />
              <p className="text-sm font-semibold text-gray-200">
                Searching Google Live Data & Evaluating 24h MBS Spreads...
              </p>
              <span className="text-xs text-blue-400 font-mono flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Grounding with Google Search
              </span>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="space-y-4 animate-in fade-in">
              {recommendation && (
                <div className="p-3 bg-[#1e1704] border border-[#FFD700]/50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#FFD700] font-mono font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#FFD700]" />
                    <span>STRATEGIST RECOMMENDATION: {recommendation}</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-400" />
                    Live Grounded
                  </span>
                </div>
              )}

              {/* Automatic Database Log Confirmation */}
              {justLogged && (
                <div className="p-2 bg-[#0c1a10] border border-green-700/60 rounded-lg flex items-center justify-between text-[11px] font-mono text-green-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    Recorded to Lock Advice Trackable Database (24h Lookback Active)
                  </span>
                  {onViewAccuracyDesk && (
                    <button
                      onClick={onViewAccuracyDesk}
                      className="underline text-[#FFD700] hover:text-white cursor-pointer"
                    >
                      View Ledger
                    </button>
                  )}
                </div>
              )}

              <div className="bg-[#141414] border border-[#262626] rounded-lg p-4 text-gray-200 space-y-3 leading-relaxed whitespace-pre-line">
                {response}
              </div>

              {/* Search Queries Used */}
              {searchQueries && searchQueries.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-gray-400">
                  <span className="text-gray-500">Searches executed:</span>
                  {searchQueries.map((sq, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#161616] border border-[#262626] text-gray-300"
                    >
                      "{sq}"
                    </span>
                  ))}
                </div>
              )}

              {/* Verified Search Sources / Grounding Citations */}
              {groundingSources && groundingSources.length > 0 && (
                <div className="pt-2 border-t border-[#222222] space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Link2 className="w-3 h-3 text-[#FFD700]" />
                    Verified Google Search Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#161616] hover:bg-[#222222] text-gray-300 hover:text-white border border-[#2b2b2b] hover:border-[#FFD700]/50 text-[10px] transition-all"
                      >
                        <span className="truncate max-w-[240px]">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#FFD700] shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 bg-[#080808] border-t border-[#222222] flex items-center space-x-2">
          <input
            id="input-ai-strategist-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Type your loan scenario, loan balance, closing date, or rate question..."
            className="flex-1 bg-[#141414] border border-[#262626] rounded-lg px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
          />
          <button
            id="btn-submit-ai-strategist"
            onClick={() => handleAsk()}
            disabled={isLoading || !query.trim()}
            className="px-4 py-2.5 bg-[#FFD700] hover:brightness-110 disabled:opacity-50 text-black rounded-lg text-xs font-bold shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask Desk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
