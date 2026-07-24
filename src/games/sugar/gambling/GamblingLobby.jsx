import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { LogIn, Plus, Copy, Check, ArrowLeft, Eye, Dices, Crown, Sparkles, Spade, Users, LogOut, Coins } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import DecryptedText from '../../../components/reactbits/DecryptedText';
import SplitText from '../../../components/reactbits/SplitText';
import BlurText from '../../../components/reactbits/BlurText';

const MODE_TITLE = { indian_poker: 'Indian Poker', dice_poker: 'Dice Poker', holdem: "Hold'em" };
const MODE_ICON = { indian_poker: Eye, dice_poker: Dices, holdem: Spade };

const descByThemeByMode = {
  indian_poker: {
    'theme-pink':      'See your opponents\' cards, never your own — stay or fold on the bluff~',
    'theme-arcade':    'SEE YOUR OPPONENTS\' CARDS, NEVER YOUR OWN. STAY OR FOLD ON THE BLUFF.',
    'theme-cozy':      'See your opponents\' cards, never your own — stay or fold on the bluff.',
    'theme-champagne': 'See your opponents\' cards, never your own — stay or fold on the bluff.',
  },
  dice_poker: {
    'theme-pink':      'Roll 5 dice, bet, reroll once, bet again — best poker hand takes the pot~',
    'theme-arcade':    'ROLL 5 DICE, BET, REROLL ONCE, BET AGAIN. BEST POKER HAND TAKES THE POT.',
    'theme-cozy':      'Roll 5 dice, bet, reroll once, bet again — best poker hand takes the pot.',
    'theme-champagne': 'Roll 5 dice, bet, reroll once, bet again — best poker hand takes the pot.',
  },
  holdem: {
    'theme-pink':      'Two hole cards, five shared cards, blinds and real betting — the classic~',
    'theme-arcade':    'TWO HOLE CARDS, FIVE SHARED CARDS, BLINDS AND REAL BETTING. THE CLASSIC.',
    'theme-cozy':      'Two hole cards, five shared cards, blinds and real betting — the classic.',
    'theme-champagne': 'Two hole cards, five shared cards, blinds and real betting — the classic.',
  },
};

const HAND_CAP_OPTIONS = [5, 8, 10];

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

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } } };
const childVariants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } } };
const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.24 } } };

const btnBase =
  'inline-flex min-h-[2.75rem] items-center justify-center gap-[0.5rem] px-[1.75rem] py-[0.625rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

// ─── Magnetic button ───────────────────────────────────────────────────────────

const MagneticButton = ({ children, strength = 0.28, disabled = false }) => {
  const ref = React.useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 380, damping: 28 });
  const sy = useSpring(y, { stiffness: 380, damping: 28 });
  const onMove = (e) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * strength);
    y.set((e.clientY - rect.top - rect.height / 2) * strength);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-flex' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
};

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
        background: isArcade ? 'rgba(0,14,14,0.85)' : 'var(--surface-strong)',
        boxShadow: isArcade ? '0 0 20px rgba(0,255,255,0.06)' : undefined,
      }}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
        {isArcade ? 'ROOM CODE' : 'your room code'}
      </p>
      <div className="mt-[0.5rem] flex items-center justify-center gap-[0.75rem]">
        <span
          className="font-mono text-4xl font-black tracking-[0.42em]"
          style={{ color: 'var(--primary)', ...(isArcade ? { textShadow: '0 0 14px var(--primary), 0 0 30px rgba(255,0,255,0.55)' } : {}) }}
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
    </motion.div>
  );
};

// ─── Waiting room — players list + host start control ──────────────────────────

const WaitingRoom = ({ room, playerId, isHost, onStartGame, onLeaveRoom, isBusy, isArcade }) => {
  const players = Array.isArray(room?.players) ? room.players : [];
  const canStart = isHost && players.length >= 2;

  return (
    <motion.div className="mt-[1.5rem] text-left" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26 }}>
      <RoomCodeDisplay roomCode={room.code} isArcade={isArcade} />

      <div className="mt-[1.25rem] flex items-center justify-center gap-[0.4rem]">
        <Users className="h-3.5 w-3.5" style={{ color: 'var(--muted)' }} />
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
          {players.length}/8 players joined · {room.starting_chips} chips each
          {(room.mode === 'dice_poker' || room.mode === 'holdem') && (
            room.end_mode === 'bust' ? ' · play until bust' : ` · ${room.hand_cap}-hand cap`
          )}
        </p>
      </div>

      <motion.div className="mt-[0.75rem] flex flex-col gap-[0.4rem]" variants={listVariants} initial="hidden" animate="show">
        {players.map((p) => (
          <motion.div
            key={p.id}
            variants={rowVariants}
            className="flex items-center gap-[0.625rem] border px-[0.875rem] py-[0.5rem]"
            style={{ borderRadius: 'var(--radius)', borderColor: p.id === playerId ? 'var(--primary)' : 'var(--divider)', background: 'var(--surface)' }}
          >
            {room.host_id === p.id
              ? <Crown className="h-4 w-4 shrink-0" style={{ color: 'var(--primary)' }} />
              : <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} />}
            <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              {p.name}{p.id === playerId ? ' (you)' : ''}
            </span>
            <span className="shrink-0 flex items-center gap-[0.25rem] text-xs font-bold" style={{ color: 'var(--muted)' }}>
              <Coins className="h-3 w-3" />{p.chips}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-[1.25rem] flex flex-col gap-[0.625rem]">
        {isHost ? (
          <motion.button
            type="button"
            onClick={onStartGame}
            disabled={!canStart || isBusy}
            className={`${btnBase} w-full`}
            style={{
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: isArcade ? '#000' : 'var(--surface)',
              boxShadow: isArcade ? '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.4)' : 'var(--shadow)',
            }}
            whileHover={canStart ? { scale: 1.02, y: -1 } : {}}
            whileTap={canStart ? { scale: 0.97 } : {}}
          >
            <Sparkles className="h-4 w-4" />
            Start Game
          </motion.button>
        ) : (
          <motion.p
            className="text-center text-xs"
            style={{ color: 'var(--muted)' }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          >
            Waiting for the host to start…
          </motion.p>
        )}
        {isHost && !canStart && (
          <p className="text-center text-[0.68rem]" style={{ color: 'var(--muted)' }}>Need at least 2 players to start.</p>
        )}
        <button
          type="button"
          onClick={onLeaveRoom}
          className={`${btnBase} border`}
          style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'transparent', color: 'var(--muted)' }}
        >
          <LogOut className="h-4 w-4" />
          Leave Table
        </button>
      </div>
    </motion.div>
  );
};

// ─── Lobby ─────────────────────────────────────────────────────────────────────

const GamblingLobby = ({
  mode,
  room,
  playerId,
  isHost,
  onBack,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  isBusy,
  error,
}) => {
  const { theme } = useTheme();
  const [entry, setEntry]       = useState(null); // null | 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [endMode, setEndMode]   = useState('hands'); // Dice Poker only: 'hands' | 'bust'
  const [handCap, setHandCap]   = useState(8);
  const inWaitingRoom = Boolean(room);

  const isPink   = theme === 'theme-pink';
  const isArcade = theme === 'theme-arcade';
  const isCozy   = theme === 'theme-cozy';
  const isDicePoker = mode === 'dice_poker';
  const isHoldem = mode === 'holdem';
  const hasEndModeConfig = isDicePoker || isHoldem;

  const descByTheme = descByThemeByMode[mode] ?? descByThemeByMode.indian_poker;
  const desc      = descByTheme[theme]      ?? descByTheme['theme-champagne'];
  const cardStyle = cardStyleByTheme[theme] ?? cardStyleByTheme['theme-champagne'];
  const iconStyle = iconStyleByTheme[theme] ?? iconStyleByTheme['theme-champagne'];
  const title     = MODE_TITLE[mode] ?? 'Gambling Corner';
  const ModeIcon  = MODE_ICON[mode] ?? Eye;

  const submitCreate = () => onCreateRoom(hasEndModeConfig ? { endMode, handCap } : {});

  const submitJoin = (e) => { e.preventDefault(); onJoinRoom(joinCode); };
  const back       = () => setEntry(null);

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[36rem] items-center justify-center px-[1rem] py-[2.5rem]" style={{ color: 'var(--foreground)' }}>
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
        <motion.div
          aria-hidden="true"
          style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, pointerEvents: 'none', color: 'var(--primary)', opacity: isArcade ? 0.13 : 0.08, ...(isArcade ? { filter: 'drop-shadow(0 0 14px var(--primary))' } : {}) }}
          initial={{ opacity: 0, scale: 0.55, rotate: -18 }} animate={{ opacity: isArcade ? 0.13 : 0.08, scale: 1, rotate: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        >
          <Spade aria-hidden="true" style={{ width: '100%', height: '100%' }} />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div variants={childVariants} className="mx-auto grid place-items-center" style={{ ...iconStyle, width: '4rem', height: '4rem' }}>
            <ModeIcon style={{ width: '1.75rem', height: '1.75rem' }} />
          </motion.div>

          <motion.p variants={childVariants} className="mt-[1.25rem] text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
            {isArcade ? title.toUpperCase() : title}
          </motion.p>

          <motion.div variants={childVariants} className="mt-[0.5rem]">
            {isArcade ? (
              <h1 className="font-serif text-3xl font-medium sm:text-4xl" style={{ color: 'var(--foreground)', textShadow: '0 0 18px var(--primary), 0 0 38px rgba(255,0,255,0.42)' }}>
                <DecryptedText text={title} speed={38} maxIterations={9} sequential revealDirection="start" />
              </h1>
            ) : isPink ? (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <SplitText text={title} delay={44} duration={0.44} ease="backOut" splitType="chars" from={{ opacity: 0, scale: 0.52, y: 18 }} to={{ opacity: 1, scale: 1, y: 0 }} />
              </h1>
            ) : (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <BlurText text={title} delay={68} animateBy="words" direction="top" />
              </h1>
            )}
          </motion.div>

          <AnimatePresence>
            {!entry && !inWaitingRoom && (
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

          {!inWaitingRoom && (
            <AnimatePresence mode="wait">
              {!entry && (
                <motion.div key="entry" className="mt-[2rem] flex flex-wrap items-center justify-center gap-[0.75rem]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                  <button
                    type="button"
                    onClick={onBack}
                    className={`${btnBase} border`}
                    style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'transparent', color: 'var(--muted)', minWidth: 0, padding: '0.625rem 1rem' }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <MagneticButton disabled={isBusy}>
                    <motion.button
                      type="button"
                      onClick={() => setEntry('create')}
                      disabled={isBusy}
                      className={btnBase}
                      style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.45)' : 'var(--shadow)' }}
                      whileHover={isPink ? { scale: 1.06, y: -3 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-4 w-4" />
                      {isArcade ? 'CREATE' : isPink ? 'create a table ♡' : 'Create a Table'}
                    </motion.button>
                  </MagneticButton>

                  <MagneticButton disabled={isBusy}>
                    <motion.button
                      type="button"
                      onClick={() => setEntry('join')}
                      disabled={isBusy}
                      className={`${btnBase} border`}
                      style={{ borderRadius: 'var(--radius)', borderColor: 'var(--ring)', background: isArcade ? 'transparent' : 'var(--surface-strong)', color: 'var(--foreground)', ...(isArcade ? { boxShadow: '0 0 12px rgba(0,255,255,0.10)' } : {}) }}
                      whileHover={isPink ? { scale: 1.04, y: -2 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <LogIn className="h-4 w-4" />
                      {isArcade ? 'JOIN' : isPink ? 'join a table ♡' : 'Join a Table'}
                    </motion.button>
                  </MagneticButton>
                </motion.div>
              )}

              {entry === 'create' && (
                <motion.div key="create" className="mt-[1.75rem] text-left" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26 }}>
                  <p className="mb-[1rem] text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    {isArcade ? 'TABLE SETTINGS' : 'table settings'}
                  </p>
                  <p className="text-sm leading-6" style={{ color: 'var(--muted)' }}>
                    {isHoldem
                      ? 'Every seat starts with 200 chips, blinds are 10/20 — 2 to 8 players.'
                      : `Every seat starts with 200 chips, ante is 20 chips a${isDicePoker ? ' hand' : ' round'} — 2 to 8 players.`}
                  </p>

                  {hasEndModeConfig && (
                    <div className="mt-[1.25rem]">
                      <p className="mb-[0.625rem] text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                        {isArcade ? 'HOW DOES THE TABLE END?' : 'how does the table end?'}
                      </p>
                      <div className="flex flex-wrap gap-[0.5rem]">
                        <button
                          type="button"
                          onClick={() => setEndMode('hands')}
                          className="border px-[0.875rem] py-[0.5rem] text-xs font-bold"
                          style={{
                            borderRadius: 'var(--radius)',
                            borderColor: endMode === 'hands' ? 'var(--primary)' : 'var(--divider)',
                            background: endMode === 'hands' ? 'var(--surface-strong)' : 'transparent',
                            color: 'var(--foreground)',
                          }}
                        >
                          Hand cap
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndMode('bust')}
                          className="border px-[0.875rem] py-[0.5rem] text-xs font-bold"
                          style={{
                            borderRadius: 'var(--radius)',
                            borderColor: endMode === 'bust' ? 'var(--primary)' : 'var(--divider)',
                            background: endMode === 'bust' ? 'var(--surface-strong)' : 'transparent',
                            color: 'var(--foreground)',
                          }}
                        >
                          All the way
                        </button>
                      </div>
                      <p className="mt-[0.375rem] text-[0.68rem]" style={{ color: 'var(--muted)' }}>
                        {endMode === 'hands' ? 'Most chips wins after the cap (~10-20 min).' : 'Play until someone runs out of chips.'}
                      </p>

                      {endMode === 'hands' && (
                        <div className="mt-[0.75rem] flex gap-[0.5rem]">
                          {HAND_CAP_OPTIONS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setHandCap(n)}
                              className="border px-[0.875rem] py-[0.5rem] text-xs font-bold"
                              style={{
                                borderRadius: 'var(--radius)',
                                borderColor: handCap === n ? 'var(--primary)' : 'var(--divider)',
                                background: handCap === n ? 'var(--surface-strong)' : 'transparent',
                                color: 'var(--foreground)',
                              }}
                            >
                              {n} hands
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-[1.25rem] flex gap-[0.625rem]">
                    <button type="button" onClick={back} className={`${btnBase} border`} style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'transparent', color: 'var(--muted)', minWidth: 0, padding: '0.625rem 1rem' }}>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <motion.button
                      type="button"
                      onClick={submitCreate}
                      disabled={isBusy}
                      className={`${btnBase} flex-1`}
                      style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.4)' : 'var(--shadow)' }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Plus className="h-4 w-4" />
                      {isArcade ? 'CREATE TABLE' : isPink ? 'create table ♡' : 'Create Table'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {entry === 'join' && (
                <motion.div key="join" className="mt-[1.75rem] text-left" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.26 }}>
                  <p className="mb-[0.625rem] text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>
                    {isArcade ? 'ENTER ROOM CODE' : 'enter room code'}
                  </p>
                  <form onSubmit={submitJoin} className="flex gap-[0.625rem]">
                    <button type="button" onClick={back} className={`${btnBase} border`} style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'transparent', color: 'var(--muted)', minWidth: 0, padding: '0.625rem 1rem' }}>
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="min-h-[2.75rem] flex-1 border px-[1rem] text-center text-lg font-bold uppercase tracking-[0.2em] outline-none transition focus:ring-2 focus:ring-[color:var(--ring)]"
                      style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', background: isArcade ? 'rgba(0,20,0,0.82)' : 'var(--surface)', color: 'var(--foreground)' }}
                      maxLength={6}
                      placeholder="ROOM"
                      aria-label="Room code"
                      autoFocus
                    />
                    <motion.button
                      type="submit"
                      disabled={isBusy || joinCode.trim().length < 4}
                      className={btnBase}
                      style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.4)' : 'var(--shadow)', minWidth: 0, padding: '0.625rem 1.25rem' }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {isArcade ? 'JOIN' : isPink ? 'join ♡' : 'Join'}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {inWaitingRoom && (
            <WaitingRoom room={room} playerId={playerId} isHost={isHost} onStartGame={onStartGame} onLeaveRoom={onLeaveRoom} isBusy={isBusy} isArcade={isArcade} />
          )}

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

export default GamblingLobby;
