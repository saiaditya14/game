import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, RotateCcw, Trophy } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import RoomCodeCopy from '../../components/RoomCodeCopy';

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    waiting:     'waiting for them',
    youWin:      'you won!!',
    theyWin:     'they won this time :(',
    draw:        'it\'s a tie',
    playAgain:   'play again',
    exit:        'exit game',
    roundLabel:  (r, t) => `round ${r} of ${t}`,
    placeholder: 'type your answer',
  },
  'theme-arcade': {
    waiting:     'P2 JOINING…',
    youWin:      'YOU WIN!',
    theyWin:     'GAME OVER',
    draw:        'DRAW!',
    playAgain:   'PLAY AGAIN',
    exit:        'EXIT',
    roundLabel:  (r, t) => `ROUND ${r}/${t}`,
    placeholder: 'ENTER ANSWER',
  },
  'theme-cozy': {
    waiting:     'waiting for them…',
    youWin:      'you won ✨',
    theyWin:     'they won',
    draw:        'a draw~',
    playAgain:   'play again',
    exit:        'exit game',
    roundLabel:  (r, t) => `round ${r} of ${t}`,
    placeholder: 'type your answer',
  },
  'theme-champagne': {
    waiting:     'Waiting for Player 2',
    youWin:      'You win!',
    theyWin:     'They win',
    draw:        'Draw',
    playAgain:   'Play again',
    exit:        'Exit game',
    roundLabel:  (r, t) => `Round ${r} of ${t}`,
    placeholder: 'Type your answer',
  },
};

// ─── Player score badge ───────────────────────────────────────────────────────

const ScoreBadge = ({ playerNumber, label, score, isArcade }) => {
  const discBg = playerNumber === 1 ? 'var(--primary)' : 'var(--accent)';
  return (
    <div
      className="flex min-w-0 flex-col items-center gap-[0.35rem] border px-[1rem] py-[0.625rem]"
      style={{
        borderColor: 'var(--divider)',
        borderRadius: 'var(--radius)',
        background: 'var(--surface)',
        minWidth: '5.5rem',
      }}
    >
      <div
        className="grid h-[2rem] w-[2rem] shrink-0 place-items-center rounded-full text-xs font-black"
        style={{ background: discBg, color: 'var(--surface)' }}
      >
        {playerNumber}
      </div>
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <motion.p
        className="text-2xl font-black"
        style={{ color: 'var(--foreground)' }}
        key={score}
        initial={{ scale: 1.5, color: discBg }}
        animate={{ scale: 1, color: 'var(--foreground)' }}
        transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      >
        {score}
      </motion.p>
    </div>
  );
};

// ─── Board ─────────────────────────────────────────────────────────────────────

const QuickMathsBoard = ({
  room,
  playerNumber,
  questions,
  onAnswerChange,
  onPlayAgain,
  onAbort,
  onExit,
}) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isPink   = theme === 'theme-pink';
  const isCozy   = theme === 'theme-cozy';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const currentRound  = room?.current_round ?? 1;
  const totalRounds   = room?.total_rounds  ?? 10;
  const scoreOne      = room?.score_one     ?? 0;
  const scoreTwo      = room?.score_two     ?? 0;
  const hasOpponent   = Boolean(room?.player_two);
  const isOver        = room?.status === 'finished';
  const q             = questions[currentRound - 1];
  const isInteractive = !isOver && hasOpponent;

  const didIWin = room?.winner === playerNumber;
  const isDraw  = isOver && room?.winner === null;

  // Clear input and re-focus on every round advance
  useEffect(() => {
    setInputValue('');
    if (isInteractive) inputRef.current?.focus();
  }, [currentRound]);

  // Keep focused while interactive
  useEffect(() => {
    if (isInteractive) inputRef.current?.focus();
  }, [isInteractive]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow minus sign + digits only
    if (raw !== '' && raw !== '-' && !/^-?\d+$/.test(raw)) return;
    setInputValue(raw);
    onAnswerChange(raw);
  };

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[48rem] flex-col px-[1rem] py-[1.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {/* ── Header: scores + round indicator ────────────────────────────── */}
      <header className="grid gap-[0.75rem] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <ScoreBadge
          playerNumber={1}
          label={playerNumber === 1 ? (isArcade ? 'YOU' : 'You') : (isArcade ? 'P1' : 'Player 1')}
          score={scoreOne}
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
        >
          {!hasOpponent ? (
            <>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
                share this code
              </p>
              <p className="mt-[0.125rem] font-black tracking-[0.18em]" style={{ color: 'var(--foreground)', fontSize: '2rem', lineHeight: 1.1 }}>
                <RoomCodeCopy code={room?.code} gap="0.3em" />
              </p>
              <p className="text-[0.62rem] uppercase tracking-[0.12em]" style={{ color: 'var(--muted)', marginTop: '0.2rem' }}>
                waiting for player 2
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
                {isArcade ? 'ROOM ' : 'room '}<RoomCodeCopy code={room?.code} />
              </p>
              <p className="mt-[0.25rem] text-xl font-black" style={{ color: 'var(--foreground)' }}>
                {copy.roundLabel(Math.min(currentRound, totalRounds), totalRounds)}
              </p>
            </>
          )}
        </motion.div>

        <div className="sm:justify-self-end">
          <ScoreBadge
            playerNumber={2}
            label={playerNumber === 2 ? (isArcade ? 'YOU' : 'You') : (isArcade ? 'P2' : 'Player 2')}
            score={scoreTwo}
            isArcade={isArcade}
          />
        </div>
      </header>

      {/* ── Game area ────────────────────────────────────────────────────── */}
      <section
        className="relative mt-[1.5rem] flex flex-1 flex-col items-center justify-center border"
        style={{
          borderRadius: 'var(--radius)',
          borderColor: 'var(--divider)',
          background: isArcade ? 'rgba(4,4,4,0.97)' : 'var(--surface)',
          boxShadow: isArcade
            ? '0 0 0 1px var(--ring), 0 0 32px rgba(0,255,255,0.06), var(--shadow)'
            : 'var(--shadow)',
          padding: 'clamp(2rem, 6vw, 3.5rem)',
          overflow: 'hidden',
          gap: '2rem',
        }}
      >
        {/* Arcade scanline */}
        {isArcade && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
            }}
          />
        )}

        {/* Pink ambient bloom */}
        {isPink && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
              background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(251,113,133,0.08) 0%, transparent 70%)',
            }}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1, width: '100%', textAlign: 'center' }}>

          {/* Equation */}
          {hasOpponent && !isOver && q && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`eq-${currentRound}`}
                className="mb-[2.5rem] flex items-center justify-center"
                initial={{ opacity: 0, y: 18, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.92 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  style={{
                    fontSize: 'clamp(2.6rem, 9vw, 5rem)',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    fontFamily: isArcade ? "'Press Start 2P', monospace" : isCozy ? "'Georgia', serif" : 'inherit',
                    color: 'var(--foreground)',
                    ...(isArcade
                      ? { textShadow: '0 0 20px var(--primary), 0 0 40px rgba(255,0,255,0.5)' }
                      : isPink
                      ? { textShadow: '0 2px 20px rgba(190,24,93,0.22)' }
                      : {}),
                  }}
                >
                  {q.expr}
                </span>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Waiting for opponent */}
          {!hasOpponent && (
            <motion.p
              className="text-base"
              style={{ color: 'var(--muted)' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              {copy.waiting}
            </motion.p>
          )}

          {/* Answer input — no submit button, auto-checks on every keystroke */}
          {hasOpponent && !isOver && (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={handleChange}
              disabled={!isInteractive}
              placeholder={copy.placeholder}
              className="min-h-[3.5rem] w-full border text-center text-2xl font-black outline-none transition focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-40"
              style={{
                maxWidth: '14rem',
                borderRadius: 'var(--radius)',
                borderColor: 'var(--ring)',
                background: isArcade ? 'rgba(0,20,0,0.82)' : 'var(--surface)',
                color: 'var(--foreground)',
                boxShadow: isArcade
                  ? '0 0 0 1px rgba(0,255,255,0.18), 0 0 12px rgba(0,255,255,0.08)'
                  : undefined,
                // kill browser spinbox completely
                MozAppearance: 'textfield',
                WebkitAppearance: 'none',
                appearance: 'none',
              }}
              aria-label="Your answer"
            />
          )}
        </div>

      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-[1.25rem]">
        <button
          type="button"
          onClick={onAbort}
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

      {/* ── End-game overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              background: 'color-mix(in srgb, var(--background) 72%, transparent)',
              backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                width: '100%',
                maxWidth: '26rem',
                padding: '2rem',
                textAlign: 'center',
                border: '1px solid var(--ring)',
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
              <motion.div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  background: didIWin ? 'var(--primary)' : 'var(--surface-strong)',
                  boxShadow: isArcade && didIWin
                    ? '0 0 20px var(--primary), 0 0 40px rgba(255,0,255,0.5)'
                    : undefined,
                }}
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              >
                <Trophy
                  style={{
                    width: '2rem', height: '2rem',
                    color: didIWin ? (isArcade ? '#000' : 'var(--surface)') : 'var(--muted)',
                  }}
                />
              </motion.div>

              <p
                className="text-[0.68rem] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--primary)' }}
              >
                {didIWin ? 'winner' : isDraw ? 'draw' : 'game over'}
              </p>

              <h2
                className="mt-[0.375rem] font-serif text-4xl font-medium"
                style={{
                  color: 'var(--foreground)',
                  ...(isArcade && didIWin
                    ? { textShadow: '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.5)' }
                    : {}),
                }}
              >
                {didIWin
                  ? (isArcade ? 'YOU WIN!' : 'You win!')
                  : isDraw
                  ? (isArcade ? 'DRAW!' : "It's a draw!")
                  : (isArcade ? 'GAME OVER' : 'Game over')}
              </h2>

              <div
                className="mt-[1.25rem] flex items-center justify-center gap-[1.5rem] border px-[1.5rem] py-[1rem]"
                style={{
                  borderRadius: 'var(--radius)',
                  borderColor: 'var(--divider)',
                  background: 'var(--surface-strong)',
                }}
              >
                <div className="text-center">
                  <p className="text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                    {playerNumber === 1 ? 'You' : 'Player 1'}
                  </p>
                  <p className="mt-[0.25rem] text-3xl font-black" style={{ color: 'var(--primary)' }}>{scoreOne}</p>
                </div>
                <span className="text-xl font-bold" style={{ color: 'var(--divider)' }}>—</span>
                <div className="text-center">
                  <p className="text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>
                    {playerNumber === 2 ? 'You' : 'Player 2'}
                  </p>
                  <p className="mt-[0.25rem] text-3xl font-black" style={{ color: 'var(--accent)' }}>{scoreTwo}</p>
                </div>
              </div>

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
                  onClick={onExit}
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

export default QuickMathsBoard;
