import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Clock, Check, Users } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import RoomCodeCopy from '../../components/RoomCodeCopy';

// ─── Per-theme copy ───────────────────────────────────────────────────────────

const copyByTheme = {
  'theme-pink': {
    submitted:  "you're locked in ♡",
    submit:     'lock in answers ♡',
    forfeit:    'forfeit round',
    letter:     'the letter is',
    lockedIn:   (n, total) => `${n} / ${total} locked in ♡`,
  },
  'theme-arcade': {
    submitted:  'LOCKED IN',
    submit:     'LOCK IN ANSWERS',
    forfeit:    'FORFEIT ROUND',
    letter:     'THE LETTER IS',
    lockedIn:   (n, total) => `${n} / ${total} LOCKED IN`,
  },
  'theme-cozy': {
    submitted:  "you're locked in",
    submit:     'lock in answers',
    forfeit:    'forfeit round',
    letter:     'the letter is',
    lockedIn:   (n, total) => `${n} / ${total} locked in`,
  },
  'theme-champagne': {
    submitted:  "You're locked in",
    submit:     'Lock In Answers',
    forfeit:    'Forfeit round',
    letter:     'The letter is',
    lockedIn:   (n, total) => `${n} / ${total} locked in`,
  },
};

const formatClock = (totalSeconds) => {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
};

// Fixed warning tint for the final countdown seconds — a functional status
// color, so it must read the same in every theme rather than inherit a
// generic surface/foreground token.
const TIMER_WARNING_COLOR = '#ef4444';
const TIMER_WARNING_THRESHOLD = 10;

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

const CategoryBlitzBoard = ({ room, playerId, onSubmitAnswers, onLeave }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy = copyByTheme[theme] ?? copyByTheme['theme-champagne'];

  const categories = room?.categories ?? [];
  const players = useMemo(() => (Array.isArray(room?.players) ? room.players : []), [room?.players]);
  const submittedMap = room?.submitted ?? {};
  const lockedCount = players.filter((p) => submittedMap[p.id]).length;

  const ownAnswers = room?.answers?.[playerId];
  const ownSubmittedAt = submittedMap[playerId];

  const [answers, setAnswers] = useState(() => {
    const base = ownSubmittedAt ? ownAnswers : null;
    return categories.map((_, i) => base?.[i] ?? '');
  });

  const isSubmitted = Boolean(ownSubmittedAt);
  const submittedRef = useRef(isSubmitted);
  submittedRef.current = isSubmitted;

  // ── Countdown synced from the room's shared started_at timestamp ──────────
  const deadline = useMemo(() => {
    if (!room?.started_at || !room?.timer_seconds) return null;
    return new Date(room.started_at).getTime() + room.timer_seconds * 1000;
  }, [room?.started_at, room?.timer_seconds]);

  const [remaining, setRemaining] = useState(() =>
    deadline ? Math.max(0, (deadline - Date.now()) / 1000) : (room?.timer_seconds ?? 0),
  );

  useEffect(() => {
    if (!deadline) return undefined;
    const tick = () => setRemaining(Math.max(0, (deadline - Date.now()) / 1000));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [deadline]);

  // "Time's up" only counts once a REAL deadline exists and we've actually
  // passed it — never when the timer simply hasn't initialized yet locally.
  // Trusting a stale `remaining === 0` here would auto-submit the instant the
  // component mounts before `deadline` is derived from realtime data.
  // (Regression caught by E2E in the 2-player version — kept identical here.)
  const timeExpired = Boolean(deadline) && Date.now() >= deadline;

  // Auto-submit whatever's typed the instant the shared timer genuinely runs out.
  useEffect(() => {
    if (submittedRef.current || !deadline) return;
    if (Date.now() < deadline) return;
    onSubmitAnswers(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, deadline]);

  const isInteractive = !isSubmitted && !timeExpired;
  const isTimeCritical = remaining <= TIMER_WARNING_THRESHOLD && remaining > 0 && !timeExpired;

  const setAnswer = (index, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const submit = () => {
    if (!isInteractive) return;
    onSubmitAnswers(answers);
  };

  return (
    <main
      className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[46rem] flex-col px-[1rem] py-[1.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      <p
        className="text-center text-[0.62rem] font-bold uppercase tracking-[0.12em]"
        style={{ color: 'var(--muted)', marginBottom: '0.5rem' }}
      >
        {isArcade ? 'ROOM ' : 'room '}<RoomCodeCopy code={room?.code} idleColor="var(--primary)" />
      </p>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="grid gap-[0.75rem] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div
          className="flex min-w-0 flex-col items-center gap-[0.2rem] border px-[1rem] py-[0.625rem]"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}
        >
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            {copy.letter}
          </p>
          <p
            className="font-mono text-2xl font-black"
            style={{
              color: 'var(--primary)',
              ...(isArcade ? { textShadow: '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.5)' } : {}),
            }}
          >
            {room?.round_letter}
          </p>
        </div>

        <motion.div
          className="flex items-center justify-center gap-[0.5rem] border px-[1.25rem] py-[0.75rem]"
          style={{
            borderColor: isTimeCritical ? TIMER_WARNING_COLOR : 'var(--ring)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface-strong)',
            boxShadow: isArcade ? '0 0 14px rgba(0,255,255,0.10), 0 0 28px rgba(255,0,255,0.06)' : 'var(--shadow)',
          }}
          animate={isTimeCritical ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isTimeCritical ? Infinity : 0, duration: 0.7 }}
        >
          <Clock className="h-4 w-4" style={{ color: isTimeCritical ? TIMER_WARNING_COLOR : 'var(--muted)' }} />
          <span
            className="font-mono text-2xl font-black tabular-nums"
            style={{ color: isTimeCritical ? TIMER_WARNING_COLOR : 'var(--foreground)' }}
          >
            {formatClock(remaining)}
          </span>
        </motion.div>

        <div
          className="flex min-w-0 flex-col items-center gap-[0.2rem] border px-[1rem] py-[0.625rem] sm:justify-self-end"
          style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)', background: 'var(--surface)' }}
        >
          <p className="flex items-center gap-[0.3rem] text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--muted)' }}>
            <Users className="h-3 w-3" />
            {isArcade ? 'PRESENCE' : 'Presence'}
          </p>
          <p className="text-sm font-bold" style={{ color: lockedCount === players.length ? 'var(--primary)' : 'var(--foreground)' }}>
            {copy.lockedIn(lockedCount, players.length)}
          </p>
        </div>
      </header>

      {/* ── Game area ────────────────────────────────────────────────────── */}
      <section
        className="relative mt-[1.5rem] flex flex-1 flex-col border"
        style={{
          borderRadius: 'var(--radius)',
          borderColor: 'var(--divider)',
          background: isArcade ? 'rgba(4,4,4,0.97)' : 'var(--surface)',
          boxShadow: isArcade ? '0 0 0 1px var(--ring), 0 0 32px rgba(0,255,255,0.06), var(--shadow)' : 'var(--shadow)',
          padding: 'clamp(1.25rem, 4vw, 2rem)',
          overflow: 'hidden',
        }}
      >
        {isArcade && (
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)' }} />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            className="grid gap-[0.75rem] sm:grid-cols-2"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {categories.map((category, i) => (
              <motion.div key={category} className="flex flex-col gap-[0.3rem]" variants={fieldVariants}>
                <label
                  htmlFor={`category-blitz-${i}`}
                  className="text-xs font-bold"
                  style={{ color: 'var(--muted)' }}
                >
                  {category}
                </label>
                <motion.input
                  id={`category-blitz-${i}`}
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswer(i, e.target.value)}
                  disabled={!isInteractive}
                  placeholder={`${room?.round_letter}…`}
                  className="min-h-[2.5rem] border px-[0.875rem] text-sm font-semibold outline-none transition focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-70"
                  style={{
                    borderColor: 'var(--divider)',
                    borderRadius: 'calc(var(--radius) * 0.6)',
                    background: isArcade ? 'rgba(0,20,0,0.55)' : 'var(--surface-strong)',
                    color: 'var(--foreground)',
                  }}
                  whileFocus={{ scale: 1.015 }}
                />
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {isSubmitted ? (
              <motion.div
                key="locked"
                className="mt-[1.5rem] flex items-center justify-center gap-[0.5rem] border px-[1rem] py-[0.75rem] text-sm font-bold"
                style={{ borderRadius: 'var(--radius)', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--surface-strong)' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Check className="h-4 w-4" />
                {copy.submitted}
              </motion.div>
            ) : (
              <motion.button
                key="submit"
                type="button"
                onClick={submit}
                disabled={!isInteractive}
                className="mt-[1.5rem] inline-flex min-h-[2.75rem] w-full items-center justify-center gap-[0.5rem] px-[1.5rem] py-[0.75rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderRadius: 'var(--radius)',
                  background: 'var(--primary)',
                  color: isArcade ? '#000' : 'var(--surface)',
                  boxShadow: isArcade ? '0 0 12px var(--primary), 0 0 24px rgba(255,0,255,0.3)' : 'var(--shadow)',
                }}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Check className="h-4 w-4" />
                {copy.submit}
              </motion.button>
            )}
          </AnimatePresence>

          {isSubmitted && lockedCount < players.length && (
            <motion.p
              className="mt-[0.75rem] text-center text-xs"
              style={{ color: 'var(--muted)' }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
            >
              {copy.lockedIn(lockedCount, players.length)}
            </motion.p>
          )}
        </div>
      </section>

      {/* ── Footer — one contextual leave/forfeit control ───────────────── */}
      <footer className="mt-[1.25rem] flex flex-wrap gap-[0.75rem]">
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex min-h-[2.75rem] items-center gap-[0.5rem] border px-[1rem] py-[0.5rem] text-sm font-bold transition hover:-translate-y-[0.125rem] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
          style={{ borderRadius: 'var(--radius)', borderColor: 'var(--divider)', background: 'var(--surface)', color: 'var(--foreground)' }}
        >
          <Flag className="h-4 w-4" />
          {copy.forfeit}
        </button>
      </footer>
    </main>
  );
};

export default CategoryBlitzBoard;
