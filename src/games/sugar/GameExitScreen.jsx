import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../components/ThemeProvider';

// Shared abort / game-over modal, consumed by any Supabase-synced sugar game.
// status: 'aborted' — mid-game abort, "Game Aborted / heading home"
// status: 'closed'  — exit after game over, "Game Over / heading home"

const exitCopy = {
  aborted: {
    'theme-pink':      { title: 'game stopped',   sub: 'heading home' },
    'theme-arcade':    { title: 'GAME ABORTED',    sub: 'RETURNING HOME…' },
    'theme-cozy':      { title: 'game ended',      sub: 'heading home…' },
    'theme-champagne': { title: 'Game Aborted',    sub: 'Returning home…' },
  },
  closed: {
    'theme-pink':      { title: 'game over',      sub: 'heading home' },
    'theme-arcade':    { title: 'GAME OVER',       sub: 'HEADING HOME…' },
    'theme-cozy':      { title: "that's a wrap",   sub: 'heading home…' },
    'theme-champagne': { title: 'Game Over',       sub: 'Heading home…' },
  },
};

const GameExitScreen = ({ status }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy =
    exitCopy[status]?.[theme] ??
    exitCopy[status]?.['theme-champagne'] ??
    { title: 'Heading home…', sub: '' };

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'color-mix(in srgb, var(--background) 78%, transparent)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          maxWidth: '22rem',
          border: '1px solid var(--ring)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: isArcade
            ? '0 0 0 1px var(--ring), 0 0 40px rgba(0,255,255,0.10), 0 0 80px rgba(255,0,255,0.07)'
            : 'var(--shadow)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.91 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="text-xl font-black"
          style={{
            color: 'var(--foreground)',
            ...(isArcade ? { textShadow: '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.45)' } : {}),
          }}
        >
          {copy.title}
        </p>
        <motion.p
          className="mt-[0.5rem] text-sm"
          style={{ color: 'var(--muted)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          {copy.sub}
        </motion.p>
      </motion.div>
    </main>
  );
};

export default GameExitScreen;
