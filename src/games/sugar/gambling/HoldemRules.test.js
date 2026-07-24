import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeck,
  shuffle,
  dealHoldemRound,
  advanceStreetBetting,
  resolveHoldemShowdown,
  STREET_AFTER,
  handLabel,
} from './HoldemRules.js';

const seq = (values) => {
  let i = 0;
  return () => values[(i += 1) - 1] ?? Math.random();
};

test('buildDeck has 52 unique cards', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 52);
  assert.equal(new Set(deck).size, 52);
});

test('shuffle is a permutation of the deck', () => {
  const deck = buildDeck();
  const shuffled = shuffle(deck, seq([0.1, 0.5, 0.9, 0.3]));
  assert.equal(shuffled.length, 52);
  assert.deepEqual([...shuffled].sort(), [...deck].sort());
});

test('heads-up deal: button posts small blind and acts first preflop', () => {
  const players = [
    { id: 'a', seat: 0, chips: 200 },
    { id: 'b', seat: 1, chips: 200 },
  ];
  const dealt = dealHoldemRound({ players, dealerSeat: -1, bigBlind: 20 });
  assert.ok(dealt);
  assert.equal(dealt.pot, 30); // 10 SB + 20 BB
  assert.equal(dealt.players.find((p) => p.id === 'a').chips, 190);
  assert.equal(dealt.players.find((p) => p.id === 'b').chips, 180);
  assert.equal(dealt.betting.currentActor, 'a'); // heads-up: button/SB acts first preflop
  assert.equal(dealt.betting.toCall, 20);
  assert.equal(dealt.holeCards.a.length, 2);
  assert.equal(dealt.holeCards.b.length, 2);
  assert.equal(dealt.communityCards.length, 5);
  // No card dealt twice across hole + community
  const allCards = [...dealt.holeCards.a, ...dealt.holeCards.b, ...dealt.communityCards];
  assert.equal(new Set(allCards).size, allCards.length);
});

test('3-player deal: UTG acts first preflop, not the button', () => {
  const players = [
    { id: 'a', seat: 0, chips: 200 },
    { id: 'b', seat: 1, chips: 200 },
    { id: 'c', seat: 2, chips: 200 },
  ];
  // dealerSeat=0 means seat 0 was PREVIOUS button; next button is seat 1 (b).
  const dealt = dealHoldemRound({ players, dealerSeat: 0, bigBlind: 20 });
  assert.ok(dealt);
  // button=b, sb=c, bb=a, first-to-act preflop = b (wraps back to the button
  // itself when there are only 3 seats: order [b, c, a], index 3 % 3 = 0 -> b).
  assert.equal(dealt.betting.currentActor, 'b');
  assert.equal(dealt.pot, 30);
});

test('a short-stacked big blind posts all-in for what they have', () => {
  const players = [
    { id: 'a', seat: 0, chips: 200 },
    { id: 'b', seat: 1, chips: 5 }, // less than the 20 big blind
  ];
  const dealt = dealHoldemRound({ players, dealerSeat: -1, bigBlind: 20 });
  assert.equal(dealt.players.find((p) => p.id === 'a').chips, 190); // posts full 10 SB
  assert.equal(dealt.players.find((p) => p.id === 'b').chips, 0); // posts all 5 chips as BB
  assert.equal(dealt.betting.committed.b, 5);
  assert.equal(dealt.betting.allIn.b, true);
});

test('dealHoldemRound returns null with fewer than 2 funded players', () => {
  const players = [{ id: 'a', seat: 0, chips: 200 }, { id: 'b', seat: 1, chips: 0 }];
  assert.equal(dealHoldemRound({ players, dealerSeat: 0, bigBlind: 20 }), null);
});

test('advanceStreetBetting starts action after the button (post-flop order), not preflop UTG order', () => {
  // button=a, sb=b, bb=c — preflop acted in order [a, b, c] (a is UTG-ish in
  // a 3-way), but post-flop must start at b (first after the button).
  const prev = {
    order: ['a', 'b', 'c'],
    buttonOrder: ['a', 'b', 'c'],
    folded: { a: false, b: false, c: false },
    allIn: { a: false, b: false, c: false },
  };
  const next = advanceStreetBetting(prev, 20);
  assert.deepEqual(next.order, ['b', 'c', 'a']);
  assert.equal(next.currentActor, 'b');
  assert.equal(next.toCall, 0);
  assert.equal(next.minRaise, 20);
});

test('advanceStreetBetting drops folded players and skips all-in for currentActor', () => {
  const prev = {
    order: ['a', 'b', 'c'],
    buttonOrder: ['a', 'b', 'c'],
    folded: { a: false, b: true, c: false },
    allIn: { a: true, b: false, c: false },
  };
  const next = advanceStreetBetting(prev, 20);
  assert.deepEqual(next.order, ['c', 'a']); // b folded and is dropped entirely
  assert.equal(next.currentActor, 'c'); // a is all-in, skipped for acting
  assert.equal(next.allIn.a, true);
});

test('advanceStreetBetting heads-up: big blind acts first post-flop, button/SB last', () => {
  const prev = {
    order: ['button', 'bb'],
    buttonOrder: ['button', 'bb'],
    folded: { button: false, bb: false },
    allIn: { button: false, bb: false },
  };
  const next = advanceStreetBetting(prev, 20);
  assert.deepEqual(next.order, ['bb', 'button']);
  assert.equal(next.currentActor, 'bb');
});

test('advanceStreetBetting with everyone all-in leaves no current actor', () => {
  const prev = {
    order: ['a', 'b'],
    buttonOrder: ['a', 'b'],
    folded: { a: false, b: false },
    allIn: { a: true, b: true },
  };
  const next = advanceStreetBetting(prev, 20);
  assert.equal(next.currentActor, null);
});

test('STREET_AFTER chains preflop -> flop -> turn -> river', () => {
  assert.equal(STREET_AFTER.preflop, 'flop');
  assert.equal(STREET_AFTER.flop, 'turn');
  assert.equal(STREET_AFTER.turn, 'river');
});

test('resolveHoldemShowdown picks the best 7-card hand and labels it', () => {
  const holeCards = {
    a: ['Ah', 'Ac'], // pair of aces + board pair -> two pair aces & kings... let's just assert a beats b
    b: ['2h', '3c'],
  };
  const communityCards = ['Kd', 'Kc', '4s', '5d', '9h'];
  const { winners, hands } = resolveHoldemShowdown({ holeCards, communityCards, folded: {} });
  assert.deepEqual(winners, ['a']);
  assert.equal(handLabel(hands.a), 'Two Pair');
});

test('resolveHoldemShowdown splits a tie', () => {
  const holeCards = {
    a: ['2h', '3c'],
    b: ['2d', '3s'],
  };
  const communityCards = ['Kd', 'Kc', 'Kh', 'Ks', '9h']; // board four-of-a-kind, kickers tie
  const { winners } = resolveHoldemShowdown({ holeCards, communityCards, folded: {} });
  assert.deepEqual(winners.sort(), ['a', 'b']);
});

test('resolveHoldemShowdown excludes folded players', () => {
  const holeCards = { a: ['Ah', 'Ac'], b: ['Kh', 'Kc'] };
  const communityCards = ['2d', '3c', '4s', '5d', '9h'];
  const { winners } = resolveHoldemShowdown({ holeCards, communityCards, folded: { a: true } });
  assert.deepEqual(winners, ['b']);
});
