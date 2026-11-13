import assert from 'node:assert/strict';
import test from 'node:test';
import { AudioManager } from '../src/lib/audioManager';

class FakeAudioParam {
  value = 1;
  targetValues: number[] = [];

  setValueAtTime(value: number) {
    this.value = value;
  }

  setTargetAtTime(value: number) {
    this.value = value;
    this.targetValues.push(value);
  }

  exponentialRampToValueAtTime(value: number) {
    this.value = value;
  }

  cancelScheduledValues() {}
}

class FakeAudioNode {
  connections: unknown[] = [];
  disconnectCount = 0;

  connect(destination: unknown) {
    this.connections.push(destination);
  }

  disconnect() {
    this.disconnectCount += 1;
  }
}

class FakeGainNode extends FakeAudioNode {
  gain = new FakeAudioParam();
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type = '';
  frequency = new FakeAudioParam();
  Q = new FakeAudioParam();
}

class FakeScheduledSource extends FakeAudioNode {
  onended: (() => void) | null = null;
  startTimes: number[] = [];
  stopTimes: number[] = [];

  start(when = 0) {
    this.startTimes.push(when);
  }

  stop(when = 0) {
    this.stopTimes.push(when);
  }
}

class FakeOscillatorNode extends FakeScheduledSource {
  type = '';
  frequency = new FakeAudioParam();
}

class FakeBufferSourceNode extends FakeScheduledSource {
  buffer: FakeAudioBuffer | null = null;
  playbackRate = new FakeAudioParam();
}

class FakeAudioBuffer {
  constructor(public readonly sampleRate: number, private readonly frameCount: number) {}

  getChannelData() {
    return new Float32Array(this.frameCount);
  }
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];

  readonly sampleRate = 48_000;
  readonly currentTime = 12;
  readonly destination = new FakeAudioNode();
  state: AudioContextState = 'running';
  buffersCreated = 0;
  sources: FakeBufferSourceNode[] = [];
  oscillators: FakeOscillatorNode[] = [];
  gains: FakeGainNode[] = [];
  filters: FakeBiquadFilterNode[] = [];
  suspendCount = 0;
  resumeCount = 0;

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createBuffer(_channels: number, frameCount: number, sampleRate: number) {
    this.buffersCreated += 1;
    return new FakeAudioBuffer(sampleRate, frameCount);
  }

  createBufferSource() {
    const source = new FakeBufferSourceNode();
    this.sources.push(source);
    return source;
  }

  createBiquadFilter() {
    const filter = new FakeBiquadFilterNode();
    this.filters.push(filter);
    return filter;
  }

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  resume() {
    this.resumeCount += 1;
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.suspendCount += 1;
    this.state = 'suspended';
    return Promise.resolve();
  }
}

function installFakeAudioEnvironment() {
  FakeAudioContext.instances = [];
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const listeners = new Map<string, () => void>();
  const fakeDocument = {
    hidden: false,
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { AudioContext: FakeAudioContext },
  });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: fakeDocument,
  });

  return {
    listeners,
    fakeDocument,
    cleanup() {
      if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
      else Reflect.deleteProperty(globalThis, 'window');
      if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
      else Reflect.deleteProperty(globalThis, 'document');
    },
  };
}

test('reuses one generated noise buffer across repeated shake sounds', () => {
  const environment = installFakeAudioEnvironment();
  try {
    const manager = new AudioManager();
    manager.playShakeRattle();
    manager.playShakeRattle();

    const context = FakeAudioContext.instances[0];
    assert.ok(context);
    assert.equal(context.buffersCreated, 1);
    assert.equal(context.sources.length, 2);
    assert.equal(context.filters.length, 2);
    assert.equal(context.gains.length, 3); // One master gain and one envelope per sound.
  } finally {
    environment.cleanup();
  }
});

test('schedules all dice bounces on the Web Audio clock without JavaScript timers', () => {
  const environment = installFakeAudioEnvironment();
  const originalSetTimeout = globalThis.setTimeout;
  let timeoutCalls = 0;

  try {
    const manager = new AudioManager();
    globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
      timeoutCalls += 1;
      return originalSetTimeout(...args);
    }) as typeof setTimeout;

    manager.playDiceRollSound(5);

    const context = FakeAudioContext.instances[0];
    assert.ok(context);
    assert.equal(context.oscillators.length, 14);
    assert.equal(timeoutCalls, 0);

    const starts = context.oscillators.map((oscillator) => oscillator.startTimes[0]);
    assert.ok(starts.every((time) => time >= context.currentTime));
    assert.deepEqual(starts, [...starts].sort((left, right) => left - right));
    assert.ok(context.oscillators.every((oscillator) =>
      Math.abs(oscillator.stopTimes[0] - oscillator.startTimes[0] - 0.05) < 1e-9
    ));
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    environment.cleanup();
  }
});

test('routes mute changes through the master gain and suspends audio in the background', async () => {
  const environment = installFakeAudioEnvironment();
  try {
    const manager = new AudioManager();
    manager.playShakeRattle();

    const context = FakeAudioContext.instances[0];
    assert.ok(context);
    const masterGain = context.gains[0];

    manager.setMuted(true);
    assert.equal(masterGain.gain.value, 0);

    environment.fakeDocument.hidden = true;
    environment.listeners.get('visibilitychange')?.();
    await Promise.resolve();

    assert.equal(context.suspendCount, 1);
    assert.equal(context.state, 'suspended');
  } finally {
    environment.cleanup();
  }
});
