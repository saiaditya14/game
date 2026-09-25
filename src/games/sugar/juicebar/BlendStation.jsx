import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Blender, Check, X } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import RoomCodeCopy from '../../../components/RoomCodeCopy';
import { TOPPINGS, fruitById, toppingById } from './juiceBarData';

const BORDER_BOX = { boxSizing: 'border-box' };

const BlendStation = ({ room, onServe, onLeave }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const glow = (color, strength) => (isArcade ? `drop-shadow(0 0 ${strength} ${color})` : 'none');

  const [selectedTopping, setSelectedTopping] = useState(null);

  // Reset the local topping pick whenever a new round's order comes in.
  useEffect(() => {
    setSelectedTopping(null);
  }, [room.round]);

  const bin = room.bin ?? [];
  const combo = room.order_combo ?? [];

  const resultColor =
    room.last_result === 'correct' ? '#16a34a' : room.last_result === 'wrong' ? '#dc2626' : 'var(--muted)';

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
          <Blender className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          <span className="font-bold uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>
            Blend Station · Round {room.round}/{room.target_rounds}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="font-bold" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
            Score {room.score}
          </span>
          <RoomCodeCopy code={room.code} idleColor="var(--muted)" />
        </div>
      </div>

      <div
        style={{
          ...BORDER_BOX,
          marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)',
          padding: 'clamp(1rem, 2.5vw, 1.5rem)',
          border: '1px solid var(--ring)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <p className="font-bold uppercase" style={{ marginBottom: '0.75rem', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--accent)' }}>
          The order — call this out to your partner
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
          {combo.map((fruitId, i) => {
            const fruit = fruitById(fruitId);
            if (!fruit) return null;
            return (
              <span
                key={`${fruitId}-${i}`}
                style={{
                  ...BORDER_BOX,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-strong)',
                  color: 'var(--foreground)',
                }}
              >
                <fruit.icon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                <span className="text-sm font-bold">{fruit.label}</span>
              </span>
            );
          })}
          <span aria-hidden="true" style={{ width: '1px', height: '1.5rem', background: 'var(--divider)' }} />
          {room.order_topping && (() => {
            const topping = toppingById(room.order_topping);
            if (!topping) return null;
            return (
              <span
                style={{
                  ...BORDER_BOX,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-strong)',
                  color: 'var(--accent)',
                }}
              >
                <topping.icon className="h-5 w-5" />
                <span className="text-sm font-bold">{topping.label}</span>
              </span>
            );
          })()}
        </div>
      </div>

      <p className="font-bold uppercase" style={{ marginBottom: '0.6rem', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--muted)' }}>
        In the blender
      </p>
      <div
        style={{
          ...BORDER_BOX,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          minHeight: '3.25rem',
          marginBottom: 'clamp(1.25rem, 3vw, 1.75rem)',
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

      <p className="font-bold uppercase" style={{ marginBottom: '0.6rem', fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--muted)' }}>
        Topping
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
        {TOPPINGS.map((topping) => {
          const active = selectedTopping === topping.id;
          return (
            <motion.button
              key={topping.id}
              type="button"
              onClick={() => setSelectedTopping(topping.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
              style={{
                ...BORDER_BOX,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                border: `1px solid ${active ? 'var(--primary)' : 'var(--divider)'}`,
                borderRadius: 'var(--radius)',
                background: active ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'var(--surface)',
                color: active ? 'var(--primary)' : 'var(--foreground)',
              }}
            >
              <topping.icon className="h-5 w-5" />
              <span className="text-sm font-bold">{topping.label}</span>
            </motion.button>
          );
        })}
      </div>

      {room.last_result && (
        <p
          className="font-bold"
          style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: resultColor, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {room.last_result === 'correct' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {room.last_result === 'correct' ? 'Nailed it — next order up.' : 'Not quite — next order up.'}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <motion.button
          type="button"
          onClick={() => onServe(selectedTopping)}
          disabled={!selectedTopping || bin.length === 0}
          whileHover={!selectedTopping || bin.length === 0 ? undefined : { y: -2 }}
          whileTap={!selectedTopping || bin.length === 0 ? undefined : { scale: 0.97 }}
          className="font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{
            ...BORDER_BOX,
            minHeight: '3rem',
            paddingInline: '1.75rem',
            fontSize: '0.85rem',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            color: isArcade ? '#000' : 'var(--surface)',
            boxShadow: isArcade ? '0 0 14px var(--primary)' : 'var(--shadow)',
          }}
        >
          Serve
        </motion.button>

        <button
          type="button"
          onClick={onLeave}
          className="font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{
            ...BORDER_BOX,
            minHeight: '3rem',
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
    </div>
  );
};

export default BlendStation;
