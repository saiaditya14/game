// Pure 5-dice poker hand evaluator/comparator + dealing helpers.
// No Supabase, no React.

const CATEGORY = {
  FIVE_KIND: 8,
  FOUR_KIND: 7,
  FULL_HOUSE: 6,
  STRAIGHT: 5,
  THREE_KIND: 4,
  TWO_PAIR: 3,
  ONE_PAIR: 2,
  HIGH: 1,
};

const CATEGORY_LABEL = {
  [CATEGORY.FIVE_KIND]: 'Five of a Kind',
  [CATEGORY.FOUR_KIND]: 'Four of a Kind',
  [CATEGORY.FULL_HOUSE]: 'Full House',
  [CATEGORY.STRAIGHT]: 'Straight',
  [CATEGORY.THREE_KIND]: 'Three of a Kind',
  [CATEGORY.TWO_PAIR]: 'Two Pair',
  [CATEGORY.ONE_PAIR]: 'One Pair',
  [CATEGORY.HIGH]: 'High Die',
};

export function rollDice(count = 5, rand = Math.random) {
  return Array.from({ length: count }, () => Math.floor(rand() * 6) + 1);
}

// `keepMask[i] === true` keeps `dice[i]`; everything else is rerolled.
export function rerollDice(dice, keepMask, rand = Math.random) {
  return dice.map((v, i) => (keepMask[i] ? v : Math.floor(rand() * 6) + 1));
}

export function dealDice(playerIds = [], rand = Math.random) {
  const dice = {};
  playerIds.forEach((id) => { dice[id] = rollDice(5, rand); });
  return dice;
}

function countsOf(dice) {
  const counts = {};
  dice.forEach((v) => { counts[v] = (counts[v] ?? 0) + 1; });
  return counts;
}

export function evaluateHand(dice) {
  const counts = countsOf(dice);
  const values = Object.keys(counts).map(Number);
  // Sorted by count desc, then face value desc — this ordering already
  // doubles as the tiebreak array for every non-straight category (e.g.
  // full house [3,3,3,2,2] sorts to counts [3,2] over values [3,2]).
  const sortedValues = values.slice().sort((a, b) => (counts[b] - counts[a]) || (b - a));
  const countList = sortedValues.map((v) => counts[v]);
  const ascending = [...dice].sort((a, b) => a - b);
  const isStraight =
    values.length === 5 &&
    (ascending.join(',') === '1,2,3,4,5' || ascending.join(',') === '2,3,4,5,6');

  let category;
  if (countList[0] === 5) category = CATEGORY.FIVE_KIND;
  else if (countList[0] === 4) category = CATEGORY.FOUR_KIND;
  else if (countList[0] === 3 && countList[1] === 2) category = CATEGORY.FULL_HOUSE;
  else if (isStraight) category = CATEGORY.STRAIGHT;
  else if (countList[0] === 3) category = CATEGORY.THREE_KIND;
  else if (countList[0] === 2 && countList[1] === 2) category = CATEGORY.TWO_PAIR;
  else if (countList[0] === 2) category = CATEGORY.ONE_PAIR;
  else category = CATEGORY.HIGH;

  // A 6-high straight beats a 1-5 straight; every other category is already
  // ordered correctly by `sortedValues`.
  const tiebreak = category === CATEGORY.STRAIGHT ? [ascending[4]] : sortedValues;

  return { category, tiebreak, dice: [...dice] };
}

export function compareHands(a, b) {
  if (a.category !== b.category) return a.category - b.category;
  const len = Math.max(a.tiebreak.length, b.tiebreak.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function rankHandLabel(handOrCategory) {
  const category = typeof handOrCategory === 'number' ? handOrCategory : handOrCategory.category;
  return CATEGORY_LABEL[category] ?? 'High Die';
}

// Best hand among non-folded players; ties split the pot.
export function resolveShowdown({ dice = {}, folded = {} }) {
  const contenders = Object.keys(dice).filter((id) => !folded[id]);
  if (contenders.length === 0) return { winners: [], hands: {} };

  const hands = {};
  contenders.forEach((id) => { hands[id] = evaluateHand(dice[id]); });

  let best = hands[contenders[0]];
  contenders.forEach((id) => {
    if (compareHands(hands[id], best) > 0) best = hands[id];
  });
  const winners = contenders.filter((id) => compareHands(hands[id], best) === 0);
  return { winners, hands };
}

// Even split, remainder to the first winner by array order (same
// determinism convention as IndianPokerRules.resolveRound).
export function splitPot(pot, winners) {
  if (winners.length === 0) return {};
  const share = Math.floor(pot / winners.length);
  const remainder = pot - share * winners.length;
  const payouts = {};
  winners.forEach((id, i) => { payouts[id] = share + (i === 0 ? remainder : 0); });
  return payouts;
}

export function checkTableGameOver({ players = [], endMode = 'bust', handCap = 0, handsPlayed = 0 }) {
  const stillIn = players.filter((p) => (p.chips ?? 0) > 0);
  if (stillIn.length <= 1) {
    return { gameOver: true, winnerIds: stillIn.length ? [stillIn[0].id] : [] };
  }
  if (endMode === 'hands' && handsPlayed >= handCap) {
    const maxChips = Math.max(...stillIn.map((p) => p.chips));
    return { gameOver: true, winnerIds: stillIn.filter((p) => p.chips === maxChips).map((p) => p.id) };
  }
  return { gameOver: false, winnerIds: [] };
}
