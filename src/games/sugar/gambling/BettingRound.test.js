import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBettingRound,
  applyAction,
  isRoundClosed,
  remainingContenders,
  potContribution,
} from './BettingRound.js';

test('check-around closes the round with nothing in the pot', () => {
  let round = createBettingRound({ order: ['a', 'b', 'c'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'check', 0, 100));
  assert.equal(round.currentActor, 'b');
  ({ round } = applyAction(round, 'b', 'check', 0, 100));
  assert.equal(round.currentActor, 'c');
  ({ round } = applyAction(round, 'c', 'check', 0, 100));
  assert.equal(isRoundClosed(round), true);
  assert.equal(potContribution(round), 0);
});

test('bet then two calls closes the round with the full pot committed', () => {
  let round = createBettingRound({ order: ['a', 'b', 'c'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 10, 100));
  assert.equal(round.toCall, 10);
  assert.equal(round.currentActor, 'b');
  ({ round } = applyAction(round, 'b', 'call', 0, 100));
  ({ round } = applyAction(round, 'c', 'call', 0, 100));
  assert.equal(isRoundClosed(round), true);
  assert.equal(potContribution(round), 30);
});

test('raise reopens action for players who already acted', () => {
  let round = createBettingRound({ order: ['a', 'b', 'c'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 10, 100));
  ({ round } = applyAction(round, 'b', 'call', 0, 100));
  assert.equal(round.currentActor, 'c');
  ({ round } = applyAction(round, 'c', 'raise', 20, 100));
  assert.equal(round.toCall, 30);
  assert.equal(isRoundClosed(round), false);
  assert.equal(round.currentActor, 'a');
  ({ round } = applyAction(round, 'a', 'call', 0, 90));
  assert.equal(isRoundClosed(round), false); // b still owes 20 more
  ({ round } = applyAction(round, 'b', 'call', 0, 90));
  assert.equal(isRoundClosed(round), true);
  assert.equal(potContribution(round), 90);
});

test('folding down to one contender closes the round immediately', () => {
  let round = createBettingRound({ order: ['a', 'b', 'c'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 10, 100));
  ({ round } = applyAction(round, 'b', 'fold', 0, 100));
  assert.equal(isRoundClosed(round), false); // c still owes
  ({ round } = applyAction(round, 'c', 'fold', 0, 100));
  assert.equal(isRoundClosed(round), true);
  assert.deepEqual(remainingContenders(round), ['a']);
});

test('an under-funded call goes all-in for whatever the player has left', () => {
  let round = createBettingRound({ order: ['a', 'b'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 50, 100));
  let stack;
  ({ round, stack } = applyAction(round, 'b', 'call', 0, 30));
  assert.equal(stack, 0);
  assert.equal(round.allIn.b, true);
  assert.equal(round.committed.b, 30);
  assert.equal(isRoundClosed(round), true); // b has nothing left to act with
});

test('all-in for more than the current bet reopens action as a raise', () => {
  let round = createBettingRound({ order: ['a', 'b', 'c'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 10, 100));
  ({ round } = applyAction(round, 'b', 'all-in', 0, 60));
  assert.equal(round.toCall, 60);
  assert.equal(round.currentActor, 'c');
  assert.equal(round.acted.a, false); // a must respond to the raise
});

test('rejects actions from a player who is not the current actor', () => {
  const round = createBettingRound({ order: ['a', 'b'], minBet: 10 });
  const { error } = applyAction(round, 'b', 'check', 0, 100);
  assert.equal(error, 'NOT_YOUR_TURN');
});

test('rejects checking when a bet is outstanding, and betting twice', () => {
  let round = createBettingRound({ order: ['a', 'b'], minBet: 10 });
  ({ round } = applyAction(round, 'a', 'bet', 10, 100));
  const badCheck = applyAction(round, 'b', 'check', 0, 100);
  assert.equal(badCheck.error, 'CANNOT_CHECK');
  const badBet = applyAction(round, 'b', 'bet', 10, 100);
  assert.equal(badBet.error, 'ALREADY_BET');
});
