// Pure turn-based betting engine — shared by Dice Poker and (later) Hold'em.
// No Supabase, no React. Operates on a small serializable "round" object;
// callers own dealing, hand evaluation, and chip stacks (a stack is passed
// into each call, not stored here, so the engine never touches `players`).
//
// Simplification: single main pot only, no side pots. An all-in player who
// is later out-called by a bigger stack still contends for the whole pot at
// showdown — a known simplification for 2-8 player couples games, not a
// tournament-grade side-pot implementation.

export function createBettingRound({ order = [], minBet = 1 }) {
  const committed = {};
  const acted = {};
  const folded = {};
  const allIn = {};
  order.forEach((id) => {
    committed[id] = 0;
    acted[id] = false;
    folded[id] = false;
    allIn[id] = false;
  });
  return {
    order: [...order],
    currentActor: order[0] ?? null,
    toCall: 0,
    minRaise: minBet,
    committed,
    acted,
    folded,
    allIn,
  };
}

const isEligible = (round, id) => !round.folded[id] && !round.allIn[id];

function nextActorAfter(round, id) {
  const idx = round.order.indexOf(id);
  for (let step = 1; step <= round.order.length; step += 1) {
    const candidate = round.order[(idx + step) % round.order.length];
    if (isEligible(round, candidate)) return candidate;
  }
  return null;
}

export function remainingContenders(round) {
  return round.order.filter((id) => !round.folded[id]);
}

// A round closes once at most one contender remains, or every contender
// still eligible to act has matched the current bet and acted since the
// last raise (everyone else is folded or all-in along for the ride).
export function isRoundClosed(round) {
  const contenders = remainingContenders(round);
  if (contenders.length <= 1) return true;
  const stillToAct = contenders.filter((id) => isEligible(round, id));
  if (stillToAct.length === 0) return true;
  return stillToAct.every((id) => round.acted[id] && round.committed[id] === round.toCall);
}

export function potContribution(round) {
  return Object.values(round.committed).reduce((sum, v) => sum + v, 0);
}

/**
 * Apply one player's action. `stack` is that player's chips available to bet
 * this round (net of anything already committed earlier this hand). Returns
 * `{ round, stack, error }` — on an illegal action the original round/stack
 * are returned unchanged and `error` is a short code string.
 */
export function applyAction(round, playerId, action, amount = 0, stack = 0) {
  if (round.currentActor !== playerId) {
    return { round, stack, error: 'NOT_YOUR_TURN' };
  }
  if (!isEligible(round, playerId)) {
    return { round, stack, error: 'CANNOT_ACT' };
  }

  const next = {
    ...round,
    committed: { ...round.committed },
    acted: { ...round.acted },
    folded: { ...round.folded },
    allIn: { ...round.allIn },
  };
  let nextStack = stack;
  const need = round.toCall - round.committed[playerId];

  const reopenActionFor = (actorId) => {
    round.order.forEach((id) => { if (id !== actorId) next.acted[id] = false; });
  };

  if (action === 'fold') {
    next.folded[playerId] = true;
  } else if (action === 'check') {
    if (need > 0) return { round, stack, error: 'CANNOT_CHECK' };
    next.acted[playerId] = true;
  } else if (action === 'call') {
    if (need <= 0) return { round, stack, error: 'NOTHING_TO_CALL' };
    const pay = Math.min(need, stack);
    next.committed[playerId] += pay;
    nextStack -= pay;
    if (nextStack <= 0) next.allIn[playerId] = true;
    next.acted[playerId] = true;
  } else if (action === 'bet') {
    if (round.toCall > 0) return { round, stack, error: 'ALREADY_BET' };
    if (amount <= 0 || amount > stack) return { round, stack, error: 'INVALID_AMOUNT' };
    if (amount < round.minRaise && amount < stack) return { round, stack, error: 'BELOW_MIN_BET' };
    next.committed[playerId] += amount;
    nextStack -= amount;
    next.toCall = next.committed[playerId];
    next.minRaise = amount;
    reopenActionFor(playerId);
    next.acted[playerId] = true;
    if (nextStack <= 0) next.allIn[playerId] = true;
  } else if (action === 'raise') {
    if (round.toCall <= 0) return { round, stack, error: 'NOTHING_TO_RAISE' };
    if (amount <= 0 || need + amount > stack) return { round, stack, error: 'INVALID_AMOUNT' };
    if (amount < round.minRaise && need + amount < stack) return { round, stack, error: 'BELOW_MIN_RAISE' };
    next.committed[playerId] += need + amount;
    nextStack -= need + amount;
    next.toCall = next.committed[playerId];
    next.minRaise = amount;
    reopenActionFor(playerId);
    next.acted[playerId] = true;
    if (nextStack <= 0) next.allIn[playerId] = true;
  } else if (action === 'all-in') {
    if (stack <= 0) return { round, stack, error: 'NO_CHIPS' };
    const raiseAmount = round.committed[playerId] + stack - round.toCall;
    next.committed[playerId] += stack;
    nextStack = 0;
    next.allIn[playerId] = true;
    if (next.committed[playerId] > round.toCall) {
      next.toCall = next.committed[playerId];
      if (raiseAmount > 0) next.minRaise = Math.max(next.minRaise, raiseAmount);
      reopenActionFor(playerId);
    }
    next.acted[playerId] = true;
  } else {
    return { round, stack, error: 'UNKNOWN_ACTION' };
  }

  next.currentActor = isRoundClosed(next) ? null : nextActorAfter(next, playerId);
  return { round: next, stack: nextStack, error: null };
}
