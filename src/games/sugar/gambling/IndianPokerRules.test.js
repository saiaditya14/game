import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dealHands,
  canAffordAnte,
  isRoundComplete,
  resolveRound,
  checkTableGameOver,
} from './IndianPokerRules.js';

const seq = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

test('dealHands assigns one rank 2-14 per player id', () => {
  const hands = dealHands(['a', 'b', 'c'], seq([0, 0.5, 0.99]));
  assert.deepEqual(Object.keys(hands).sort(), ['a', 'b', 'c']);
  Object.values(hands).forEach((rank) => assert.ok(rank >= 2 && rank <= 14));
});

test('canAffordAnte compares chips to the ante', () => {
  assert.equal(canAffordAnte({ chips: 20 }, 20), true);
  assert.equal(canAffordAnte({ chips: 19 }, 20), false);
  assert.equal(canAffordAnte(undefined, 20), false);
});

test('isRoundComplete is false until every dealt-in player has decided', () => {
  const hands = { a: 10, b: 8 };
  assert.equal(isRoundComplete(hands, {}), false);
  assert.equal(isRoundComplete(hands, { a: 'stay' }), false);
  assert.equal(isRoundComplete(hands, { a: 'stay', b: 'fold' }), true);
});

test('isRoundComplete is false with no hands dealt', () => {
  assert.equal(isRoundComplete({}, {}), false);
});

test('resolveRound: highest card among stayers wins the whole pot', () => {
  const hands = { a: 9, b: 14, c: 12 };
  const decisions = { a: 'stay', b: 'fold', c: 'stay' };
  const { winners, payouts } = resolveRound({ hands, decisions, pot: 90 });
  assert.deepEqual(winners, ['c']); // b folded despite the highest card
  assert.deepEqual(payouts, { c: 90 });
});

test('resolveRound splits the pot across a tie, remainder to the first winner', () => {
  const hands = { a: 10, b: 10, c: 5 };
  const decisions = { a: 'stay', b: 'stay', c: 'stay' };
  const { winners, payouts } = resolveRound({ hands, decisions, pot: 101 });
  assert.deepEqual(winners, ['a', 'b']);
  assert.deepEqual(payouts, { a: 51, b: 50 });
});

test('resolveRound returns no winners/payouts when everyone folds', () => {
  const hands = { a: 9, b: 14 };
  const decisions = { a: 'fold', b: 'fold' };
  const { winners, payouts } = resolveRound({ hands, decisions, pot: 40 });
  assert.deepEqual(winners, []);
  assert.deepEqual(payouts, {});
});

test('checkTableGameOver reports the sole player with chips left as winner', () => {
  const players = [{ id: 'a', chips: 0 }, { id: 'b', chips: 40 }, { id: 'c', chips: 0 }];
  assert.deepEqual(checkTableGameOver(players), { gameOver: true, winnerId: 'b' });
});

test('checkTableGameOver is false with 2+ players still holding chips', () => {
  const players = [{ id: 'a', chips: 10 }, { id: 'b', chips: 10 }];
  assert.deepEqual(checkTableGameOver(players), { gameOver: false, winnerId: null });
});
