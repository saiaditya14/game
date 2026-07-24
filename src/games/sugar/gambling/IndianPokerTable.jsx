import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Coins, Crown, EyeOff, Gamepad2, Home, LogOut, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { canAffordAnte } from './IndianPokerRules';

// Fixed/per-theme-tinted status colors — never a generic surface token, or
// they wash out in some themes (see the Word Race ABSENT_BY_THEME lesson).
const STAY_COLOR = {
  'theme-pink':      '#16a34a',
  'theme-arcade':    '#39ff9d',
  'theme-cozy':      '#5a8f4f',
  'theme-champagne': '#15803d',
};
const FOLD_COLOR = {
  'theme-pink':      '#94748a',
  'theme-arcade':    '#7a5a8f',
  'theme-cozy':      '#7a6a55',
  'theme-champagne': '#8a8072',
};
const WIN_GLOW = {
  'theme-pink':      '0 0 0 2px #f59e0b, 0 6px 24px rgba(245,158,11,0.35)',
  'theme-arcade':    '0 0 0 2px #ffd400, 0 0 22px rgba(255,212,0,0.55), 0 0 44px rgba(255,0,255,0.3)',
  'theme-cozy':      '0 0 0 2px #d4a24c, 0 6px 20px rgba(212,162,76,0.32)',
  'theme-champagne': '0 0 0 2px #d4aa60, 0 6px 20px rgba(212,170,96,0.3)',
};

// A real 3D flip — the reveal moment is the entire point of Indian Poker, so
// the card-back → face transition gets a proper turn instead of a hard swap.
// Framer Motion only animates `animate` prop CHANGES, so the very first
// render (mount) snaps straight to the correct side with no spurious flip.
const CardFace = ({ rank, hidden, small }) => {
  const label = rank >= 11 ? { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' }[rank] : String(rank);
  const size = small ? { w: '2.75rem', h: '3.75rem', font: '1.1rem' } : { w: '3.75rem', h: '5.25rem', font: '1.6rem' };

  return (
    <div style={{ perspective: '600px', width: size.w, height: size.h }}>
      <motion.div
        animate={{ rotateY: hidden ? 0 : 180 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
      >
        <div
          className="grid place-items-center border"
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '0.5rem',
            borderColor: 'var(--divider)',
            background: 'repeating-linear-gradient(45deg, var(--surface-strong), var(--surface-strong) 6px, var(--surface) 6px, var(--surface) 12px)',
          }}
        >
          <EyeOff className="h-4 w-4" style={{ color: 'var(--muted)' }} />
        </div>
        <div
          className="grid place-items-center border font-black"
          style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            borderRadius: '0.5rem', borderColor: 'var(--ring)', background: 'var(--surface)', color: 'var(--foreground)', fontSize: size.font,
          }}
        >
          {label}
        </div>
      </motion.div>
    </div>
  );
};

// Ticks a chip total up/down with a spring instead of snapping the digits —
// sells the "you just won/paid chips" moment.
const AnimatedChips = ({ value }) => {
  const spring = useSpring(value, { stiffness: 120, damping: 22 });
  useEffect(() => { spring.set(value); }, [value, spring]);
  const rounded = useTransform(spring, (v) => Math.round(v));
  return <motion.span>{rounded}</motion.span>;
};

const seatVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
};

const PlayerSeat = ({ player, isMe, cardRank, decision, isWinner, revealAll, isArcade, theme }) => {
  const folded = decision === 'fold';
  const busted = (player.chips ?? 0) <= 0;
  const hideCard = cardRank === undefined ? true : (isMe && !revealAll);
  return (
    <motion.div
      variants={seatVariants}
      className="relative flex flex-col items-center gap-[0.5rem] border px-[1rem] py-[1rem]"
      style={{
        borderRadius: 'var(--radius)',
        borderColor: isMe ? 'var(--primary)' : 'var(--divider)',
        background: 'var(--surface)',
        opacity: busted ? 0.5 : folded ? 0.7 : 1,
      }}
    >
      {isWinner && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 15 }}
          style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius)', boxShadow: WIN_GLOW[theme] ?? WIN_GLOW['theme-champagne'], pointerEvents: 'none' }}
        />
      )}
      <CardFace rank={cardRank} hidden={hideCard} />
      <div className="flex items-center gap-[0.375rem]">
        {isWinner && <Crown className="h-3.5 w-3.5" style={{ color: 'var(--primary)' }} />}
        <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
          {player.name}{isMe ? ' (you)' : ''}
        </span>
      </div>
      <span className="flex items-center gap-[0.25rem] text-xs font-bold" style={{ color: 'var(--muted)' }}>
        <Coins className="h-3 w-3" /><AnimatedChips value={player.chips} />
      </span>
      {busted ? (
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: FOLD_COLOR[theme] ?? FOLD_COLOR['theme-champagne'] }}>Out</span>
      ) : decision === 'stay' ? (
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: STAY_COLOR[theme] ?? STAY_COLOR['theme-champagne'] }}>Stayed</span>
      ) : decision === 'fold' ? (
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: FOLD_COLOR[theme] ?? FOLD_COLOR['theme-champagne'] }}>Folded</span>
      ) : (
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }} />
      )}
    </motion.div>
  );
};

const tableGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const IndianPokerTable = ({ room, playerId, onDecide, onDealNextRound, onLeave, onExit }) => {
  const { theme, setTheme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isPink   = theme === 'theme-pink';
  const themes = [{ id: 'theme-champagne', label: 'Champagne' }, { id: 'theme-pink', label: 'Pink' }, { id: 'theme-arcade', label: 'Arcade' }, { id: 'theme-cozy', label: 'Cozy' }];

  const players = useMemo(() => (Array.isArray(room?.players) ? room.players : []), [room?.players]);
  const hands = room?.hands ?? {};
  const decisions = room?.decisions ?? {};
  const winnerIds = room?.winner_ids ?? [];
  const myPlayer = players.find((p) => p.id === playerId);
  const isHost = room?.host_id === playerId;
  const isRevealed = room?.round_phase === 'revealed';
  const isDealt = room?.round_phase === 'dealt';
  const iAmDealtIn = playerId in hands;
  const iHaveDecided = Boolean(decisions[playerId]);
  const canAfford = canAffordAnte(myPlayer, room?.ante ?? 20);
  const isFinished = room?.status === 'finished';

  const tableWinner = isFinished ? players.find((p) => (p.chips ?? 0) > 0) : null;

  return (
    <div className="mx-auto max-w-[64rem] px-[1rem] pb-[3rem]" style={{ color: 'var(--foreground)' }}>
      <nav className="flex flex-wrap items-center justify-between gap-[0.75rem] py-[1.25rem]">
        <Link to="/" className="flex items-center gap-[0.5rem] no-underline" style={{ color: 'var(--foreground)' }}>
          <span className="grid place-items-center" style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)' }}>
            <Gamepad2 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold">Lovelyland</span>
        </Link>
        <div className="flex items-center gap-[0.5rem]">
          {room?.code && (
            <button type="button" onClick={() => navigator.clipboard?.writeText(room.code)} className="border px-[0.75rem] py-[0.375rem] text-xs font-bold uppercase tracking-[0.14em]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--muted)' }}>
              {room.code}
            </button>
          )}
          <label className="flex items-center gap-[0.375rem] border px-[0.625rem] py-[0.375rem]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)' }}>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-transparent text-xs font-bold outline-none" style={{ color: 'var(--foreground)' }}>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          {!isFinished ? (
            <button type="button" onClick={onLeave} className="grid place-items-center border" style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius)', borderColor: 'var(--divider)', color: 'var(--muted)' }} aria-label="Leave table">
              <LogOut className="h-4 w-4" />
            </button>
          ) : null}
          <Link to="/" className="grid place-items-center border" style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius)', borderColor: 'var(--divider)', color: 'var(--muted)' }} aria-label="Home">
            <Home className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <div className="mb-[1.5rem] flex flex-col items-center gap-[0.375rem]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>Indian Poker</p>
        <div className="flex items-center gap-[0.5rem] border px-[1.25rem] py-[0.625rem]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--ring)', background: 'var(--surface)' }}>
          <Coins className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <span className="text-lg font-black"><AnimatedChips value={room?.pot ?? 0} /></span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>pot</span>
          <span className="mx-[0.5rem] h-4 w-px" style={{ background: 'var(--divider)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>ante {room?.ante ?? 20}</span>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-[1rem] sm:grid-cols-3 md:grid-cols-4"
        variants={tableGridVariants}
        initial="hidden"
        animate="show"
      >
        {players.map((p) => (
          <PlayerSeat
            key={p.id}
            player={p}
            isMe={p.id === playerId}
            cardRank={hands[p.id]}
            decision={decisions[p.id]}
            isWinner={winnerIds.includes(p.id)}
            revealAll={isRevealed || isFinished}
            isArcade={isArcade}
            theme={theme}
          />
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {isDealt && !isFinished && (
          <motion.div key="decide" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {!iAmDealtIn ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You're sitting out this round (not enough chips for the ante).</p>
            ) : iHaveDecided ? (
              <motion.p className="text-sm" style={{ color: 'var(--muted)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                Waiting on the rest of the table…
              </motion.p>
            ) : (
              <div className="flex gap-[0.75rem]">
                <motion.button
                  type="button"
                  onClick={() => onDecide('stay')}
                  disabled={!canAfford}
                  className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] px-[1.75rem] text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderRadius: 'var(--radius)', background: STAY_COLOR[theme] ?? STAY_COLOR['theme-champagne'], color: '#fff' }}
                  whileHover={canAfford ? (isPink ? { scale: 1.06, y: -3 } : isArcade ? { scale: 1.04 } : { y: -2 }) : {}}
                  whileTap={canAfford ? { scale: 0.96 } : {}}
                >
                  <ThumbsUp className="h-4 w-4" />
                  Stay ({room?.ante ?? 20})
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => onDecide('fold')}
                  className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] border px-[1.75rem] text-sm font-bold"
                  style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', color: 'var(--foreground)', background: 'transparent' }}
                  whileHover={isPink ? { scale: 1.04, y: -2 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <ThumbsDown className="h-4 w-4" />
                  Fold
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {isRevealed && !isFinished && (
          <motion.div key="reveal" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              {winnerIds.length === 0
                ? 'Everyone folded — no winner this round.'
                : winnerIds.length === 1
                ? `${players.find((p) => p.id === winnerIds[0])?.name ?? 'A player'} takes the pot!`
                : `Split pot: ${winnerIds.map((id) => players.find((p) => p.id === id)?.name ?? '').join(' & ')}`}
            </p>
            {isHost ? (
              <motion.button
                type="button"
                onClick={onDealNextRound}
                className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] px-[1.75rem] text-sm font-bold"
                style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary)' : 'var(--shadow)' }}
                whileHover={isPink ? { scale: 1.06, y: -3 } : isArcade ? { scale: 1.04 } : { y: -2 }}
                whileTap={{ scale: 0.96 }}
              >
                <Sparkles className="h-4 w-4" />
                Deal Next Round
              </motion.button>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Waiting for the host to deal the next round…</p>
            )}
          </motion.div>
        )}

        {isFinished && (
          <motion.div key="finished" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Crown className="h-8 w-8" style={{ color: 'var(--primary)' }} />
            <p className="text-lg font-black">
              {tableWinner ? `${tableWinner.name} wins the table!` : 'Game over.'}
            </p>
            <motion.button
              type="button"
              onClick={onExit}
              className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] px-[1.75rem] text-sm font-bold"
              style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)' }}
              whileHover={isPink ? { scale: 1.06, y: -3 } : isArcade ? { scale: 1.04 } : { y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <Home className="h-4 w-4" />
              Back Home
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IndianPokerTable;
