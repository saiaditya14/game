// Pure Category Blitz game logic — no Supabase, no React.
import { categories as CATEGORY_POOL } from './categoryBlitzCategories.js';

// Excludes Q, U, V, X, Y, Z — mirrors the classic Scattergories letter die,
// which drops the letters that make most categories nearly unplayable.
export const LETTER_POOL = 'ABCDEFGHIJKLMNOPRSTW'.split('');

export function pickRandomLetter(rand = Math.random) {
  return LETTER_POOL[Math.floor(rand() * LETTER_POOL.length)];
}

export function pickCategories(count, rand = Math.random) {
  const pool = [...CATEGORY_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export function normalizeAnswer(value) {
  return String(value ?? '').trim().toLowerCase();
}

/**
 * Tally votes for one Category Blitz round across N players.
 *
 * For each category, every player may cast ONE vote for another player's
 * (non-empty) answer in that category, or abstain (null). A player's score
 * is the total number of votes their answers RECEIVED across all categories.
 * There is no duplicate-cancellation — voting alone decides everything.
 *
 * Defensive rules (never trust the payload blindly — it's realtime-synced
 * client input): a self-vote is ignored, a vote for a nonexistent player is
 * ignored, and a vote that targets an empty answer is ignored.
 *
 * @param {{ players: {id:string,name:string}[], categories: string[],
 *   answers: Record<string,string[]>, votes: Record<string,(string|null)[]> }} args
 * @returns {{ scores: Record<string,number>,
 *   perCategory: { category: string, votesReceived: Record<string,number> }[] }}
 */
export function computeScores({ players = [], categories = [], answers = {}, votes = {} }) {
  const playerIds = players.map((p) => p.id);
  const scores = Object.fromEntries(playerIds.map((id) => [id, 0]));

  const perCategory = categories.map((category, i) => {
    const votesReceived = Object.fromEntries(playerIds.map((id) => [id, 0]));

    playerIds.forEach((voterId) => {
      const targetId = votes?.[voterId]?.[i];
      if (!targetId) return; // abstain
      if (targetId === voterId) return; // self-vote — ignored
      if (!playerIds.includes(targetId)) return; // unknown player — ignored

      const targetAnswer = answers?.[targetId]?.[i];
      if (!normalizeAnswer(targetAnswer)) return; // vote for an empty answer — ignored

      votesReceived[targetId] += 1;
      scores[targetId] += 1;
    });

    return { category, votesReceived };
  });

  return { scores, perCategory };
}

/**
 * Winner = the player with the strictly highest score. Returns null when the
 * top score is shared by more than one player (a tie) or when there are no
 * players/scores at all.
 */
export function resolveWinner(scores = {}) {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;

  const max = Math.max(...entries.map(([, v]) => v));
  const top = entries.filter(([, v]) => v === max);
  if (top.length !== 1) return null;
  return top[0][0];
}
