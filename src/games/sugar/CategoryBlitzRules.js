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
 * Score one Category Blitz round.
 * - An answer only counts if it's non-empty AND the partner approved it.
 * - Identical answers (case/whitespace-insensitive) between both players
 *   auto-cancel to zero points each, regardless of approval — dupes never score.
 */
export function computeScores({
  categories,
  answersOne = [],
  answersTwo = [],
  approvalsOne = [],
  approvalsTwo = [],
}) {
  const perCategory = categories.map((category, i) => {
    const answerOne = answersOne[i] ?? '';
    const answerTwo = answersTwo[i] ?? '';
    const normOne = normalizeAnswer(answerOne);
    const normTwo = normalizeAnswer(answerTwo);
    const isDupe = Boolean(normOne) && Boolean(normTwo) && normOne === normTwo;

    let scoreOne = 0;
    let scoreTwo = 0;
    if (!isDupe) {
      if (normOne && approvalsOne[i]) scoreOne = 1;
      if (normTwo && approvalsTwo[i]) scoreTwo = 1;
    }

    return { category, answerOne, answerTwo, isDupe, scoreOne, scoreTwo };
  });

  const scoreOne = perCategory.reduce((sum, c) => sum + c.scoreOne, 0);
  const scoreTwo = perCategory.reduce((sum, c) => sum + c.scoreTwo, 0);

  return { perCategory, scoreOne, scoreTwo };
}

export function resolveWinner(scoreOne, scoreTwo) {
  if (scoreOne > scoreTwo) return 1;
  if (scoreTwo > scoreOne) return 2;
  return null;
}
