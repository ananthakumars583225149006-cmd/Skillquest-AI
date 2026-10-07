/**
 * Sound Manager for Skill Quest AI
 * Uses Web Audio API & Howler.js for deterministic, zero-latency cartoon sound effects
 * and ambient jungle atmosphere without external asset loading dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAmbientPlaying: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientInterval: any = null;

  constructor() {
    // Lazy initialize on first interaction to comply with browser autoplay policies
  }

  private initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext init error:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.ambientGain) this.ambientGain.gain.value = 0;
    } else {
      if (this.ambientGain) this.ambientGain.gain.value = 0.15;
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous jungle forest ambient atmosphere:
   * Combines gentle wind rustle with organic tropical bird chirps and jungle crickets.
   */
  public startAmbient() {
    if (this.isAmbientPlaying || typeof window === 'undefined') return;
    this.initContext();
    if (!this.ctx) return;

    this.isAmbientPlaying = true;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this.isMuted ? 0 : 0.12;
    this.ambientGain.connect(this.ctx.destination);

    // Subtle gentle breeze pink noise generator
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.04;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;

      whiteNoise.connect(filter);
      filter.connect(this.ambientGain);
      whiteNoise.start();

      // Occasional tropical bird chirp scheduler
      this.ambientInterval = setInterval(() => {
        if (!this.isMuted && Math.random() > 0.4) {
          this.playBirdChirp();
        }
      }, 4000);
    } catch (e) {
      console.warn('Ambient audio init skipped:', e);
    }
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
  }

  private playBirdChirp() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'sine';
    const baseFreq = 2200 + Math.random() * 800;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 200, t + 0.16);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Sound Effect: Vine Swing / Step Click (stepping on 3D level drums)
   */
  public playVineSwing() {
    try {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {
      // Audio playback skipped safely
    }
  }

  /**
   * Sound Effect: Coin Reward (sparkling dual-tone chime)
   */
  public playCoinPickup() {
    try {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Pitch 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, t); // B5
      osc1.frequency.setValueAtTime(1318.51, t + 0.08); // E6
      gain1.gain.setValueAtTime(0.25, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.38);
    } catch (e) {
      // Audio playback skipped safely
    }
  }

  /**
   * Sound Effect: Heart Loss / Electrical Zap
   */
  public playHeartLoss() {
    try {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {
      // Audio playback skipped safely
    }
  }

  /**
   * Sound Effect: Level Complete Fanfare
   */
  public playLevelVictory() {
    try {
      if (this.isMuted) return;
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const start = t + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch (e) {
      // Audio playback skipped safely
    }
  }
}

export const soundManager = new SoundManager();
