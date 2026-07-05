import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LETTER_POOL,
  computeScores,
  normalizeAnswer,
  pickCategories,
  pickRandomLetter,
  resolveWinner,
} from './CategoryBlitzRules.js';

test('pickRandomLetter is deterministic given a fixed rand() and stays in the pool', () => {
  const letter = pickRandomLetter(() => 0);
  assert.equal(letter, LETTER_POOL[0]);
});

test('LETTER_POOL excludes the hard Scattergories letters', () => {
  for (const hard of ['Q', 'U', 'V', 'X', 'Y', 'Z']) {
    assert.equal(LETTER_POOL.includes(hard), false);
  }
});

test('pickCategories returns the requested count with no duplicates', () => {
  const picked = pickCategories(10, () => 0.5);
  assert.equal(picked.length, 10);
  assert.equal(new Set(picked).size, 10);
});

test('normalizeAnswer trims whitespace and lowercases', () => {
  assert.equal(normalizeAnswer('  Banana '), 'banana');
  assert.equal(normalizeAnswer(null), '');
});

const PLAYERS3 = [
  { id: 'p1', name: 'Player 1' },
  { id: 'p2', name: 'Player 2' },
  { id: 'p3', name: 'Player 3' },
];

test('computeScores tallies votes across 3 players', () => {
  // Category 0: p1 gets 2 votes (from p2, p3), p2 gets 1 vote (from p1), p3 gets 0.
  const { scores, perCategory } = computeScores({
    players: PLAYERS3,
    categories: ['Fruits'],
    answers: { p1: ['Apple'], p2: ['Banana'], p3: ['Cherry'] },
    votes: { p1: ['p2'], p2: ['p1'], p3: ['p1'] },
  });
  assert.equal(scores.p1, 2);
  assert.equal(scores.p2, 1);
  assert.equal(scores.p3, 0);
  assert.deepEqual(perCategory[0].votesReceived, { p1: 2, p2: 1, p3: 0 });
});

test('computeScores treats a null vote as an abstain', () => {
  const { scores } = computeScores({
    players: PLAYERS3,
    categories: ['Fruits'],
    answers: { p1: ['Apple'], p2: ['Banana'], p3: ['Cherry'] },
    votes: { p1: [null], p2: ['p1'], p3: [null] },
  });
  assert.equal(scores.p1, 1);
  assert.equal(scores.p2, 0);
  assert.equal(scores.p3, 0);
});

test('computeScores ignores a self-vote', () => {
  const { scores } = computeScores({
    players: PLAYERS3,
    categories: ['Fruits'],
    answers: { p1: ['Apple'], p2: ['Banana'], p3: ['Cherry'] },
    votes: { p1: ['p1'], p2: ['p1'], p3: ['p1'] },
  });
  // p1's own self-vote does not count, only p2 and p3's votes for p1 do.
  assert.equal(scores.p1, 2);
});

test('computeScores ignores a vote for an empty answer', () => {
  const { scores } = computeScores({
    players: PLAYERS3,
    categories: ['Fruits'],
    answers: { p1: [''], p2: ['Banana'], p3: ['Cherry'] },
    votes: { p2: ['p1'], p3: ['p1'] },
  });
  assert.equal(scores.p1, 0);
});

test('computeScores ignores a vote for an unknown/removed player id', () => {
  const { scores } = computeScores({
    players: PLAYERS3,
    categories: ['Fruits'],
    answers: { p1: ['Apple'], p2: ['Banana'], p3: ['Cherry'] },
    votes: { p1: ['ghost'], p2: ['p1'] },
  });
  assert.equal(scores.p1, 1);
});

test('computeScores in a 2-player room reduces to a single approve/abstain per category', () => {
  const players2 = [{ id: 'p1', name: 'Player 1' }, { id: 'p2', name: 'Player 2' }];
  const { scores } = computeScores({
    players: players2,
    categories: ['Fruits', 'Colors'],
    answers: { p1: ['Apple', 'Amber'], p2: ['Banana', 'Blue'] },
    // p1 approves p2's "Banana" but abstains on "Blue"; p2 approves both of p1's.
    votes: { p1: ['p2', null], p2: ['p1', 'p1'] },
  });
  assert.equal(scores.p1, 2);
  assert.equal(scores.p2, 1);
});

test('resolveWinner picks the single strictly-highest scorer', () => {
  assert.equal(resolveWinner({ p1: 5, p2: 3, p3: 1 }), 'p1');
});

test('resolveWinner returns null on an exact tie', () => {
  assert.equal(resolveWinner({ p1: 4, p2: 4 }), null);
});

test('resolveWinner returns null when scores are empty', () => {
  assert.equal(resolveWinner({}), null);
});
