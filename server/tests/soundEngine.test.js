import test from 'node:test';
import assert from 'node:assert/strict';

// Test mock implementation of SuspenseAudioEngine state machine
class MockSuspenseAudioEngine {
  constructor() {
    this.isPlaying = false;
    this.timerId = null;
    this.currentStep = 0;
    this.activeNodes = new Set();
  }

  start(volume = 0.7, isMuted = false) {
    this.stop();
    if (isMuted || volume <= 0) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.volume = volume;
    this.scheduleNextTick();
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;
    const mockOsc = {
      id: Math.random(),
      stop: () => {},
    };
    this.activeNodes.add(mockOsc);
    this.currentStep++;

    this.timerId = setTimeout(() => {
      this.scheduleNextTick();
    }, 50);
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.clear();
  }
}

test('Audio Engine - start activates loop and creates active nodes', (t, done) => {
  const engine = new MockSuspenseAudioEngine();
  assert.equal(engine.isPlaying, false);

  engine.start(0.8, false);
  assert.equal(engine.isPlaying, true);
  assert.ok(engine.activeNodes.size > 0);

  setTimeout(() => {
    assert.ok(engine.currentStep > 1);
    engine.stop();
    assert.equal(engine.isPlaying, false);
    assert.equal(engine.activeNodes.size, 0);
    assert.equal(engine.timerId, null);
    done();
  }, 120);
});

test('Audio Engine - stop clears all background timers immediately', () => {
  const engine = new MockSuspenseAudioEngine();
  engine.start(0.5, false);
  assert.equal(engine.isPlaying, true);

  engine.stop();
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.timerId, null);
  assert.equal(engine.activeNodes.size, 0);
});

test('Audio Engine - Muted mode prevents starting audio loop', () => {
  const engine = new MockSuspenseAudioEngine();
  engine.start(0.5, true); // isMuted = true
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.activeNodes.size, 0);
});

test('Audio Engine - Zero volume prevents starting audio loop', () => {
  const engine = new MockSuspenseAudioEngine();
  engine.start(0, false); // volume = 0
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.activeNodes.size, 0);
});

test('Audio Engine - Volume clamping invariant', () => {
  const clampVolume = (v) => Math.max(0, Math.min(1, v));
  assert.equal(clampVolume(-0.5), 0);
  assert.equal(clampVolume(1.5), 1);
  assert.equal(clampVolume(0.7), 0.7);
});
