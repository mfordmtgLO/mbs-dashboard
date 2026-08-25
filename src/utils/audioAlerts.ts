// Institutional Web Audio Alert Chimes for Volatility Alerts
let audioCtx: AudioContext | null = null;
let lastChimeTimestamp = 0;
const MIN_CHIME_INTERVAL_MS = 75000; // 75-second minimum cooldown between auto-beeps to prevent noise fatigue

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Red Volatility Alert: Subtle dual warning tone (e.g. 880Hz -> 660Hz) with gentle volume
export function playRedVolatilityChime(force = false) {
  try {
    const nowMs = Date.now();
    if (!force && nowMs - lastChimeTimestamp < MIN_CHIME_INTERVAL_MS) {
      return; // Enforce audio throttle cooldown
    }
    lastChimeTimestamp = nowMs;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(740, now);
    osc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.18);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(370, now);
    osc2.frequency.exponentialRampToValueAtTime(293.66, now + 0.22);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  } catch (e) {
    // Audio contexts may be blocked by browser policy until interaction
  }
}

// Green Volatility Alert: Positive upward major harmonic chime (C5 -> E5 -> G5)
export function playGreenVolatilityChime(force = false) {
  try {
    const nowMs = Date.now();
    if (!force && nowMs - lastChimeTimestamp < MIN_CHIME_INTERVAL_MS) {
      return; // Enforce audio throttle cooldown
    }
    lastChimeTimestamp = nowMs;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.05, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.28);
    });
  } catch (e) {
    // Graceful fallback
  }
}

