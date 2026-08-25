import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { MarketTape } from './components/MarketTape';
import { LiveBroadcastStudio } from './components/LiveBroadcastStudio';
import { MbsTickerBoard } from './components/MbsTickerBoard';
import { TechnicalChart } from './components/TechnicalChart';
import { LiveCommentaryFeed } from './components/LiveCommentaryFeed';
import { InteractiveQAHub } from './components/InteractiveQAHub';
import { LivePollWidget } from './components/LivePollWidget';
import { MortgageProCalculator } from './components/MortgageProCalculator';
import { EconomicCalendarWidget } from './components/EconomicCalendarWidget';
import { UstYieldCurveCard } from './components/UstYieldCurveCard';
import { MarketIntelligenceWidget } from './components/MarketIntelligenceWidget';
import { AiStrategistModal } from './components/AiStrategistModal';
import { VolatilityToastContainer } from './components/VolatilityToastContainer';
import { VolatilityAlertsDrawer } from './components/VolatilityAlertsDrawer';
import { VolatilityControlBar } from './components/VolatilityControlBar';
import { LoBenchmarkDesk } from './components/LoBenchmarkDesk';
import { HousingBriefArticleDesk } from './components/HousingBriefArticleDesk';
import { playRedVolatilityChime, playGreenVolatilityChime } from './utils/audioAlerts';

import {
  INITIAL_QUOTES,
  HOSTS,
  INITIAL_COMMENTARY,
  INITIAL_QUESTIONS,
  INITIAL_POLLS,
  ECONOMIC_CALENDAR,
  INITIAL_UST_CURVE,
  MACRO_INDICES,
  INITIAL_MARKET_STORIES,
} from './data/mockMbsData';
import {
  MBSQuote,
  CommentaryMessage,
  QAQuestion,
  LivePoll,
  IntradayCandle,
  TreasuryCurveData,
  MarketStory,
  TapeItem,
  VolatilityAlert,
  TradingSessionType,
} from './types';
import { generateIntradayData, decimalTo32nds, deriveMbsPrice, parseTreasuryXml } from './utils/mbsCalculations';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'charts' | 'articles' | 'qa' | 'calculator' | 'calendar'>('studio');
  const [quotes, setQuotes] = useState<MBSQuote[]>(INITIAL_QUOTES);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('fnma55');
  const [treasuryCurve, setTreasuryCurve] = useState<TreasuryCurveData>(INITIAL_UST_CURVE);
  const [macroIndices, setMacroIndices] = useState<TapeItem[]>(MACRO_INDICES);
  const [stories, setStories] = useState<MarketStory[]>(INITIAL_MARKET_STORIES);

  const [commentaries, setCommentaries] = useState<CommentaryMessage[]>(INITIAL_COMMENTARY);
  const [questions, setQuestions] = useState<QAQuestion[]>(INITIAL_QUESTIONS);
  const [polls, setPolls] = useState<LivePoll[]>(INITIAL_POLLS);
  const [intradayData, setIntradayData] = useState<IntradayCandle[]>(() => generateIntradayData(99.56, 36));

  const [viewerCount, setViewerCount] = useState<number>(2841);
  const [isAudioLive, setIsAudioLive] = useState<boolean>(false);
  const [isSimulatingTicks, setIsSimulatingTicks] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [isLoadingTreasury, setIsLoadingTreasury] = useState<boolean>(false);

  // Volatility Alert System States
  const [currentSession, setCurrentSession] = useState<TradingSessionType>('LIVE_DAILY');
  const [dailyBaseline10Y, setDailyBaseline10Y] = useState<number>(4.284);
  const [afterHoursBaseline10Y, setAfterHoursBaseline10Y] = useState<number>(4.300);
  const [thresholdBps, setThresholdBps] = useState<number>(3.0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeToasts, setActiveToasts] = useState<VolatilityAlert[]>([]);
  const [volatilityAlertsHistory, setVolatilityAlertsHistory] = useState<VolatilityAlert[]>([
    {
      id: 'vol-init-1',
      direction: 'SPIKE_UP',
      session: 'LIVE_DAILY',
      sessionLabel: 'Live Daily Bond Session (Pre-Close)',
      currentYield: 4.318,
      baselineYield: 4.284,
      deltaBps: 3.4,
      timestamp: '09:42:15 AM',
      headline: '10Y Yield Spiked +3.4 bps (Pre-Close)',
      message: '10Y Benchmark Treasury yield rose by +3.4 bps to 4.318% during the Live Daily session before close. High risk of negative lender repricing.',
      marketImpact: 'NEGATIVE REPRICE RISK',
      actionRecommendation: 'LOCK Floating Loans Immediately',
      isRead: false,
    },
    {
      id: 'vol-init-2',
      direction: 'DROP_DOWN',
      session: 'AFTER_HOURS',
      sessionLabel: 'After-Hours 10Y Trading Window',
      currentYield: 4.264,
      baselineYield: 4.300,
      deltaBps: -3.6,
      timestamp: '06:15:30 PM',
      headline: '10Y Yield Rallied -3.6 bps (After-Hours)',
      message: '10Y Benchmark Treasury yield dropped by -3.6 bps to 4.264% during the After-Hours trading window. Bullish momentum with positive pricing adjustments expected.',
      marketImpact: 'POSITIVE REPRICE OPPORTUNITY',
      actionRecommendation: 'FLOAT Strategy Active for Better Pricing',
      isRead: true,
    },
  ]);
  const [isVolatilityDrawerOpen, setIsVolatilityDrawerOpen] = useState<boolean>(false);

  // Store base anchor 10Y yield for mean-reverting random walk
  const baseY10Ref = useRef<number>(4.284);
  const lastAlertTimeRef = useRef<{ [key: string]: number }>({});

  // Active selected quote
  const activeQuote = quotes.find((q) => q.id === selectedQuoteId) || quotes[0];
  const tenYearQuote = quotes.find((q) => q.id === 'us-10y-treasury');
  const currentAnsweringQuestion = questions.find((q) => q.status === 'answering_live');

  // Trigger Volatility Alert Function (works for Live Daily and After Hours)
  const triggerVolatilityAlert = (
    direction: 'SPIKE_UP' | 'DROP_DOWN',
    customDelta?: number,
    overrideYield?: number,
    overrideSession?: TradingSessionType
  ) => {
    const session = overrideSession || currentSession;
    const baseline = session === 'LIVE_DAILY' ? dailyBaseline10Y : afterHoursBaseline10Y;
    const delta =
      customDelta !== undefined
        ? customDelta
        : direction === 'SPIKE_UP'
        ? +(thresholdBps + 0.4).toFixed(1)
        : -+(thresholdBps + 0.6).toFixed(1);

    const yieldVal =
      overrideYield !== undefined
        ? overrideYield
        : +(baseline + delta / 100).toFixed(3);

    const sessionLabel =
      session === 'LIVE_DAILY'
        ? 'Live Daily Bond Session (Pre-Close)'
        : 'After-Hours 10Y Trading Window';

    const isSpike = direction === 'SPIKE_UP';

    const newAlert: VolatilityAlert = {
      id: `vol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      direction,
      session,
      sessionLabel,
      currentYield: yieldVal,
      baselineYield: baseline,
      deltaBps: delta,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      headline: isSpike
        ? `10Y Yield Spiked +${Math.abs(delta).toFixed(1)} bps (${
            session === 'LIVE_DAILY' ? 'Pre-Close' : 'After-Hours'
          })`
        : `10Y Yield Rallied -${Math.abs(delta).toFixed(1)} bps (${
            session === 'LIVE_DAILY' ? 'Pre-Close' : 'After-Hours'
          })`,
      message: isSpike
        ? `10Y Benchmark Treasury yield rose by +${Math.abs(delta).toFixed(
            1
          )} bps to ${yieldVal.toFixed(3)}% during the ${
            session === 'LIVE_DAILY'
              ? 'Live Daily session before close'
              : 'After-Hours trading window'
          }. High risk of negative lender repricing.`
        : `10Y Benchmark Treasury yield dropped by -${Math.abs(delta).toFixed(
            1
          )} bps to ${yieldVal.toFixed(3)}% during the ${
            session === 'LIVE_DAILY'
              ? 'Live Daily session before close'
              : 'After-Hours trading window'
          }. Bullish momentum with positive pricing adjustments expected.`,
      marketImpact: isSpike
        ? 'NEGATIVE REPRICE RISK'
        : 'POSITIVE REPRICE OPPORTUNITY',
      actionRecommendation: isSpike
        ? 'LOCK Floating Loans Immediately'
        : 'FLOAT Strategy Active for Better Pricing',
      isRead: false,
    };

    // Play Audio Chime
    if (soundEnabled) {
      if (isSpike) {
        playRedVolatilityChime();
      } else {
        playGreenVolatilityChime();
      }
    }

    // Add to Active Floating Toasts
    setActiveToasts((prev) => [newAlert, ...prev.slice(0, 3)]);

    // Add to History Log
    setVolatilityAlertsHistory((prev) => [newAlert, ...prev]);

    // Also dispatch to Live Commentary Feed
    const deskComment: CommentaryMessage = {
      id: `comm-vol-${Date.now()}`,
      author: '10Y Volatility Desk',
      role: 'Automated Rate Shield',
      badge: 'REPRICING_ALERT',
      timestamp: newAlert.timestamp,
      content: `${
        isSpike ? '🚨 [VOLATILITY SPIKE ALERT]' : '🚀 [VOLATILITY RALLY ALERT]'
      } 10Y Yield shifted ${
        delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)
      } bps in ${sessionLabel}. ${newAlert.marketImpact}. Recommendation: ${
        newAlert.actionRecommendation
      }.`,
      type: 'reprice_alert',
      impact: isSpike ? 'bearish' : 'bullish',
      likes: 15,
    };
    setCommentaries((prev) => [deskComment, ...prev]);
  };

  // Toggle Session Handler
  const handleToggleSession = () => {
    const nextSession: TradingSessionType =
      currentSession === 'LIVE_DAILY' ? 'AFTER_HOURS' : 'LIVE_DAILY';
    setCurrentSession(nextSession);

    const active10Y = treasuryCurve.y10 ?? 4.284;
    if (nextSession === 'AFTER_HOURS') {
      setAfterHoursBaseline10Y(active10Y);
    } else {
      setDailyBaseline10Y(active10Y);
    }
  };

  // Try fetching live daily Treasury curve from treasury.gov (with fallback)
  const fetchLiveTreasuryData = async () => {
    setIsLoadingTreasury(true);
    try {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const url = `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=${yearMonth}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseTreasuryXml(text);
        if (parsed && parsed.y10 !== null) {
          setTreasuryCurve(parsed);
          if (parsed.y10) {
            baseY10Ref.current = parsed.y10;
            setDailyBaseline10Y(parsed.y10);
          }
        }
      }
    } catch (err) {
      console.log('Treasury live sync using desk simulation model');
    } finally {
      setIsLoadingTreasury(false);
    }
  };

  useEffect(() => {
    fetchLiveTreasuryData();
  }, []);

  // Institutional Market Tick Simulation Engine
  // Models 10Y Benchmark UST yield fluctuations and derives Agency MBS prices through duration + OAS math
  // Real-time checks whether 10Y yields move up/down > 3bps relative to session baseline
  useEffect(() => {
    if (!isSimulatingTicks) return;

    const tickInterval = setInterval(() => {
      // 1. Viewer count random walk
      setViewerCount((prev) => Math.max(1200, prev + Math.floor(Math.random() * 7 - 3)));

      // 2. 10Y Benchmark Treasury Yield Tick
      const current10Y = treasuryCurve.y10 ?? 4.284;
      const noise = (Math.random() - 0.49) * 0.006;
      const pull = (baseY10Ref.current - current10Y) * 0.03;
      const new10Y = +(current10Y + noise + pull).toFixed(3);
      const delta10YBps = +((new10Y - current10Y) * 100).toFixed(1);

      // Check Volatility Alert threshold relative to session baseline
      const activeBaseline = currentSession === 'LIVE_DAILY' ? dailyBaseline10Y : afterHoursBaseline10Y;
      const sessionShiftBps = +((new10Y - activeBaseline) * 100).toFixed(1);
      const nowMs = Date.now();

      if (sessionShiftBps >= thresholdBps) {
        const lastSpike = lastAlertTimeRef.current[`SPIKE_${currentSession}`] || 0;
        if (nowMs - lastSpike > 45000) {
          lastAlertTimeRef.current[`SPIKE_${currentSession}`] = nowMs;
          triggerVolatilityAlert('SPIKE_UP', sessionShiftBps, new10Y, currentSession);
        }
      } else if (sessionShiftBps <= -thresholdBps) {
        const lastDrop = lastAlertTimeRef.current[`DROP_${currentSession}`] || 0;
        if (nowMs - lastDrop > 45000) {
          lastAlertTimeRef.current[`DROP_${currentSession}`] = nowMs;
          triggerVolatilityAlert('DROP_DOWN', sessionShiftBps, new10Y, currentSession);
        }
      }

      // Fluctuate other points on curve slightly
      setTreasuryCurve((prev) => {
        const y2 = prev.y2 ? +(prev.y2 + (Math.random() - 0.5) * 0.003).toFixed(3) : 4.412;
        const y5 = prev.y5 ? +(prev.y5 + (Math.random() - 0.5) * 0.004).toFixed(3) : 4.195;
        const y30 = prev.y30 ? +(prev.y30 + (Math.random() - 0.5) * 0.003).toFixed(3) : 4.512;
        return {
          ...prev,
          y2,
          y5,
          y10: new10Y,
          y30,
          curve2y10y: +(new10Y - y2).toFixed(3),
        };
      });

      // 3. Update all Agency MBS Quotes using deriveMbsPrice math
      setQuotes((prevQuotes) =>
        prevQuotes.map((quote) => {
          // Special handling for 10Y Treasury quote
          if (quote.category === 'TREASURY') {
            const start10Y = 4.326;
            const chgBps = +((new10Y - start10Y) * 100).toFixed(1);
            return {
              ...quote,
              price: new10Y,
              priceFormatted: `${new10Y.toFixed(3)}%`,
              yieldRate: new10Y,
              yieldChange: chgBps,
              changeBps: chgBps,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              sparkline: [...quote.sparkline.slice(1), new10Y],
            };
          }

          if (quote.category === 'SPREAD') {
            return quote;
          }

          // Agency MBS Pools: FNMA, FHLMC, GNMA
          const duration = quote.duration || 4.0;
          const histOas = quote.histOas || 20;
          const openPrice =
            quote.couponRate <= 3.0
              ? 87.0
              : quote.couponRate <= 4.0
              ? 95.0
              : quote.couponRate <= 4.5
              ? 97.0
              : quote.couponRate <= 5.0
              ? 98.8
              : quote.couponRate <= 5.5
              ? 99.2
              : quote.couponRate <= 6.0
              ? 100.8
              : 102.1;

          // Derive mathematical price
          const derivedPrice = deriveMbsPrice(quote.couponRate, duration, new10Y, histOas);
          const priceChangeDec = derivedPrice - openPrice;
          const change32nds = Math.round(priceChangeDec * 32);
          const changeBps = +(priceChangeDec * 100).toFixed(1);
          const mbsYield = +(new10Y + histOas / 100).toFixed(3);

          const updatedSpark = quote.sparkline ? [...quote.sparkline.slice(1), +derivedPrice.toFixed(3)] : [derivedPrice];

          return {
            ...quote,
            price: +derivedPrice.toFixed(4),
            priceFormatted: decimalTo32nds(derivedPrice),
            change32nds,
            changeBps,
            yieldRate: mbsYield,
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            sparkline: updatedSpark,
          };
        })
      );

      // 4. Update Intraday chart dataset
      setIntradayData((prevData) => {
        if (prevData.length === 0) return prevData;
        const last = prevData[prevData.length - 1];
        // Bond price goes up when 10Y yield goes down
        const priceDelta = -(delta10YBps / 100) * 0.035 + (Math.random() - 0.5) * 0.01;
        const newClose = +(last.close + priceDelta).toFixed(4);
        const updatedLast = {
          ...last,
          close: newClose,
          high: Math.max(last.high, newClose),
          low: Math.min(last.low, newClose),
          priceFormatted: decimalTo32nds(newClose),
        };
        return [...prevData.slice(0, -1), updatedLast];
      });
    }, 3200);

    return () => clearInterval(tickInterval);
  }, [isSimulatingTicks, treasuryCurve.y10, currentSession, dailyBaseline10Y, afterHoursBaseline10Y, thresholdBps]);

  // Handle Toast Action Clicks
  const handleToastAction = (alert: VolatilityAlert, action: 'chart' | 'calculator' | 'lock') => {
    if (action === 'chart') {
      setActiveTab('charts');
    } else if (action === 'calculator' || action === 'lock') {
      setActiveTab('calculator');
    }
  };

  // Handle Question Upvoting
  const handleUpvoteQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const hasVoted = q.hasUpvoted;
          return {
            ...q,
            upvotes: hasVoted ? q.upvotes - 1 : q.upvotes + 1,
            hasUpvoted: !hasVoted,
          };
        }
        return q;
      })
    );
  };

  // Handle User Question Submission
  const handleSubmitQuestion = async (newQ: Partial<QAQuestion>) => {
    const createdQuestion: QAQuestion = {
      id: `qa-${Date.now()}`,
      authorName: newQ.authorName || 'Anonymous LO',
      authorTitle: newQ.authorTitle || 'Loan Officer',
      authorCompany: newQ.authorCompany || 'Lending Team',
      authorLocation: newQ.authorLocation || 'National',
      question: newQ.question || '',
      category: newQ.category || 'Lock vs Float',
      upvotes: 1,
      hasUpvoted: true,
      status: 'queued',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setQuestions((prev) => [createdQuestion, ...prev]);

    // Add acknowledgment to commentary feed
    const shoutoutComment: CommentaryMessage = {
      id: `comm-qa-${Date.now()}`,
      author: 'Live Q&A Desk',
      role: 'Broadcast Queue',
      badge: 'TRADING_FLOOR',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `📥 New loan scenario queued from ${createdQuestion.authorName} (${createdQuestion.authorCompany}): "${createdQuestion.question}"`,
      type: 'qa_shoutout',
      likes: 3,
    };
    setCommentaries((prev) => [shoutoutComment, ...prev]);
  };

  // Handle Instant AI Answer on a Question
  const handleAnswerWithAi = async (question: QAQuestion) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ask-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          marketContext: {
            activeCoupon: activeQuote.symbol,
            price: activeQuote.priceFormatted,
            changeBps: `${activeQuote.changeBps > 0 ? '+' : ''}${activeQuote.changeBps.toFixed(1)}`,
            tenYear: `${(treasuryCurve.y10 ?? 4.284).toFixed(3)}%`,
            parRate: '6.625%',
          },
        }),
      });

      const data = await res.json();
      const answer = data.answer || data.fallbackAnswer;

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id
            ? {
                ...q,
                status: 'answered',
                answerText: answer,
                answeredBy: 'Dan Gallagher, CFA (AI Desk)',
              }
            : q
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Handle Poll Voting
  const handleVotePoll = (pollId: string, optionId: string) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        const newTotal = poll.totalVotes + 1;
        const updatedOptions = poll.options.map((opt) => {
          const newVotes = opt.id === optionId ? opt.votes + 1 : opt.votes;
          return {
            ...opt,
            votes: newVotes,
            percentage: Math.round((newVotes / newTotal) * 100),
          };
        });
        return {
          ...poll,
          totalVotes: newTotal,
          userVotedId: optionId,
          options: updatedOptions,
        };
      })
    );
  };

  const repriceAlertsCount = commentaries.filter((c) => c.type === 'reprice_alert').length;

  return (
    <div className="min-h-screen bg-[#080808] text-gray-200 flex flex-col font-sans selection:bg-[#FFD700] selection:text-black">
      {/* Top Fixed Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewerCount={viewerCount}
        quotes={quotes}
        isAudioLive={isAudioLive}
        setIsAudioLive={setIsAudioLive}
        onOpenAiStrategist={() => setIsAiModalOpen(true)}
        repriceAlertCount={repriceAlertsCount}
        currentSession={currentSession}
        onToggleSession={handleToggleSession}
        onOpenVolatilityDrawer={() => setIsVolatilityDrawerOpen(true)}
        volatilityAlertCount={volatilityAlertsHistory.filter((a) => !a.isRead).length}
      />

      {/* Real-time Continuous Market Ticker Tape */}
      <MarketTape
        quotes={quotes}
        treasuryCurve={treasuryCurve}
        macroIndices={macroIndices}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time 10Y Volatility Alert Control & Live Session Gauge */}
        <VolatilityControlBar
          currentSession={currentSession}
          onToggleSession={handleToggleSession}
          current10YYield={treasuryCurve.y10 ?? 4.284}
          dailyBaseline10Y={dailyBaseline10Y}
          afterHoursBaseline10Y={afterHoursBaseline10Y}
          thresholdBps={thresholdBps}
          onTriggerTestAlert={triggerVolatilityAlert}
          onOpenDrawer={() => setIsVolatilityDrawerOpen(true)}
          alertCount={volatilityAlertsHistory.length}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />

        {/* Loan Officer Core Benchmark & Production Desk: 10Y UST + 5.5, 6.0, 6.5 FNMA & GNMA */}
        <LoBenchmarkDesk
          quotes={quotes}
          treasuryCurve={treasuryCurve}
          selectedQuoteId={selectedQuoteId}
          onSelectQuote={setSelectedQuoteId}
          onNavigateToTab={setActiveTab}
        />

        {/* Tab 1: Live Studio & Feed (Default Broadcast Mode) */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Cols: Video Broadcast Studio + Ticker Depth */}
              <div className="lg:col-span-8 space-y-6">
                <LiveBroadcastStudio
                  hosts={HOSTS}
                  activeQuote={activeQuote}
                  latestCommentary={commentaries[0]}
                  currentAnsweringQuestion={currentAnsweringQuestion}
                  isAudioLive={isAudioLive}
                  setIsAudioLive={setIsAudioLive}
                  onAskAi={() => setIsAiModalOpen(true)}
                />

                {/* MBS Pricing & Depth Board */}
                <MbsTickerBoard
                  quotes={quotes}
                  selectedQuoteId={selectedQuoteId}
                  onSelectQuote={setSelectedQuoteId}
                  isSimulatingTicks={isSimulatingTicks}
                  setIsSimulatingTicks={setIsSimulatingTicks}
                  anchorY10Yield={treasuryCurve.y10 ?? 4.284}
                />
              </div>

              {/* Right 4 Cols: Live Expert Commentary + Treasury Curve + Live Poll */}
              <div className="lg:col-span-4 space-y-6">
                {/* Live Commentary Feed */}
                <LiveCommentaryFeed
                  commentaries={commentaries}
                  onAddCommentary={(msg) => setCommentaries([msg, ...commentaries])}
                  activeQuote={activeQuote}
                  onOpenAiModal={() => setIsAiModalOpen(true)}
                />

                {/* Treasury Curve Monitor Card */}
                <UstYieldCurveCard
                  curveData={treasuryCurve}
                  isLoadingLive={isLoadingTreasury}
                  onRefreshLive={fetchLiveTreasuryData}
                />

                {/* Live Pulse Poll */}
                {polls[0] && (
                  <LivePollWidget poll={polls[0]} onVote={handleVotePoll} />
                )}
              </div>
            </div>

            {/* Bottom Row: Technical Intraday Candlestick Chart + Market Intelligence Wire */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <TechnicalChart quote={activeQuote} intradayData={intradayData} />
              </div>
              <div className="lg:col-span-5">
                <MarketIntelligenceWidget stories={stories} />
              </div>
            </div>

            {/* Featured HousingBrief & MBS Live Wire Desk (Top 5 Articles) */}
            <HousingBriefArticleDesk />
          </div>
        )}

        {/* Tab: HousingBrief Wire & Intelligence Desk */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            <HousingBriefArticleDesk />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7">
                <MarketIntelligenceWidget stories={stories} />
              </div>
              <div className="lg:col-span-5">
                <UstYieldCurveCard
                  curveData={treasuryCurve}
                  isLoadingLive={isLoadingTreasury}
                  onRefreshLive={fetchLiveTreasuryData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Technical Ticker & Charts */}
        {activeTab === 'charts' && (
          <div className="space-y-6">
            <MbsTickerBoard
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              onSelectQuote={setSelectedQuoteId}
              isSimulatingTicks={isSimulatingTicks}
              setIsSimulatingTicks={setIsSimulatingTicks}
              anchorY10Yield={treasuryCurve.y10 ?? 4.284}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <TechnicalChart quote={activeQuote} intradayData={intradayData} />
              </div>
              <div className="lg:col-span-4 space-y-6">
                <UstYieldCurveCard
                  curveData={treasuryCurve}
                  isLoadingLive={isLoadingTreasury}
                  onRefreshLive={fetchLiveTreasuryData}
                />
                <MarketIntelligenceWidget stories={stories} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Q&A Hub */}
        {activeTab === 'qa' && (
          <div className="space-y-6">
            <InteractiveQAHub
              questions={questions}
              onUpvoteQuestion={handleUpvoteQuestion}
              onSubmitQuestion={handleSubmitQuestion}
              activeQuote={activeQuote}
              onAnswerWithAi={handleAnswerWithAi}
              isLoadingAi={isLoadingAi}
            />
          </div>
        )}

        {/* Tab 4: Mortgage Pro Calculator */}
        {activeTab === 'calculator' && (
          <div className="space-y-6">
            <MortgageProCalculator activeQuote={activeQuote} />
          </div>
        )}

        {/* Tab 5: Economic Calendar */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <EconomicCalendarWidget events={ECONOMIC_CALENDAR} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0c0c0c] border-t border-[#222222] py-6 px-4 sm:px-6 lg:px-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#FFD700] font-mono tracking-wider">MBS-LIVE</span>
            <span>•</span>
            <span className="text-gray-400">Institutional Mortgage Backed Securities Live Stream Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] font-mono text-gray-400">
            <span>Data Feeds: Fannie Mae / Freddie Mac UMBS • Ginnie Mae II • Treasury.gov Daily XML</span>
            <span className="text-green-400 font-bold">● 100% Operational</span>
          </div>
        </div>
      </footer>

      {/* Floating Volatility Toast Notifications (Red for >+3bps Spikes, Green for >-3bps Drops) */}
      <VolatilityToastContainer
        alerts={activeToasts}
        onDismiss={(id) => setActiveToasts((prev) => prev.filter((a) => a.id !== id))}
        onSelectAction={handleToastAction}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Volatility Alert History & Settings Drawer */}
      <VolatilityAlertsDrawer
        isOpen={isVolatilityDrawerOpen}
        onClose={() => setIsVolatilityDrawerOpen(false)}
        alertsHistory={volatilityAlertsHistory}
        onClearHistory={() => setVolatilityAlertsHistory([])}
        currentSession={currentSession}
        onToggleSession={handleToggleSession}
        thresholdBps={thresholdBps}
        onSetThresholdBps={setThresholdBps}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onTriggerTestAlert={triggerVolatilityAlert}
        current10YYield={treasuryCurve.y10 ?? 4.284}
        dailyBaseline10Y={dailyBaseline10Y}
        afterHoursBaseline10Y={afterHoursBaseline10Y}
      />

      {/* AI Strategist Modal */}
      <AiStrategistModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeQuote={activeQuote}
        tenYearQuote={tenYearQuote}
      />
    </div>
  );
}
