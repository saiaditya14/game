// Pure Word Race game logic — no Supabase, no React.
import { answers, all } from './wordRaceWords.js';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

const ALL_WORDS = new Set(all);

export function normalizeWord(word) {
  return String(word ?? '').trim().toLowerCase();
}

export function pickSecretWord(rand = Math.random) {
  return answers[Math.floor(rand() * answers.length)];
}

export function isValidWord(word) {
  const w = normalizeWord(word);
  return w.length === WORD_LENGTH && ALL_WORDS.has(w);
}

// Standard Wordle color algorithm — handles duplicate letters correctly.
export function evaluateGuess(guess, secret) {
  const g = normalizeWord(guess).split('');
  const s = normalizeWord(secret).split('');
  const result = new Array(WORD_LENGTH).fill('absent');
  const remaining = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === s[i]) {
      result[i] = 'correct';
    } else {
      remaining[s[i]] = (remaining[s[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    if (remaining[g[i]] > 0) {
      result[i] = 'present';
      remaining[g[i]] -= 1;
    }
  }

  return result;
}

export function isSolvedRow(colors) {
  return Array.isArray(colors) && colors.every((c) => c === 'correct');
}

// A player is "done" once they solve, exhaust all guesses, or give up.
export function isPlayerDone({ progress, solved, gaveUp }) {
  return solved || gaveUp || (progress?.length ?? 0) >= MAX_GUESSES;
}

/**
 * Decide the winner once both players are done racing.
 * Fewer guesses wins; ties on guess count go to whoever finished first;
 * still tied (or neither solved) is a draw (returns null).
 */
export function resolveWinner({
  solvedOne, solvedTwo,
  progressOne = [], progressTwo = [],
  gaveUpOne = false, gaveUpTwo = false,
  finishedOneAt, finishedTwoAt,
}) {
  if (solvedOne && !solvedTwo) return 1;
  if (solvedTwo && !solvedOne) return 2;
  if (!solvedOne && !solvedTwo) return null;

  // Both solved — fewer guesses wins.
  if (progressOne.length !== progressTwo.length) {
    return progressOne.length < progressTwo.length ? 1 : 2;
  }

  // Same guess count — earlier finish timestamp wins.
  const t1 = finishedOneAt ? new Date(finishedOneAt).getTime() : Infinity;
  const t2 = finishedTwoAt ? new Date(finishedTwoAt).getTime() : Infinity;
  if (t1 !== t2) return t1 < t2 ? 1 : 2;

  return null;
}
