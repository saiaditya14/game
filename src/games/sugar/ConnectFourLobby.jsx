import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { LogIn, Plus, Users, Copy, Check } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import DecryptedText from '../../components/reactbits/DecryptedText';
import ConnectFourLanterns from './ConnectFourLanterns';

const buttonBase =
  'inline-flex min-h-[3rem] items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

// ─── Arcade-only magnetic cursor-follow wrapper (matches Tic-Tac-Toe lobby) ────

const MagneticButton = ({ children, strength = 0.28, disabled = false }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 380, damping: 28 });
  const sy = useSpring(y, { stiffness: 380, damping: 28 });

  const onMove = (event) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-flex' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
};

// ─── Arcade-only glowing room code display with copy button ──────────────────

const ArcadeRoomCode = ({ roomCode }) => {
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="mx-auto mt-[1.25rem] max-w-[20rem] border p-[1.25rem] text-center"
      style={{
        borderColor: 'rgba(0,255,255,0.22)',
        borderRadius: 'var(--radius)',
        background: 'rgba(0,14,14,0.85)',
        boxShadow: '0 0 14px rgba(0,255,255,0.045)',
      }}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        ROOM CODE
      </p>

      <div className="mt-[0.5rem] flex items-center justify-center gap-[0.75rem]">
        <span
          className="font-mono tracking-[0.42em]"
          style={{
            fontSize: '2.25rem',
            fontWeight: 900,
            color: 'var(--primary)',
            textShadow: '0 0 10px var(--primary), 0 0 21px rgba(255,0,255,0.4)',
          }}
        >
          {roomCode}
        </span>
        <motion.button
          type="button"
          onClick={doCopy}
          className="grid h-[2rem] w-[2rem] shrink-0 place-items-center border"
          style={{
            borderColor: 'var(--divider)',
            borderRadius: 'var(--radius)',
            color: copied ? 'var(--primary)' : 'var(--muted)',
            background: 'transparent',
          }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.88 }}
          aria-label="Copy room code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </motion.button>
      </div>

      <motion.p
        className="mt-[0.625rem] text-xs"
        style={{ color: 'var(--muted)' }}
        animate={{ opacity: [0.42, 1, 0.42] }}
        transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
      >
        WAITING FOR P2...
      </motion.p>
    </motion.div>
  );
};

const ConnectFourLobby = ({ onCreateRoom, onJoinRoom, isBusy, error, roomCode }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isCozy = theme === 'theme-cozy';
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const submitJoin = (event) => {
    event.preventDefault();
    onJoinRoom(joinCode);
  };

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[56rem] items-center px-[1rem] py-[2.5rem] text-foreground">
      {isArcade && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(255,0,255,0.05) 0%, rgba(0,255,255,0.03) 45%, transparent 80%)',
          }}
        />
      )}

      {isArcade && (
        <div className="connect-four-arcade-drift" aria-hidden="true">
          <span className="connect-four-drift-piece connect-four-drift-piece--primary" />
          <span className="connect-four-drift-piece connect-four-drift-piece--accent" />
        </div>
      )}

      {isCozy && <ConnectFourLanterns />}

      <motion.section
        className="relative w-full border bg-[color:var(--surface)] p-[2rem] text-center"
        style={{
          borderColor: 'var(--ring)',
          borderRadius: 'var(--radius)',
          boxShadow: isArcade
            ? '0 0 0 1px var(--ring), 0 0 34px rgba(0,255,255,0.045), 0 0 68px rgba(255,0,255,0.035)'
            : 'var(--shadow)',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div
          className="mx-auto grid h-[3.5rem] w-[3.5rem] place-items-center rounded-full bg-[color:var(--primary)] text-[color:var(--surface)]"
          style={
            isArcade
              ? { borderRadius: 0, boxShadow: '0 0 13px var(--primary), 0 0 26px rgba(255,0,255,0.4)', color: '#000' }
              : undefined
          }
        >
          <Users className="h-6 w-6" />
        </div>

        <p className="mt-[1.25rem] text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[color:var(--primary)]">
          {isArcade ? 'SUGAR GAME' : 'sugar game'}
        </p>

        <div className="mt-[0.5rem]">
          {isArcade ? (
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(2.25rem, 1.9rem + 1.5vw, 3rem)',
                fontWeight: 500,
                color: 'var(--foreground)',
                textShadow: '0 0 13px var(--primary), 0 0 27px rgba(255,0,255,0.3)',
              }}
            >
              <DecryptedText text="Connect Four" speed={38} maxIterations={9} sequential revealDirection="start" />
            </h1>
          ) : (
            <h1
              className="font-serif text-foreground"
              style={{ fontSize: 'clamp(2.25rem, 1.9rem + 1.5vw, 3rem)', fontWeight: 500 }}
            >
              Connect Four
            </h1>
          )}
        </div>

        <p className="mx-auto mt-[1rem] max-w-[42rem] leading-6 text-[color:var(--muted)]" style={{ fontSize: '0.95rem' }}>
          {isArcade
            ? 'DROP PIECES. CONNECT FOUR. HORIZONTAL, VERTICAL, OR DIAGONAL.'
            : 'Drop pieces into the grid and be the first player to connect four horizontally, vertically, or diagonally.'}
        </p>

        <div className="mx-auto mt-[2rem] flex max-w-[36rem] flex-wrap items-center justify-center gap-[0.75rem]">
          <MagneticButton disabled={!isArcade || isBusy}>
            <motion.button
              type="button"
              onClick={onCreateRoom}
              disabled={isBusy}
              className={`${buttonBase} bg-[color:var(--primary)] text-[color:var(--surface)]`}
              style={{
                borderRadius: 'var(--radius)',
                boxShadow: isArcade ? '0 0 11px var(--primary), 0 0 23px rgba(255,0,255,0.32)' : 'var(--shadow)',
                color: isArcade ? '#000' : undefined,
              }}
              whileHover={isArcade ? { scale: 1.04 } : { y: -2 }}
              whileTap={isArcade ? { scale: 0.96 } : { scale: 0.98 }}
            >
              <Plus className="h-4 w-4" />
              {isArcade ? 'CREATE' : 'Create a Game'}
            </motion.button>
          </MagneticButton>

          <MagneticButton disabled={!isArcade || isBusy}>
            <motion.button
              type="button"
              onClick={() => setIsJoinOpen((value) => !value)}
              disabled={isBusy}
              className={`${buttonBase} border bg-[color:var(--surface-strong)]`}
              style={{
                borderColor: 'var(--ring)',
                borderRadius: 'var(--radius)',
                background: isArcade ? 'transparent' : undefined,
                boxShadow: isArcade ? '0 0 8px rgba(0,255,255,0.07)' : undefined,
                color: 'var(--foreground)',
              }}
              whileHover={isArcade ? { scale: 1.04 } : { y: -2 }}
              whileTap={isArcade ? { scale: 0.96 } : { scale: 0.98 }}
            >
              <LogIn className="h-4 w-4" />
              {isArcade ? 'JOIN' : 'Join a Game'}
            </motion.button>
          </MagneticButton>
        </div>

        <AnimatePresence>
          {isJoinOpen && (
            <motion.form
              onSubmit={submitJoin}
              className="mx-auto mt-[1.25rem] flex max-w-[36rem] flex-wrap gap-[0.75rem] border bg-[color:var(--surface-strong)] p-[0.75rem]"
              style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)' }}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
            >
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                className="min-h-[3rem] border bg-[color:var(--surface)] px-[1rem] text-center text-lg font-bold uppercase tracking-[0.2em] outline-none transition placeholder:text-[color:var(--muted)] focus:ring-2 focus:ring-[color:var(--ring)]"
                style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', flex: '1 1 12rem', color: 'var(--foreground)' }}
                maxLength={6}
                placeholder="ROOM"
                aria-label="Room code"
              />
              <button
                type="submit"
                disabled={isBusy || joinCode.trim().length < 4}
                className={`${buttonBase} bg-[color:var(--primary)] text-[color:var(--surface)]`}
                style={{ borderRadius: 'var(--radius)', color: isArcade ? '#000' : undefined }}
              >
                {isArcade ? 'JOIN' : 'Join'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {roomCode && (
            isArcade ? (
              <ArcadeRoomCode roomCode={roomCode} />
            ) : (
              <p className="mt-[1.25rem] text-sm font-semibold text-[color:var(--foreground)]">
                Room code: <span className="tracking-[0.22em] text-[color:var(--primary)]">{roomCode}</span>
              </p>
            )
          )}
        </AnimatePresence>

        {error && (
          <p
            className="mx-auto mt-[1rem] max-w-[36rem] border bg-[color:var(--surface-strong)] px-[1rem] py-[0.75rem] text-sm text-[color:var(--muted)]"
            style={{ borderRadius: 'var(--radius)', borderColor: 'color-mix(in srgb, var(--border) 70%, transparent)' }}
          >
            {error}
          </p>
        )}
      </motion.section>
    </main>
  );
};

export default ConnectFourLobby;
