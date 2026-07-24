import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, XCircle } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import GameExitScreen from './GameExitScreen';
import ConnectFourLanterns from './ConnectFourLanterns';

const COLUMNS = 7;
const ROWS = 6;

// Piece colors overridden per-theme where --primary/--accent read as too
// similar for telling pieces apart at a glance (cozy: both warm gold/tan;
// pink: both rose/red — now dark pink vs. light pink instead).
const DISC_COLOR_OVERRIDE = {
  'theme-pink': { 1: '#9d174d', 2: '#f472b6' },
  'theme-cozy': { 2: '#3f7a8c' },
};

const getDiscStyle = (playerNumber, theme, isArcade) => {
  const color =
    DISC_COLOR_OVERRIDE[theme]?.[playerNumber] || (playerNumber === 1 ? 'var(--primary)' : 'var(--accent)');
  const base = {
    background: color,
    boxShadow:
      playerNumber === 1
        ? 'inset 0 0.45rem 0.9rem color-mix(in srgb, var(--surface) 28%, transparent), inset 0 -0.35rem 0.75rem rgba(0, 0, 0, 0.24), 0 0.3rem 0.85rem rgba(0, 0, 0, 0.18)'
        : 'inset 0 0.45rem 0.9rem color-mix(in srgb, var(--surface) 30%, transparent), inset 0 -0.35rem 0.75rem rgba(0, 0, 0, 0.22), 0 0.3rem 0.85rem rgba(0, 0, 0, 0.18)',
  };

  if (!isArcade) return base;

  return { ...base, filter: `drop-shadow(0 0 0.28rem ${color})` };
};

const PlayerBadge = ({ playerNumber, label, isActive, isArcade, theme }) => (
  <motion.div
    className="flex min-w-0 items-center gap-[0.75rem] border bg-[color:var(--surface)] px-[0.75rem] py-[0.5rem]"
    style={{ borderColor: isActive ? 'var(--ring)' : 'var(--divider)', borderRadius: 'var(--radius)' }}
    animate={
      isActive && isArcade
        ? { boxShadow: '0 0 0 1.5px var(--ring), 0 0 11px rgba(0,255,255,0.2)', scale: 1.02 }
        : { boxShadow: '0 0 0 0px transparent', scale: 1 }
    }
    transition={{ duration: 0.25 }}
  >
    <div
      className="grid h-[2.5rem] w-[2.5rem] shrink-0 place-items-center rounded-full text-sm font-black text-[color:var(--surface)]"
      style={getDiscStyle(playerNumber, theme, isArcade)}
    >
      P{playerNumber}
    </div>
    <div className="min-w-0 text-left">
      <p className="truncate text-sm font-bold" style={{ color: 'var(--foreground)' }}>{label}</p>
    </div>
  </motion.div>
);

const ConnectFourBoard = ({ room, playerNumber, onDropPiece, onAbortGame, onPlayAgain, onExitGame }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isCozy = theme === 'theme-cozy';

  const board = room?.board || Array(COLUMNS * ROWS).fill(null);
  const isMyTurn = room?.status === 'playing' && room?.current_player === playerNumber;
  const hasOpponent = Boolean(room?.player_two);
  const winningCells = room?.last_move?.winning_cells || [];
  const winningCellKeys = useMemo(
    () => new Set(winningCells.map((cell) => `${cell.row}-${cell.column}`)),
    [winningCells],
  );
  const isOver = room?.status === 'won' || room?.status === 'draw';

  const statusText = useMemo(() => {
    if (!hasOpponent) return isArcade ? 'WAITING FOR P2' : 'Waiting for player 2';
    if (room?.status === 'won') {
      if (room.winner === playerNumber) return isArcade ? 'YOU CONNECTED FOUR!' : 'You connected four!';
      return isArcade ? 'OPPONENT CONNECTED FOUR' : 'Opponent connected four';
    }
    if (room?.status === 'draw') return isArcade ? 'BOARD FULL. DRAW!' : 'Board full. Draw game!';
    return isMyTurn ? "IT'S YOUR TURN!" : isArcade ? 'OPPONENT TURN' : "Opponent's turn";
  }, [hasOpponent, isArcade, isMyTurn, playerNumber, room]);

  if (room?.status === 'aborted') return <GameExitScreen status="aborted" />;

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[72rem] flex-col px-[1rem] py-[1.5rem]" style={{ color: 'var(--foreground)' }}>
      {isArcade && (
        <div className="connect-four-arcade-drift" aria-hidden="true">
          <span className="connect-four-drift-piece connect-four-drift-piece--primary" />
          <span className="connect-four-drift-piece connect-four-drift-piece--accent" />
        </div>
      )}

      {isCozy && <ConnectFourLanterns />}

      <header className="relative flex flex-wrap items-center justify-between gap-[0.75rem]">
        <PlayerBadge playerNumber={1} label="Player 1" isActive={room?.current_player === 1} isArcade={isArcade} theme={theme} />
        <motion.div
          className="border bg-[color:var(--surface-strong)] px-[1.25rem] py-[0.75rem] text-center"
          style={{
            borderColor: 'var(--ring)',
            borderRadius: 'var(--radius)',
            boxShadow: isArcade ? '0 0 10px rgba(0,255,255,0.07), 0 0 20px rgba(255,0,255,0.045)' : 'var(--shadow)',
            flex: '1 1 14rem',
          }}
          animate={isArcade && isMyTurn ? { scale: [1, 1.015, 1] } : { scale: 1 }}
          transition={isArcade && isMyTurn ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } : {}}
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[color:var(--primary)]">
            {isArcade ? 'ROOM' : 'room'} {room?.code}
          </p>
          <h1
            className="mt-[0.25rem] font-black uppercase"
            style={{
              fontSize: '1.375rem',
              color: 'var(--foreground)',
              ...(isArcade && isMyTurn ? { textShadow: '0 0 9px var(--primary), 0 0 18px rgba(255,0,255,0.35)' } : {}),
            }}
          >
            {statusText}
          </h1>
        </motion.div>
        <div>
          <PlayerBadge
            playerNumber={2}
            label={hasOpponent ? 'Player 2' : 'Waiting...'}
            isActive={room?.current_player === 2}
            isArcade={isArcade}
            theme={theme}
          />
        </div>
      </header>

      <section className="mt-[1.5rem] flex flex-1 items-center justify-center">
        <div
          className="relative grid aspect-[7/6] w-full max-w-[38rem] grid-cols-7 grid-rows-6 gap-[0.75rem] border bg-[color:var(--surface-strong)] p-[1rem]"
          style={{
            borderColor: 'var(--ring)',
            borderRadius: 'var(--radius)',
            boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 22px rgba(0,255,255,0.07), var(--shadow)' : 'var(--shadow)',
          }}
          aria-label="Connect Four board"
        >
          {winningCells.length >= 4 && (
            <svg
              className="pointer-events-none absolute inset-[1rem] z-20"
              viewBox={`0 0 ${COLUMNS} ${ROWS}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <motion.line
                x1={winningCells[0].column + 0.5}
                y1={winningCells[0].row + 0.5}
                x2={winningCells[3].column + 0.5}
                y2={winningCells[3].row + 0.5}
                stroke="color-mix(in srgb, var(--ring) 76%, gold)"
                strokeWidth="0.16"
                strokeLinecap="round"
                style={isArcade ? { filter: 'drop-shadow(0 0 0.08px var(--ring)) drop-shadow(0 0 0.18px rgba(0,255,255,0.5))' } : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
              />
            </svg>
          )}

          {board.map((slot, index) => {
            const column = index % COLUMNS;
            const row = Math.floor(index / COLUMNS);
            const canPlayColumn = isMyTurn && room?.status === 'playing';
            const isLastMove = room?.last_move?.row === row && room?.last_move?.column === column;
            const isWinningCell = winningCellKeys.has(`${row}-${column}`);

            return (
              <button
                key={`${row}-${column}`}
                type="button"
                onClick={() => onDropPiece(column)}
                disabled={!canPlayColumn}
                className="relative h-full w-full overflow-hidden rounded-full bg-[color:var(--surface)] shadow-inner transition hover:ring-2 hover:ring-[color:var(--ring)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-default"
                aria-label={`Column ${column + 1}, row ${row + 1}`}
              >
                {slot && (
                  <motion.span
                    key={`${index}-${slot}`}
                    className="absolute inset-[8%] block rounded-full"
                    style={getDiscStyle(slot, theme, isArcade)}
                    initial={isLastMove ? { y: '-135%', scale: 0.92, opacity: 0.92 } : false}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.72 }}
                  />
                )}
                {isWinningCell && (
                  <motion.span
                    className="pointer-events-none absolute inset-[2%] z-10 rounded-full border-4"
                    style={{ borderColor: 'color-mix(in srgb, var(--ring) 76%, gold)' }}
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.22, delay: 0.15 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-[1.5rem] flex items-center justify-between gap-[1rem]">
        <button
          type="button"
          onClick={onAbortGame}
          className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] border bg-[color:var(--surface)] px-[1rem] py-[0.5rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}
        >
          <XCircle className="h-4 w-4" />
          {isArcade ? 'ABORT' : 'Abort game'}
        </button>
      </footer>

      <AnimatePresence>
        {isOver && (
          <motion.div
            className="z-50 p-[1rem]"
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'color-mix(in srgb, var(--background) 74%, transparent)',
              backdropFilter: 'blur(10px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-[24rem] border bg-[color:var(--surface)] p-[1.5rem] text-center"
              style={{
                borderColor: 'var(--ring)',
                borderRadius: 'var(--radius)',
                boxShadow: isArcade
                  ? '0 0 0 1px var(--ring), 0 0 28px rgba(0,255,255,0.08), 0 0 56px rgba(255,0,255,0.055)'
                  : 'var(--shadow)',
              }}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              {room?.status === 'won' && room.winner === playerNumber && (
                <div className="connect-four-win-sparkles" aria-hidden="true">
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                </div>
              )}

              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[color:var(--primary)]">
                {room?.status === 'won' ? (room.winner === playerNumber ? 'winner' : 'game over') : 'draw'}
              </p>
              <h2 className="mt-[0.5rem] font-serif" style={{ fontSize: '2.25rem', fontWeight: 500, color: 'var(--foreground)' }}>
                {room?.status === 'won'
                  ? (isArcade ? (room.winner === playerNumber ? 'WINNER!' : 'GAME OVER') : 'Congrats!')
                  : (isArcade ? 'DRAW!' : 'A draw!')}
              </h2>
              <p className="mt-[0.75rem] text-sm leading-6 text-[color:var(--muted)]">
                {room?.status === 'won' ? `Player ${room.winner} connected four.` : 'The board is full — no winner this time.'}
              </p>
              <div className="mt-[1.5rem] flex flex-col gap-[0.75rem]">
                <button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center gap-[0.5rem] bg-[color:var(--primary)] text-[color:var(--surface)] px-[1.25rem] py-[0.75rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {isArcade ? 'RESTART' : 'Restart game'}
                </button>
                <button
                  type="button"
                  onClick={onExitGame}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center border px-[1.25rem] py-[0.75rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)', color: 'var(--foreground)' }}
                >
                  {isArcade ? 'EXIT' : 'Exit game'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ConnectFourBoard;
