import test from 'node:test';
import assert from 'node:assert/strict';
import { shuffleArray } from '../src/utils/randomPicker.js';

test('Fair Round Logic - guarantees each student picked exactly once per round', () => {
  const studentIds = ['id_1', 'id_2', 'id_3', 'id_4', 'id_5'];
  let remaining = shuffleArray(studentIds);
  const selected = [];

  // Simulate drawing 5 students
  while (remaining.length > 0) {
    const nextPicked = remaining.shift();
    selected.push(nextPicked);
  }

  // All 5 must have been selected
  assert.equal(selected.length, 5);
  // Zero remaining
  assert.equal(remaining.length, 0);
  // No duplicates in selected
  const uniqueSelected = new Set(selected);
  assert.equal(uniqueSelected.size, 5);
  // All original student IDs present
  studentIds.forEach((id) => assert.ok(uniqueSelected.has(id)));
});

test('Fair Round Reset - replenishes pool with fresh randomized order', () => {
  const studentIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];
  const round1Shuffled = shuffleArray(studentIds);
  const round2Shuffled = shuffleArray(studentIds);

  assert.equal(round1Shuffled.length, studentIds.length);
  assert.equal(round2Shuffled.length, studentIds.length);
  assert.deepEqual([...round1Shuffled].sort(), [...studentIds].sort());
  assert.deepEqual([...round2Shuffled].sort(), [...studentIds].sort());
});
