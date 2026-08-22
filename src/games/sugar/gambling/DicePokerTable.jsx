import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Coins, Crown, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Home,
  RefreshCw, Sparkles, ThumbsDown, Lock,
} from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { evaluateHand, rankHandLabel } from './DicePokerRules';
import TableStatusBar from './TableStatusBar';

// Fixed/per-theme-tinted status colors — never a generic surface token (see
// Word Race's ABSENT_BY_THEME / Indian Poker's STAY_COLOR precedent).
const ACTIVE_COLOR = {
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
const ALLIN_COLOR = {
  'theme-pink':      '#c2410c',
  'theme-arcade':    '#ff8c39',
  'theme-cozy':      '#b3672c',
  'theme-champagne': '#b3672c',
};
const WIN_GLOW = {
  'theme-pink':      '0 0 0 2px #f59e0b, 0 6px 24px rgba(245,158,11,0.35)',
  'theme-arcade':    '0 0 0 2px #ffd400, 0 0 22px rgba(255,212,0,0.55), 0 0 44px rgba(255,0,255,0.3)',
  'theme-cozy':      '0 0 0 2px #d4a24c, 0 6px 20px rgba(212,162,76,0.32)',
  'theme-champagne': '0 0 0 2px #d4aa60, 0 6px 20px rgba(212,170,96,0.3)',
};
const TURN_GLOW = {
  'theme-pink':      '0 0 0 2px #16a34a, 0 4px 18px rgba(22,163,74,0.28)',
  'theme-arcade':    '0 0 0 2px #39ff9d, 0 0 18px rgba(57,255,157,0.4)',
  'theme-cozy':      '0 0 0 2px #5a8f4f, 0 4px 16px rgba(90,143,79,0.28)',
  'theme-champagne': '0 0 0 2px #15803d, 0 4px 16px rgba(21,128,61,0.25)',
};

const DIE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

const DieFace = ({ value, hidden, size = 'md', kept, onToggle, dim, index = 0 }) => {
  const dims = size === 'sm' ? '2rem' : size === 'lg' ? '3rem' : size === 'xl' ? 'clamp(2.75rem, 6vw, 4.25rem)' : '2.5rem';
  const Icon = value ? DIE_ICONS[value - 1] : Dice1;
  const clickable = Boolean(onToggle);
  return (
    <motion.button
      type="button"
      disabled={!clickable}
      onClick={onToggle}
      aria-label={hidden ? 'hidden die' : `die showing ${value}`}
      whileHover={clickable ? { scale: 1.08, y: -2 } : {}}
      whileTap={clickable ? { scale: 0.88, rotate: -6 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      className="relative grid place-items-center border"
      style={{
        width: dims,
        height: dims,
        borderRadius: '0.5rem',
        borderColor: kept ? 'var(--primary)' : 'var(--divider)',
        background: hidden ? 'repeating-linear-gradient(45deg, var(--surface-strong), var(--surface-strong) 5px, var(--surface) 5px, var(--surface) 10px)' : 'var(--surface)',
        color: 'var(--foreground)',
        opacity: dim ? 0.45 : 1,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {!hidden && (
        <motion.span
          key={value}
          className="grid place-items-center"
          style={{ width: '84%', height: '84%' }}
          initial={{ opacity: 0, scale: 0.3, rotate: -140 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 16, delay: index * 0.05 }}
        >
          <Icon style={{ width: '100%', height: '100%' }} />
        </motion.span>
      )}
      {kept && (
        <span className="absolute -bottom-1.5 -right-1.5 grid place-items-center rounded-full" style={{ width: '1rem', height: '1rem', background: 'var(--primary)', color: 'var(--surface)' }}>
          <Lock style={{ width: '0.6rem', height: '0.6rem' }} />
        </span>
      )}
    </motion.button>
  );
};

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

const PlayerSeat = ({
  player, isMe, dice, isCurrentActor, isFolded, isAllIn, committed, isWinner,
  revealDice, theme, showHandLabel, keepMask, onToggleKeep, canPickReroll,
}) => {
  const busted = (player.chips ?? 0) <= 0;
  const hideDice = dice === undefined ? true : (!isMe && !revealDice);
  const hand = revealDice && dice ? evaluateHand(dice) : null;

  // Below ~860px (roughly "half a laptop screen"), the seat grid collapses
  // to one column — reorder so the OPPONENT'S seat lands first/on top and
  // your own drops below it, since reading the opponent is the higher-value
  // glance at that size. Your own dice stay fully present and tappable
  // (reroll needs to see + tap them), just visually secondary.
  const smallScreenOrder = isMe ? 'max-[860px]:order-2' : 'max-[860px]:order-1';

  return (
    <motion.div
      variants={seatVariants}
      data-player-seat={player.id}
      data-player-name={player.name}
      className={`relative flex flex-col items-center justify-center gap-[1rem] border px-[1.5rem] py-[2rem] ${smallScreenOrder}`}
      style={{
        borderRadius: 'var(--radius)',
        borderColor: isMe ? 'var(--primary)' : 'var(--divider)',
        background: 'var(--surface)',
        opacity: busted ? 0.5 : isFolded ? 0.65 : 1,
        minHeight: '18rem',
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
      {isCurrentActor && !isWinner && (
        <motion.div
          aria-hidden="true"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
          style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius)', boxShadow: TURN_GLOW[theme] ?? TURN_GLOW['theme-champagne'], pointerEvents: 'none' }}
        />
      )}

      {/* Below ~480px, five dice at a legible size no longer fit in a row —
          rather than keep shrinking them into unreadable/untappable specks,
          the row becomes a smooth, snap-scrollable strip so every die stays
          a real size. */}
      <div
        className="flex w-full justify-center gap-[0.5rem] max-[480px]:snap-x max-[480px]:snap-mandatory max-[480px]:justify-start max-[480px]:overflow-x-auto max-[480px]:scroll-smooth max-[480px]:pb-[0.375rem]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {(dice ?? [undefined, undefined, undefined, undefined, undefined]).map((v, i) => (
          <div key={i} className="shrink-0 max-[480px]:snap-start">
            <DieFace
              index={i}
              value={v}
              hidden={hideDice}
              size="xl"
              kept={canPickReroll ? keepMask?.[i] : undefined}
              onToggle={canPickReroll ? () => onToggleKeep(i) : undefined}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-[0.5rem]">
        {isWinner && <Crown className="h-5 w-5" style={{ color: 'var(--primary)' }} />}
        <span className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
          {player.name}{isMe ? ' (you)' : ''}
        </span>
      </div>

      <span className="flex items-center gap-[0.375rem] text-sm font-bold" style={{ color: 'var(--muted)' }}>
        <Coins className="h-4 w-4" /><AnimatedChips value={player.chips} />
        {committed > 0 && <span style={{ color: ACTIVE_COLOR[theme] ?? ACTIVE_COLOR['theme-champagne'] }}>&nbsp;(+{committed})</span>}
      </span>

      {hand && showHandLabel && (
        <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--primary)' }}>
          {rankHandLabel(hand)}
        </span>
      )}

      {busted ? (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: FOLD_COLOR[theme] ?? FOLD_COLOR['theme-champagne'] }}>Out</span>
      ) : isFolded ? (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: FOLD_COLOR[theme] ?? FOLD_COLOR['theme-champagne'] }}>Folded</span>
      ) : isAllIn ? (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ALLIN_COLOR[theme] ?? ALLIN_COLOR['theme-champagne'] }}>All In</span>
      ) : isCurrentActor ? (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: ACTIVE_COLOR[theme] ?? ACTIVE_COLOR['theme-champagne'] }}>Their Turn</span>
      ) : (
        <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--muted)' }} />
      )}
    </motion.div>
  );
};

const tableGridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const btnBase =
  'inline-flex min-h-[2.75rem] items-center justify-center gap-[0.5rem] px-[1.5rem] text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

const DicePokerTable = ({ room, playerId, onBetAction, onRerollCommit, onDealNextHand, onLeave, onExit }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isPink   = theme === 'theme-pink';

  const players = useMemo(() => (Array.isArray(room?.players) ? room.players : []), [room?.players]);
  const dice = room?.dice ?? {};
  const betting = room?.betting ?? {};
  const folded = betting.folded ?? {};
  const allIn = betting.allIn ?? {};
  const committed = betting.committed ?? {};
  const winnerIds = room?.winner_ids ?? [];
  const rerollDone = room?.reroll_done ?? {};

  const myPlayer = players.find((p) => p.id === playerId);
  const isHost = room?.host_id === playerId;
  const isFinished = room?.status === 'finished';
  const phase = room?.dice_phase ?? 'idle';
  const isBetting = phase === 'bet1' || phase === 'bet2';
  const isReroll = phase === 'reroll';
  const isShowdown = phase === 'showdown';
  const isMyTurn = isBetting && betting.currentActor === playerId;
  const iAmDealtIn = playerId in dice;
  const iAmFolded = Boolean(folded[playerId]);
  const iAmAllIn = Boolean(allIn[playerId]);

  const toCall = betting.toCall ?? 0;
  const myCommitted = committed[playerId] ?? 0;
  const needToCall = toCall - myCommitted;
  const myChips = myPlayer?.chips ?? 0;

  const [keepMask, setKeepMask] = useState([false, false, false, false, false]);
  const [raiseAmount, setRaiseAmount] = useState(room?.ante ?? 20);

  useEffect(() => { setKeepMask([false, false, false, false, false]); }, [phase, room?.hands_played]);
  useEffect(() => { setRaiseAmount(room?.ante ?? 20); }, [phase, betting.currentActor]);

  const iHaveCommittedReroll = Boolean(rerollDone[playerId]);
  const canPickReroll = isReroll && iAmDealtIn && !iAmFolded && !iHaveCommittedReroll;

  const toggleKeep = (i) => setKeepMask((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  const confirmReroll = () => onRerollCommit(keepMask);

  const tableWinner = isFinished
    ? players.reduce((best, p) => (!best || (p.chips ?? 0) > (best.chips ?? 0) ? p : best), null)
    : null;

  const handModeLabel = room?.end_mode === 'bust'
    ? 'Play until someone busts'
    : `Hand ${Math.min((room?.hands_played ?? 0) + (isShowdown || isFinished ? 0 : 1), room?.hand_cap ?? 8)} of ${room?.hand_cap ?? 8}`;

  return (
    <div className="mx-auto max-w-[84rem] px-[1rem] pb-[3rem]" style={{ color: 'var(--foreground)' }}>
      <TableStatusBar code={room?.code} onLeave={onLeave} showLeave={!isFinished} />

      <div className="mb-[1.5rem] flex flex-col items-center gap-[0.375rem]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
          Dice Poker · {handModeLabel}
        </p>
        <div className="flex items-center gap-[0.5rem] border px-[1.25rem] py-[0.625rem]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--ring)', background: 'var(--surface)' }}>
          <Coins className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <span className="text-lg font-black"><AnimatedChips value={room?.pot ?? 0} /></span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>pot</span>
          <span className="mx-[0.5rem] h-4 w-px" style={{ background: 'var(--divider)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>ante {room?.ante ?? 20}</span>
          {isBetting && (
            <>
              <span className="mx-[0.5rem] h-4 w-px" style={{ background: 'var(--divider)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>to call {toCall}</span>
            </>
          )}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-[1.5rem] max-[860px]:grid-cols-1"
        variants={tableGridVariants}
        initial="hidden"
        animate="show"
      >
        {players.map((p) => (
          <PlayerSeat
            key={p.id}
            player={p}
            isMe={p.id === playerId}
            dice={dice[p.id]}
            isCurrentActor={isBetting && betting.currentActor === p.id}
            isFolded={Boolean(folded[p.id])}
            isAllIn={Boolean(allIn[p.id])}
            committed={committed[p.id] ?? 0}
            isWinner={winnerIds.includes(p.id)}
            revealDice={isShowdown || isFinished}
            showHandLabel={isShowdown || isFinished}
            theme={theme}
            keepMask={p.id === playerId ? keepMask : undefined}
            onToggleKeep={toggleKeep}
            canPickReroll={p.id === playerId && canPickReroll}
          />
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {isBetting && !isFinished && (
          <motion.div key="betting" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {!iAmDealtIn ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You're sitting out this hand.</p>
            ) : iAmFolded ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You folded — waiting for the hand to finish…</p>
            ) : iAmAllIn ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You're all in — waiting on the rest of the table…</p>
            ) : !isMyTurn ? (
              <motion.p className="text-sm" style={{ color: 'var(--muted)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                Waiting for {players.find((p) => p.id === betting.currentActor)?.name ?? 'the next player'}…
              </motion.p>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-[0.625rem]">
                {needToCall <= 0 ? (
                  <motion.button type="button" onClick={() => onBetAction('check')} className={`${btnBase} border`} style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', color: 'var(--foreground)', background: 'transparent' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                    Check
                  </motion.button>
                ) : (
                  <motion.button type="button" onClick={() => onBetAction('call')} className={btnBase} style={{ borderRadius: 'var(--radius)', background: ACTIVE_COLOR[theme] ?? ACTIVE_COLOR['theme-champagne'], color: '#fff' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                    Call {Math.min(needToCall, myChips)}
                  </motion.button>
                )}

                <div className="flex items-center gap-[0.375rem] border px-[0.75rem] py-[0.375rem]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)' }}>
                  <input
                    type="range"
                    className="dice-poker-slider"
                    min={betting.minRaise ?? room?.ante ?? 20}
                    max={Math.max(myChips - Math.max(needToCall, 0), betting.minRaise ?? 20)}
                    step={5}
                    value={Math.min(raiseAmount, Math.max(myChips - Math.max(needToCall, 0), 1))}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    style={{ width: '6rem' }}
                    disabled={myChips - Math.max(needToCall, 0) <= 0}
                  />
                  <span className="w-[2.5rem] text-center text-sm font-bold" style={{ color: 'var(--foreground)' }}>{raiseAmount}</span>
                </div>

                <motion.button
                  type="button"
                  onClick={() => onBetAction(toCall > 0 ? 'raise' : 'bet', raiseAmount)}
                  disabled={myChips - Math.max(needToCall, 0) <= 0}
                  className={btnBase}
                  style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary)' : 'var(--shadow)' }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Sparkles className="h-4 w-4" />
                  {toCall > 0 ? 'Raise' : 'Bet'}
                </motion.button>

                <motion.button type="button" onClick={() => onBetAction('all-in')} className={`${btnBase} border`} style={{ borderRadius: 'var(--radius)', borderColor: ALLIN_COLOR[theme] ?? ALLIN_COLOR['theme-champagne'], color: ALLIN_COLOR[theme] ?? ALLIN_COLOR['theme-champagne'], background: 'transparent' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                  All In
                </motion.button>

                <motion.button type="button" onClick={() => onBetAction('fold')} className={`${btnBase} border`} style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', color: FOLD_COLOR[theme] ?? FOLD_COLOR['theme-champagne'], background: 'transparent' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                  <ThumbsDown className="h-4 w-4" />
                  Fold
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {isReroll && !isFinished && (
          <motion.div key="reroll" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            {!iAmDealtIn ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You're sitting out this hand.</p>
            ) : iAmFolded ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>You folded — waiting for the hand to finish…</p>
            ) : iHaveCommittedReroll ? (
              <motion.p className="text-sm" style={{ color: 'var(--muted)' }} animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                Waiting on the rest of the table to reroll…
              </motion.p>
            ) : (
              <>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Tap dice to keep them — everything else rerolls once.</p>
                <motion.button type="button" onClick={confirmReroll} className={btnBase} style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary)' : 'var(--shadow)' }} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
                  <RefreshCw className="h-4 w-4" />
                  Confirm Reroll
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {isShowdown && !isFinished && (
          <motion.div key="showdown" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              {winnerIds.length === 0
                ? 'No winner this hand.'
                : winnerIds.length === 1
                ? `${players.find((p) => p.id === winnerIds[0])?.name ?? 'A player'} takes the pot!`
                : `Split pot: ${winnerIds.map((id) => players.find((p) => p.id === id)?.name ?? '').join(' & ')}`}
            </p>
            {isHost ? (
              <motion.button type="button" onClick={onDealNextHand} className={btnBase} style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 14px var(--primary)' : 'var(--shadow)' }} whileHover={isPink ? { scale: 1.06, y: -3 } : { y: -2 }} whileTap={{ scale: 0.96 }}>
                <Sparkles className="h-4 w-4" />
                Deal Next Hand
              </motion.button>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Waiting for the host to deal the next hand…</p>
            )}
          </motion.div>
        )}

        {isFinished && (
          <motion.div key="finished" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Crown className="h-8 w-8" style={{ color: 'var(--primary)' }} />
            <p className="text-lg font-black">
              {tableWinner ? `${tableWinner.name} wins the table!` : 'Game over.'}
            </p>
            <motion.button type="button" onClick={onExit} className={btnBase} style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)' }} whileHover={isPink ? { scale: 1.06, y: -3 } : { y: -2 }} whileTap={{ scale: 0.96 }}>
              <Home className="h-4 w-4" />
              Back Home
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DicePokerTable;
