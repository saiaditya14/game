import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, RotateCcw } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import RoomCodeCopy from '../../components/RoomCodeCopy';

// ─── Cell centers for the win-line SVG (viewBox 0 0 4 4) ─────────────────────

const CELL_CENTERS = [
  [0.5, 0.5], [1.5, 0.5], [2.5, 0.5], [3.5, 0.5],
  [0.5, 1.5], [1.5, 1.5], [2.5, 1.5], [3.5, 1.5],
  [0.5, 2.5], [1.5, 2.5], [2.5, 2.5], [3.5, 2.5],
  [0.5, 3.5], [1.5, 3.5], [2.5, 3.5], [3.5, 3.5],
];

// ─── Per-theme board grid ─────────────────────────────────────────────────────

const boardStyleByTheme = {
  'theme-pink':      { gap: '4px',   background: 'rgba(251,113,133,0.30)' },
  'theme-champagne': { gap: '1.5px', background: 'rgba(102,81,63,0.22)'   },
  'theme-arcade':    { gap: '2px',   background: 'var(--ring)'             },
  'theme-cozy':      { gap: '3px',   background: 'rgba(205,144,64,0.22)'  },
};

const cellBgByTheme = {
  'theme-pink':      'rgba(255,247,251,0.96)',
  'theme-champagne': 'var(--surface)',
  'theme-arcade':    '#060606',
  'theme-cozy':      'rgba(18,9,2,0.94)',
};

// ─── Animated X ───────────────────────────────────────────────────────────────

const XSymbol = ({ isArcade }) => (
  <motion.svg
    viewBox="0 0 100 100"
    style={{
      width: '52%',
      height: '52%',
      ...(isArcade ? { filter: 'drop-shadow(0 0 6px var(--primary)) drop-shadow(0 0 14px var(--primary))' } : {}),
    }}
    initial="hidden"
    animate="visible"
    aria-hidden="true"
  >
    <motion.line
      x1="18" y1="18" x2="82" y2="82"
      stroke="var(--primary)" strokeWidth="13" strokeLinecap="round"
      variants={{
        hidden:  { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
      }}
    />
    <motion.line
      x1="82" y1="18" x2="18" y2="82"
      stroke="var(--primary)" strokeWidth="13" strokeLinecap="round"
      variants={{
        hidden:  { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.22, ease: 'easeOut', delay: 0.1 } },
      }}
    />
  </motion.svg>
);

// ─── Animated O ───────────────────────────────────────────────────────────────

const OSymbol = ({ isArcade }) => (
  <motion.svg
    viewBox="0 0 100 100"
    style={{
      width: '52%',
      height: '52%',
      ...(isArcade ? { filter: 'drop-shadow(0 0 6px var(--accent)) drop-shadow(0 0 14px var(--accent))' } : {}),
    }}
    initial="hidden"
    animate="visible"
    aria-hidden="true"
  >
    <motion.circle
      cx="50" cy="50" r="34"
      fill="none" stroke="var(--accent)" strokeWidth="13" strokeLinecap="round"
      variants={{
        hidden:  { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
      }}
    />
  </motion.svg>
);

// ─── Ghost preview SVGs (static, no pathLength animation) ─────────────────────

const GhostX = () => (
  <svg viewBox="0 0 100 100" style={{ width: '52%', height: '52%' }} fill="none" aria-hidden="true">
    <line x1="18" y1="18" x2="82" y2="82" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" />
    <line x1="82" y1="18" x2="18" y2="82" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" />
  </svg>
);

const GhostO = () => (
  <svg viewBox="0 0 100 100" style={{ width: '52%', height: '52%' }} fill="none" aria-hidden="true">
    <circle cx="50" cy="50" r="34" fill="none" stroke="var(--accent)" strokeWidth="13" />
  </svg>
);

// ─── Player badge ─────────────────────────────────────────────────────────────

const discStyle = {
  1: {
    background: 'var(--primary)',
    boxShadow: 'inset 0 0.35rem 0.75rem color-mix(in srgb, var(--surface) 28%, transparent), inset 0 -0.3rem 0.6rem rgba(0,0,0,0.22)',
  },
  2: {
    background: 'var(--accent)',
    boxShadow: 'inset 0 0.35rem 0.75rem color-mix(in srgb, var(--surface) 28%, transparent), inset 0 -0.3rem 0.6rem rgba(0,0,0,0.22)',
  },
};

const PlayerBadge = ({ symbol, label, isActive, isArcade }) => (
  <motion.div
    className="flex min-w-0 items-center gap-[0.75rem] border px-[0.75rem] py-[0.5rem]"
    style={{
      borderColor: isActive ? 'var(--ring)' : 'var(--divider)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface)',
    }}
    animate={
      isActive
        ? {
            boxShadow: isArcade
              ? '0 0 0 1.5px var(--ring), 0 0 16px rgba(0,255,255,0.28)'
              : '0 0 0 1.5px var(--ring), 0 0 12px color-mix(in srgb, var(--ring) 32%, transparent)',
            scale: 1.02,
          }
        : { boxShadow: '0 0 0 0px transparent', scale: 1 }
    }
    transition={{ duration: 0.25 }}
  >
    <div
      className="grid h-[2.5rem] w-[2.5rem] shrink-0 place-items-center rounded-full text-sm font-black"
      style={{ ...discStyle[symbol === 'X' ? 1 : 2], color: 'var(--surface)' }}
    >
      {symbol}
    </div>
    <p className="truncate text-sm font-bold" style={{ color: 'var(--foreground)' }}>{label}</p>
  </motion.div>
);

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    youWin: 'you win!!', opponentWins: 'they got it :(',  draw: "it's a tie",
    aborted: 'game stopped', waiting: 'invite them',
    yourTurn: 'your turn', theirTurn: 'their turn...',
    playAgain: 'play again', exit: 'exit game',
  },
  'theme-arcade': {
    youWin: 'YOU WIN!', opponentWins: 'GAME OVER', draw: 'DRAW!',
    aborted: 'ABORTED', waiting: 'P2 JOINING…',
    yourTurn: 'YOUR TURN!', theirTurn: 'OPPONENT',
    playAgain: 'PLAY AGAIN', exit: 'EXIT',
  },
  'theme-cozy': {
    youWin: 'you won ✨', opponentWins: 'they won', draw: 'a draw~',
    aborted: 'game ended', waiting: 'waiting for them…',
    yourTurn: 'your move', theirTurn: 'their move',
    playAgain: 'play again', exit: 'exit game',
  },
  'theme-champagne': {
    youWin: 'You win!', opponentWins: 'They win', draw: 'Draw',
    aborted: 'Game aborted', waiting: 'Waiting for Player 2',
    yourTurn: 'Your turn', theirTurn: "Opponent's turn",
    playAgain: 'Play again', exit: 'Exit game',
  },
};

// ─── Board cell entrance stagger ──────────────────────────────────────────────

const boardVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.028 } },
};

const cellVariants = {
  hidden: { opacity: 0, scale: 0.72 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Board ────────────────────────────────────────────────────────────────────

const TicTacToeBoard = ({ room, playerNumber, onPlaceMarker, onPlayAgain, onAbortGame, onExitGame }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const board       = room?.board ?? Array(16).fill(null);
  const xPlayer     = room?.x_player ?? 1;
  const symbolFor   = (num) => (num === xPlayer ? 'X' : 'O');
  const winningLine = room?.winning_line ?? null;
  const winningSet  = useMemo(() => new Set(winningLine ?? []), [winningLine]);
  const hasOpponent = Boolean(room?.player_two);
  const isMyTurn    = room?.status === 'playing' && room?.current_player === playerNumber;
  const isOver      = room?.status === 'won' || room?.status === 'draw' || room?.status === 'aborted';
  const didIWin     = room?.status === 'won' && room?.winner === playerNumber;
  const isDraw      = room?.status === 'draw';

  const statusText = useMemo(() => {
    if (!hasOpponent)          return copy.waiting;
    if (room?.status === 'won')
      return room.winner === playerNumber ? copy.youWin : copy.opponentWins;
    if (room?.status === 'draw')    return copy.draw;
    if (room?.status === 'aborted') return copy.aborted;
    return isMyTurn ? copy.yourTurn : copy.theirTurn;
  }, [copy, hasOpponent, isMyTurn, playerNumber, room]);

  const bStyle  = boardStyleByTheme[theme] ?? boardStyleByTheme['theme-champagne'];
  const cellBg  = cellBgByTheme[theme]     ?? cellBgByTheme['theme-champagne'];

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[56rem] flex-col px-[1rem] py-[1.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {/* Header */}
      <header className="grid gap-[0.75rem] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <PlayerBadge
          symbol={symbolFor(1)}
          label={`Player 1 (${symbolFor(1)})`}
          isActive={room?.current_player === 1 && room?.status === 'playing'}
          isArcade={isArcade}
        />

        <motion.div
          className="border px-[1.25rem] py-[0.75rem] text-center"
          style={{
            borderColor: 'var(--ring)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-strong)',
            boxShadow: isArcade
              ? '0 0 14px rgba(0,255,255,0.10), 0 0 28px rgba(255,0,255,0.06)'
              : 'var(--shadow)',
          }}
          animate={isMyTurn ? { scale: [1, 1.015, 1] } : { scale: 1 }}
          transition={isMyTurn ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : {}}
        >
          {!hasOpponent ? (
            <>
              <p
                className="text-[0.68rem] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--primary)' }}
              >
                share this code
              </p>
              <p
                className="mt-[0.125rem] font-black tracking-[0.18em]"
                style={{ color: 'var(--foreground)', fontSize: '2rem', lineHeight: 1.1 }}
              >
                <RoomCodeCopy code={room?.code} gap="0.3em" />
              </p>
              <p
                className="text-[0.68rem] uppercase tracking-[0.12em]"
                style={{ color: 'var(--muted)', marginTop: '0.2rem' }}
              >
                waiting for player 2
              </p>
            </>
          ) : (
            <>
              <p
                className="text-[0.68rem] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--primary)' }}
              >
                room <RoomCodeCopy code={room?.code} />
              </p>
              <h1
                className="mt-[0.125rem] text-lg font-black uppercase sm:text-xl"
                style={{
                  color: 'var(--foreground)',
                  ...(isArcade && isMyTurn ? { textShadow: '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.5)' } : {}),
                }}
              >
                {statusText}
              </h1>
            </>
          )}
        </motion.div>

        <div className="sm:justify-self-end">
          <PlayerBadge
            symbol={symbolFor(2)}
            label={hasOpponent ? `Player 2 (${symbolFor(2)})` : 'Waiting…'}
            isActive={room?.current_player === 2 && room?.status === 'playing'}
            isArcade={isArcade}
          />
        </div>
      </header>

      {/* Board */}
      <section style={{ marginTop: '1.5rem', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gridTemplateRows: 'repeat(4, 1fr)',
              overflow: 'hidden',
              width: '26rem',
              maxWidth: 'calc(100vw - 2rem)',
              aspectRatio: '1 / 1',
              gap: bStyle.gap,
              background: bStyle.background,
              borderRadius: 'var(--radius)',
              boxShadow: isArcade
                ? '0 0 0 1px var(--ring), 0 0 24px rgba(0,255,255,0.10), var(--shadow)'
                : 'var(--shadow)',
            }}
            variants={boardVariants}
            initial="hidden"
            animate="show"
            aria-label="Tic-Tac-Toe board"
          >
            {/* Win-line overlay */}
            {winningLine && (
              <svg
                viewBox="0 0 4 4"
                style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 20 }}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.line
                  x1={CELL_CENTERS[winningLine[0]][0]}
                  y1={CELL_CENTERS[winningLine[0]][1]}
                  x2={CELL_CENTERS[winningLine[2]][0]}
                  y2={CELL_CENTERS[winningLine[2]][1]}
                  stroke="var(--primary)"
                  strokeWidth="0.12"
                  strokeLinecap="round"
                  style={isArcade
                    ? { filter: 'drop-shadow(0 0 0.08px var(--primary)) drop-shadow(0 0 0.2px rgba(255,0,255,0.7))' }
                    : undefined
                  }
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.42, ease: 'easeOut', delay: 0.12 }}
                />
              </svg>
            )}

            {board.map((cell, index) => {
              const isWinning = winningSet.has(index);
              const canPlay   = isMyTurn && !cell && room?.status === 'playing';

              return (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => onPlaceMarker(index)}
                  disabled={!canPlay}
                  className="relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[color:var(--ring)] disabled:cursor-default"
                  style={{
                    background: isWinning
                      ? 'color-mix(in srgb, var(--surface) 52%, var(--ring))'
                      : cellBg,
                  }}
                  variants={cellVariants}
                  whileHover={canPlay ? { scale: 1.06 } : undefined}
                  whileTap={canPlay   ? { scale: 0.94 } : undefined}
                  aria-label={`Cell ${index + 1}${cell ? `, ${symbolFor(cell)}` : ''}`}
                >
                  {cell === xPlayer && <XSymbol key={`x-${index}`} isArcade={isArcade} />}
                  {cell && cell !== xPlayer && <OSymbol key={`o-${index}`} isArcade={isArcade} />}

                  {/* Hover ghost — fixed: uses Framer Motion, not CSS hover */}
                  {canPlay && !cell && (
                    <motion.span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 0.15 }}
                      transition={{ duration: 0.12 }}
                    >
                      {playerNumber === xPlayer ? <GhostX /> : <GhostO />}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
      </section>

      {/* Footer */}
      <footer className="mt-[1.5rem] flex items-center justify-between gap-[1rem]">
        <button
          type="button"
          onClick={onAbortGame}
          className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] border px-[1rem] py-[0.5rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{
            borderRadius: 'var(--radius)',
            borderColor: 'var(--divider)',
            background: 'var(--surface)',
            color: 'var(--foreground)',
          }}
        >
          <XCircle className="h-4 w-4" />
          {isArcade ? 'ABORT' : 'Abort game'}
        </button>

      </footer>

      {/* End-game overlay */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-[1rem]"
            style={{
              background: 'color-mix(in srgb, var(--background) 72%, transparent)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[24rem] border p-[1.75rem] text-center"
              style={{
                borderColor: 'var(--ring)',
                borderRadius: 'var(--radius)',
                background: 'var(--surface)',
                boxShadow: isArcade
                  ? '0 0 0 1px var(--ring), 0 0 40px rgba(0,255,255,0.12), 0 0 80px rgba(255,0,255,0.08)'
                  : 'var(--shadow)',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Winning / draw symbol */}
              {room?.status === 'won' && (
                <motion.div
                  className="mx-auto mb-[1rem] h-[4rem] w-[4rem]"
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                >
                  {room.winner === xPlayer ? (
                    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none"
                      style={isArcade ? { filter: 'drop-shadow(0 0 8px var(--primary))' } : undefined}
                    >
                      <line x1="14" y1="14" x2="86" y2="86" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
                      <line x1="86" y1="14" x2="14" y2="86" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 100 100" className="h-full w-full" fill="none"
                      style={isArcade ? { filter: 'drop-shadow(0 0 8px var(--accent))' } : undefined}
                    >
                      <circle cx="50" cy="50" r="38" stroke="var(--accent)" strokeWidth="12" fill="none" />
                    </svg>
                  )}
                </motion.div>
              )}

              {isDraw && (
                <motion.div
                  className="mx-auto mb-[1rem] flex items-center justify-center gap-[0.75rem]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 20, delay: 0.1 }}
                >
                  <svg viewBox="0 0 100 100" className="h-[3rem] w-[3rem]" fill="none">
                    <line x1="14" y1="14" x2="86" y2="86" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" />
                    <line x1="86" y1="14" x2="14" y2="86" stroke="var(--primary)" strokeWidth="13" strokeLinecap="round" />
                  </svg>
                  <svg viewBox="0 0 100 100" className="h-[3rem] w-[3rem]" fill="none">
                    <circle cx="50" cy="50" r="38" stroke="var(--accent)" strokeWidth="13" fill="none" />
                  </svg>
                </motion.div>
              )}

              <p
                className="text-[0.68rem] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--primary)' }}
              >
                {didIWin ? 'winner' : isDraw ? 'draw' : 'game over'}
              </p>

              <h2
                className="mt-[0.375rem] font-serif text-4xl font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {didIWin
                  ? (isArcade ? 'WINNER!' : 'Congrats!')
                  : isDraw
                  ? (isArcade ? 'DRAW!' : 'A draw!')
                  : (isArcade ? 'GAME OVER' : 'Game over')}
              </h2>

              <p
                className="mt-[0.75rem] text-sm leading-6"
                style={{ color: 'var(--muted)' }}
              >
                {room?.status === 'won'
                  ? `Player ${room.winner} (${symbolFor(room.winner)}) wins.`
                  : isDraw
                  ? 'The board is full — no winner this time.'
                  : 'The game was stopped.'}
              </p>

              <div className="mt-[1.5rem] flex flex-col gap-[0.75rem]">
                <motion.button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    background: 'var(--primary)',
                    color: isArcade ? '#000' : 'var(--surface)',
                    boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)',
                  }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {copy.playAgain}
                </motion.button>

                <button
                  type="button"
                  onClick={onExitGame}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center border px-[1.25rem] py-[0.75rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{
                    borderRadius: 'var(--radius)',
                    borderColor: 'var(--divider)',
                    background: 'var(--surface-strong)',
                    color: 'var(--foreground)',
                  }}
                >
                  {copy.exit}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default TicTacToeBoard;
