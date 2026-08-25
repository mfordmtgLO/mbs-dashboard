import React, { useState } from 'react';
import { MessageSquare, ArrowBigUp, Sparkles, Send, CheckCircle2, Radio, User, Building, MapPin, Filter, HelpCircle, Loader2 } from 'lucide-react';
import { QAQuestion, MBSQuote } from '../types';

interface InteractiveQAHubProps {
  questions: QAQuestion[];
  onUpvoteQuestion: (id: string) => void;
  onSubmitQuestion: (newQ: Partial<QAQuestion>) => Promise<void>;
  activeQuote: MBSQuote;
  onAnswerWithAi: (question: QAQuestion) => Promise<void>;
  isLoadingAi?: boolean;
}

export const InteractiveQAHub: React.FC<InteractiveQAHubProps> = ({
  questions,
  onUpvoteQuestion,
  onSubmitQuestion,
  activeQuote,
  onAnswerWithAi,
  isLoadingAi = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [questionText, setQuestionText] = useState<string>('');
  const [name, setName] = useState<string>('Alex Thorne');
  const [title, setTitle] = useState<string>('Senior Loan Officer');
  const [company, setCompany] = useState<string>('Guaranteed Rate');
  const [location, setLocation] = useState<string>('Dallas, TX');
  const [category, setCategory] = useState<QAQuestion['category']>('Lock vs Float');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  const filteredQuestions = questions
    .filter((q) => (selectedCategory === 'ALL' ? true : q.category === selectedCategory))
    .sort((a, b) => {
      if (a.status === 'answering_live') return -1;
      if (b.status === 'answering_live') return 1;
      return b.upvotes - a.upvotes;
    });

  const liveQuestion = questions.find((q) => q.status === 'answering_live');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setIsSubmitting(true);
    await onSubmitQuestion({
      authorName: name || 'Mortgage Originator',
      authorTitle: title || 'Loan Officer',
      authorCompany: company || 'Mortgage Lending',
      authorLocation: location || 'US',
      question: questionText.trim(),
      category,
      upvotes: 1,
      status: 'queued',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setQuestionText('');
    setShowForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Question Submission Trigger */}
      <div className="bg-gradient-to-r from-[#1f1906] via-[#111111] to-[#141414] rounded-xl border border-[#FFD700]/30 p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/40 text-[11px] font-mono font-bold uppercase tracking-wider">
              LIVE BROADCAST Q&A
            </span>
            <span className="text-gray-400 text-xs">• Chief Strategist Dan Gallagher is answering on-air</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Originator Pipeline & Lock Dilemmas Hub
          </h2>
          <p className="text-xs text-gray-300 max-w-xl">
            Submit your specific scenario (loan size, rate, closing horizon). Top upvoted questions are addressed directly on the live stream and analyzed by our AI Strategist.
          </p>
        </div>

        <button
          id="btn-open-submit-q"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gradient-to-r from-[#FFD700] to-[#E5C100] text-black rounded-lg text-xs font-bold shadow-lg shadow-[#FFD700]/10 border border-[#FFD700] hover:brightness-110 transition-all cursor-pointer flex items-center space-x-2"
        >
          <MessageSquare className="w-4 h-4 text-black" />
          <span>{showForm ? 'Close Question Form' : 'Submit Loan Scenario Question'}</span>
        </button>
      </div>

      {/* Expandable Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#111111] border border-[#222222] rounded-xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4"
        >
          <div className="flex items-center justify-between border-b border-[#222222] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFD700]" />
              Ask the Secondary Desk & Broadcast Hosts
            </h3>
            <span className="text-xs text-gray-400">Powered by MBS-Live AI Strategist</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 font-medium mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1">Title / Role</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1">Lender / Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FFD700]"
              />
            </div>
            <div>
              <label className="block text-gray-400 font-medium mb-1">Topic Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#080808] border border-[#262626] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#FFD700] font-mono"
              >
                <option value="Lock vs Float">Lock vs Float</option>
                <option value="Repricing">Repricing Alert</option>
                <option value="Fed Policy">Fed & Treasury Yields</option>
                <option value="Jumbo/Non-QM">Jumbo / Non-QM Spreads</option>
                <option value="Technical Analysis">Technical & Support Levels</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1.5 text-xs">
              Your Loan Scenario or Market Question (Include loan balance, note rate, and closing date for accurate analysis):
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. I have a $680,000 Conventional purchase locking today at 6.625% for a 30-day close. Should I lock now or wait for tomorrow's Core PCE release?"
              className="w-full bg-[#080808] border border-[#262626] rounded-lg p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !questionText.trim()}
              className="px-5 py-2 rounded-lg bg-[#FFD700] hover:brightness-110 disabled:opacity-50 text-black text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Post to Live Q&A Stream</span>
            </button>
          </div>
        </form>
      )}

      {/* Live Spotlight Question Card (Currently on air) */}
      {liveQuestion && (
        <div className="bg-gradient-to-r from-[#2b2207] via-[#111111] to-[#201804] border-2 border-[#FFD700] rounded-xl p-5 shadow-2xl ring-1 ring-[#FFD700]/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD700] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFD700]"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-[#FFD700] font-mono">
                CURRENTLY ANSWERING LIVE ON AIR
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40 text-[11px] font-mono font-bold">
              {liveQuestion.category}
            </span>
          </div>

          <p className="text-sm sm:text-base font-bold text-white mb-3">
            "{liveQuestion.question}"
          </p>

          {/* Author Badge */}
          <div className="flex items-center space-x-3 text-xs text-gray-300 mb-3">
            <span className="font-semibold text-white">{liveQuestion.authorName}</span>
            <span>•</span>
            <span className="text-gray-400">{liveQuestion.authorTitle}</span>
            <span>•</span>
            <span className="text-[#FFD700]">{liveQuestion.authorCompany}</span>
            <span>•</span>
            <span className="text-gray-400">{liveQuestion.authorLocation}</span>
          </div>

          {/* Host Answer Breakdown */}
          {liveQuestion.answerText && (
            <div className="bg-[#080808] border border-[#FFD700]/30 rounded-lg p-3.5 text-xs text-gray-200 leading-relaxed space-y-2">
              <div className="flex items-center space-x-2 text-[#FFD700] font-mono font-bold text-[11px]">
                <Radio className="w-3.5 h-3.5" />
                <span>On-Air Strategist Answer ({liveQuestion.answeredBy}):</span>
              </div>
              <p>{liveQuestion.answerText}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1 scrollbar-none">
        {['ALL', 'Lock vs Float', 'Repricing', 'Fed Policy', 'Jumbo/Non-QM', 'Technical Analysis'].map((cat) => (
          <button
            key={cat}
            id={`qa-filter-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#FFD700] text-black font-bold shadow'
                : 'bg-[#111111] text-gray-400 hover:text-white border border-[#222222]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Questions Queue Grid */}
      <div className="space-y-3">
        {filteredQuestions.map((q) => {
          const isLive = q.status === 'answering_live';
          const isAnswered = q.status === 'answered';

          return (
            <div
              key={q.id}
              id={`qa-card-${q.id}`}
              className={`bg-[#111111] border rounded-xl p-4 transition-all flex items-start space-x-4 ${
                isLive
                  ? 'border-[#FFD700] bg-[#161616] shadow-md'
                  : 'border-[#222222] hover:border-[#333333]'
              }`}
            >
              {/* Upvote Column */}
              <button
                id={`btn-upvote-${q.id}`}
                onClick={() => onUpvoteQuestion(q.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer min-w-[50px] ${
                  q.hasUpvoted
                    ? 'bg-[#FFD700] border-[#FFD700] text-black shadow-md'
                    : 'bg-[#080808] border-[#222222] text-gray-400 hover:text-white hover:border-[#333333]'
                }`}
              >
                <ArrowBigUp className="w-5 h-5" />
                <span className="text-xs font-mono font-bold">{q.upvotes}</span>
              </button>

              {/* Question Body */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-white">{q.authorName}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{q.authorCompany} ({q.authorLocation})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#080808] border border-[#222222] text-gray-400 text-[10px] font-mono">
                      {q.category}
                    </span>
                    {isAnswered && (
                      <span className="px-2 py-0.5 rounded bg-green-950 text-green-400 border border-green-800 text-[10px] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ANSWERED
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                  {q.question}
                </p>

                {/* If already answered */}
                {q.answerText && (
                  <div className="bg-[#080808] border border-[#222222] rounded-lg p-3 text-xs text-gray-300 space-y-1">
                    <span className="text-[#FFD700] font-mono font-bold text-[11px]">
                      Desk Answer ({q.answeredBy || 'Chief Strategist'}):
                    </span>
                    <p>{q.answerText}</p>
                  </div>
                )}

                {/* Instant AI Answer Button if queued */}
                {!q.answerText && (
                  <div className="pt-1 flex items-center justify-between">
                    <button
                      id={`btn-ai-answer-${q.id}`}
                      onClick={() => onAnswerWithAi(q)}
                      disabled={isLoadingAi}
                      className="text-xs font-semibold text-[#FFD700] hover:brightness-110 flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
                      <span>{isLoadingAi ? 'Consulting Strategist AI...' : 'Generate Instant AI Desk Answer'}</span>
                    </button>
                    <span className="text-[10px] font-mono text-gray-500">{q.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
