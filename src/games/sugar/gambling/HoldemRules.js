// Pure Heads-up/N-player Texas Hold'em helpers — dealing, blinds, and
// showdown resolution. Betting itself is delegated entirely to the shared
// `BettingRound.js` engine (unchanged, per the Part 3 brief); this module
// only adds hole/community cards and blind-posting on top of it.
//
// Hand ranking is vendored via `pokersolver` (goldfire/pokersolver, MIT) —
// never hand-rolled, per the gameplan's sourcing note.
import pokersolverPkg from 'pokersolver';
import { createBettingRound } from './BettingRound.js';

const { Hand } = pokersolverPkg;

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['h', 'd', 'c', 's'];

export function buildDeck() {
  const deck = [];
  RANKS.forEach((r) => SUITS.forEach((s) => deck.push(r + s)));
  return deck;
}

export function shuffle(deck, rand = Math.random) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Rotates `ids` so `startId` is first, preserving relative order — used for
// both blind assignment (relative to the button) and first-to-act order on
// each street.
function rotateTo(ids, startId) {
  const idx = ids.indexOf(startId);
  if (idx <= 0) return [...ids];
  return [...ids.slice(idx), ...ids.slice(0, idx)];
}

/**
 * Deals a fresh hand: posts blinds, deals 2 hole cards per dealt-in player
 * and reserves 5 community cards (no burn cards — a documented simplification
 * like Dice Poker's single-main-pot rule, since nothing here needs to defend
 * against a physical dealer). `dealerSeat` is the PREVIOUS hand's dealer
 * seat; the button moves to the first dealt-in player with a higher seat
 * (wrapping), same rotation Dice Poker already uses for `dealer_seat`.
 *
 * Returns null if fewer than 2 players have chips.
 */
export function dealHoldemRound({ players, dealerSeat = 0, bigBlind = 20, rand = Math.random }) {
  const dealtIn = players.filter((p) => p.chips > 0).sort((a, b) => a.seat - b.seat);
  if (dealtIn.length < 2) return null;

  let startIdx = dealtIn.findIndex((p) => p.seat > dealerSeat);
  if (startIdx === -1) startIdx = 0;
  const seatOrder = [...dealtIn.slice(startIdx), ...dealtIn.slice(0, startIdx)]; // button first
  const ids = seatOrder.map((p) => p.id);
  const headsUp = ids.length === 2;
  const smallBlind = Math.max(1, Math.floor(bigBlind / 2));

  const sbId = headsUp ? ids[0] : ids[1];
  const bbId = headsUp ? ids[1] : ids[2];
  const preflopFirstActor = headsUp ? ids[0] : ids[3 % ids.length];

  const chipsById = {};
  seatOrder.forEach((p) => { chipsById[p.id] = p.chips; });

  const sbPaid = Math.min(smallBlind, chipsById[sbId]);
  const bbPaid = Math.min(bigBlind, chipsById[bbId]);
  chipsById[sbId] -= sbPaid;
  chipsById[bbId] -= bbPaid;

  const newPlayers = players.map((p) => (
    p.id in chipsById ? { ...p, chips: chipsById[p.id] } : p
  ));

  const deck = shuffle(buildDeck(), rand);
  const holeCards = {};
  ids.forEach((id) => { holeCards[id] = []; });
  for (let round = 0; round < 2; round += 1) {
    ids.forEach((id) => { holeCards[id].push(deck.pop()); });
  }
  const communityCards = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];

  const preflopOrder = rotateTo(ids, preflopFirstActor);
  const betting = {
    ...createBettingRound({ order: preflopOrder, minBet: bigBlind }),
    committed: ids.reduce((acc, id) => {
      acc[id] = id === sbId ? sbPaid : id === bbId ? bbPaid : 0;
      return acc;
    }, {}),
    allIn: ids.reduce((acc, id) => {
      acc[id] = (id === sbId && chipsById[sbId] <= 0) || (id === bbId && chipsById[bbId] <= 0);
      return acc;
    }, {}),
    toCall: bbPaid,
    minRaise: bigBlind,
    // Carried along (not used by BettingRound.js itself) so
    // advanceStreetBetting can rotate POST-flop action to start after the
    // button, independent of preflop's UTG-first order.
    buttonOrder: ids,
  };

  const nextDealerSeat = seatOrder[1]?.seat ?? seatOrder[0].seat;

  return {
    players: newPlayers,
    holeCards,
    communityCards,
    betting,
    pot: sbPaid + bbPaid,
    dealerSeat: nextDealerSeat,
    smallBlind,
    bigBlind,
  };
}

/**
 * Builds the fresh betting round for the next street. Folded players are
 * dropped from `order` entirely (they're out for the rest of the hand);
 * all-in players stay in `order` (still contend for the pot at showdown) but
 * are excluded from `currentActor` selection — mirrors how a real table
 * "runs out" the board once everyone left is all-in.
 */
export function advanceStreetBetting(prevBetting, minBet) {
  const buttonOrder = prevBetting.buttonOrder ?? prevBetting.order;
  // Rotate to start right after the button (standard post-flop action order —
  // NOT preflop's UTG-first order, which `prevBetting.order` still reflects
  // for the just-closed street).
  const postButtonOrder = buttonOrder.length > 1 ? rotateTo(buttonOrder, buttonOrder[1]) : buttonOrder;
  const order = postButtonOrder.filter((id) => !prevBetting.folded[id]);
  const eligible = order.filter((id) => !prevBetting.allIn[id]);
  const committed = {};
  const acted = {};
  const folded = {};
  const allIn = {};
  order.forEach((id) => {
    committed[id] = 0;
    acted[id] = false;
    folded[id] = false;
    allIn[id] = Boolean(prevBetting.allIn[id]);
  });
  return {
    order,
    currentActor: eligible[0] ?? null,
    toCall: 0,
    minRaise: minBet,
    committed,
    acted,
    folded,
    allIn,
    buttonOrder,
  };
}

export const STREET_AFTER = { preflop: 'flop', flop: 'turn', turn: 'river' };

// Best 7-card (2 hole + 5 community) hand among non-folded players; ties
// split the pot. Mirrors DicePokerRules.resolveShowdown's shape.
export function resolveHoldemShowdown({ holeCards = {}, communityCards = [], folded = {} }) {
  const contenders = Object.keys(holeCards).filter((id) => !folded[id]);
  if (contenders.length === 0) return { winners: [], hands: {} };

  const hands = {};
  contenders.forEach((id) => {
    const solved = Hand.solve([...holeCards[id], ...communityCards]);
    solved.playerId = id;
    hands[id] = solved;
  });

  const winningHands = Hand.winners(contenders.map((id) => hands[id]));
  const winners = winningHands.map((h) => h.playerId);
  return { winners, hands };
}

export function handLabel(hand) {
  return hand?.name ?? 'High Card';
}
