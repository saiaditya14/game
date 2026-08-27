import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Flag } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { STARTING_LIVES } from './VerbalMemoryRules';

// ─── Lives row — own lives only, never the opponent's ──────────────────────────

const LivesRow = ({ lives, isArcade }) => (
  <div style={{ display: 'flex', gap: '0.4rem' }} aria-label={`${lives} lives remaining`}>
    {Array.from({ length: STARTING_LIVES }, (_, i) => {
      const alive = i < lives;
      return (
        <Heart
          key={i}
          style={{
            width: '1.35rem',
            height: '1.35rem',
            color: alive ? 'var(--primary)' : 'var(--divider)',
            fill: alive ? 'var(--primary)' : 'transparent',
            filter: alive && isArcade ? 'drop-shadow(0 0 6px var(--primary))' : undefined,
            transition: 'color 0.2s, fill 0.2s',
          }}
        />
      );
    })}
  </div>
);

// ─── Word card ──────────────────────────────────────────────────────────────────

const WordCard = ({ word, wordKey, flash, isArcade }) => {
  const flashBorder =
    flash === 'correct' ? 'rgba(34,197,94,0.55)' :
    flash === 'wrong'   ? 'rgba(239,68,68,0.6)'  :
    isArcade ? 'rgba(0,255,255,0.18)' : 'var(--ring)';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '26rem',
        minHeight: '9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius)',
        border: `2px solid ${flashBorder}`,
        background: isArcade ? 'rgba(4,4,4,0.9)' : 'var(--surface)',
        boxShadow: flash ? `0 0 0 1px ${flashBorder}, 0 0 28px ${flashBorder}` : 'var(--shadow)',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={wordKey}
          initial={{ opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.94 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontSize: 'clamp(1.75rem, 1.3rem + 2vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: 'var(--foreground)',
            textTransform: 'lowercase',
            ...(isArcade ? { textShadow: '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.35)' } : {}),
          }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// ─── Board ──────────────────────────────────────────────────────────────────────

const VerbalMemoryDuelBoard = ({ room, playerNumber, wordSequence, onSubmitAnswer, onLeave }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isOne = playerNumber === 1;

  const lives = isOne ? room.lives_one : room.lives_two;
  const score = isOne ? room.score_one : room.score_two;
  const mistakes = (isOne ? room.mistakes_one : room.mistakes_two) ?? [];
  const finishedAt = isOne ? room.finished_one_at : room.finished_two_at;
  const answeredCount = score + mistakes.length;
  const currentEntry = wordSequence[answeredCount];
  const isDone = lives <= 0 || Boolean(finishedAt) || !currentEntry;

  const [busy, setBusy]   = useState(false);
  const [flash, setFlash] = useState(null);

  const answer = async (choice) => {
    if (busy || isDone) return;
    setBusy(true);
    const result = await onSubmitAnswer(choice);
    if (result?.ok) {
      setFlash(result.correct ? 'correct' : 'wrong');
      setTimeout(() => setFlash(null), 320);
    }
    setBusy(false);
  };

  // Keyboard shortcuts: arrows or S/N, since this is a reaction-speed game.
  useEffect(() => {
    if (isDone) return undefined;
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 's') answer('seen');
      else if (key === 'arrowright' || key === 'n') answer('new');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, busy, answeredCount]);

  const btnBase = {
    minHeight: '3.25rem',
    flex: '1 1 9rem',
    borderRadius: 'var(--radius)',
    fontWeight: 800,
    fontSize: '1rem',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    border: 'none',
  };

  return (
    <main
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '1.5rem', color: 'var(--foreground)', textAlign: 'center', padding: '1.5rem',
      }}
    >
      {/* Top bar — pushed below the site NavBar (which occupies roughly the
          top 76px and intercepts pointer events there), not flush to the
          viewport edge. */}
      <div
        style={{
          position: 'absolute', top: '5.5rem', left: '1.25rem', right: '1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <p style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.68rem' }}>
          Room {room.code}
        </p>
        <button
          type="button"
          onClick={onLeave}
          title="Leaving now immediately ends the match — your opponent wins."
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Flag style={{ width: '0.9rem', height: '0.9rem' }} />
          Forfeit
        </button>
      </div>

      {!isDone ? (
        <>
          <LivesRow lives={lives} isArcade={isArcade} />
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Score <strong style={{ color: 'var(--foreground)' }}>{score}</strong>
          </p>

          <WordCard word={currentEntry.word} wordKey={answeredCount} flash={flash} isArcade={isArcade} />

          <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '26rem' }}>
            <motion.button
              type="button"
              onClick={() => answer('seen')}
              disabled={busy}
              whileTap={{ scale: 0.95 }}
              style={{
                ...btnBase,
                background: isArcade ? 'transparent' : 'var(--surface-strong)',
                border: `2px solid ${isArcade ? 'rgba(0,255,255,0.35)' : 'var(--ring)'}`,
                color: 'var(--foreground)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              SEEN
            </motion.button>
            <motion.button
              type="button"
              onClick={() => answer('new')}
              disabled={busy}
              whileTap={{ scale: 0.95 }}
              style={{
                ...btnBase,
                background: 'var(--primary)',
                color: isArcade ? '#000' : 'var(--surface)',
                boxShadow: isArcade ? '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.4)' : 'var(--shadow)',
                opacity: busy ? 0.6 : 1,
              }}
            >
              NEW
            </motion.button>
          </div>

          <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            ← / S = seen &nbsp;·&nbsp; N / → = new
          </p>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}
        >
          <p style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            {lives <= 0 ? "You're out of lives!" : 'Run complete!'}
          </p>
          <p style={{ color: 'var(--muted)' }}>
            Your score: <strong style={{ color: 'var(--foreground)' }}>{score}</strong>
          </p>
          <motion.p
            style={{ color: 'var(--muted)', fontSize: '0.85rem' }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          >
            Waiting for your opponent to finish…
          </motion.p>
        </motion.div>
      )}
    </main>
  );
};

export default VerbalMemoryDuelBoard;
