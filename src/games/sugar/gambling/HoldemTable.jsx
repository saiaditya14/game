import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { Coins, Crown, Home, Sparkles, ThumbsDown } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { resolveHoldemShowdown, handLabel } from './HoldemRules';
import { CardArt, CARD_BACK_ID, cardSymbolId } from './cardArt';
import TableStatusBar from './TableStatusBar';

// Fixed/per-theme-tinted status colors — matches Indian Poker / Dice Poker's
// precedent (never a generic surface token).
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

const STREET_LABEL = { idle: 'Waiting', preflop: 'Pre-Flop', flop: 'Flop', turn: 'Turn', river: 'River', showdown: 'Showdown' };
const COMMUNITY_COUNT = { idle: 0, preflop: 0, flop: 3, turn: 4, river: 5, showdown: 5 };

// A real 3D flip, same precedent as Indian Poker's CardFace — the reveal is
// the point, so back->face is a proper rotateY turn, not a hard swap. Faces
// are real vector card art (see cardArt.js) instead of a hand-drawn box.
// `vw`-only sizing grows cards purely off viewport WIDTH, which on a wide
// but not-that-tall screen made cards tall enough (locked to the card aspect
// ratio) to eat the flex spacer's slack and visually collide with the seats
// below. `min(vw, vh)` caps growth by whichever dimension is tighter.
const CardFace = ({ card, hidden, small, faceDown }) => {
  const width = small ? 'clamp(3rem, min(8vw, 9vh), 5.5rem)' : 'clamp(3.25rem, min(11vw, 12vh), 8.5rem)';

  return (
    <div style={{ perspective: '600px', width, aspectRatio: '169.075 / 244.64' }}>
      <motion.div
        animate={{ rotateY: hidden || faceDown ? 0 : 180 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
      >
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
          <CardArt symbolId={CARD_BACK_ID} width="100%" />
        </div>
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          {card && <CardArt symbolId={cardSymbolId(card)} width="100%" />}
        </div>
      </motion.div>
    </div>
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
  player, isMe, holeCards, isButton, isSmallBlind, isBigBlind, isCurrentActor,
  isFolded, isAllIn, committed, isWinner, revealCards, handLabelText, theme,
}) => {
  const busted = (player.chips ?? 0) <= 0;
  const hideCards = !holeCards ? true : (!isMe && !revealCards);

  return (
    <motion.div
      variants={seatVariants}
      data-player-seat={player.id}
      data-player-name={player.name}
      className="relative flex flex-col items-center justify-center gap-[0.875rem] border px-[1.5rem] py-[1.75rem]"
      style={{
        borderRadius: 'var(--radius)',
        borderColor: isMe ? 'var(--primary)' : 'var(--divider)',
        background: 'var(--surface)',
        opacity: busted ? 0.5 : isFolded ? 0.6 : 1,
        minHeight: '16rem',
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

      {(isButton || isSmallBlind || isBigBlind) && (
        <span
          className="absolute -top-2 -left-2 grid place-items-center rounded-full text-[0.55rem] font-black"
          style={{
            width: '1.35rem', height: '1.35rem', background: 'var(--primary)',
            color: theme === 'theme-arcade' ? '#000' : 'var(--surface)',
            zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          }}
        >
          {isButton ? 'D' : isBigBlind ? 'BB' : 'SB'}
        </span>
      )}

      <div className="flex gap-[0.5rem]">
        <CardFace card={holeCards?.[0]} hidden={hideCards} />
        <CardFace card={holeCards?.[1]} hidden={hideCards} />
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

      {handLabelText && (
        <span className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--primary)' }}>
          {handLabelText}
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

const tableGridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const communityVariants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const cardPop = {
  hidden: { opacity: 0, scale: 0.5, y: -10, rotate: -8 },
  show: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 320, damping: 18 } },
};

const btnBase = 'inline-flex min-h-[2.75rem] items-center justify-center gap-[0.5rem] px-[1.5rem] text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50';

const HoldemTable = ({ room, playerId, onBetAction, onDealNextHand, onLeave, onExit }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isPink   = theme === 'theme-pink';

  const players = useMemo(() => (Array.isArray(room?.players) ? room.players : []), [room?.players]);
  const holeCards = room?.hole_cards ?? {};
  const communityCards = room?.community_cards ?? [];
  const betting = room?.betting ?? {};
  const folded = betting.folded ?? {};
  const allIn = betting.allIn ?? {};
  const committed = betting.committed ?? {};
  const winnerIds = room?.winner_ids ?? [];

  const myPlayer = players.find((p) => p.id === playerId);
  const isHost = room?.host_id === playerId;
  const isFinished = room?.status === 'finished';
  const phase = room?.holdem_phase ?? 'idle';
  const isBetting = phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river';
  const isShowdown = phase === 'showdown';
  const isMyTurn = isBetting && betting.currentActor === playerId;
  const iAmDealtIn = playerId in holeCards;
  const iAmFolded = Boolean(folded[playerId]);
  const iAmAllIn = Boolean(allIn[playerId]);

  const toCall = betting.toCall ?? 0;
  const myCommitted = committed[playerId] ?? 0;
  const needToCall = toCall - myCommitted;
  const myChips = myPlayer?.chips ?? 0;
  const bigBlind = room?.ante ?? 20;
  const smallBlind = Math.max(1, Math.floor(bigBlind / 2));

  const [raiseAmount, setRaiseAmount] = useState(bigBlind);
  useEffect(() => { setRaiseAmount(bigBlind); }, [phase, betting.currentActor, bigBlind]);

  // `buttonOrder` (button-first seat order for the CURRENT hand) is carried
  // on the betting object by dealHoldemRound/advanceStreetBetting — reuse it
  // directly for the D/SB/BB seat badges instead of re-deriving seat roles.
  const buttonOrder = betting.buttonOrder ?? [];
  const headsUp = buttonOrder.length === 2;
  const buttonId = buttonOrder[0];
  const smallBlindId = headsUp ? buttonOrder[0] : buttonOrder[1];
  const bigBlindId = headsUp ? buttonOrder[1] : buttonOrder[2];

  const visibleCommunityCount = COMMUNITY_COUNT[phase] ?? 0;
  const shownCommunity = communityCards.slice(0, visibleCommunityCount);

  const revealAtShowdown = isShowdown || isFinished;
  const showdownHands = useMemo(() => {
    if (!revealAtShowdown) return {};
    return resolveHoldemShowdown({ holeCards, communityCards, folded }).hands;
  }, [revealAtShowdown, holeCards, communityCards, folded]);

  const contendersLeft = players.filter((p) => p.id in holeCards && !folded[p.id]).length;

  const tableWinner = isFinished
    ? players.reduce((best, p) => (!best || (p.chips ?? 0) > (best.chips ?? 0) ? p : best), null)
    : null;

  const handModeLabel = room?.end_mode === 'bust'
    ? 'Play until someone busts'
    : `Hand ${Math.min((room?.hands_played ?? 0) + (isShowdown || isFinished ? 0 : 1), room?.hand_cap ?? 8)} of ${room?.hand_cap ?? 8}`;

  return (
    <div className="mx-auto flex max-w-[84rem] flex-col px-[1rem] pb-[2rem]" style={{ color: 'var(--foreground)', minHeight: 'calc(100vh - 6rem)' }}>
      <TableStatusBar code={room?.code} onLeave={onLeave} showLeave={!isFinished} />

      <div className="mb-[0.5rem] flex flex-col items-center gap-[0.375rem]">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
          Hold'em · {handModeLabel} · {STREET_LABEL[phase] ?? 'Waiting'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-[0.5rem] border px-[1.25rem] py-[0.625rem]" style={{ borderRadius: 'var(--radius)', borderColor: 'var(--ring)', background: 'var(--surface)' }}>
          <Coins className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <span className="text-lg font-black"><AnimatedChips value={room?.pot ?? 0} /></span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>pot</span>
          <span className="mx-[0.5rem] h-4 w-px" style={{ background: 'var(--divider)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>blinds {smallBlind}/{bigBlind}</span>
          {isBetting && (
            <>
              <span className="mx-[0.5rem] h-4 w-px" style={{ background: 'var(--divider)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>to call {toCall}</span>
            </>
          )}
        </div>
      </div>

      {/* Community cards float in the remaining vertical space above the
          seats — this flex-1 block is what pushes the seats/betting
          controls down toward the bottom third on tall viewports, instead
          of everything stacking tight under the header. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[0.5rem]" style={{ minHeight: '9rem', paddingBottom: '1.5rem' }}>
        <motion.div
          className="flex flex-wrap justify-center"
          style={{ gap: 'clamp(0.3rem, 1.5vw, 0.625rem)', maxWidth: '100%' }}
          variants={communityVariants}
          initial="hidden"
          animate="show"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div key={`${phase}-${i}`} variants={cardPop}>
              <CardFace card={shownCommunity[i]} hidden={!shownCommunity[i]} faceDown={!shownCommunity[i]} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '1.5rem' }}
        variants={tableGridVariants}
        initial="hidden"
        animate="show"
      >
        {players.map((p) => (
            <PlayerSeat
              key={p.id}
              player={p}
              isMe={p.id === playerId}
              holeCards={holeCards[p.id]}
              isButton={p.id === buttonId}
              isSmallBlind={p.id === smallBlindId}
              isBigBlind={p.id === bigBlindId}
              isCurrentActor={isBetting && betting.currentActor === p.id}
              isFolded={Boolean(folded[p.id])}
              isAllIn={Boolean(allIn[p.id])}
              committed={committed[p.id] ?? 0}
              isWinner={winnerIds.includes(p.id)}
              revealCards={revealAtShowdown && !folded[p.id]}
              handLabelText={revealAtShowdown && showdownHands[p.id] ? handLabel(showdownHands[p.id]) : null}
              theme={theme}
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
                    min={betting.minRaise ?? bigBlind}
                    max={Math.max(myChips - Math.max(needToCall, 0), betting.minRaise ?? bigBlind)}
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

        {isShowdown && !isFinished && (
          <motion.div key="showdown" className="mt-[2rem] flex flex-col items-center gap-[0.75rem]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              {winnerIds.length === 0
                ? contendersLeft <= 1 ? 'Hand over.' : 'No winner this hand.'
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

export default HoldemTable;
