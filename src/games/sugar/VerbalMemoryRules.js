// Pure Verbal Memory Duel game logic — no Supabase, no React.
// Both players derive an identical 250-word sequence from the shared room
// seed (mulberry32 PRNG, same approach as QuickMathsRules.js), then judge
// their own SEEN/NEW answers against it independently and at their own pace.
import { words as WORD_POOL } from './verbalMemoryWords.js';

export const SEQUENCE_LENGTH = 250;
export const STARTING_LIVES = 3;

// Words shown before repeats can start appearing — the opening stretch of
// the real test is always fresh words, since there's nothing to recall yet.
const WARMUP_WORDS = 4;
// Chance any post-warmup word is a repeat of one already shown, rather than
// a brand-new pool word. A flat probability is a documented simplification —
// the real test's pacing curve isn't reproduced here.
const REPEAT_CHANCE = 0.35;

function mulberry32(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed() {
  return (Math.random() * 0xFFFFFFFF) >>> 0;
}

/**
 * Deterministic word stream for one room. Same seed -> same sequence on
 * both clients, no server round-trip. Each entry's `isRepeat` is the
 * ground-truth answer: true if `word` already appeared earlier in this
 * same sequence, false if this is its first appearance.
 */
export function generateWordSequence(seed, length = SEQUENCE_LENGTH, pool = WORD_POOL) {
  const rand = mulberry32(seed);
  const int = (max) => Math.floor(rand() * max);

  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = int(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const sequence = [];
  const shown = [];
  let poolIndex = 0;

  for (let i = 0; i < length; i++) {
    const poolExhausted = poolIndex >= shuffled.length;
    const pastWarmup = shown.length >= WARMUP_WORDS;
    const shouldRepeat = shown.length > 0 && (poolExhausted || (pastWarmup && rand() < REPEAT_CHANCE));

    let word;
    let isRepeat;
    if (shouldRepeat) {
      word = shown[int(shown.length)];
      isRepeat = true;
    } else {
      word = shuffled[poolIndex];
      poolIndex += 1;
      isRepeat = false;
      shown.push(word);
    }
    sequence.push({ index: i, word, isRepeat });
  }

  return sequence;
}

export function judgeAnswer(answer, isRepeat) {
  return (answer === 'seen') === isRepeat;
}

export function isPlayerDone({ lives }) {
  return lives <= 0;
}

/**
 * Apply one answer to a player's running state. Returns the next
 * { lives, score, mistakes } plus whether this particular answer was correct.
 * On a mistake, records { index, word, correctAnswer, playerAnswered } —
 * everything the end-of-match reveal needs to show "how each point was lost."
 */
export function applyAnswer({ lives, score, mistakes }, entry, answer) {
  const { index, word, isRepeat } = entry;
  const correct = judgeAnswer(answer, isRepeat);
  if (correct) {
    return { lives, score: score + 1, mistakes, correct: true };
  }
  const mistake = {
    index,
    word,
    correctAnswer: isRepeat ? 'seen' : 'new',
    playerAnswered: answer,
  };
  return { lives: lives - 1, score, mistakes: [...mistakes, mistake], correct: false };
}

/**
 * Winner once both players are done (out of lives). Higher score wins;
 * an exact tie is a draw (returns null).
 */
export function resolveWinner({ scoreOne, scoreTwo }) {
  if (scoreOne === scoreTwo) return null;
  return scoreOne > scoreTwo ? 1 : 2;
}
