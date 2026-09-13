import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Plus, Users, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

// Tailwind's preflight reset is not active in this project, so `box-sizing` is
// content-box everywhere. Any box that combines padding with a width/height
// constraint has to opt into border-box explicitly or it overflows its parent.
const BORDER_BOX = { boxSizing: 'border-box' };

// The spacing scale generates no CSS in this project, so every size below has to
// be a real value rather than a named utility.
const buttonClass =
  'inline-flex items-center justify-center font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

const buttonStyle = {
  ...BORDER_BOX,
  width: '100%',
  minHeight: '3rem',
  gap: '0.5rem',
  paddingInline: '1.25rem',
  paddingBlock: '0.75rem',
  fontSize: '0.85rem',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: 'var(--radius)',
};

const primaryButtonStyle = {
  ...buttonStyle,
  borderColor: 'var(--primary)',
  background: 'var(--primary)',
  color: 'var(--surface)',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  borderColor: 'var(--ring)',
  background: 'var(--surface-strong)',
  color: 'var(--foreground)',
};

const DrawOffCoopLobby = ({ onCreateRoom, onJoinRoom, isBusy, error, roomCode }) => {
  const [mode, setMode] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const glow = (color, strength) => (isArcade ? `drop-shadow(0 0 ${strength} ${color})` : 'none');

  const submitJoin = (event) => {
    event.preventDefault();
    onJoinRoom(joinCode);
  };
  const back = () => setMode(null);

  return (
    <main
      style={{
        ...BORDER_BOX,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 5rem)',
        marginInline: 'auto',
        width: '100%',
        maxWidth: 'min(72rem, 100%)',
        paddingInline: 'clamp(1rem, 4vw, 2.5rem)',
        paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
        color: 'var(--foreground)',
      }}
    >
      {/* Ambient wash so the card reads as sitting on a designed surface */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: isArcade
            ? 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,0,255,0.10) 0%, rgba(0,255,255,0.05) 45%, transparent 78%)'
            : 'radial-gradient(ellipse 75% 50% at 50% 40%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 72%)',
        }}
      />

      <motion.section
        style={{
          ...BORDER_BOX,
          position: 'relative',
          zIndex: 1,
          marginInline: 'auto',
          width: '100%',
          maxWidth: '34rem',
          padding: 'clamp(1.75rem, 4vw, 2.75rem)',
          textAlign: 'center',
          border: '1px solid var(--ring)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow)',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          style={{
            ...BORDER_BOX,
            display: 'grid',
            placeItems: 'center',
            width: '3.75rem',
            height: '3.75rem',
            marginInline: 'auto',
            marginBottom: '1.25rem',
            border: '1px solid var(--accent)',
            borderRadius: 'calc(var(--radius) + 0.35rem)',
            background: 'var(--surface-strong)',
            color: 'var(--accent)',
            filter: glow('var(--accent)', '10px'),
          }}
        >
          <Users className="h-7 w-7" />
        </div>

        <p
          className="font-bold uppercase"
          style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--accent)' }}
        >
          two players, one sketchpad
        </p>

        <h1
          className="font-serif font-bold"
          style={{
            marginTop: '0.5rem',
            fontSize: 'clamp(1.75rem, 1.4rem + 1.6vw, 2.75rem)',
            lineHeight: 1.15,
            color: 'var(--foreground)',
            filter: glow('var(--foreground)', '10px'),
          }}
        >
          Draw Off Co-op
        </h1>

        <p
          style={{
            marginTop: '0.8rem',
            marginInline: 'auto',
            maxWidth: '26rem',
            fontSize: 'clamp(0.85rem, 0.8rem + 0.2vw, 0.98rem)',
            lineHeight: 1.6,
            color: 'var(--muted)',
          }}
        >
          Team up! One player draws while the other guesses. Guess 3 words to win.
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {!mode && (
            <motion.div
              key="entry"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 11rem), 1fr))',
                gap: '0.75rem',
                marginTop: 'clamp(1.5rem, 4vw, 2rem)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <motion.button
                type="button"
                onClick={onCreateRoom}
                disabled={isBusy}
                className={buttonClass}
                style={primaryButtonStyle}
                whileHover={isBusy ? undefined : { y: -2 }}
                whileTap={isBusy ? undefined : { scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                CREATE
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setMode('join')}
                disabled={isBusy}
                className={buttonClass}
                style={secondaryButtonStyle}
                whileHover={isBusy ? undefined : { y: -2 }}
                whileTap={isBusy ? undefined : { scale: 0.98 }}
              >
                <LogIn className="h-4 w-4" />
                JOIN
              </motion.button>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              style={{ marginTop: '0.9rem', textAlign: 'left' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <p
                className="font-bold uppercase"
                style={{ marginBottom: '0.5rem', fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--accent)' }}
              >
                Enter room code
              </p>
              <form
                onSubmit={submitJoin}
                style={{
                  ...BORDER_BOX,
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                  gap: '0.6rem',
                  padding: '0.7rem',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface-strong)',
                }}
              >
                <button
                  type="button"
                  onClick={back}
                  className={buttonClass}
                  style={{ ...secondaryButtonStyle, width: 'auto', paddingInline: '1rem' }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <input
                  value={joinCode}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  className="font-bold uppercase outline-none transition placeholder:text-[color:var(--muted)] focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{
                    ...BORDER_BOX,
                    minHeight: '3rem',
                    paddingInline: '1rem',
                    textAlign: 'center',
                    fontSize: '1.05rem',
                    letterSpacing: '0.2em',
                    border: '1px solid var(--divider)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface)',
                    color: 'var(--foreground)',
                  }}
                  maxLength={6}
                  placeholder="ROOM"
                  aria-label="Room code"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isBusy || joinCode.trim().length < 4}
                  className={buttonClass}
                  style={{ ...primaryButtonStyle, width: 'auto', paddingInline: '1.5rem' }}
                >
                  Join
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {roomCode && (
          <p style={{ marginTop: '1.1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
            Room code:{' '}
            <span
              style={{
                letterSpacing: '0.22em',
                color: 'var(--primary)',
                filter: glow('var(--primary)', '8px'),
              }}
            >
              {roomCode}
            </span>
          </p>
        )}

        {error && (
          <p
            style={{
              ...BORDER_BOX,
              marginTop: '1rem',
              padding: '0.8rem 1.1rem',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              border: '1px solid var(--divider)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface-strong)',
              color: 'var(--muted)',
            }}
          >
            {error}
          </p>
        )}
      </motion.section>
    </main>
  );
};

export default DrawOffCoopLobby;
