type ToneOptions = {
  type?: OscillatorType;
  volume?: number;
  slideTo?: number;
  delay?: number;
};

const STORAGE_KEY = 'mini-games:muted';

/**
 * Tiny WebAudio synth. No audio files: every sound is generated on the fly,
 * which keeps the PWA small and fully offline.
 */
class SoundManager {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = this.readMuted();

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // Storage may be unavailable; keep the in-memory value.
    }
  }

  toggle(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Must be called from a user gesture at least once. */
  unlock(): void {
    const ctx = this.ensureContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume();
    }
  }

  pop(size = 1): void {
    const base = 520 / size;
    this.tone(base * 1.8, 0.12, {
      type: 'triangle',
      volume: 0.5,
      slideTo: base * 0.7,
    });
  }

  /** Plays a pentatonic note by index (wraps around the scale). */
  chime(note: number): void {
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    const index = ((note % scale.length) + scale.length) % scale.length;
    const freq = scale[index];
    this.tone(freq, 0.5, { type: 'sine', volume: 0.4 });
    this.tone(freq * 2, 0.32, { type: 'sine', volume: 0.1, delay: 0.01 });
  }

  collect(): void {
    this.tone(880, 0.12, { type: 'triangle', volume: 0.4 });
    this.tone(1318.5, 0.18, { type: 'triangle', volume: 0.3, delay: 0.07 });
  }

  munch(): void {
    this.tone(180, 0.09, { type: 'square', volume: 0.22, slideTo: 120 });
    this.tone(150, 0.09, { type: 'square', volume: 0.18, slideTo: 100, delay: 0.1 });
  }

  splash(): void {
    if (this.muted) {
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.master) {
      return;
    }
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const duration = 0.25;
    const buffer = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * duration),
      ctx.sampleRate,
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.22;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start();
  }

  boing(): void {
    this.tone(300, 0.18, { type: 'sine', volume: 0.32, slideTo: 620 });
  }

  sparkle(): void {
    this.tone(1046.5, 0.12, { type: 'sine', volume: 0.22 });
    this.tone(1568, 0.16, { type: 'sine', volume: 0.18, delay: 0.06 });
    this.tone(2093, 0.2, { type: 'sine', volume: 0.13, delay: 0.12 });
  }

  /** Soft "not this one" sound — never harsh or scolding. */
  nope(): void {
    this.tone(392, 0.1, { type: 'sine', volume: 0.18, slideTo: 330 });
    this.tone(330, 0.14, {
      type: 'sine',
      volume: 0.16,
      slideTo: 262,
      delay: 0.09,
    });
  }

  private readMuted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }

    const Ctor =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!Ctor) {
      return null;
    }

    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);

    this.context = ctx;
    this.master = master;
    return ctx;
  }

  private tone(freq: number, duration: number, options: ToneOptions = {}): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.master) {
      return;
    }
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const start = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (options.slideTo) {
      osc.frequency.exponentialRampToValueAtTime(
        options.slideTo,
        start + duration,
      );
    }

    const volume = options.volume ?? 0.5;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }
}

export const sound = new SoundManager();
