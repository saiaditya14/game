import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEQUENCE_LENGTH,
  STARTING_LIVES,
  applyAnswer,
  generateSeed,
  generateWordSequence,
  isPlayerDone,
  judgeAnswer,
  resolveWinner,
} from './VerbalMemoryRules.js';

test('generateWordSequence is deterministic for a fixed seed', () => {
  const a = generateWordSequence(42);
  const b = generateWordSequence(42);
  assert.deepEqual(a, b);
});

test('generateWordSequence differs across seeds', () => {
  const a = generateWordSequence(1);
  const b = generateWordSequence(2);
  assert.notDeepEqual(a, b);
});

test('generateWordSequence returns the requested length', () => {
  const seq = generateWordSequence(7, 250);
  assert.equal(seq.length, 250);
  assert.equal(seq.length, SEQUENCE_LENGTH);
});

test('generateWordSequence never marks the very first word as a repeat', () => {
  for (const seed of [1, 2, 3, 999, 123456]) {
    const seq = generateWordSequence(seed, 20);
    assert.equal(seq[0].isRepeat, false);
  }
});

test('generateWordSequence isRepeat flags match true prior-appearance ground truth', () => {
  const seq = generateWordSequence(99, 250);
  const seenSoFar = new Set();
  for (const entry of seq) {
    if (entry.isRepeat) {
      assert.equal(seenSoFar.has(entry.word), true, `word "${entry.word}" at index ${entry.index} flagged repeat but wasn't shown before`);
    } else {
      assert.equal(seenSoFar.has(entry.word), false, `word "${entry.word}" at index ${entry.index} flagged new but was already shown`);
    }
    seenSoFar.add(entry.word);
  }
});

test('generateSeed returns a value in the mulberry32-friendly uint32 range', () => {
  const seed = generateSeed();
  assert.equal(typeof seed, 'number');
  assert.ok(seed >= 0 && seed <= 0xFFFFFFFF);
});

test('judgeAnswer is correct only when the answer matches ground truth', () => {
  assert.equal(judgeAnswer('seen', true), true);
  assert.equal(judgeAnswer('new', false), true);
  assert.equal(judgeAnswer('seen', false), false);
  assert.equal(judgeAnswer('new', true), false);
});

test('applyAnswer on a correct answer increments score and leaves lives/mistakes untouched', () => {
  const start = { lives: STARTING_LIVES, score: 5, mistakes: [] };
  const entry = { index: 5, word: 'hello', isRepeat: false };
  const next = applyAnswer(start, entry, 'new');
  assert.equal(next.correct, true);
  assert.equal(next.score, 6);
  assert.equal(next.lives, STARTING_LIVES);
  assert.deepEqual(next.mistakes, []);
});

test('applyAnswer on a wrong answer costs a life and records the mistake', () => {
  const start = { lives: STARTING_LIVES, score: 5, mistakes: [] };
  const entry = { index: 12, word: 'orbit', isRepeat: true };
  const next = applyAnswer(start, entry, 'new');
  assert.equal(next.correct, false);
  assert.equal(next.score, 5);
  assert.equal(next.lives, STARTING_LIVES - 1);
  assert.deepEqual(next.mistakes, [
    { index: 12, word: 'orbit', correctAnswer: 'seen', playerAnswered: 'new' },
  ]);
});

test('isPlayerDone is true once lives reach zero', () => {
  assert.equal(isPlayerDone({ lives: 1 }), false);
  assert.equal(isPlayerDone({ lives: 0 }), true);
  assert.equal(isPlayerDone({ lives: -1 }), true);
});

test('resolveWinner picks the higher score', () => {
  assert.equal(resolveWinner({ scoreOne: 40, scoreTwo: 30 }), 1);
  assert.equal(resolveWinner({ scoreOne: 12, scoreTwo: 50 }), 2);
});

test('resolveWinner is a draw on an exact tie', () => {
  assert.equal(resolveWinner({ scoreOne: 20, scoreTwo: 20 }), null);
});
