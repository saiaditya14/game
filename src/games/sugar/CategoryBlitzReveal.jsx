import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Vote, MinusCircle, Users } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { computeScores, resolveWinner } from './CategoryBlitzRules';

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    reviewTitle: 'cast your votes~ ♡',
    reviewHint:  'pick the best answer in each category, or abstain',
    abstain:     'abstain',
    noAnswers:   '(no one else answered — skipped)',
    confirm:     'confirm my votes ♡',
    waitingOthers: (n) => `waiting for ${n} more…`,
    youWin:      'you won!! ♡',
    otherWins:   (name) => `${name} won this one!`,
    draw:        "it's a tie~",
    playAgain:   'play again ♡',
    exit:        'exit game',
    results:     'results',
    votes:       'votes',
    noVotes:     'no votes',
  },
  'theme-arcade': {
    reviewTitle: 'CAST YOUR VOTES',
    reviewHint:  'PICK THE BEST ANSWER PER CATEGORY, OR ABSTAIN',
    abstain:     'ABSTAIN',
    noAnswers:   '(NO OTHER ANSWERS — SKIPPED)',
    confirm:     'CONFIRM MY VOTES',
    waitingOthers: (n) => `WAITING FOR ${n} MORE…`,
    youWin:      'YOU WIN!',
    otherWins:   (name) => `${name} WINS THIS ROUND`,
    draw:        'DRAW!',
    playAgain:   'PLAY AGAIN',
    exit:        'EXIT',
    results:     'RESULTS',
    votes:       'VOTES',
    noVotes:     'NO VOTES',
  },
  'theme-cozy': {
    reviewTitle: 'cast your votes',
    reviewHint:  'pick the best answer in each category, or abstain',
    abstain:     'abstain',
    noAnswers:   '(no one else answered — skipped)',
    confirm:     'confirm my votes',
    waitingOthers: (n) => `waiting for ${n} more…`,
    youWin:      'you won ✨',
    otherWins:   (name) => `${name} won this one`,
    draw:        'a draw~',
    playAgain:   'play again',
    exit:        'exit game',
    results:     'results',
    votes:       'votes',
    noVotes:     'no votes',
  },
  'theme-champagne': {
    reviewTitle: 'Cast your votes',
    reviewHint:  'Pick the best answer in each category, or abstain.',
    abstain:     'Abstain',
    noAnswers:   '(No other answers — skipped)',
    confirm:     'Confirm my votes',
    waitingOthers: (n) => `Waiting for ${n} more…`,
    youWin:      'You win!',
    otherWins:   (name) => `${name} wins this round`,
    draw:        'Draw',
    playAgain:   'Play again',
    exit:        'Exit game',
    results:     'Results',
    votes:       'votes',
    noVotes:     'No votes',
  },
};

// Functional status colors: a fixed "selected vote" tint so a cast vote reads
// identically across every theme (same reasoning as APPROVE_COLOR before).
const VOTE_COLOR = '#16a34a';
const VOTE_GLOW   = '#00e676';

const rowContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

const CategoryBlitzReveal = ({ room, playerId, onConfirmVotes, onPlayAgain, onExit }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const categories = room?.categories ?? [];
  const players = useMemo(() => (Array.isArray(room?.players) ? room.players : []), [room?.players]);
  const answers = room?.answers ?? {};
  const reviewsDone = room?.reviews_done ?? {};

  const myExistingVotes = room?.votes?.[playerId];
  const [localVotes, setLocalVotes] = useState(() =>
    (Array.isArray(myExistingVotes) && myExistingVotes.length === categories.length)
      ? [...myExistingVotes]
      : categories.map(() => null),
  );
  const [confirmed, setConfirmed] = useState(Boolean(reviewsDone[playerId]));

  const setVote = (index, targetId) =>
    setLocalVotes((prev) => { const next = [...prev]; next[index] = targetId; return next; });

  const isOver = room?.status === 'finished';

  const results = useMemo(() => {
    if (!isOver) return null;
    return computeScores({
      players,
      categories,
      answers,
      votes: room?.votes ?? {},
    });
  }, [isOver, players, categories, answers, room?.votes]);

  const scores = isOver ? (room?.scores ?? results?.scores ?? {}) : null;
  const winnerId = isOver ? (room?.winner ?? resolveWinner(scores)) : null;
  const isDraw = isOver && winnerId === null;
  const didIWin = isOver && winnerId === playerId;
  const winnerName = isOver && winnerId ? (players.find((p) => p.id === winnerId)?.name ?? '') : '';

  const sortedPlayers = useMemo(() => {
    if (!isOver || !scores) return [];
    return [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  }, [isOver, scores, players]);

  const reviewedCount = players.filter((p) => reviewsDone[p.id]).length;
  const remainingCount = Math.max(0, players.length - reviewedCount);

  const confirmVotes = () => {
    setConfirmed(true);
    onConfirmVotes(localVotes);
  };

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[46rem] flex-col px-[1rem] py-[1.5rem]"
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
            className="mt-[1.5rem] flex flex-1 flex-col gap-[1rem] border p-[1rem]"
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
              const options = players
                .filter((p) => p.id !== playerId)
                .map((p) => ({ id: p.id, name: p.name, answer: String(answers?.[p.id]?.[i] ?? '') }))
                .filter((o) => o.answer.trim() !== '');
              const myVote = localVotes[i];

              return (
                <motion.div
                  key={category}
                  className="flex flex-col gap-[0.5rem] border-b pb-[1rem] last:border-b-0 last:pb-0"
                  style={{ borderColor: 'var(--divider)' }}
                  variants={rowVariants}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--muted)' }}>
                    {category}
                  </p>

                  {options.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{copy.noAnswers}</p>
                  ) : (
                    <div className="flex flex-wrap gap-[0.5rem]">
                      {options.map((opt) => {
                        const isSelected = myVote === opt.id;
                        return (
                          <motion.button
                            key={opt.id}
                            type="button"
                            disabled={confirmed}
                            onClick={() => setVote(i, opt.id)}
                            className="flex min-w-[8rem] flex-1 flex-col items-start gap-[0.15rem] border px-[0.875rem] py-[0.625rem] text-left transition disabled:cursor-not-allowed"
                            style={{
                              borderRadius: 'var(--radius)',
                              borderColor: isSelected ? VOTE_COLOR : 'var(--divider)',
                              background: isSelected ? (isArcade ? 'rgba(0,230,118,0.10)' : 'var(--surface-strong)') : 'transparent',
                              boxShadow: isArcade && isSelected ? `0 0 10px ${VOTE_GLOW}` : undefined,
                            }}
                            whileHover={!confirmed ? { scale: 1.02 } : {}}
                            whileTap={!confirmed ? { scale: 0.97 } : {}}
                          >
                            <span
                              className="flex items-center gap-[0.3rem] text-[0.6rem] font-bold uppercase tracking-[0.1em]"
                              style={{ color: isSelected ? VOTE_COLOR : 'var(--muted)' }}
                            >
                              <Vote className="h-3 w-3" />
                              {opt.name}
                            </span>
                            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                              {opt.answer}
                            </span>
                          </motion.button>
                        );
                      })}
                      <motion.button
                        type="button"
                        disabled={confirmed}
                        onClick={() => setVote(i, null)}
                        className="flex min-w-[6rem] items-center justify-center gap-[0.3rem] border px-[0.875rem] py-[0.625rem] text-xs font-bold uppercase tracking-[0.08em] transition disabled:cursor-not-allowed"
                        style={{
                          borderRadius: 'var(--radius)',
                          borderColor: myVote == null ? 'var(--primary)' : 'var(--divider)',
                          color: myVote == null ? 'var(--primary)' : 'var(--muted)',
                          background: 'transparent',
                        }}
                        whileHover={!confirmed ? { scale: 1.04 } : {}}
                        whileTap={!confirmed ? { scale: 0.95 } : {}}
                      >
                        <MinusCircle className="h-3.5 w-3.5" />
                        {copy.abstain}
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
                  onClick={confirmVotes}
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
                <motion.div
                  key="waiting"
                  className="flex items-center justify-center gap-[0.4rem] text-center text-sm"
                  style={{ color: 'var(--muted)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {remainingCount > 0 && (
                    <motion.span
                      className="flex items-center gap-[0.4rem]"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.2 }}
                    >
                      <Users className="h-3.5 w-3.5" />
                      {copy.waitingOthers(remainingCount)}
                    </motion.span>
                  )}
                </motion.div>
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
                width: '100%', maxWidth: '30rem', maxHeight: '86vh', overflowY: 'auto', padding: '2rem', textAlign: 'center',
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
                {didIWin ? copy.youWin : isDraw ? copy.draw : copy.otherWins(winnerName)}
              </h2>

              <div
                className="mt-[1.25rem] flex flex-col gap-[0.4rem] border px-[1.25rem] py-[1rem] text-left"
                style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)' }}
              >
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                  {copy.results}
                </p>
                {sortedPlayers.map((p) => {
                  const isWinnerRow = winnerId === p.id;
                  const isMe = p.id === playerId;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-[0.5rem] py-[0.15rem]">
                      <span
                        className="flex min-w-0 items-center gap-[0.4rem] truncate text-sm font-bold"
                        style={{ color: isWinnerRow ? 'var(--primary)' : 'var(--foreground)' }}
                      >
                        {isWinnerRow && <Trophy className="h-3.5 w-3.5 shrink-0" />}
                        {p.name}{isMe ? ' (you)' : ''}
                      </span>
                      <span className="shrink-0 font-mono text-lg font-black" style={{ color: isWinnerRow ? 'var(--primary)' : 'var(--foreground)' }}>
                        {scores?.[p.id] ?? 0}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-[1.25rem] flex flex-col gap-[0.4rem] text-left">
                {results?.perCategory?.map((row) => {
                  const entries = Object.entries(row.votesReceived).filter(([, v]) => v > 0);
                  return (
                    <div
                      key={row.category}
                      className="flex items-center justify-between gap-[0.5rem] border-b px-[0.25rem] py-[0.35rem] text-xs"
                      style={{ borderColor: 'var(--divider)' }}
                    >
                      <span style={{ color: 'var(--muted)' }} className="truncate">{row.category}</span>
                      <span className="shrink-0 text-right font-bold" style={{ color: 'var(--foreground)' }}>
                        {entries.length === 0
                          ? copy.noVotes
                          : entries
                              .map(([pid, v]) => `${players.find((p) => p.id === pid)?.name ?? '?'} +${v}`)
                              .join(', ')}
                      </span>
                    </div>
                  );
                })}
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
