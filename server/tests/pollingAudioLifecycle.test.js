import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * State machine simulating the exact RandomPicker + PollAnimationStage + SoundContext lifecycle.
 */
class SelectionStateMachine {
  constructor({ soundEnabled = true, volume = 0.7 } = {}) {
    this.status = 'idle'; // 'idle' | 'polling' | 'selected' | 'error' | 'cancelled'
    this.selectedStudent = null;
    this.error = null;
    this.soundEnabled = soundEnabled;
    this.volume = volume;

    this.currentRequestId = 0;
    this.activeTimer = null;
    this.isSuspenseAudioPlaying = false;
    this.confirmationChimeCount = 0;
    this.errorSoundCount = 0;
    this.startupSoundCount = 0;
  }

  startSuspenseAudio() {
    if (!this.soundEnabled || this.volume <= 0) return;
    this.startupSoundCount++;
    this.isSuspenseAudioPlaying = true;
  }

  stopSuspenseAudio() {
    this.isSuspenseAudioPlaying = false;
  }

  playConfirmationChime() {
    this.stopSuspenseAudio();
    if (!this.soundEnabled || this.volume <= 0) return;
    this.confirmationChimeCount++;
  }

  playErrorTone() {
    this.stopSuspenseAudio();
    if (!this.soundEnabled || this.volume <= 0) return;
    this.errorSoundCount++;
  }

  async draw({
    students = [],
    apiFn = null,
    minSuspenseMs = 20,
  } = {}) {
    // 1. Guard against rapid repeated clicks
    if (this.status === 'polling') {
      return { rejected: true, reason: 'Already polling' };
    }

    // 2. Guard against empty classroom
    if (!students || students.length === 0) {
      this.status = 'error';
      this.error = 'Cannot pick: No active students in this classroom roster.';
      return { rejected: true, reason: 'Empty roster' };
    }

    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    const requestId = ++this.currentRequestId;
    this.status = 'polling';
    this.error = null;
    this.selectedStudent = null;

    // Start suspense audio immediately
    this.startSuspenseAudio();

    try {
      const minSuspensePromise = new Promise((resolve) => {
        this.activeTimerResolve = resolve;
        this.activeTimer = setTimeout(() => {
          this.activeTimer = null;
          this.activeTimerResolve = null;
          resolve();
        }, minSuspenseMs);
      });

      const apiPromise = apiFn ? apiFn() : Promise.resolve({ selectedStudent: students[0] });

      const [_, result] = await Promise.all([minSuspensePromise, apiPromise]);

      // Guard against stale requests / cancellation
      if (requestId !== this.currentRequestId) {
        return { ignored: true };
      }

      if (!result || !result.selectedStudent) {
        throw new Error('Invalid selection received');
      }

      // Commit authoritative result
      this.selectedStudent = result.selectedStudent;
      this.status = 'selected';

      // Audio lifecycle: stop suspense and play confirmation chime exactly once
      this.stopSuspenseAudio();
      this.playConfirmationChime();

      return { success: true, selectedStudent: this.selectedStudent };
    } catch (err) {
      if (requestId !== this.currentRequestId) {
        return { ignored: true };
      }

      this.status = 'error';
      this.error = err.message;
      this.stopSuspenseAudio();
      this.playErrorTone();

      return { success: false, error: this.error };
    }
  }

  cancel() {
    if (this.status !== 'polling') return;
    this.currentRequestId++;
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    if (this.activeTimerResolve) {
      this.activeTimerResolve();
      this.activeTimerResolve = null;
    }
    this.stopSuspenseAudio();
    this.status = 'cancelled';
    this.error = null;
  }

  unmount() {
    this.currentRequestId++;
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    if (this.activeTimerResolve) {
      this.activeTimerResolve();
      this.activeTimerResolve = null;
    }
    this.stopSuspenseAudio();
  }
}

test('Polling Lifecycle - Successful selection transitions idle -> polling -> selected', async () => {
  const machine = new SelectionStateMachine();
  const students = [{ id: 's1', fullName: 'Student One' }];

  assert.equal(machine.status, 'idle');
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.confirmationChimeCount, 0);

  const drawPromise = machine.draw({
    students,
    apiFn: async () => {
      assert.equal(machine.status, 'polling');
      assert.equal(machine.isSuspenseAudioPlaying, true);
      return { selectedStudent: students[0] };
    },
    minSuspenseMs: 15,
  });

  const res = await drawPromise;
  assert.equal(res.success, true);
  assert.equal(machine.status, 'selected');
  assert.equal(machine.selectedStudent.id, 's1');
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.confirmationChimeCount, 1);
});

test('Polling Lifecycle - API failure transitions to error and halts suspense without chime', async () => {
  const machine = new SelectionStateMachine();
  const students = [{ id: 's1', fullName: 'Student One' }];

  const res = await machine.draw({
    students,
    apiFn: async () => {
      throw new Error('Network timeout');
    },
    minSuspenseMs: 10,
  });

  assert.equal(res.success, false);
  assert.equal(machine.status, 'error');
  assert.equal(machine.error, 'Network timeout');
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.confirmationChimeCount, 0); // Confirmation chime must NOT play
  assert.equal(machine.errorSoundCount, 1);
});

test('Polling Lifecycle - Empty classroom is rejected immediately without starting audio', async () => {
  const machine = new SelectionStateMachine();
  const res = await machine.draw({ students: [] });

  assert.equal(res.rejected, true);
  assert.equal(machine.status, 'error');
  assert.ok(machine.error.includes('No active students'));
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.startupSoundCount, 0);
  assert.equal(machine.confirmationChimeCount, 0);
});

test('Polling Lifecycle - Rapid repeated clicks are blocked during polling', async () => {
  const machine = new SelectionStateMachine();
  const students = [{ id: 's1', fullName: 'Student One' }];

  let apiCallCount = 0;
  const slowApi = () =>
    new Promise((resolve) => {
      apiCallCount++;
      setTimeout(() => resolve({ selectedStudent: students[0] }), 40);
    });

  // First click starts polling
  const firstCall = machine.draw({ students, apiFn: slowApi, minSuspenseMs: 10 });

  // Rapid second and third clicks
  const secondCall = await machine.draw({ students, apiFn: slowApi, minSuspenseMs: 10 });
  const thirdCall = await machine.draw({ students, apiFn: slowApi, minSuspenseMs: 10 });

  assert.equal(secondCall.rejected, true);
  assert.equal(thirdCall.rejected, true);
  assert.equal(apiCallCount, 1, 'Only one API call must be fired');

  await firstCall;
  assert.equal(machine.status, 'selected');
  assert.equal(machine.confirmationChimeCount, 1);
});

test('Polling Lifecycle - Cancellation immediately cuts suspense and halts commit', async () => {
  const machine = new SelectionStateMachine();
  const students = [{ id: 's1', fullName: 'Student One' }];

  const slowApi = () =>
    new Promise((resolve) => setTimeout(() => resolve({ selectedStudent: students[0] }), 50));

  const drawPromise = machine.draw({ students, apiFn: slowApi, minSuspenseMs: 40 });
  assert.equal(machine.status, 'polling');
  assert.equal(machine.isSuspenseAudioPlaying, true);

  // User clicks Cancel halfway through
  machine.cancel();

  assert.equal(machine.status, 'cancelled');
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.confirmationChimeCount, 0);

  // When API eventually finishes, it must be ignored
  await drawPromise;
  assert.equal(machine.status, 'cancelled');
  assert.equal(machine.confirmationChimeCount, 0);
  assert.equal(machine.selectedStudent, null);
});

test('Polling Lifecycle - Unmounting component terminates suspense audio and pending work', async () => {
  const machine = new SelectionStateMachine();
  const students = [{ id: 's1', fullName: 'Student One' }];

  const drawPromise = machine.draw({
    students,
    apiFn: () => new Promise((resolve) => setTimeout(() => resolve({ selectedStudent: students[0] }), 50)),
    minSuspenseMs: 40,
  });

  assert.equal(machine.isSuspenseAudioPlaying, true);

  // Component unmounts
  machine.unmount();
  assert.equal(machine.isSuspenseAudioPlaying, false);

  await drawPromise;
  assert.equal(machine.confirmationChimeCount, 0);
});

test('Polling Lifecycle - Muted mode suppresses sound without breaking state progression', async () => {
  const machine = new SelectionStateMachine({ soundEnabled: false });
  const students = [{ id: 's1', fullName: 'Student One' }];

  const res = await machine.draw({
    students,
    apiFn: async () => ({ selectedStudent: students[0] }),
    minSuspenseMs: 10,
  });

  assert.equal(res.success, true);
  assert.equal(machine.status, 'selected');
  assert.equal(machine.startupSoundCount, 0);
  assert.equal(machine.isSuspenseAudioPlaying, false);
  assert.equal(machine.confirmationChimeCount, 0); // Muted suppresses audio output
});
