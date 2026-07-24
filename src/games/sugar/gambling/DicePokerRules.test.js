import test from 'node:test';
import assert from 'node:assert/strict';
import {
  rollDice,
  rerollDice,
  dealDice,
  evaluateHand,
  compareHands,
  rankHandLabel,
  resolveShowdown,
  splitPot,
  checkTableGameOver,
} from './DicePokerRules.js';

test('rollDice returns the requested count of faces 1-6', () => {
  const dice = rollDice(5, () => 0.999);
  assert.equal(dice.length, 5);
  dice.forEach((v) => assert.ok(v >= 1 && v <= 6));
});

test('rerollDice only replaces dice where the keep mask is false', () => {
  const original = [1, 2, 3, 4, 5];
  const rerolled = rerollDice(original, [true, true, false, false, true], () => 0); // -> face 1
  assert.deepEqual(rerolled, [1, 2, 1, 1, 5]);
});

test('dealDice assigns 5 dice per player id', () => {
  const dice = dealDice(['a', 'b']);
  assert.deepEqual(Object.keys(dice).sort(), ['a', 'b']);
  assert.equal(dice.a.length, 5);
  assert.equal(dice.b.length, 5);
});

test('evaluateHand recognizes every category', () => {
  assert.equal(evaluateHand([6, 6, 6, 6, 6]).category, 8); // five of a kind
  assert.equal(evaluateHand([3, 3, 3, 3, 6]).category, 7); // four of a kind
  assert.equal(evaluateHand([2, 2, 2, 5, 5]).category, 6); // full house
  assert.equal(evaluateHand([1, 2, 3, 4, 5]).category, 5); // low straight
  assert.equal(evaluateHand([2, 3, 4, 5, 6]).category, 5); // high straight
  assert.equal(evaluateHand([4, 4, 4, 1, 2]).category, 4); // three of a kind
  assert.equal(evaluateHand([2, 2, 5, 5, 1]).category, 3); // two pair
  assert.equal(evaluateHand([2, 2, 1, 3, 6]).category, 2); // one pair
  assert.equal(evaluateHand([1, 2, 4, 5, 6]).category, 1); // high die
});

test('compareHands: higher category always wins regardless of face values', () => {
  const pair = evaluateHand([6, 6, 5, 4, 3]);
  const straight = evaluateHand([1, 2, 3, 4, 5]);
  assert.ok(compareHands(straight, pair) > 0);
});

test('compareHands: a 6-high straight beats a 1-5 straight', () => {
  const low = evaluateHand([1, 2, 3, 4, 5]);
  const high = evaluateHand([2, 3, 4, 5, 6]);
  assert.ok(compareHands(high, low) > 0);
});

test('compareHands: within a category, higher tiebreak face wins', () => {
  const threeFours = evaluateHand([4, 4, 4, 1, 2]);
  const threeTwos = evaluateHand([2, 2, 2, 6, 5]);
  assert.ok(compareHands(threeFours, threeTwos) > 0);
});

test('compareHands: identical hands tie', () => {
  const a = evaluateHand([3, 3, 5, 5, 1]);
  const b = evaluateHand([5, 5, 3, 3, 1]);
  assert.equal(compareHands(a, b), 0);
});

test('rankHandLabel accepts a hand object or a raw category number', () => {
  assert.equal(rankHandLabel(evaluateHand([1, 1, 1, 1, 1])), 'Five of a Kind');
  assert.equal(rankHandLabel(1), 'High Die');
});

test('resolveShowdown picks the best hand among non-folded players and ties split', () => {
  const dice = { a: [6, 6, 6, 1, 2], b: [5, 5, 5, 1, 2], c: [1, 2, 3, 4, 6] };
  const { winners } = resolveShowdown({ dice, folded: { c: true } });
  assert.deepEqual(winners, ['a']);
});

test('resolveShowdown returns a tie when two non-folded hands are equal', () => {
  const dice = { a: [3, 3, 5, 5, 1], b: [5, 5, 3, 3, 1] };
  const { winners } = resolveShowdown({ dice, folded: {} });
  assert.deepEqual(winners.sort(), ['a', 'b']);
});

test('splitPot divides evenly with the remainder to the first winner', () => {
  assert.deepEqual(splitPot(101, ['a', 'b']), { a: 51, b: 50 });
  assert.deepEqual(splitPot(90, ['a']), { a: 90 });
  assert.deepEqual(splitPot(50, []), {});
});

test('checkTableGameOver (bust mode): stops once only one player has chips', () => {
  const players = [{ id: 'a', chips: 0 }, { id: 'b', chips: 40 }];
  assert.deepEqual(checkTableGameOver({ players, endMode: 'bust' }), { gameOver: true, winnerIds: ['b'] });
});

test('checkTableGameOver (hands mode): stops at the hand cap, most chips wins', () => {
  const players = [{ id: 'a', chips: 120 }, { id: 'b', chips: 80 }];
  const result = checkTableGameOver({ players, endMode: 'hands', handCap: 5, handsPlayed: 5 });
  assert.deepEqual(result, { gameOver: true, winnerIds: ['a'] });
});

test('checkTableGameOver (hands mode): not over before the cap, and ties list every winner', () => {
  const players = [{ id: 'a', chips: 100 }, { id: 'b', chips: 100 }];
  assert.equal(checkTableGameOver({ players, endMode: 'hands', handCap: 5, handsPlayed: 3 }).gameOver, false);
  const atCap = checkTableGameOver({ players, endMode: 'hands', handCap: 5, handsPlayed: 5 });
  assert.deepEqual(atCap.winnerIds.sort(), ['a', 'b']);
});
