import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import RoomCodeCopy from '../../../components/RoomCodeCopy';
import { FRUITS, fruitById } from './juiceBarData';

const BORDER_BOX = { boxSizing: 'border-box' };

// Taps needed to fully chop one fruit before it's sent to the Blend station.
const CHOPS_NEEDED = 3;

const PrepStation = ({ room, onSendIngredient, onLeave }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const glow = (color, strength) => (isArcade ? `drop-shadow(0 0 ${strength} ${color})` : 'none');

  // Local-only chop progress per fruit — the shared room only needs to know
  // about a fruit once it's fully chopped and sent, not mid-chop.
  const [chopProgress, setChopProgress] = useState({});

  const chop = (fruitId) => {
    setChopProgress((prev) => {
      const next = (prev[fruitId] ?? 0) + 1;
      if (next >= CHOPS_NEEDED) {
        onSendIngredient(fruitId);
        return { ...prev, [fruitId]: 0 };
      }
      return { ...prev, [fruitId]: next };
    });
  };

  const bin = room.bin ?? [];

  return (
    <div
      style={{
        ...BORDER_BOX,
        marginInline: 'auto',
        width: '100%',
        maxWidth: '48rem',
        paddingInline: 'clamp(1rem, 3vw, 2rem)',
        paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
        color: 'var(--foreground)',
      }}
    >
      <div
        style={{
          ...BORDER_BOX,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: 'clamp(1rem, 2.5vw, 1.5rem)',
          padding: 'clamp(0.65rem, 1.5vw, 0.9rem) clamp(0.9rem, 2vw, 1.25rem)',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface-strong)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ChefHat className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span className="font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>
            Prep Station · Round {room.round}/{room.target_rounds}
          </span>
        </div>
        <RoomCodeCopy code={room.code} idleColor="var(--muted)" />
      </div>

      <p style={{ marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--muted)' }}>
        You can't see the order — your partner will call out what to chop. Tap a fruit {CHOPS_NEEDED} times to prep and send it.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 9rem), 1fr))',
          gap: 'clamp(0.75rem, 2vw, 1.1rem)',
        }}
      >
        {FRUITS.map((fruit) => {
          const progress = chopProgress[fruit.id] ?? 0;
          return (
            <motion.button
              key={fruit.id}
              type="button"
              onClick={() => chop(fruit.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.94 }}
              className="focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              style={{
                ...BORDER_BOX,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem',
                padding: 'clamp(1rem, 2.5vw, 1.5rem)',
                border: '1px solid var(--ring)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  transform: `scaleY(${progress / CHOPS_NEEDED})`,
                  transformOrigin: 'bottom',
                  background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
                  transition: 'transform 0.15s ease',
                }}
              />
              <fruit.icon className="h-8 w-8" style={{ position: 'relative', color: 'var(--primary)', filter: glow('var(--primary)', '8px') }} />
              <span className="text-sm font-bold" style={{ position: 'relative', color: 'var(--foreground)' }}>
                {fruit.label}
              </span>
              <span className="text-xs" style={{ position: 'relative', color: 'var(--muted)' }}>
                {progress}/{CHOPS_NEEDED}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div style={{ marginTop: 'clamp(1.5rem, 3vw, 2rem)' }}>
        <p className="font-bold uppercase" style={{ marginBottom: '0.6rem', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--muted)' }}>
          Sent this round
        </p>
        <div
          style={{
            ...BORDER_BOX,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            minHeight: '3.25rem',
            padding: '0.75rem',
            border: '1px solid var(--divider)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-strong)',
          }}
        >
          <AnimatePresence initial={false}>
            {bin.map((fruitId, i) => {
              const fruit = fruitById(fruitId);
              if (!fruit) return null;
              return (
                <motion.span
                  key={`${fruitId}-${i}`}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  style={{
                    ...BORDER_BOX,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '2.5rem',
                    height: '2.5rem',
                    border: '1px solid var(--ring)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface)',
                    color: 'var(--primary)',
                  }}
                >
                  <fruit.icon className="h-5 w-5" />
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <button
        type="button"
        onClick={onLeave}
        className="font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
        style={{
          ...BORDER_BOX,
          marginTop: 'clamp(1.5rem, 3vw, 2rem)',
          minHeight: '2.75rem',
          paddingInline: '1.25rem',
          fontSize: '0.82rem',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius)',
          background: 'transparent',
          color: 'var(--muted)',
        }}
      >
        Leave table
      </button>
    </div>
  );
};

export default PrepStation;
