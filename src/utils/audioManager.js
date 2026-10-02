/**
 * Swappable sound effects.
 * Leave a value as null to use the built-in chiptune synth, or point it at a file
 * in /public/sounds (e.g. '/sounds/correct.mp3') to replace it.
 */
export const SOUND_FILES = {
  menuSelect: null,
  incorrect: null,
  correct: null,
  reveal: null,
};

/** "Who's that Pokémon?" voice clip played when a silhouette appears. */
export const INTRO_FILE = '/sounds/whos-that-pokemon.mp3';

/** Empty WAV used to unlock the voice element during the first click. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

const SYNTH = {
  menuSelect: (m) => {
    m.tone(1046, 0, 0.045);
    m.tone(1568, 0.045, 0.06);
  },
  incorrect: (m) => {
    m.tone(220, 0, 0.11, { type: 'sawtooth', volume: 0.05 });
    m.tone(147, 0.11, 0.2, { type: 'sawtooth', volume: 0.05 });
  },
  correct: (m) => {
    [523, 659, 784].forEach((f, i) => m.tone(f, i * 0.075, 0.08));
    m.tone(1046, 0.225, 0.32, { volume: 0.06 });
    m.tone(784, 0.225, 0.32, { type: 'triangle', volume: 0.05 });
  },
  reveal: (m) => {
    m.tone(330, 0, 0.28, { type: 'triangle', slideTo: 1320, volume: 0.07 });
    m.noise(0, 0.18, 0.04);
  },
};

class AudioManager {
  constructor() {
    this.muted = false;
    this.ctx = null;
    this.cry = null;
    this.lastCryAt = 0;
    // One reused element for the intro clip and cries. Safari only lets an element play
    // outside a user gesture if that same element was first played inside one.
    this.voice = null;
  }

  /** Call from a user gesture so browsers allow sound. */
  unlock() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && Ctx) this.ctx = new Ctx();
    if (this.ctx?.state === 'suspended') this.ctx.resume();
    if (!this.voice) {
      this.voice = new Audio(SILENCE);
      this.voice.play().catch(() => {});
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted) this.stopCry();
  }

  play(name) {
    if (this.muted) return;
    const file = SOUND_FILES[name];
    if (file) {
      const el = new Audio(file);
      el.volume = 0.6;
      el.play().catch(() => {});
      return;
    }
    if (!this.ctx) return;
    SYNTH[name]?.(this);
  }

  tone(freq, start, duration, { type = 'square', volume = 0.07, slideTo } = {}) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  noise(start, duration, volume = 0.04) {
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    src.buffer = buffer;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + start);
  }

  /**
   * Plays a Pokémon cry, stopping any cry already playing so cries never overlap.
   * Resolves to { played, blocked } — blocked means the browser refused autoplay.
   */
  async playCry(url) {
    if (!url || this.muted) return { played: false, blocked: false };
    const now = performance.now();
    if (now - this.lastCryAt < 300) return { played: false, blocked: false };
    this.lastCryAt = now;
    return this.playVoice(url, 0.5);
  }

  /** Plays the "Who's that Pokémon?" clip. Shares the cry channel, so stopCry() stops it too. */
  playIntro() {
    if (this.muted) return Promise.resolve({ played: false, blocked: false });
    return this.playVoice(INTRO_FILE, 0.6);
  }

  async playVoice(url, volume) {
    this.stopCry();
    if (!this.voice) this.voice = new Audio();
    const el = this.voice;
    const token = (this.voiceToken = (this.voiceToken || 0) + 1);
    el.src = url;
    el.volume = volume;
    this.cry = el;
    try {
      await el.play();
      return { played: true, blocked: false };
    } catch (err) {
      if (token !== this.voiceToken) return { played: false, blocked: false }; // replaced by a newer clip
      this.cry = null;
      return { played: false, blocked: err?.name === 'NotAllowedError' };
    }
  }

  stopCry() {
    if (this.cry) {
      this.cry.pause();
      this.cry = null;
    }
  }
}

export const audio = new AudioManager();
