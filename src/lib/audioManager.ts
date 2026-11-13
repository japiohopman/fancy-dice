class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private shakeNoiseBuffer: AudioBuffer | null = null;
  private isMuted = false;
  private hasVisibilityListener = false;

  private handleVisibilityChange = () => {
    if (!this.ctx || typeof document === 'undefined' || !document.hidden) return;
    if (this.ctx.state === 'running') {
      void this.ctx.suspend().catch(() => {
        // A context may already be closing when the page becomes hidden.
      });
    }
  };

  /** Keeps one AudioContext alive and resumes it only from an active-page sound request. */
  private initContext(): AudioContext | null {
    if (typeof window === 'undefined' || (typeof document !== 'undefined' && document.hidden)) {
      return null;
    }

    if (!this.ctx) {
      const AudioCtx = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 1;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        this.ctx = null;
        this.masterGain = null;
        return null;
      }
    }

    if (!this.hasVisibilityListener && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      this.hasVisibilityListener = true;
    }

    if (this.ctx.state === 'suspended') {
      // Resume rejection is expected on some browsers until a user gesture occurs.
      void this.ctx.resume().catch(() => undefined);
    }

    return this.ctx;
  }

  /** Measures only the synchronous Web Audio scheduling work, not audible playback time. */
  private measureScheduling(name: string, startedAt: number) {
    if (typeof performance === 'undefined') return;
    performance.measure(name, { start: startedAt, end: performance.now() });
  }

  /** Reuses one short noise buffer rather than filling a new buffer for every shake event. */
  private getShakeNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.shakeNoiseBuffer && this.shakeNoiseBuffer.sampleRate === ctx.sampleRate) {
      return this.shakeNoiseBuffer;
    }

    const frameCount = Math.ceil(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.shakeNoiseBuffer = buffer;
    return buffer;
  }

  private connectToOutput(node: AudioNode, ctx: AudioContext) {
    node.connect(this.masterGain ?? ctx.destination);
  }

  /** Release one-shot source/effect nodes after the browser has played their envelope. */
  private disconnectWhenEnded(
    source: AudioScheduledSourceNode,
    nodes: AudioNode[]
  ) {
    source.onended = () => {
      source.disconnect();
      nodes.forEach((node) => node.disconnect());
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.012);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a subtle plastic/wood clatter sound for phone shaking.
   * The short noise buffer is generated once and shared by later one-shot sources.
   */
  public playShakeRattle() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startedAt = performance.now();
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.getShakeNoiseBuffer(ctx);
    noise.playbackRate.setValueAtTime(0.85 + Math.random() * 0.3, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + Math.random() * 800, now);
    filter.Q.setValueAtTime(4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    this.connectToOutput(gain, ctx);
    this.disconnectWhenEnded(noise, [filter, gain]);

    noise.start(now);
    this.measureScheduling('fancy-dice:audio-shake-schedule', startedAt);
  }

  /**
   * Plays realistic dice bounces using the Web Audio clock.
   * All bounce events are scheduled in one pass instead of waking JavaScript
   * once per bounce through separate setTimeout callbacks.
   */
  public playDiceRollSound(diceCount: number = 2) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startedAt = performance.now();
    const startAt = ctx.currentTime;
    const bounces = Math.min(Math.max(diceCount * 3, 5), 14);

    for (let i = 0; i < bounces; i++) {
      const delay = (i * 0.06) + (Math.random() * 0.04);
      const when = startAt + delay;
      const intensity = Math.pow(1 - (i / bounces), 1.5) * 0.25;

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350 + Math.random() * 450, when);
      osc.frequency.exponentialRampToValueAtTime(120, when + 0.04);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(intensity, when);
      gain.gain.exponentialRampToValueAtTime(0.001, when + 0.04);

      osc.connect(gain);
      this.connectToOutput(gain, ctx);
      this.disconnectWhenEnded(osc, [gain]);

      osc.start(when);
      osc.stop(when + 0.05);
    }

    this.measureScheduling('fancy-dice:audio-roll-schedule', startedAt);
  }

  /** Plays a dramatic fanfare chord for Natural 20 / Critical Success. */
  public playCritSound() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startedAt = performance.now();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteAt = now + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteAt);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.2, noteAt);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + idx * 0.08);

      osc.connect(gain);
      this.connectToOutput(gain, ctx);
      this.disconnectWhenEnded(osc, [gain]);

      osc.start(noteAt);
      osc.stop(now + 1.2);
    });

    this.measureScheduling('fancy-dice:audio-crit-schedule', startedAt);
  }

  /** Plays a low thud / fumble sound for Natural 1. */
  public playFumbleSound() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const startedAt = performance.now();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.4);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    this.connectToOutput(gain, ctx);
    this.disconnectWhenEnded(osc, [gain]);

    osc.start(now);
    osc.stop(now + 0.45);
    this.measureScheduling('fancy-dice:audio-fumble-schedule', startedAt);
  }
}

export const audioManager = new AudioManager();
