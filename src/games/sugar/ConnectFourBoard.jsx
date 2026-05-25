import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, XCircle } from 'lucide-react';

const COLUMNS = 7;
const ROWS = 6;

const playerDiscStyles = {
  1: {
    background: 'var(--primary)',
    boxShadow: 'inset 0 0.45rem 0.9rem color-mix(in srgb, var(--surface) 28%, transparent), inset 0 -0.35rem 0.75rem rgba(0, 0, 0, 0.24), 0 0.3rem 0.85rem rgba(0, 0, 0, 0.18)',
  },
  2: {
    background: 'var(--accent)',
    boxShadow: 'inset 0 0.45rem 0.9rem color-mix(in srgb, var(--surface) 30%, transparent), inset 0 -0.35rem 0.75rem rgba(0, 0, 0, 0.22), 0 0.3rem 0.85rem rgba(0, 0, 0, 0.18)',
  },
};

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const PlayerBadge = ({ playerNumber, label, timer, isActive }) => (
  <div
    className="flex min-w-0 items-center gap-3 border bg-[color:var(--surface)] px-3 py-2"
    style={{ borderColor: isActive ? 'var(--ring)' : 'var(--divider)', borderRadius: 'var(--radius)' }}
  >
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-black text-[color:var(--surface)]" style={playerDiscStyles[playerNumber]}>
      P{playerNumber}
    </div>
    <div className="min-w-0 text-left">
      <p className="truncate text-sm font-bold text-foreground">{label}</p>
      <p className="font-mono text-xs text-[color:var(--muted)]">{formatTime(timer)}</p>
    </div>
  </div>
);

const ConnectFourBoard = ({ room, playerNumber, onDropPiece, onAbortGame }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const turnSeconds = useMemo(() => {
    const anchor = room?.updated_at || room?.started_at || room?.created_at;
    if (!anchor || room?.status !== 'playing') return 0;
    return Math.max(0, Math.floor((now - new Date(anchor).getTime()) / 1000));
  }, [now, room]);

  const timers = {
    1: room?.current_player === 1 ? turnSeconds : 0,
    2: room?.current_player === 2 ? turnSeconds : 0,
  };

  const board = room?.board || Array(COLUMNS * ROWS).fill(null);
  const isMyTurn = room?.status === 'playing' && room?.current_player === playerNumber;
  const hasOpponent = Boolean(room?.player_two);

  const statusText = useMemo(() => {
    if (!hasOpponent) return 'Waiting for player 2';
    if (room?.status === 'won') return room.winner === playerNumber ? 'You connected four!' : 'Opponent connected four';
    if (room?.status === 'draw') return 'Board full. Draw game!';
    if (room?.status === 'aborted') return 'Game aborted';
    return isMyTurn ? "IT'S YOUR TURN!" : "Opponent's turn";
  }, [hasOpponent, isMyTurn, playerNumber, room]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col px-4 py-6 text-foreground">
      <header className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <PlayerBadge playerNumber={1} label="Player 1" timer={timers[1]} isActive={room?.current_player === 1} />
        <div
          className="border bg-[color:var(--surface-strong)] px-5 py-3 text-center"
          style={{ borderColor: 'var(--ring)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
        >
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-primary">room {room?.code}</p>
          <h1 className="mt-1 text-xl font-black uppercase text-foreground sm:text-2xl">{statusText}</h1>
        </div>
        <div className="lg:justify-self-end">
          <PlayerBadge playerNumber={2} label={hasOpponent ? 'Player 2' : 'Waiting...'} timer={timers[2]} isActive={room?.current_player === 2} />
        </div>
      </header>

      <section className="mt-6 flex flex-1 items-center justify-center">
        <div
          className="grid aspect-[7/6] w-full max-w-[38rem] grid-cols-7 grid-rows-6 gap-2 border bg-[color:var(--surface-strong)] p-3 sm:gap-3 sm:p-4"
          style={{ borderColor: 'var(--ring)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
          aria-label="Connect Four board"
        >
          {board.map((slot, index) => {
            const column = index % COLUMNS;
            const row = Math.floor(index / COLUMNS);
            const canPlayColumn = isMyTurn && room?.status === 'playing';
            const isLastMove = room?.last_move?.row === row && room?.last_move?.column === column;

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
                    style={playerDiscStyles[slot]}
                    initial={isLastMove ? { y: '-135%', scale: 0.92, opacity: 0.92 } : false}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.72 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <footer className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onAbortGame}
          className="inline-flex min-h-11 items-center gap-2 border bg-[color:var(--surface)] px-4 py-2 text-sm font-bold text-foreground transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)' }}
        >
          <XCircle className="h-4 w-4" />
          Abort game
        </button>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center border bg-[color:var(--surface)] text-foreground transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)' }}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </footer>
    </main>
  );
};

export default ConnectFourBoard;
