// Pure Indian Poker round logic — no Supabase, no React.
// Everyone sees everyone else's card except their own; each round every
// dealt-in player independently decides 'stay' (pay the ante into the pot)
// or 'fold' (forfeit, no further payment). Once all decisions are in,
// whoever stayed with the highest card takes the pot (ties split it).

export function dealHands(playerIds = [], rand = Math.random) {
  const hands = {};
  playerIds.forEach((id) => { hands[id] = Math.floor(rand() * 13) + 2; }); // 2..14
  return hands;
}

export function canAffordAnte(player, ante) {
  return (player?.chips ?? 0) >= ante;
}

export function isRoundComplete(hands = {}, decisions = {}) {
  const ids = Object.keys(hands);
  return ids.length > 0 && ids.every((id) => decisions[id] === 'stay' || decisions[id] === 'fold');
}

/**
 * Resolve a completed round: highest card among everyone who stayed wins the
 * pot (split evenly across ties, remainder to the first winner by hands-key
 * insertion order for determinism). If everyone folded, there are no
 * winners and the pot is returned untouched by the caller (the RPC that
 * applies payouts is a no-op for an empty payouts map).
 */
export function resolveRound({ hands = {}, decisions = {}, pot = 0 }) {
  const stayers = Object.keys(hands).filter((id) => decisions[id] === 'stay');
  if (stayers.length === 0) return { winners: [], payouts: {} };

  const maxRank = Math.max(...stayers.map((id) => hands[id]));
  const winners = stayers.filter((id) => hands[id] === maxRank);

  const share = Math.floor(pot / winners.length);
  const remainder = pot - share * winners.length;
  const payouts = {};
  winners.forEach((id, i) => { payouts[id] = share + (i === 0 ? remainder : 0); });

  return { winners, payouts };
}

/**
 * Whole-table game over: true once at most one seated player still has
 * chips to play with (the others are busted at 0).
 */
export function checkTableGameOver(players = []) {
  const stillIn = players.filter((p) => (p.chips ?? 0) > 0);
  if (stillIn.length <= 1) return { gameOver: true, winnerId: stillIn[0]?.id ?? null };
  return { gameOver: false, winnerId: null };
}
