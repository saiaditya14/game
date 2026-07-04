import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGuess,
  isSolvedRow,
  isValidWord,
  pickSecretWord,
  resolveWinner,
  WORD_LENGTH,
} from './WordRaceRules.js';

test('evaluateGuess marks exact matches as correct', () => {
  assert.deepEqual(evaluateGuess('crane', 'crane'), Array(WORD_LENGTH).fill('correct'));
});

test('evaluateGuess marks letters absent when not in secret', () => {
  assert.deepEqual(evaluateGuess('spelt', 'crank'), ['absent', 'absent', 'absent', 'absent', 'absent']);
});

test('evaluateGuess handles duplicate letters without over-counting', () => {
  // secret "clean" has one "l" and one "c"; guess "lilac" has two of each —
  // the exact-position "a" is correct, and only one "l" and one "c" register as present.
  assert.deepEqual(evaluateGuess('lilac', 'clean'), ['present', 'absent', 'absent', 'correct', 'present']);
});

test('isSolvedRow is true only when every tile is correct', () => {
  assert.equal(isSolvedRow(['correct', 'correct', 'correct', 'correct', 'correct']), true);
  assert.equal(isSolvedRow(['correct', 'present', 'correct', 'correct', 'correct']), false);
});

test('isValidWord accepts known words and rejects gibberish', () => {
  assert.equal(isValidWord('crane'), true);
  assert.equal(isValidWord('zzzzz'), false);
  assert.equal(isValidWord('ab'), false);
});

test('pickSecretWord is deterministic given a fixed rand()', () => {
  const word = pickSecretWord(() => 0);
  assert.equal(typeof word, 'string');
  assert.equal(word.length, WORD_LENGTH);
});

test('resolveWinner picks the solver when only one player solved', () => {
  assert.equal(resolveWinner({ solvedOne: true, solvedTwo: false }), 1);
  assert.equal(resolveWinner({ solvedOne: false, solvedTwo: true }), 2);
});

test('resolveWinner is a draw when neither player solved', () => {
  assert.equal(resolveWinner({ solvedOne: false, solvedTwo: false }), null);
});

test('resolveWinner picks fewer guesses when both solved', () => {
  const winner = resolveWinner({
    solvedOne: true, solvedTwo: true,
    progressOne: [1, 2, 3], progressTwo: [1, 2, 3, 4],
  });
  assert.equal(winner, 1);
});

test('resolveWinner breaks a guess-count tie by earlier finish time', () => {
  const winner = resolveWinner({
    solvedOne: true, solvedTwo: true,
    progressOne: [1, 2], progressTwo: [1, 2],
    finishedOneAt: '2026-01-01T00:00:01.000Z',
    finishedTwoAt: '2026-01-01T00:00:02.000Z',
  });
  assert.equal(winner, 1);
});
