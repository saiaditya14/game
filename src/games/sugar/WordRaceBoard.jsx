import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Flag, RotateCcw, Trophy } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import RoomCodeCopy from '../../components/RoomCodeCopy';
import { WORD_LENGTH, MAX_GUESSES, isValidWord } from './WordRaceRules';

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    waiting:    'waiting for them',
    youWin:     'you won!!',
    theyWin:    'they got it first :(',
    draw:       "it's a tie",
    playAgain:  'play again',
    exit:       'exit game',
    giveUp:     'give up',
    leave:      'leave game',
    yourBoard:  'your guesses',
    theirBoard: 'their tiles',
    invalid:    "that's not a word",
    gaveUp:     'you gave up :(',
    theyGaveUp: 'they gave up',
  },
  'theme-arcade': {
    waiting:    'P2 JOINING…',
    youWin:     'YOU WIN!',
    theyWin:    'THEY SOLVED IT FIRST',
    draw:       'DRAW!',
    playAgain:  'PLAY AGAIN',
    exit:       'EXIT',
    giveUp:     'GIVE UP',
    leave:      'LEAVE GAME',
    yourBoard:  'YOUR GUESSES',
    theirBoard: 'THEIR TILES',
    invalid:    'NOT IN WORD LIST',
    gaveUp:     'YOU GAVE UP',
    theyGaveUp: 'THEY GAVE UP',
  },
  'theme-cozy': {
    waiting:    'waiting for them…',
    youWin:     'you won ✨',
    theyWin:    'they solved it first',
    draw:       'a draw~',
    playAgain:  'play again',
    exit:       'exit game',
    giveUp:     'give up',
    leave:      'leave game',
    yourBoard:  'your guesses',
    theirBoard: 'their tiles',
    invalid:    'not in word list',
    gaveUp:     'you gave up',
    theyGaveUp: 'they gave up',
  },
  'theme-champagne': {
    waiting:    'Waiting for Player 2',
    youWin:     'You win!',
    theyWin:    'They solved it first',
    draw:       'Draw',
    playAgain:  'Play again',
    exit:       'Exit game',
    giveUp:     'Give up',
    leave:      'Leave game',
    yourBoard:  'Your guesses',
    theirBoard: 'Their tiles',
    invalid:    'Not in word list',
    gaveUp:     'You gave up',
    theyGaveUp: 'They gave up',
  },
};

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
];

// Correct/present stay fixed hex — they're functional status colors that must
// read the same everywhere. "Absent" gets a per-theme tint (instead of a flat
// neutral gray) so it still feels native to each theme while staying legible.
const ABSENT_BY_THEME = {
  'theme-pink':      '#8a5b68',
  'theme-champagne': '#8a7350',
  'theme-arcade':    '#0d0d10',
  'theme-cozy':      '#5c4630',
};

const tileBg = (status, theme) => {
  const isArcade = theme === 'theme-arcade';
  if (status === 'correct') return isArcade ? '#00e676' : '#22c55e';
  if (status === 'present') return isArcade ? '#ffea00' : '#eab308';
  if (status === 'absent') return ABSENT_BY_THEME[theme] ?? ABSENT_BY_THEME['theme-champagne'];
  return 'transparent';
};

const tileTextColor = (status, theme) => {
  if (status === 'absent') return '#ffffff';
  return theme === 'theme-arcade' ? '#000000' : '#ffffff';
};

const tileGlow = (status, theme) => {
  if (theme !== 'theme-arcade') return undefined;
  if (status === 'correct') return '0 0 12px #00e676, 0 0 24px rgba(0,230,118,0.5)';
  if (status === 'present') return '0 0 12px #ffea00, 0 0 24px rgba(255,234,0,0.45)';
  if (status === 'absent') return '0 0 8px rgba(0,0,0,0.6)';
  return undefined;
};

// ─── Own board (letters + colors) ──────────────────────────────────────────────

const OwnTile = ({ letter, status, theme, active, delay = 0 }) => (
  <motion.div
    className="grid place-items-center border font-black uppercase"
    style={{
      width: 'clamp(2.2rem, 8vw, 2.9rem)',
      height: 'clamp(2.2rem, 8vw, 2.9rem)',
      borderRadius: 'calc(var(--radius) * 0.5)',
      borderColor: status ? 'transparent' : active ? 'var(--ring)' : 'var(--divider)',
      background: status ? tileBg(status, theme) : 'transparent',
      color: status ? tileTextColor(status, theme) : 'var(--foreground)',
      fontSize: 'clamp(1rem, 4vw, 1.4rem)',
      boxShadow: tileGlow(status, theme),
    }}
    initial={status ? { rotateX: 90 } : false}
    animate={status ? { rotateX: 0 } : {}}
    transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {letter}
  </motion.div>
);

const OwnBoard = ({ rows, activeInput, theme }) => (
  <div className="flex flex-col items-center gap-[0.4rem]">
    {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
      const row = rows[rowIndex];
      const isActive = !row && rowIndex === rows.length;
      const letters = row ? row.word.split('') : isActive ? activeInput.split('') : [];
      return (
        <div key={rowIndex} className="flex gap-[0.4rem]">
          {Array.from({ length: WORD_LENGTH }, (_, colIndex) => (
            <OwnTile
              key={colIndex}
              letter={letters[colIndex] ?? ''}
              status={row?.colors?.[colIndex]}
              theme={theme}
              active={isActive}
              delay={row ? colIndex * 0.08 : 0}
            />
          ))}
        </div>
      );
    })}
  </div>
);

// ─── Opponent board (colors only, no letters ever) ─────────────────────────────

const OpponentTile = ({ status, theme }) => (
  <motion.div
    className="border"
    style={{
      width: 'clamp(1.1rem, 4vw, 1.5rem)',
      height: 'clamp(1.1rem, 4vw, 1.5rem)',
      borderRadius: 'calc(var(--radius) * 0.35)',
      borderColor: status ? 'transparent' : 'var(--divider)',
      background: status ? tileBg(status, theme) : 'transparent',
      boxShadow: tileGlow(status, theme),
    }}
    initial={status ? { scale: 0.4, opacity: 0 } : false}
    animate={status ? { scale: 1, opacity: 1 } : {}}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
  />
);

const OpponentBoard = ({ progress, theme }) => (
  <div className="flex flex-col items-center gap-[0.28rem]">
    {Array.from({ length: MAX_GUESSES }, (_, rowIndex) => {
      const colors = progress[rowIndex];
      return (
        <div key={rowIndex} className="flex gap-[0.28rem]">
          {Array.from({ length: WORD_LENGTH }, (_, colIndex) => (
            <OpponentTile key={colIndex} status={colors?.[colIndex]} theme={theme} />
          ))}
        </div>
      );
    })}
  </div>
);

// ─── On-screen keyboard ─────────────────────────────────────────────────────────

const Keyboard = ({ onKey, letterStatus, theme, disabled }) => (
  <div className="mt-[1.5rem] flex flex-col items-center gap-[0.4rem]">
    {KEYBOARD_ROWS.map((row, i) => (
      <div key={i} className="flex gap-[0.3rem]">
        {row.map((key) => {
          const isSpecial = key === 'enter' || key === 'back';
          const status = !isSpecial ? letterStatus[key] : null;
          return (
            <motion.button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onKey(key)}
              className="grid place-items-center border text-xs font-bold uppercase transition disabled:opacity-40"
              style={{
                minWidth: isSpecial ? 'clamp(2.6rem, 9vw, 3.4rem)' : 'clamp(1.7rem, 7vw, 2.3rem)',
                height: 'clamp(2.4rem, 8vw, 2.9rem)',
                borderRadius: 'calc(var(--radius) * 0.45)',
                borderColor: status ? 'transparent' : 'var(--divider)',
                background: status ? tileBg(status, theme) : 'var(--surface)',
                color: status ? tileTextColor(status, theme) : 'var(--foreground)',
                padding: '0 0.4rem',
              }}
              whileHover={disabled ? {} : { scale: 1.06 }}
              whileTap={disabled ? {} : { scale: 0.92 }}
            >
              {key === 'back' ? '⌫' : key === 'enter' ? '↵' : key}
            </motion.button>
          );
        })}
      </div>
    ))}
  </div>
);

// ─── Board ──────────────────────────────────────────────────────────────────────

const WordRaceBoard = ({
  room,
  playerNumber,
  onSubmitGuess,
  onLeave,
  onPlayAgain,
  onExit,
}) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const isPink   = theme === 'theme-pink';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const [myRows, setMyRows]   = useState([]); // [{ word, colors }]
  const [input, setInput]     = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [flash, setFlash]     = useState('');

  const ownProgress = playerNumber === 1 ? room?.progress_one : room?.progress_two;
  const oppProgress = playerNumber === 1 ? room?.progress_two : room?.progress_one;
  const ownSolved    = playerNumber === 1 ? room?.solved_one : room?.solved_two;
  const oppSolved    = playerNumber === 1 ? room?.solved_two : room?.solved_one;
  const ownGaveUp    = playerNumber === 1 ? room?.gave_up_one : room?.gave_up_two;
  const oppGaveUp    = playerNumber === 1 ? room?.gave_up_two : room?.gave_up_one;

  useEffect(() => {
    if ((ownProgress?.length ?? 0) === 0) setMyRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.secret_word]);

  const hasOpponent = Boolean(room?.player_two);
  const isOver       = room?.status === 'finished';
  const didIWin      = isOver && room?.winner === playerNumber;
  const didTheyWin   = isOver && room?.winner !== null && room?.winner !== playerNumber;
  const isDraw       = isOver && room?.winner === null;

  const rowsSoFar = ownProgress?.length ?? 0;
  const isDone    = ownSolved || ownGaveUp || rowsSoFar >= MAX_GUESSES;
  const isInteractive = hasOpponent && !isOver && !isDone;

  // Merge local (lettered) rows with any server-known colors-only rows (post-reload fallback).
  const displayRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < rowsSoFar; i++) {
      if (myRows[i]) rows.push(myRows[i]);
      else rows.push({ word: '     ', colors: ownProgress[i] });
    }
    return rows;
  }, [myRows, ownProgress, rowsSoFar]);

  // Best-known status per letter, for keyboard highlighting.
  const letterStatus = useMemo(() => {
    const map = {};
    const rank = { absent: 0, present: 1, correct: 2 };
    for (const row of myRows) {
      row.word.split('').forEach((ch, i) => {
        const s = row.colors[i];
        if (!map[ch] || rank[s] > rank[map[ch]]) map[ch] = s;
      });
    }
    return map;
  }, [myRows]);

  const submit = async () => {
    if (!isInteractive || input.length !== WORD_LENGTH) return;
    if (!isValidWord(input)) {
      setFlash(copy.invalid);
      setShakeKey((k) => k + 1);
      setTimeout(() => setFlash(''), 1400);
      return;
    }
    const word = input;
    setInput('');
    const result = await onSubmitGuess(word);
    if (result?.ok) {
      setMyRows((prev) => [...prev, { word, colors: result.colors }]);
    } else if (result && !result.ok) {
      setInput(word);
      setShakeKey((k) => k + 1);
    }
  };

  const handleKey = (key) => {
    if (!isInteractive) return;
    if (key === 'enter') { submit(); return; }
    if (key === 'back') { setInput((s) => s.slice(0, -1)); return; }
    if (/^[a-z]$/.test(key) && input.length < WORD_LENGTH) setInput((s) => s + key);
  };

  // Physical keyboard support
  useEffect(() => {
    if (!isInteractive) return undefined;
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'enter') { submit(); return; }
      if (k === 'backspace') { setInput((s) => s.slice(0, -1)); return; }
      if (/^[a-z]$/.test(k)) setInput((s) => (s.length < WORD_LENGTH ? s + k : s));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInteractive, input]);

  const statusLine = isDone && !isOver
    ? (ownGaveUp ? copy.gaveUp : (ownSolved ? '' : copy.waiting))
    : null;

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[52rem] flex-col px-[1rem] py-[1.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="grid gap-[0.75rem] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div
          className="flex min-w-0 flex-col items-center gap-[0.2rem] border px-[1rem] py-[0.625rem]"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            {isArcade ? 'YOU' : 'You'}
          </p>
          <p className="text-lg font-black" style={{ color: ownSolved ? 'var(--primary)' : 'var(--foreground)' }}>
            {rowsSoFar}/{MAX_GUESSES}
          </p>
        </div>

        <motion.div
          className="border px-[1.25rem] py-[0.75rem] text-center"
          style={{
            borderColor: 'var(--ring)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-strong)',
            boxShadow: isArcade ? '0 0 14px rgba(0,255,255,0.10), 0 0 28px rgba(255,0,255,0.06)' : 'var(--shadow)',
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
              <p className="mt-[0.25rem] text-sm font-bold" style={{ color: 'var(--muted)', minHeight: '1.2rem' }}>
                {statusLine}
              </p>
            </>
          )}
        </motion.div>

        <div
          className="flex min-w-0 flex-col items-center gap-[0.2rem] border px-[1rem] py-[0.625rem] sm:justify-self-end"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            {isArcade ? 'THEM' : 'Them'}
          </p>
          <p className="text-lg font-black" style={{ color: oppSolved ? 'var(--accent)' : 'var(--foreground)' }}>
            {oppProgress?.length ?? 0}/{MAX_GUESSES}
          </p>
        </div>
      </header>

      {/* ── Game area ────────────────────────────────────────────────────── */}
      <section
        className="relative mt-[1.5rem] flex flex-1 flex-col items-center justify-center gap-[2rem] border sm:flex-row sm:items-start sm:justify-center"
        style={{
          borderRadius: 'var(--radius)',
          borderColor: 'var(--divider)',
          background: isArcade ? 'rgba(4,4,4,0.97)' : 'var(--surface)',
          boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 32px rgba(0,255,255,0.06), var(--shadow)' : 'var(--shadow)',
          padding: 'clamp(1.5rem, 5vw, 2.5rem)',
          overflow: 'hidden',
        }}
      >
        {isArcade && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)' }} />
        )}
        {isPink && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(251,113,133,0.08) 0%, transparent 70%)' }} />
        )}

        {!hasOpponent ? (
          <motion.p
            className="text-base"
            style={{ color: 'var(--muted)', position: 'relative', zIndex: 1 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          >
            {copy.waiting}
          </motion.p>
        ) : (
          <>
            <motion.div
              key={shakeKey}
              style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
              animate={flash ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <p className="mb-[0.75rem] text-[0.6rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                {copy.yourBoard}
              </p>
              <OwnBoard rows={displayRows} activeInput={input} theme={theme} />
              <AnimatePresence>
                {flash && (
                  <motion.p
                    className="mt-[0.75rem] text-xs font-bold"
                    style={{ color: 'var(--primary)' }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {flash}
                  </motion.p>
                )}
              </AnimatePresence>
              {!isOver && (
                <Keyboard onKey={handleKey} letterStatus={letterStatus} theme={theme} disabled={!isInteractive} />
              )}
            </motion.div>

            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <p className="mb-[0.75rem] text-[0.6rem] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>
                {copy.theirBoard}
              </p>
              <OpponentBoard progress={oppProgress ?? []} theme={theme} />
              {oppGaveUp && !isOver && (
                <p className="mt-[0.75rem] text-xs font-bold" style={{ color: 'var(--muted)' }}>{copy.theyGaveUp}</p>
              )}
            </div>
          </>
        )}
      </section>

      {/* ── Footer — one contextual leave/forfeit control ───────────────────── */}
      {!isOver && !isDone && (
        <footer className="mt-[1.25rem] flex flex-wrap gap-[0.75rem]">
          <button
            type="button"
            onClick={onLeave}
            className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] border px-[1rem] py-[0.5rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--foreground)' }}
          >
            {hasOpponent ? <Flag className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {hasOpponent ? copy.giveUp : copy.leave}
          </button>
        </footer>
      )}

      {/* ── End-game overlay ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            style={{
              position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem', background: 'color-mix(in srgb, var(--background) 72%, transparent)', backdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                width: '100%', maxWidth: '26rem', padding: '2rem', textAlign: 'center',
                border: '1px solid var(--ring)', borderRadius: 'var(--radius)', background: 'var(--surface)',
                boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 40px rgba(0,255,255,0.12), 0 0 80px rgba(255,0,255,0.08)' : 'var(--shadow)',
              }}
              initial={{ opacity: 0, y: 20, scale: 0.93 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                style={{
                  display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', borderRadius: '50%', margin: '0 auto 1rem',
                  background: didIWin ? 'var(--primary)' : 'var(--surface-strong)',
                  boxShadow: isArcade && didIWin ? '0 0 20px var(--primary), 0 0 40px rgba(255,0,255,0.5)' : undefined,
                }}
                initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
              >
                <Trophy style={{ width: '2rem', height: '2rem', color: didIWin ? (isArcade ? '#000' : 'var(--surface)') : 'var(--muted)' }} />
              </motion.div>

              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
                {didIWin ? 'winner' : isDraw ? 'draw' : 'game over'}
              </p>

              <h2
                className="mt-[0.375rem] font-serif text-3xl font-medium"
                style={{ color: 'var(--foreground)', ...(isArcade && didIWin ? { textShadow: '0 0 16px var(--primary), 0 0 32px rgba(255,0,255,0.5)' } : {}) }}
              >
                {didIWin ? copy.youWin : didTheyWin ? copy.theyWin : copy.draw}
              </h2>

              <div
                className="mt-[1.25rem] border px-[1.5rem] py-[1rem]"
                style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)' }}
              >
                <p className="text-[0.6rem] uppercase tracking-[0.16em]" style={{ color: 'var(--muted)' }}>the word was</p>
                <p className="mt-[0.25rem] font-mono text-2xl font-black uppercase tracking-[0.3em]" style={{ color: 'var(--primary)' }}>
                  {room?.secret_word}
                </p>
              </div>

              <div className="mt-[1.5rem] flex flex-col gap-[0.75rem]">
                <motion.button
                  type="button"
                  onClick={onPlayAgain}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)', background: 'var(--primary)', color: isArcade ? '#000' : 'var(--surface)', boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)' }}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {copy.playAgain}
                </motion.button>

                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex min-h-[3rem] w-full items-center justify-center border px-[1.25rem] py-[0.75rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
                  style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface-strong)', color: 'var(--foreground)' }}
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

export default WordRaceBoard;
