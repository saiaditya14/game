import React, { useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { LogIn, Plus, Copy, Check, ArrowLeft, Type } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import SplitText from '../../components/reactbits/SplitText';
import DecryptedText from '../../components/reactbits/DecryptedText';
import BlurText from '../../components/reactbits/BlurText';

// ─── Per-theme copy ────────────────────────────────────────────────────────────

const eyebrowByTheme = {
  'theme-pink':      'sugar game',
  'theme-arcade':    'SUGAR GAME',
  'theme-cozy':      'sugar game',
  'theme-champagne': 'sugar game',
};

const descByTheme = {
  'theme-pink':      'Same secret word, six guesses each. Watch their tiles light up as you race to solve it first.',
  'theme-arcade':    'SAME SECRET WORD. SIX GUESSES. WATCH THEIR TILES LIGHT UP AS YOU RACE TO SOLVE IT FIRST.',
  'theme-cozy':      'The same hidden word, six tries each. Race to solve it, glancing at their progress as you go.',
  'theme-champagne': 'A shared secret word and six guesses each — race your partner to solve it first.',
};

// ─── Per-theme card shell (matches Quick-Maths lobby) ──────────────────────────

const cardStyleByTheme = {
  'theme-pink': {
    background: 'rgba(255,247,251,0.82)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(251,113,133,0.28)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 32px 96px rgba(190,24,93,0.18), inset 0 1px 0 rgba(255,255,255,0.55)',
  },
  'theme-champagne': {
    background: 'var(--surface)',
    border: '1px solid var(--ring)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  'theme-arcade': {
    background: 'rgba(4,4,4,0.97)',
    border: '1px solid var(--ring)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 0 0 1px rgba(0,255,255,0.10), 0 0 48px rgba(0,255,255,0.06), 0 0 96px rgba(255,0,255,0.05)',
  },
  'theme-cozy': {
    background: 'rgba(16,8,2,0.90)',
    border: '1px solid rgba(205,144,64,0.26)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 32px 96px rgba(160,90,20,0.38), 0 0 0 1px rgba(205,144,64,0.12)',
  },
};

const iconStyleByTheme = {
  'theme-pink':      { background: 'var(--primary)', borderRadius: '50%',           boxShadow: '0 4px 22px rgba(190,24,93,0.38)',                       color: 'white' },
  'theme-champagne': { background: 'var(--primary)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',                                          color: 'var(--surface)' },
  'theme-arcade':    { background: 'var(--primary)', borderRadius: '0',             boxShadow: '0 0 18px var(--primary), 0 0 36px rgba(255,0,255,0.55)', color: '#000' },
  'theme-cozy':      { background: 'var(--primary)', borderRadius: 'var(--radius)', boxShadow: '0 4px 24px rgba(205,144,64,0.42)',                       color: 'var(--surface)' },
};

// ─── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const childVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Decorative letter tiles ────────────────────────────────────────────────────

const DecoTile = ({ className = '', letter }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" aria-hidden="true">
    <rect x="8" y="8" width="84" height="84" rx="14" stroke="currentColor" strokeWidth="8" />
    <text x="50" y="66" textAnchor="middle" fontSize="52" fontWeight="900" fill="currentColor" fontFamily="monospace">{letter}</text>
  </svg>
);

// ─── Room code display ─────────────────────────────────────────────────────────

const RoomCodeDisplay = ({ roomCode, isArcade }) => {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="mt-[1.25rem] border p-[1.25rem] text-center"
      style={{
        borderColor: isArcade ? 'rgba(0,255,255,0.22)' : 'var(--ring)',
        borderRadius: 'var(--radius)',
        background:   isArcade ? 'rgba(0,14,14,0.85)' : 'var(--surface-strong)',
        boxShadow:    isArcade ? '0 0 20px rgba(0,255,255,0.06)' : undefined,
      }}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        {isArcade ? 'ROOM CODE' : 'your room code'}
      </p>
      <div className="mt-[0.5rem] flex items-center justify-center gap-[0.75rem]">
        <span
          className="font-mono text-4xl font-black tracking-[0.42em]"
          style={{
            color: 'var(--primary)',
            ...(isArcade ? { textShadow: '0 0 14px var(--primary), 0 0 30px rgba(255,0,255,0.55)' } : {}),
          }}
        >
          {roomCode}
        </span>
        <motion.button
          type="button"
          onClick={doCopy}
          className="grid h-[2rem] w-[2rem] shrink-0 place-items-center border"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', color: copied ? 'var(--primary)' : 'var(--muted)', background: 'transparent' }}
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
        {isArcade ? 'WAITING FOR P2...' : 'waiting for your partner…'}
      </motion.p>
    </motion.div>
  );
};

// ─── Magnetic button ───────────────────────────────────────────────────────────

const MagneticButton = ({ children, strength = 0.28, disabled = false }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 380, damping: 28 });
  const sy = useSpring(y, { stiffness: 380, damping: 28 });
  const onMove  = (e) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width  / 2) * strength);
    y.set((e.clientY - rect.top  - rect.height / 2) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-flex' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
};

const btnBase =
  'inline-flex min-h-[2.75rem] items-center justify-center gap-[0.5rem] px-[1.75rem] py-[0.625rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

// ─── Lobby ─────────────────────────────────────────────────────────────────────

const WordRaceLobby = ({ onCreateRoom, onJoinRoom, isBusy, error, roomCode }) => {
  const { theme } = useTheme();
  const [mode, setMode]         = useState(null);
  const [joinCode, setJoinCode] = useState('');

  const isPink   = theme === 'theme-pink';
  const isArcade = theme === 'theme-arcade';
  const isCozy   = theme === 'theme-cozy';

  const eyebrow   = eyebrowByTheme[theme]   ?? eyebrowByTheme['theme-champagne'];
  const desc      = descByTheme[theme]      ?? descByTheme['theme-champagne'];
  const cardStyle = cardStyleByTheme[theme] ?? cardStyleByTheme['theme-champagne'];
  const iconStyle = iconStyleByTheme[theme] ?? iconStyleByTheme['theme-champagne'];

  const submitJoin = (e) => { e.preventDefault(); onJoinRoom(joinCode); };
  const back       = () => setMode(null);

  return (
    <main
      className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[36rem] items-center justify-center px-[1rem] py-[2.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {isArcade && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(255,0,255,0.07) 0%, rgba(0,255,255,0.04) 45%, transparent 80%)' }} />
      )}
      {isCozy && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(205,144,64,0.16) 0%, transparent 72%)' }} />
      )}

      <motion.section
        className="relative w-full overflow-hidden p-[2rem] text-center sm:p-[3rem]"
        style={cardStyle}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Deco watermarks */}
        <motion.div aria-hidden="true" style={{ position: 'absolute', bottom: -24, left: -24, pointerEvents: 'none', color: 'var(--primary)', opacity: isArcade ? 0.13 : 0.08, ...(isArcade ? { filter: 'drop-shadow(0 0 14px var(--primary))' } : {}) }}
          initial={{ opacity: 0, scale: 0.55, rotate: -18 }} animate={{ opacity: isArcade ? 0.13 : 0.08, scale: 1, rotate: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}>
          <DecoTile letter="W" className="h-[130px] w-[130px]" />
        </motion.div>
        <motion.div aria-hidden="true" style={{ position: 'absolute', top: -24, right: -24, pointerEvents: 'none', color: 'var(--accent)', opacity: isArcade ? 0.13 : 0.08, ...(isArcade ? { filter: 'drop-shadow(0 0 14px var(--accent))' } : {}) }}
          initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: isArcade ? 0.13 : 0.08, scale: 1 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}>
          <DecoTile letter="R" className="h-[130px] w-[130px]" />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
          {/* Icon */}
          <motion.div variants={childVariants} className="mx-auto grid place-items-center" style={{ ...iconStyle, width: '4rem', height: '4rem' }}>
            <Type style={{ width: '1.75rem', height: '1.75rem' }} />
          </motion.div>

          {/* Eyebrow */}
          <motion.p variants={childVariants} className="mt-[1.25rem] text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
            {eyebrow}
          </motion.p>

          {/* Title */}
          <motion.div variants={childVariants} className="mt-[0.5rem]">
            {isArcade ? (
              <h1 className="font-serif text-3xl font-medium sm:text-4xl" style={{ color: 'var(--foreground)', textShadow: '0 0 18px var(--primary), 0 0 38px rgba(255,0,255,0.42)' }}>
                <DecryptedText text="Word Race" speed={38} maxIterations={9} sequential revealDirection="start" />
              </h1>
            ) : isPink ? (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <SplitText text="Word Race" delay={44} duration={0.44} ease="backOut" splitType="chars" from={{ opacity: 0, scale: 0.52, y: 18 }} to={{ opacity: 1, scale: 1, y: 0 }} />
              </h1>
            ) : (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <BlurText text="Word Race" delay={68} animateBy="words" direction="top" />
              </h1>
            )}
          </motion.div>

          {/* Description */}
          <AnimatePresence>
            {!mode && (
              <motion.p
                variants={childVariants}
                className="mx-auto mt-[1rem] max-w-[22rem] text-sm leading-6 sm:text-base"
                style={{ color: 'var(--muted)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {desc}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Mode switcher ─────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {!mode && (
              <motion.div
                key="entry"
                className="mt-[2rem] flex flex-wrap items-center justify-center gap-[0.75rem]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
              >
                <MagneticButton disabled={isBusy}>
                  <motion.button
                    type="button"
                    onClick={onCreateRoom}
                    disabled={isBusy}
                    className={btnBase}
                    style={{
                      borderRadius: 'var(--radius)',
                      background: 'var(--primary)',
                      color: isArcade ? '#000' : 'var(--surface)',
                      boxShadow: isArcade ? '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.45)' : 'var(--shadow)',
                    }}
                    whileHover={isPink ? { scale: 1.06, y: -3 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-4 w-4" />
                    CREATE
                  </motion.button>
                </MagneticButton>

                <MagneticButton disabled={isBusy}>
                  <motion.button
                    type="button"
                    onClick={() => setMode('join')}
                    disabled={isBusy}
                    className={`${btnBase} border`}
                    style={{
                      borderRadius: 'var(--radius)',
                      borderColor: 'var(--ring)',
                      background: isArcade ? 'transparent' : 'var(--surface-strong)',
                      color: 'var(--foreground)',
                      ...(isArcade ? { boxShadow: '0 0 12px rgba(0,255,255,0.10)' } : {}),
                    }}
                    whileHover={isPink ? { scale: 1.04, y: -2 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <LogIn className="h-4 w-4" />
                    JOIN
                  </motion.button>
                </MagneticButton>
              </motion.div>
            )}

            {roomCode && !mode && (
              <RoomCodeDisplay roomCode={roomCode} isArcade={isArcade} />
            )}


            {/* ── JOIN flow ────────────────────────────────────────────────── */}
            {mode === 'join' && (
              <motion.div
                key="join"
                className="mt-[1.75rem] text-left"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mb-[0.625rem] text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                  {isArcade ? 'ENTER ROOM CODE' : 'enter room code'}
                </p>
                <form onSubmit={submitJoin} className="flex gap-[0.625rem]">
                  <button
                    type="button"
                    onClick={back}
                    className={`${btnBase} border`}
                    style={{
                      borderRadius: 'var(--radius)',
                      borderColor: 'var(--divider)',
                      background: 'transparent',
                      color: 'var(--muted)',
                      minWidth: 0,
                      padding: '0.625rem 1rem',
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="min-h-[2.75rem] flex-1 border px-[1rem] text-center text-lg font-bold uppercase tracking-[0.2em] outline-none transition focus:ring-2 focus:ring-[color:var(--ring)]"
                    style={{
                      borderColor: 'var(--divider)',
                      borderRadius: 'var(--radius)',
                      background: isArcade ? 'rgba(0,20,0,0.82)' : 'var(--surface)',
                      color: 'var(--foreground)',
                    }}
                    maxLength={6}
                    placeholder="ROOM"
                    aria-label="Room code"
                    autoFocus
                  />
                  <motion.button
                    type="submit"
                    disabled={isBusy || joinCode.trim().length < 4}
                    className={btnBase}
                    style={{
                      borderRadius: 'var(--radius)',
                      background: 'var(--primary)',
                      color: isArcade ? '#000' : 'var(--surface)',
                      boxShadow: isArcade ? '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.4)' : 'var(--shadow)',
                      minWidth: 0,
                      padding: '0.625rem 1.25rem',
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {isArcade ? 'JOIN' : isPink ? 'join' : 'Join'}
                  </motion.button>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="mt-[1rem] border px-[1rem] py-[0.75rem] text-sm"
                style={{ borderRadius: 'var(--radius)', borderColor: 'rgba(239,68,68,0.28)', background: 'rgba(239,68,68,0.06)', color: 'var(--muted)' }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.section>
    </main>
  );
};

export default WordRaceLobby;
