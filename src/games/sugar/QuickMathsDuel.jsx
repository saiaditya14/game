import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../components/ThemeProvider';
import { generateSeed, generateQuestions } from './QuickMathsRules';
import QuickMathsLobby from './QuickMathsLobby';
import QuickMathsBoard from './QuickMathsBoard';

const PLAYER_ID_KEY = 'lovelyland-quick-maths-player-id';

const getOrCreatePlayerId = () => {
  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id =
    window.crypto?.randomUUID?.() ??
    `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
};

const generateRoomCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const getPlayerNumber = (room, playerId) => {
  if (room?.player_one === playerId) return 1;
  if (room?.player_two === playerId) return 2;
  return null;
};

// ─── Exit / Abort modal card ────────────────────────────────────────────────────

const exitCopy = {
  aborted: {
    'theme-pink':      { title: 'game stopped~',  sub: 'heading home ♡' },
    'theme-arcade':    { title: 'GAME ABORTED',    sub: 'RETURNING HOME…' },
    'theme-cozy':      { title: 'game ended',      sub: 'heading home…' },
    'theme-champagne': { title: 'Game Aborted',    sub: 'Returning home…' },
  },
  closed: {
    'theme-pink':      { title: 'game over~ ♡',   sub: 'heading home ♡' },
    'theme-arcade':    { title: 'GAME OVER',       sub: 'HEADING HOME…' },
    'theme-cozy':      { title: "that's a wrap",   sub: 'heading home…' },
    'theme-champagne': { title: 'Game Over',       sub: 'Heading home…' },
  },
};

const GameExitScreen = ({ status }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const copy =
    exitCopy[status]?.[theme] ??
    exitCopy[status]?.['theme-champagne'] ??
    { title: 'Heading home…', sub: '' };

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'color-mix(in srgb, var(--background) 78%, transparent)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <motion.div
        style={{
          width: '100%',
          maxWidth: '22rem',
          border: '1px solid var(--ring)',
          borderRadius: 'var(--radius)',
          background: 'var(--surface)',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: isArcade
            ? '0 0 0 1px var(--ring), 0 0 40px rgba(0,255,255,0.10), 0 0 80px rgba(255,0,255,0.07)'
            : 'var(--shadow)',
        }}
        initial={{ opacity: 0, y: 24, scale: 0.91 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <p
          className="text-xl font-black"
          style={{
            color: 'var(--foreground)',
            ...(isArcade ? { textShadow: '0 0 14px var(--primary), 0 0 28px rgba(255,0,255,0.45)' } : {}),
          }}
        >
          {copy.title}
        </p>
        <motion.p
          className="mt-[0.5rem] text-sm"
          style={{ color: 'var(--muted)' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          {copy.sub}
        </motion.p>
      </motion.div>
    </main>
  );
};

// ─── Root component ────────────────────────────────────────────────────────────

const QuickMathsDuel = () => {
  const navigate   = useNavigate();
  const playerId   = useMemo(getOrCreatePlayerId, []);
  const [room, setRoom]     = useState(null);
  const [error, setError]   = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const claimingRef = useRef(false);

  const playerNumber = getPlayerNumber(room, playerId);

  const questions = useMemo(
    () =>
      room?.seed
        ? generateQuestions(room.seed, {
            totalRounds:  room.total_rounds  ?? 10,
            numberSize:   room.number_size   ?? 'small',
            operations:   room.operations    ?? 'add_sub',
            operandCount: room.operand_count ?? 2,
          })
        : [],
    [room?.seed, room?.total_rounds, room?.number_size, room?.operations, room?.operand_count],
  );

  // ── Realtime subscription ──────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;
    const channel = supabase
      .channel(`quick-maths-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quick_maths_rooms', filter: `id=eq.${room.id}` },
        (payload) => { if (payload.new) setRoom(payload.new); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  // ── Navigate both players home on abort or exit ────────────────────────────

  useEffect(() => {
    if (room?.status !== 'aborted' && room?.status !== 'closed') return;
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [room?.status, navigate]);

  // ── Reset claiming flag on round advance ───────────────────────────────────

  useEffect(() => { claimingRef.current = false; }, [room?.current_round]);

  // ── Create room ────────────────────────────────────────────────────────────

  const createRoom = async (config = {}) => {
    const {
      numberSize   = 'small',
      operations   = 'add_sub',
      operandCount = 2,
      totalRounds  = 10,
    } = config;

    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    setIsBusy(true);
    const { data, error: e } = await supabase
      .from('quick_maths_rooms')
      .insert({
        code:          generateRoomCode(),
        seed:          generateSeed(),
        number_size:   numberSize,
        operations,
        operand_count: operandCount,
        total_rounds:  totalRounds,
        status:        'waiting',
        player_one:    playerId,
        score_one:     0,
        score_two:     0,
        current_round: 1,
        round_winner:  null,
        winner:        null,
      })
      .select()
      .single();
    setIsBusy(false);
    if (e) { setError(e.message); return; }
    setRoom(data);
  };

  // ── Join room ──────────────────────────────────────────────────────────────

  const joinRoom = async (rawCode) => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    const code = rawCode.trim().toUpperCase();
    if (code.length < 4) { setError('Enter the 4-6 character room code.'); return; }
    setIsBusy(true);

    const { data: existing, error: lookupError } = await supabase
      .from('quick_maths_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (lookupError || !existing) {
      setIsBusy(false);
      setError('No Quick-Maths room found for that code.');
      return;
    }
    if (existing.player_one === playerId || existing.player_two === playerId) {
      setIsBusy(false);
      setRoom(existing);
      return;
    }
    if (existing.player_two) {
      setIsBusy(false);
      setError('That room already has two players.');
      return;
    }

    const { data, error: joinError } = await supabase
      .from('quick_maths_rooms')
      .update({ player_two: playerId, status: 'playing', started_at: new Date().toISOString() })
      .eq('id', existing.id)
      .is('player_two', null)
      .select()
      .single();
    setIsBusy(false);
    if (joinError) { setError(joinError.message); return; }
    setRoom(data);
  };

  // ── Handle answer change ───────────────────────────────────────────────────

  const handleAnswerChange = useCallback((rawValue) => {
    if (!room || room.status !== 'playing' || claimingRef.current) return;

    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed)) return;

    const q = questions[room.current_round - 1];
    if (!q || parsed !== q.answer) return;

    claimingRef.current = true;

    const isLastRound = room.current_round >= room.total_rounds;
    const newScoreOne = playerNumber === 1 ? room.score_one + 1 : room.score_one;
    const newScoreTwo = playerNumber === 2 ? room.score_two + 1 : room.score_two;
    const finalWinner = isLastRound
      ? (newScoreOne > newScoreTwo ? 1 : newScoreTwo > newScoreOne ? 2 : null)
      : null;

    supabase
      .from('quick_maths_rooms')
      .update({
        round_winner:  playerNumber,
        score_one:     newScoreOne,
        score_two:     newScoreTwo,
        current_round: isLastRound ? room.current_round : room.current_round + 1,
        status:        isLastRound ? 'finished' : 'playing',
        winner:        finalWinner,
      })
      .eq('id', room.id)
      .eq('current_round', room.current_round)
      .then(({ error: e }) => {
        if (e) claimingRef.current = false;
      });
  }, [playerNumber, questions, room]);

  // ── Abort — locks room mid-game, both clients navigate home ───────────────

  const abortGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from('quick_maths_rooms')
      .update({ status: 'aborted' })
      .eq('id', room.id);
  };

  // ── Exit — after game finishes, both clients navigate home ────────────────

  const exitGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from('quick_maths_rooms')
      .update({ status: 'closed' })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Play again ─────────────────────────────────────────────────────────────

  const playAgain = async () => {
    if (!supabase || !room) return;
    claimingRef.current = false;
    await supabase
      .from('quick_maths_rooms')
      .update({
        seed:          generateSeed(),
        status:        'playing',
        score_one:     0,
        score_two:     0,
        current_round: 1,
        round_winner:  null,
        winner:        null,
        started_at:    new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!room || !playerNumber) {
    return (
      <QuickMathsLobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        isBusy={isBusy}
        error={error}
        roomCode={room?.code}
      />
    );
  }

  if (room.status === 'aborted') return <GameExitScreen status="aborted" />;
  if (room.status === 'closed')  return <GameExitScreen status="closed" />;

  return (
    <QuickMathsBoard
      room={room}
      playerNumber={playerNumber}
      questions={questions}
      onAnswerChange={handleAnswerChange}
      onPlayAgain={playAgain}
      onAbort={abortGame}
      onExit={exitGame}
    />
  );
};

export default QuickMathsDuel;
