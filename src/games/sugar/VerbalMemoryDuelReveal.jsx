import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, X, Sparkles } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

// ─── One mistake row — the word, its position, and what went wrong ────────────

const MistakeRow = ({ mistake, isArcade }) => (
  <div
    style={{
      display: 'flex', alignItems: 'center', gap: '0.6rem',
      padding: '0.5rem 0.75rem',
      borderRadius: 'calc(var(--radius) * 0.6)',
      background: isArcade ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.22)',
    }}
  >
    <X style={{ width: '0.85rem', height: '0.85rem', color: '#ef4444', flexShrink: 0 }} />
    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 700, minWidth: '2.75rem' }}>
      #{mistake.index + 1}
    </span>
    <span style={{ fontWeight: 700, color: 'var(--foreground)', textTransform: 'lowercase' }}>
      {mistake.word}
    </span>
    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--muted)' }}>
      said <strong style={{ color: 'var(--foreground)' }}>{mistake.playerAnswered}</strong>
      {' · was '}
      <strong style={{ color: 'var(--foreground)' }}>{mistake.correctAnswer}</strong>
    </span>
  </div>
);

// ─── One side of the results (you or your opponent) ────────────────────────────

const ResultColumn = ({ label, score, mistakes, isWinner, isArcade }) => (
  <div
    style={{
      flex: '1 1 16rem',
      minWidth: 0,
      borderRadius: 'var(--radius)',
      border: `1px solid ${isWinner ? 'var(--primary)' : 'var(--divider)'}`,
      background: 'var(--surface)',
      boxShadow: isWinner && isArcade ? '0 0 18px rgba(0,255,255,0.10)' : isWinner ? 'var(--shadow)' : undefined,
      padding: '1.25rem',
      textAlign: 'left',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--muted)' }}>
        {label}
      </p>
      {isWinner && <Sparkles style={{ width: '0.9rem', height: '0.9rem', color: 'var(--primary)' }} />}
    </div>
    <p style={{ marginTop: '0.25rem', marginBottom: '0.75rem', fontSize: '2rem', fontWeight: 900, color: 'var(--foreground)' }}>
      {score}
    </p>

    {mistakes.length === 0 ? (
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', fontStyle: 'italic' }}>
        No mistakes — flawless run.
      </p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {mistakes.map((m) => (
          <MistakeRow key={m.index} mistake={m} isArcade={isArcade} />
        ))}
      </div>
    )}
  </div>
);

// ─── Reveal screen ──────────────────────────────────────────────────────────────

const VerbalMemoryDuelReveal = ({ room, playerNumber, onPlayAgain, onExit }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isOne = playerNumber === 1;

  const myScore     = isOne ? room.score_one : room.score_two;
  const oppScore    = isOne ? room.score_two : room.score_one;
  const myMistakes  = (isOne ? room.mistakes_one : room.mistakes_two) ?? [];
  const oppMistakes = (isOne ? room.mistakes_two : room.mistakes_one) ?? [];

  const didIWin    = room.winner === playerNumber;
  const didTheyWin = room.winner !== null && room.winner !== playerNumber;
  const isDraw     = room.winner === null;

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        color: 'var(--foreground)', padding: '2.5rem 1.25rem',
      }}
    >
      <motion.div
        style={{
          display: 'grid', placeItems: 'center', width: '4rem', height: '4rem', borderRadius: '50%', marginBottom: '0.75rem',
          background: didIWin ? 'var(--primary)' : 'var(--surface-strong)',
          boxShadow: isArcade && didIWin ? '0 0 20px var(--primary), 0 0 40px rgba(255,0,255,0.5)' : undefined,
        }}
        initial={{ scale: 0, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <Trophy style={{ width: '1.75rem', height: '1.75rem', color: didIWin ? (isArcade ? '#000' : 'var(--surface)') : 'var(--muted)' }} />
      </motion.div>

      <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--primary)' }}>
        {didIWin ? 'winner' : isDraw ? 'draw' : 'match over'}
      </p>
      <h1
        style={{
          marginTop: '0.375rem', fontSize: 'clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)', fontWeight: 700,
          ...(isArcade && didIWin ? { textShadow: '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.5)' } : {}),
        }}
        className="font-serif"
      >
        {didIWin ? 'You won!' : didTheyWin ? 'They won this one' : "It's a draw"}
      </h1>

      <div
        style={{
          marginTop: '2rem', width: '100%', maxWidth: '46rem',
          display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center',
        }}
      >
        <ResultColumn label="You" score={myScore} mistakes={myMistakes} isWinner={didIWin} isArcade={isArcade} />
        <ResultColumn label="Opponent" score={oppScore} mistakes={oppMistakes} isWinner={didTheyWin} isArcade={isArcade} />
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '20rem' }}>
        <motion.button
          type="button"
          onClick={onPlayAgain}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            minHeight: '3rem', borderRadius: 'var(--radius)', border: 'none', cursor: 'pointer',
            background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)',
            fontWeight: 800, fontSize: '0.9rem',
            boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)',
          }}
        >
          <RotateCcw style={{ width: '1rem', height: '1rem' }} />
          Play again
        </motion.button>
        <button
          type="button"
          onClick={onExit}
          style={{
            minHeight: '3rem', borderRadius: 'var(--radius)', cursor: 'pointer',
            border: '1px solid var(--divider)', background: 'var(--surface-strong)', color: 'var(--foreground)',
            fontWeight: 700, fontSize: '0.9rem',
          }}
        >
          Exit
        </button>
      </div>
    </main>
  );
};

export default VerbalMemoryDuelReveal;
