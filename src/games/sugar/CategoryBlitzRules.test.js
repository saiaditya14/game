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

test('computeScores awards a point for a non-empty, approved, non-duplicate answer', () => {
  const { perCategory, scoreOne, scoreTwo } = computeScores({
    categories: ['Fruits'],
    answersOne: ['Banana'],
    answersTwo: ['Apple'],
    approvalsOne: [true],
    approvalsTwo: [true],
  });
  assert.equal(scoreOne, 1);
  assert.equal(scoreTwo, 1);
  assert.equal(perCategory[0].isDupe, false);
});

test('computeScores zeroes out an unapproved answer', () => {
  const { scoreOne } = computeScores({
    categories: ['Fruits'],
    answersOne: ['Banana'],
    answersTwo: [''],
    approvalsOne: [false],
    approvalsTwo: [],
  });
  assert.equal(scoreOne, 0);
});

test('computeScores cancels identical answers regardless of approval', () => {
  const { perCategory, scoreOne, scoreTwo } = computeScores({
    categories: ['Fruits'],
    answersOne: [' Banana'],
    answersTwo: ['banana '],
    approvalsOne: [true],
    approvalsTwo: [true],
  });
  assert.equal(perCategory[0].isDupe, true);
  assert.equal(scoreOne, 0);
  assert.equal(scoreTwo, 0);
});

test('computeScores gives zero for an empty answer even if approved', () => {
  const { scoreOne } = computeScores({
    categories: ['Fruits'],
    answersOne: [''],
    answersTwo: ['Apple'],
    approvalsOne: [true],
    approvalsTwo: [true],
  });
  assert.equal(scoreOne, 0);
});

test('resolveWinner picks the higher score and draws on a tie', () => {
  assert.equal(resolveWinner(5, 3), 1);
  assert.equal(resolveWinner(2, 6), 2);
  assert.equal(resolveWinner(4, 4), null);
});
