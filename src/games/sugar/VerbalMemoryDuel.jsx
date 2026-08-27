import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  STARTING_LIVES,
  applyAnswer,
  generateSeed,
  generateWordSequence,
  resolveWinner,
} from './VerbalMemoryRules';
import VerbalMemoryDuelLobby from './VerbalMemoryDuelLobby';
import VerbalMemoryDuelBoard from './VerbalMemoryDuelBoard';
import VerbalMemoryDuelReveal from './VerbalMemoryDuelReveal';
import GameExitScreen from './GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-verbal-memory-duel-player-id';
const TABLE = 'verbal_memory_duel_rooms';

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

const VerbalMemoryDuel = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getOrCreatePlayerId, []);
  const [room, setRoom]     = useState(null);
  const [error, setError]   = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const playerNumber = getPlayerNumber(room, playerId);

  // Deterministic 250-word stream for this room — identical on both clients,
  // recomputed only when the seed changes (fresh each `playAgain`).
  const wordSequence = useMemo(
    () => (room?.seed != null ? generateWordSequence(room.seed) : []),
    [room?.seed],
  );

  // ── Realtime subscription ──────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;
    const channel = supabase
      .channel(`verbal-memory-duel-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE, filter: `id=eq.${room.id}` },
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

  // ── Finalize the match once both players have finished their run ──────────
  // "Finished" is whatever the board decided when it wrote finished_*_at —
  // out of lives, exhausted the word list, or forfeited via Leave — so this
  // effect just watches for both timestamps rather than recomputing lives.

  useEffect(() => {
    if (!supabase || !room || room.status !== 'playing' || !room.player_two) return;
    const oneDone = Boolean(room.finished_one_at);
    const twoDone = Boolean(room.finished_two_at);
    if (!oneDone || !twoDone) return;

    const winner = resolveWinner({ scoreOne: room.score_one, scoreTwo: room.score_two });

    supabase
      .from(TABLE)
      .update({ status: 'finished', winner })
      .eq('id', room.id)
      .eq('status', 'playing')
      .then(() => {});
  }, [room]);

  // ── Create room ────────────────────────────────────────────────────────────

  const createRoom = async () => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    setIsBusy(true);
    const { data, error: e } = await supabase
      .from(TABLE)
      .insert({
        code:      generateRoomCode(),
        seed:      generateSeed(),
        status:    'waiting',
        player_one: playerId,
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
      .from(TABLE)
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (lookupError || !existing) {
      setIsBusy(false);
      setError('No Verbal Memory Duel room found for that code.');
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
      .from(TABLE)
      .update({ player_two: playerId })
      .eq('id', existing.id)
      .is('player_two', null)
      .select()
      .single();
    setIsBusy(false);
    if (joinError) { setError(joinError.message); return; }
    setRoom(data);
  };

  // ── Start game — host-only, requires player two to have joined ─────────────

  const startGame = async () => {
    if (!supabase || !room || room.status !== 'waiting' || playerNumber !== 1 || !room.player_two) return;
    setIsBusy(true);
    await supabase
      .from(TABLE)
      .update({ status: 'playing', started_at: new Date().toISOString() })
      .eq('id', room.id)
      .eq('status', 'waiting');
    setIsBusy(false);
  };

  // ── Submit an answer (own columns only — opponent never sees this live) ────

  const submitAnswer = async (choice) => {
    if (!supabase || !room || room.status !== 'playing' || !playerNumber) return { ok: false };
    const isOne = playerNumber === 1;
    const lives = isOne ? room.lives_one : room.lives_two;
    const score = isOne ? room.score_one : room.score_two;
    const mistakes = (isOne ? room.mistakes_one : room.mistakes_two) ?? [];
    const finishedAt = isOne ? room.finished_one_at : room.finished_two_at;
    if (lives <= 0 || finishedAt) return { ok: false, reason: 'done' };

    const answeredCount = score + mistakes.length;
    const entry = wordSequence[answeredCount];
    if (!entry) return { ok: false, reason: 'exhausted' };

    const next = applyAnswer({ lives, score, mistakes }, entry, choice);
    const exhausted = answeredCount + 1 >= wordSequence.length;

    const update = {
      [isOne ? 'lives_one' : 'lives_two']:       next.lives,
      [isOne ? 'score_one' : 'score_two']:       next.score,
      [isOne ? 'mistakes_one' : 'mistakes_two']: next.mistakes,
    };
    if (next.lives <= 0 || exhausted) {
      update[isOne ? 'finished_one_at' : 'finished_two_at'] = new Date().toISOString();
    }

    const { data, error: e } = await supabase
      .from(TABLE)
      .update(update)
      .eq('id', room.id)
      .select()
      .single();
    if (e) return { ok: false, reason: 'error', message: e.message };
    setRoom(data);
    return { ok: true, correct: next.correct };
  };

  // ── Leave — one contextual control ─────────────────────────────────────────
  // Before start (waiting, with or without an opponent yet): aborts the room
  // outright — nothing has actually begun. Mid-match: ends the match
  // immediately and unconditionally awards the win to whoever stayed, then
  // takes the leaver straight home (the opponent finds out via realtime and
  // lands on the normal reveal screen with "You won!").

  const leaveGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }

    if (room.status === 'waiting') {
      await supabase.from(TABLE).update({ status: 'aborted' }).eq('id', room.id);
      return;
    }

    if (room.status !== 'playing' || !playerNumber) { navigate('/'); return; }
    const isOne = playerNumber === 1;
    await supabase
      .from(TABLE)
      .update({
        status: 'finished',
        winner: isOne ? 2 : 1,
        [isOne ? 'finished_one_at' : 'finished_two_at']: new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'playing');
    navigate('/');
  };

  // ── Exit — after the match finishes, both clients navigate home ───────────

  const exitGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from(TABLE)
      .update({ status: 'closed' })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Play again ─────────────────────────────────────────────────────────────

  const playAgain = async () => {
    if (!supabase || !room) return;
    await supabase
      .from(TABLE)
      .update({
        seed:            generateSeed(),
        status:          'playing',
        lives_one:       STARTING_LIVES,
        lives_two:       STARTING_LIVES,
        score_one:       0,
        score_two:       0,
        mistakes_one:    [],
        mistakes_two:    [],
        finished_one_at: null,
        finished_two_at: null,
        winner:          null,
        started_at:      new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!room || !playerNumber) {
    return (
      <VerbalMemoryDuelLobby
        key="entry"
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

  if (room.status === 'waiting') {
    return (
      <VerbalMemoryDuelLobby
        key="waiting-room"
        inRoom
        roomCode={room.code}
        isHost={playerNumber === 1}
        hasOpponent={Boolean(room.player_two)}
        onStart={startGame}
        onCancel={leaveGame}
        isBusy={isBusy}
      />
    );
  }

  if (room.status === 'playing') {
    return (
      <VerbalMemoryDuelBoard
        room={room}
        playerNumber={playerNumber}
        wordSequence={wordSequence}
        onSubmitAnswer={submitAnswer}
        onLeave={leaveGame}
      />
    );
  }

  return (
    <VerbalMemoryDuelReveal
      room={room}
      playerNumber={playerNumber}
      onPlayAgain={playAgain}
      onExit={exitGame}
    />
  );
};

export default VerbalMemoryDuel;
