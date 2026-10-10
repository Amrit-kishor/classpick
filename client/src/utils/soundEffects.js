// Web Audio API Synthesizer for ClassPick — Professional College Classroom Audio Experience

let audioCtx = null;
let masterGainNode = null;

/**
 * Initializes or returns the shared AudioContext, ensuring it's resumed upon user gesture.
 */
export const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGainNode = audioCtx.createGain();
      masterGainNode.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Updates master volume & mute state
 */
export const setMasterVolume = (volume, isMuted = false) => {
  const ctx = getAudioContext();
  if (!ctx || !masterGainNode) return;
  const targetGain = isMuted ? 0 : Math.max(0, Math.min(1, volume));
  masterGainNode.gain.cancelScheduledValues(ctx.currentTime);
  masterGainNode.gain.setValueAtTime(targetGain, ctx.currentTime);
};

/**
 * 1. ELECTRONIC STARTUP SOUND
 * Subtle rising electronic tone when polling begins.
 */
export const playStartupSound = (volume = 0.7, isMuted = false) => {
  if (isMuted || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Dual oscillator for rich warm electronic feel
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.16);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, now);
    osc2.frequency.exponentialRampToValueAtTime(960, now + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.linearRampToValueAtTime(2400, now + 0.16);

    const safeVol = Math.min(0.18, volume * 0.18);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(safeVol, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainNode || ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.22);
    osc2.stop(now + 0.22);
  } catch (e) {
    // Graceful fallback
  }
};

/**
 * 2. SUSPENSE LOOP MANAGER
 * Continuous electronic ticking / synth pulse while student names are being shuffled.
 * Gradually increases intensity as selection approaches conclusion.
 * Guaranteed to stop immediately without lingering in background.
 */
class SuspenseAudioEngine {
  constructor() {
    this.isPlaying = false;
    this.timerId = null;
    this.currentStep = 0;
    this.activeNodes = new Set();
  }

  start(volume = 0.7, isMuted = false) {
    this.stop(); // Stop any existing loop immediately
    if (isMuted || volume <= 0) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.volume = volume;

    // Start electronic tick loop
    this.scheduleNextTick();
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    // Normalized progress over steps (starts around step 0, reaches 25-30 steps over 2.2s)
    const progress = Math.min(1, this.currentStep / 24);

    // Dynamic pitch and tempo calculation:
    // Base tempo accelerates slightly as suspense builds, then spaces out for final tick
    let interval = 85;
    if (progress < 0.4) {
      interval = 85 - progress * 20; // 85ms -> 75ms
    } else if (progress < 0.8) {
      interval = 75 + (progress - 0.4) * 50; // Decelerating for suspense
    } else {
      interval = 100 + (progress - 0.8) * 120; // Suspenseful slow landing
    }

    this.playElectronicTick(progress);
    this.currentStep++;

    this.timerId = setTimeout(() => {
      this.scheduleNextTick();
    }, interval);
  }

  playElectronicTick(progress) {
    try {
      const ctx = getAudioContext();
      if (!ctx || !this.isPlaying) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Pitch rises gently with progress to build subtle intensity
      const baseFreq = 440 + progress * 220; // 440 Hz up to 660 Hz
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.04);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + progress * 600, now);
      filter.Q.setValueAtTime(3.0, now);

      const tickVol = Math.min(0.08, this.volume * (0.05 + progress * 0.03));
      gain.gain.setValueAtTime(tickVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainNode || ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);

      // Track active node for guaranteed clean cutoff
      this.activeNodes.add(osc);
      osc.onended = () => {
        this.activeNodes.delete(osc);
      };
    } catch (e) {}
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    // Cut off any currently sounding nodes
    this.activeNodes.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
    });
    this.activeNodes.clear();
  }
}

export const suspenseEngine = new SuspenseAudioEngine();

/**
 * 3. CONFIRMATION CHIME
 * Plays a pleasant, warm confirmation chord when a student is officially selected.
 * Synchronized with the student card reveal.
 */
export const playConfirmationChime = (volume = 0.7, isMuted = false) => {
  // Always stop the suspense loop immediately
  suspenseEngine.stop();

  if (isMuted || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Harmonious major chord: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.5)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      const chimeVol = Math.min(0.12, volume * 0.1);
      const noteStart = now + index * 0.06;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(chimeVol, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGainNode || ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 0.7);
    });
  } catch (e) {
    // Graceful error handling
  }
};

/**
 * 4. ERROR SOUND
 * Soft, unobtrusive low tone if selection encounters an error.
 */
export const playErrorTone = (volume = 0.7, isMuted = false) => {
  suspenseEngine.stop();
  if (isMuted || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);

    const safeVol = Math.min(0.08, volume * 0.08);
    gain.gain.setValueAtTime(safeVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(masterGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch (e) {}
};

/**
 * 5. TEST AUDIO CHIME (for settings volume slider adjustment)
 */
export const playTestTone = (volume = 0.7, isMuted = false) => {
  if (isMuted || volume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.08);

    const safeVol = Math.min(0.1, volume * 0.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(safeVol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(masterGainNode || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) {}
};
