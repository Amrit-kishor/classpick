import test from 'node:test';
import assert from 'node:assert/strict';
import { getSecureRandomIndex, pickRandomItem, shuffleArray } from '../src/utils/randomPicker.js';

test('Random Picker - getSecureRandomIndex returns numbers within bounds', () => {
  for (let i = 0; i < 100; i++) {
    const idx = getSecureRandomIndex(10);
    assert.ok(idx >= 0 && idx < 10, `Index ${idx} out of bounds [0, 10)`);
  }
});

test('Random Picker - getSecureRandomIndex throws for invalid max', () => {
  assert.throws(() => getSecureRandomIndex(0), /must be greater than 0/);
  assert.throws(() => getSecureRandomIndex(-5), /must be greater than 0/);
});

test('Random Picker - pickRandomItem selects elements from array', () => {
  const students = ['Aarav', 'Bhavna', 'Chirag', 'Devansh'];
  const picked = pickRandomItem(students);
  assert.ok(students.includes(picked), `Picked item ${picked} not in students list`);
});

test('Random Picker - pickRandomItem throws on empty array', () => {
  assert.throws(() => pickRandomItem([]), /Cannot pick from empty array/);
});

test('Random Picker - Fisher-Yates shuffleArray produces complete permutation', () => {
  const original = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
  const shuffled = shuffleArray(original);

  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
  // Original array must not be mutated
  assert.deepEqual(original, ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
});

test('Random Picker - Statistical uniformity sanity test', () => {
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const iterations = 4000;
  for (let i = 0; i < iterations; i++) {
    const idx = getSecureRandomIndex(4);
    counts[idx]++;
  }
  // Each bucket should get roughly 1000 hits (+/- 200)
  for (let k = 0; k < 4; k++) {
    assert.ok(
      counts[k] > 750 && counts[k] < 1250,
      `Bucket ${k} count ${counts[k]} outside expected range`
    );
  }
});
