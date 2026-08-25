import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Sparkles, Activity, ShieldCheck, AlertTriangle, Radio, Video, Zap, MessageSquare, TrendingUp } from 'lucide-react';
import { LiveStreamHost, MBSQuote, CommentaryMessage, QAQuestion } from '../types';

interface LiveBroadcastStudioProps {
  hosts: LiveStreamHost[];
  activeQuote: MBSQuote;
  latestCommentary?: CommentaryMessage;
  currentAnsweringQuestion?: QAQuestion;
  isAudioLive: boolean;
  setIsAudioLive: (val: boolean) => void;
  onAskAi: () => void;
}

export const LiveBroadcastStudio: React.FC<LiveBroadcastStudioProps> = ({
  hosts,
  activeQuote,
  latestCommentary,
  currentAnsweringQuestion,
  isAudioLive,
  setIsAudioLive,
  onAskAi,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'main_desk' | 'chart_overhead' | 'fed_watch' | 'floor_cam'>('main_desk');
  const [activeHostId, setActiveHostId] = useState<string>('host-dan');
  const [audioLevel, setAudioLevel] = useState<number>(65);
  const [streamQuality, setStreamQuality] = useState<'1080p60' | '720p60' | '4K HDR'>('1080p60');
  const [bannerAlert, setBannerAlert] = useState<string>('⚡ BREAKING: UMBS 5.5% Breaks 99-16+ on Heavy Institutional Buying • 10Y Yield 4.284% (-4.2 bps)');
  const [isSpeakingSynth, setIsSpeakingSynth] = useState<boolean>(false);

  // Simulated audio visualizer bars
  const [waveBars, setWaveBars] = useState<number[]>([40, 65, 30, 85, 95, 60, 45, 75, 90, 50, 60, 80]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setWaveBars((prev) =>
        prev.map(() => Math.floor(20 + Math.random() * 75))
      );
    }, 180);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Rotate speaking host occasionally
  useEffect(() => {
    const hostInterval = setInterval(() => {
      setActiveHostId((curr) => (curr === 'host-dan' ? 'host-sarah' : 'host-dan'));
    }, 14000);
    return () => clearInterval(hostInterval);
  }, []);

  const activeHost = hosts.find((h) => h.id === activeHostId) || hosts[0];

  // Browser Speech Synthesis for realistic Live Audio broadcast
  const triggerAudioBriefing = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const textToSpeak = `This is Dan Gallagher live on the MBS-Live desk. ${
      activeQuote.symbol
    } is trading at ${activeQuote.priceFormatted}, up ${
      activeQuote.change32nds
    } thirty-seconds on the session. Ten-year Treasury yields have fallen to ${
      activeQuote.yieldRate
    } percent. We are advising originators to watch for positive lender repricing over the next hour.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    utterance.onstart = () => {
      setIsSpeakingSynth(true);
      setIsAudioLive(true);
    };
    utterance.onend = () => {
      setIsSpeakingSynth(false);
    };
    utterance.onerror = () => {
      setIsSpeakingSynth(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-[#111111] rounded-xl border border-[#222222] shadow-2xl overflow-hidden flex flex-col">
      {/* Studio Screen Container */}
      <div className="relative aspect-video w-full bg-[#080808] flex items-center justify-center overflow-hidden group select-none">
        {/* Background Visual Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0c0c0c] to-black"></div>
        
        {/* Dynamic Studio Views */}
        {cameraMode === 'main_desk' && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {/* Split Host Screen */}
            <div className="grid grid-cols-2 gap-4 w-full h-full max-h-[90%] items-center">
              {/* Host 1: Dan Gallagher */}
              <div
                className={`relative h-full rounded-xl overflow-hidden border transition-all flex flex-col justify-between p-4 bg-[#121212]/90 backdrop-blur-md ${
                  activeHostId === 'host-dan'
                    ? 'border-[#FFD700] shadow-xl shadow-[#FFD700]/10 ring-1 ring-[#FFD700]/50'
                    : 'border-[#222222] opacity-80'
                }`}
              >
                {/* Background Trading Floor Simulation */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-[#161616]/80 to-transparent z-0"></div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFD700_1px,transparent_1px)] [background-size:16px_16px]"></div>

                {/* Top Status */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-gray-300 border border-[#333333] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeHostId === 'host-dan' ? 'bg-[#FFD700] animate-ping' : 'bg-gray-600'}`}></span>
                    DESK CAM 01
                  </span>
                  {activeHostId === 'host-dan' && (
                    <span className="px-2 py-0.5 rounded bg-[#FFD700] text-black text-[10px] font-black tracking-wider uppercase">
                      ON AIR
                    </span>
                  )}
                </div>

                {/* Center Visual Persona */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#FFD700]/80 p-1 shadow-xl bg-[#080808]">
                      <img
                        src={hosts[0].avatarUrl}
                        alt="Dan Gallagher"
                        className="w-full h-full rounded-full object-cover grayscale-[20%]"
                      />
                    </div>
                    {activeHostId === 'host-dan' && (
                      <div className="absolute -bottom-2 -right-2 p-1.5 bg-[#FFD700] rounded-full border-2 border-black shadow">
                        <Activity className="w-3.5 h-3.5 text-black" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Lower Anchor Tag */}
                <div className="relative z-10 bg-black/85 border border-[#262626] p-2.5 rounded-lg">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                    <span>Dan Gallagher, CFA</span>
                    <span className="text-[10px] font-mono text-[#FFD700] font-bold">CHIEF STRATEGIST</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">MBS Syndicate & Capital Markets Desk</div>
                </div>
              </div>

              {/* Host 2: Sarah Lin */}
              <div
                className={`relative h-full rounded-xl overflow-hidden border transition-all flex flex-col justify-between p-4 bg-[#121212]/90 backdrop-blur-md ${
                  activeHostId === 'host-sarah'
                    ? 'border-[#FFD700] shadow-xl shadow-[#FFD700]/10 ring-1 ring-[#FFD700]/50'
                    : 'border-[#222222] opacity-80'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-[#161616]/80 to-transparent z-0"></div>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FFD700_1px,transparent_1px)] [background-size:16px_16px]"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-gray-300 border border-[#333333] flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeHostId === 'host-sarah' ? 'bg-[#FFD700] animate-ping' : 'bg-gray-600'}`}></span>
                    DESK CAM 02
                  </span>
                  {activeHostId === 'host-sarah' && (
                    <span className="px-2 py-0.5 rounded bg-[#FFD700] text-black text-[10px] font-black tracking-wider uppercase">
                      ON AIR
                    </span>
                  )}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-400/80 p-1 shadow-xl bg-[#080808]">
                      <img
                        src={hosts[1].avatarUrl}
                        alt="Sarah Lin"
                        className="w-full h-full rounded-full object-cover grayscale-[20%]"
                      />
                    </div>
                    {activeHostId === 'host-sarah' && (
                      <div className="absolute -bottom-2 -right-2 p-1.5 bg-[#FFD700] rounded-full border-2 border-black shadow">
                        <Activity className="w-3.5 h-3.5 text-black" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 bg-black/85 border border-[#262626] p-2.5 rounded-lg">
                  <div className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
                    <span>Sarah Lin, CMB</span>
                    <span className="text-[10px] font-mono text-[#FFD700] font-bold">SECONDARY VP</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium">Lender Repricing & Margin Analysis</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {cameraMode === 'chart_overhead' && (
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            <div className="bg-[#111111]/95 border border-[#333333] p-4 rounded-xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#FFD700] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  TECHNICAL OVERHEAD: UMBS 30Y 5.5%
                </span>
                <span className="px-2 py-0.5 rounded bg-green-950 border border-green-800 text-green-400 text-[11px] font-mono font-bold">
                  TESTING 99-20 RESISTANCE
                </span>
              </div>
              <div className="h-40 flex items-end justify-between gap-1 pt-4 px-2 border-b border-[#222222]">
                {waveBars.concat(waveBars).slice(0, 24).map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        i % 2 === 0 ? 'bg-[#FFD700] shadow-sm shadow-[#FFD700]/30' : 'bg-gray-600'
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 font-mono mt-2">
                <span>08:00 AM</span>
                <span>09:30 AM (Jobs Print)</span>
                <span>11:00 AM (Treasury Inflow)</span>
                <span className="text-[#FFD700] font-bold">NOW (11:42 AM)</span>
              </div>
            </div>
          </div>
        )}

        {cameraMode === 'fed_watch' && (
          <div className="absolute inset-0 p-6 flex items-center justify-center">
            <div className="max-w-md w-full bg-[#111111]/95 border border-[#333333] rounded-xl p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center space-x-2 text-[#FFD700] text-xs font-bold font-mono uppercase mb-3">
                <Zap className="w-4 h-4 text-[#FFD700]" />
                FOMC Probability & Yield Spread Analysis
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-300 mb-1">
                    <span>25 bps Rate Cut Probability</span>
                    <span className="font-mono text-green-400 font-bold">68.4%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '68.4%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-300 mb-1">
                    <span>50 bps Jumbo Cut Probability</span>
                    <span className="font-mono text-[#FFD700] font-bold">31.6%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#222222] overflow-hidden">
                    <div className="h-full bg-[#FFD700] rounded-full" style={{ width: '31.6%' }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-gray-400">
                Desk Note: Fed balance sheet runoff (QT) MBS caps remain at $35B/mo. Reinvestment pace is stable.
              </div>
            </div>
          </div>
        )}

        {/* Top Badges (matching Elegant Dark reference HTML) */}
        <div className="absolute top-4 left-4 flex gap-2 z-20">
          <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded text-xs font-semibold text-white border border-white/10">
            {streamQuality}
          </span>
          <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded text-xs font-semibold text-white border border-white/10">
            3.2k Watching
          </span>
        </div>

        {/* Live Audio Visualizer Overlay on Top Right */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
          <div className="flex items-end space-x-0.5 h-4">
            {waveBars.slice(0, 6).map((val, idx) => (
              <span
                key={idx}
                style={{ height: `${Math.max(4, (val / 100) * 16)}px` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeakingSynth || isAudioLive ? 'bg-[#FFD700]' : 'bg-gray-600'
                }`}
              ></span>
            ))}
          </div>
          <span className="text-[11px] font-mono font-bold text-gray-200">
            {isSpeakingSynth ? 'VOICE AI ON' : isAudioLive ? 'AUDIO ACTIVE' : 'MUTED'}
          </span>
        </div>

        {/* Live On-Air Question Spotlight Overlay */}
        {currentAnsweringQuestion && (
          <div className="absolute bottom-16 left-4 z-20 max-w-sm bg-black/90 backdrop-blur-md border border-[#FFD700]/60 rounded-xl p-3 shadow-2xl">
            <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-[#FFD700] uppercase tracking-wider mb-1">
              <MessageSquare className="w-3 h-3 text-[#FFD700]" />
              <span>Answering Live Question</span>
            </div>
            <p className="text-xs font-semibold text-white line-clamp-2">
              "{currentAnsweringQuestion.question}"
            </p>
            <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between">
              <span>{currentAnsweringQuestion.authorName} ({currentAnsweringQuestion.authorCompany})</span>
              <span className="text-[#FFD700] font-mono font-bold">▲ {currentAnsweringQuestion.upvotes}</span>
            </div>
          </div>
        )}

        {/* Bottom Lower-Third Chyron / Ticker Banner */}
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent border-t border-[#222222] p-2.5 sm:p-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Live Indicator Pill */}
            <div className="flex items-center space-x-2 bg-[#FF0000] px-2.5 py-0.5 rounded text-white shrink-0 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">LIVE DESK</span>
            </div>

            {/* Rolling Headline Alert */}
            <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="text-xs sm:text-sm font-semibold text-gray-200 flex items-center space-x-3">
                <span className="text-[#FFD700] font-bold font-mono">[REPRICE ALERT 78%]</span>
                <span className="truncate">{bannerAlert}</span>
              </div>
            </div>

            {/* Live Coupon Badge */}
            <div className="hidden sm:flex items-center space-x-2 bg-[#161616] border border-[#333333] px-3 py-1 rounded-lg shrink-0 font-mono text-xs">
              <span className="text-gray-400">UMBS 5.5%:</span>
              <span className="text-white font-bold">{activeQuote.priceFormatted}</span>
              <span className="text-green-400 font-bold">+{activeQuote.change32nds}/32</span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Studio Controls Toolbar */}
      <div className="p-4 bg-[#111111] flex flex-wrap items-center justify-between gap-4 border-t border-[#222222]">
        {/* Stream Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-play-pause"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-[#FFD700] text-black font-bold hover:brightness-110 transition-all cursor-pointer shadow"
            title={isPlaying ? 'Pause Stream' : 'Resume Stream'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            id="btn-trigger-voice-summary"
            onClick={triggerAudioBriefing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
              isSpeakingSynth
                ? 'bg-[#FFD700] text-black shadow-md shadow-[#FFD700]/30 animate-pulse'
                : 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border border-[#333333]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>{isSpeakingSynth ? 'Playing Voice Briefing...' : 'Play Audio Briefing'}</span>
          </button>

          <button
            id="btn-ask-gemini-studio"
            onClick={onAskAi}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#1a1a1a] hover:bg-[#252525] text-white flex items-center space-x-1.5 border border-[#333333] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
            <span>Ask Desk</span>
          </button>
        </div>

        {/* Camera Angles Switcher */}
        <div className="flex items-center space-x-1 bg-[#0c0c0c] p-1 rounded-xl border border-[#222222]">
          <span className="text-[10px] font-mono text-gray-500 px-2 uppercase font-bold hidden sm:inline">Camera:</span>
          <button
            id="cam-main"
            onClick={() => setCameraMode('main_desk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              cameraMode === 'main_desk'
                ? 'bg-[#1e1e1e] text-[#FFD700] border border-[#FFD700]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Desk Anchor
          </button>
          <button
            id="cam-charts"
            onClick={() => setCameraMode('chart_overhead')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              cameraMode === 'chart_overhead'
                ? 'bg-[#1e1e1e] text-[#FFD700] border border-[#FFD700]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chart Feed
          </button>
          <button
            id="cam-fed"
            onClick={() => setCameraMode('fed_watch')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              cameraMode === 'fed_watch'
                ? 'bg-[#1e1e1e] text-[#FFD700] border border-[#FFD700]/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Fed Watch
          </button>
        </div>

        {/* Resolution & Settings */}
        <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono">
          <select
            id="select-stream-quality"
            value={streamQuality}
            onChange={(e) => setStreamQuality(e.target.value as any)}
            className="bg-[#0c0c0c] border border-[#262626] rounded-lg px-2 py-1 text-gray-300 text-xs font-mono focus:outline-none focus:border-[#FFD700]"
          >
            <option value="1080p60">1080p60 HD</option>
            <option value="720p60">720p60</option>
            <option value="4K HDR">4K Ultra HDR</option>
          </select>
        </div>
      </div>
    </div>
  );
};
