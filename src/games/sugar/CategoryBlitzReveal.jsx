import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Copy, Trophy, RotateCcw } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { computeScores } from './CategoryBlitzRules';

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    reviewTitle: 'judge their answers~ ♡',
    reviewHint:  "tap thumbs up if it's fair, thumbs down if it's not",
    yourAnswer:  'you wrote',
    theirAnswer: 'they wrote',
    dupe:        'same answer — no points either way',
    confirm:     'confirm my reviews ♡',
    waitingThem: 'waiting for them to finish reviewing…',
    youWin:      'you won!! ♡',
    theyWin:     'they won this one :(',
    draw:        "it's a tie~",
    playAgain:   'play again ♡',
    exit:        'exit game',
    empty:       '(blank)',
  },
  'theme-arcade': {
    reviewTitle: 'JUDGE THEIR ANSWERS',
    reviewHint:  'THUMBS UP IF FAIR, THUMBS DOWN IF NOT',
    yourAnswer:  'YOU WROTE',
    theirAnswer: 'THEY WROTE',
    dupe:        'IDENTICAL — NO POINTS EITHER WAY',
    confirm:     'CONFIRM MY REVIEWS',
    waitingThem: 'WAITING FOR THEM TO FINISH REVIEWING…',
    youWin:      'YOU WIN!',
    theyWin:     'THEY WON THIS ROUND',
    draw:        'DRAW!',
    playAgain:   'PLAY AGAIN',
    exit:        'EXIT',
    empty:       '(BLANK)',
  },
  'theme-cozy': {
    reviewTitle: 'judge their answers',
    reviewHint:  "thumbs up if it's fair, thumbs down if not",
    yourAnswer:  'you wrote',
    theirAnswer: 'they wrote',
    dupe:        'same answer — no points either way',
    confirm:     'confirm my reviews',
    waitingThem: 'waiting for them to finish reviewing…',
    youWin:      'you won ✨',
    theyWin:     'they won this one',
    draw:        'a draw~',
    playAgain:   'play again',
    exit:        'exit game',
    empty:       '(blank)',
  },
  'theme-champagne': {
    reviewTitle: 'Judge their answers',
    reviewHint:  "Thumbs up if it's fair, thumbs down if not.",
    yourAnswer:  'You wrote',
    theirAnswer: 'They wrote',
    dupe:        'Identical answer — no points either way',
    confirm:     'Confirm my reviews',
    waitingThem: 'Waiting for them to finish reviewing…',
    youWin:      'You win!',
    theyWin:     'They won this round',
    draw:        'Draw',
    playAgain:   'Play again',
    exit:        'Exit game',
    empty:       '(blank)',
  },
};

// Functional status colors: fixed for approve/reject so verdicts read
// identically everywhere; a per-theme tint for the neutral "duplicate" state
// (same pattern as ABSENT_BY_THEME in WordRaceBoard.jsx).
const APPROVE_COLOR = '#16a34a';
const APPROVE_GLOW   = '#00e676';
const REJECT_COLOR  = '#dc2626';
const REJECT_GLOW    = '#ff3b5c';
const DUPE_BY_THEME = {
  'theme-pink':      '#8a5b68',
  'theme-champagne': '#8a7350',
  'theme-arcade':    '#0d0d10',
  'theme-cozy':      '#5c4630',
};

const rowContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const CategoryBlitzReveal = ({
  room,
  playerNumber,
  onConfirmReview,
  onPlayAgain,
  onExit,
}) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const categories = room?.categories ?? [];
  const isOne = playerNumber === 1;

  // I judge the OTHER player's answers, writing into "their" approvals column.
  const partnerAnswers  = isOne ? room?.answers_two   : room?.answers_one;
  const myApprovals     = isOne ? room?.approvals_two : room?.approvals_one;
  const myReviewDone    = isOne ? room?.review_one_done : room?.review_two_done;
  const partnerReviewDone = isOne ? room?.review_two_done : room?.review_one_done;
  const myOwnAnswers    = isOne ? room?.answers_one   : room?.answers_two;

  const [confirmed, setConfirmed] = useState(Boolean(myReviewDone));

  // Track my verdicts LOCALLY and commit them in one atomic write at confirm.
  // Writing each toggle straight to the DB raced: every write overwrote the
  // whole approvals array from a stale realtime snapshot, so rapid clicks lost
  // all but the last verdict and scores collapsed toward ~1 each. (Caught by E2E.)
  const [verdicts, setVerdicts] = useState(() =>
    (Array.isArray(myApprovals) && myApprovals.length === categories.length)
      ? [...myApprovals]
      : categories.map(() => null),
  );
  const setVerdict = (index, value) =>
    setVerdicts((prev) => { const next = [...prev]; next[index] = value; return next; });

  const isOver = room?.status === 'finished';

  const results = useMemo(() => {
    if (!isOver) return null;
    return computeScores({
      categories,
      answersOne: room?.answers_one ?? [],
      answersTwo: room?.answers_two ?? [],
      approvalsOne: room?.approvals_one ?? [],
      approvalsTwo: room?.approvals_two ?? [],
    });
  }, [isOver, categories, room?.answers_one, room?.answers_two, room?.approvals_one, room?.approvals_two]);

  const scoreOne = isOver ? (room?.score_one ?? results?.scoreOne ?? 0) : null;
  const scoreTwo = isOver ? (room?.score_two ?? results?.scoreTwo ?? 0) : null;
  const myScore  = isOver ? (isOne ? scoreOne : scoreTwo) : null;
  const theirScore = isOver ? (isOne ? scoreTwo : scoreOne) : null;
  const didIWin = isOver && room?.winner === playerNumber;
  const didTheyWin = isOver && room?.winner !== null && room?.winner !== playerNumber;
  const isDraw = isOver && room?.winner === null;

  const confirmReview = () => {
    setConfirmed(true);
    onConfirmReview(verdicts);
  };

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[42rem] flex-col px-[1rem] py-[1.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {!isOver && (
        <>
          <header className="text-center">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
              {copy.reviewTitle}
            </p>
            <p className="mt-[0.375rem] text-sm" style={{ color: 'var(--muted)' }}>
              {copy.reviewHint}
            </p>
          </header>

          <motion.section
            className="mt-[1.5rem] flex flex-1 flex-col gap-[0.75rem] border p-[1rem]"
            style={{
              borderRadius: 'var(--radius)',
              borderColor: 'var(--divider)',
              background: isArcade ? 'rgba(4,4,4,0.97)' : 'var(--surface)',
              boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 32px rgba(0,255,255,0.06)' : 'var(--shadow)',
            }}
            variants={rowContainerVariants}
            initial="hidden"
            animate="show"
          >
            {categories.map((category, i) => {
              const mine = myOwnAnswers?.[i] ?? '';
              const theirs = partnerAnswers?.[i] ?? '';
              const normMine = String(mine).trim().toLowerCase();
              const normTheirs = String(theirs).trim().toLowerCase();
              const isDupe = Boolean(normMine) && Boolean(normTheirs) && normMine === normTheirs;
              const verdict = verdicts[i];
              const canJudge = Boolean(normTheirs) && !isDupe && !confirmed;

              return (
                <motion.div
                  key={category}
                  className="flex flex-col gap-[0.5rem] border-b pb-[0.75rem] last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: 'var(--divider)' }}
                  variants={rowVariants}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
                      {category}
                    </p>
                    <p className="mt-[0.15rem] text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                      {copy.yourAnswer}: <strong>{mine || copy.empty}</strong>
                    </p>
                    <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                      {copy.theirAnswer}: {theirs || copy.empty}
                    </p>
                  </div>

                  {isDupe ? (
                    <span
                      className="inline-flex shrink-0 items-center gap-[0.3rem] px-[0.625rem] py-[0.3rem] text-[0.62rem] font-bold uppercase tracking-[0.08em]"
                      style={{
                        borderRadius: 'var(--radius)',
                        background: DUPE_BY_THEME[theme] ?? DUPE_BY_THEME['theme-champagne'],
                        color: '#ffffff',
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      {copy.dupe}
                    </span>
                  ) : (
                    <div className="flex shrink-0 gap-[0.4rem]">
                      <motion.button
                        type="button"
                        disabled={!canJudge}
                        onClick={() => setVerdict(i, true)}
                        className="grid h-[2.25rem] w-[2.25rem] place-items-center border transition disabled:cursor-not-allowed"
                        style={{
                          borderRadius: 'var(--radius)',
                          borderColor: verdict === true ? APPROVE_COLOR : 'var(--divider)',
                          background: verdict === true ? APPROVE_COLOR : 'transparent',
                          color: verdict === true ? '#ffffff' : 'var(--muted)',
                          boxShadow: isArcade && verdict === true ? `0 0 10px ${APPROVE_GLOW}` : undefined,
                          opacity: !normTheirs ? 0.4 : 1,
                        }}
                        whileHover={canJudge ? { scale: 1.1 } : {}}
                        whileTap={canJudge ? { scale: 0.9 } : {}}
                        aria-label="Approve answer"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        disabled={!canJudge}
                        onClick={() => setVerdict(i, false)}
                        className="grid h-[2.25rem] w-[2.25rem] place-items-center border transition disabled:cursor-not-allowed"
                        style={{
                          borderRadius: 'var(--radius)',
                          borderColor: verdict === false ? REJECT_COLOR : 'var(--divider)',
                          background: verdict === false ? REJECT_COLOR : 'transparent',
                          color: verdict === false ? '#ffffff' : 'var(--muted)',
                          boxShadow: isArcade && verdict === false ? `0 0 10px ${REJECT_GLOW}` : undefined,
                          opacity: !normTheirs ? 0.4 : 1,
                        }}
                        whileHover={canJudge ? { scale: 1.1 } : {}}
                        whileTap={canJudge ? { scale: 0.9 } : {}}
                        aria-label="Reject answer"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.section>

          <footer className="mt-[1.25rem]">
            <AnimatePresence mode="wait">
              {!confirmed ? (
                <motion.button
                  key="confirm"
                  type="button"
                  onClick={confirmReview}
                  className="inline-flex min-h-[2.75rem] w-full items-center justify-center gap-[0.5rem] px-[1.5rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    background: 'var(--primary)',
                    color: isArcade ? '#000' : 'var(--surface)',
                    boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)',
                  }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {copy.confirm}
                </motion.button>
              ) : (
                <motion.p
                  key="waiting"
                  className="text-center text-sm"
                  style={{ color: 'var(--muted)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.2 }}
                >
                  {partnerReviewDone ? '' : copy.waitingThem}
                </motion.p>
              )}
            </AnimatePresence>
          </footer>
        </>
      )}

      {/* ── Final results overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem', background: 'color-mix(in srgb, var(--background) 72%, transparent)', backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                width: '100%', maxWidth: '28rem', maxHeight: '86vh', overflowY: 'auto', padding: '2rem', textAlign: 'center',
                border: '1px solid var(--ring)', borderRadius: 'var(--radius)', background: 'var(--surface)',
                boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 40px rgba(0,255,255,0.12), 0 0 80px rgba(255,0,255,0.08)' : 'var(--shadow)',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                style={{
                  display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', borderRadius: '50%', margin: '0 auto 1rem',
                  background: didIWin ? 'var(--primary)' : 'var(--surface-strong)',
                  boxShadow: isArcade && didIWin ? '0 0 20px var(--primary), 0 0 40px rgba(255,0,255,0.5)' : undefined,
                }}
                initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              >
                <Trophy style={{ width: '2rem', height: '2rem', color: didIWin ? (isArcade ? '#000' : 'var(--surface)') : 'var(--muted)' }} />
              </motion.div>

              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
                {didIWin ? 'winner' : isDraw ? 'draw' : 'game over'}
              </p>

              <h2
                className="mt-[0.375rem] font-serif text-3xl font-medium"
                style={{ color: 'var(--foreground)', ...(isArcade && didIWin ? { textShadow: '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.5)' } : {}) }}
              >
                {didIWin ? copy.youWin : didTheyWin ? copy.theyWin : copy.draw}
              </h2>

              <div
                className="mt-[1.25rem] flex items-center justify-center gap-[1.5rem] border px-[1.5rem] py-[1rem]"
                style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)' }}
              >
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>you</p>
                  <p className="mt-[0.15rem] text-2xl font-black" style={{ color: 'var(--primary)' }}>{myScore}</p>
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--divider)' }} />
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>them</p>
                  <p className="mt-[0.15rem] text-2xl font-black" style={{ color: 'var(--foreground)' }}>{theirScore}</p>
                </div>
              </div>

              <div className="mt-[1.25rem] flex flex-col gap-[0.4rem] text-left">
                {results?.perCategory?.map((row) => (
                  <div
                    key={row.category}
                    className="flex items-center justify-between gap-[0.5rem] border-b px-[0.25rem] py-[0.35rem] text-xs"
                    style={{ borderColor: 'var(--divider)' }}
                  >
                    <span style={{ color: 'var(--muted)' }} className="truncate">{row.category}</span>
                    <span className="shrink-0 font-bold" style={{ color: 'var(--foreground)' }}>
                      {row.scoreOne + row.scoreTwo === 0 && (row.answerOne || row.answerTwo) ? '0 pts' : `+${row.scoreOne + row.scoreTwo}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-[1.5rem] flex flex-col gap-[0.75rem]">
                <motion.button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)' }}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {copy.playAgain}
                </motion.button>

                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center border px-[1.25rem] py-[0.75rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)', color: 'var(--foreground)' }}
                >
                  {copy.exit}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default CategoryBlitzReveal;
