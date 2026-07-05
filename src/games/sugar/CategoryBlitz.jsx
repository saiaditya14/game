import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { computeScores, pickCategories, pickRandomLetter, resolveWinner } from './CategoryBlitzRules';
import CategoryBlitzLobby from './CategoryBlitzLobby';
import CategoryBlitzBoard from './CategoryBlitzBoard';
import CategoryBlitzReveal from './CategoryBlitzReveal';
import GameExitScreen from './GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-category-blitz-player-id';
const MAX_PLAYERS = 8;

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

const playersOf = (room) => (Array.isArray(room?.players) ? room.players : []);

const CategoryBlitz = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getOrCreatePlayerId, []);
  const [room, setRoom]     = useState(null);
  const [error, setError]   = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const players  = playersOf(room);
  const myPlayer = players.find((p) => p.id === playerId) ?? null;
  const isHost   = Boolean(room) && room.host_id === playerId;

  // ── Realtime subscription ──────────────────────────────────────────────────

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;
    const channel = supabase
      .channel(`category-blitz-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'category_blitz_rooms', filter: `id=eq.${room.id}` },
        (payload) => { if (payload.new) setRoom(payload.new); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  // ── Navigate home on abort or exit ─────────────────────────────────────────

  useEffect(() => {
    if (room?.status !== 'aborted' && room?.status !== 'closed') return;
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [room?.status, navigate]);

  // ── Playing → Reveal once EVERY player has submitted OR the timer expired ──

  useEffect(() => {
    if (!supabase || !room || room.status !== 'playing') return;
    const ids = playersOf(room).map((p) => p.id);
    const submitted = room.submitted ?? {};
    const allSubmitted = ids.length > 0 && ids.every((id) => submitted[id]);

    const deadline = room.started_at && room.timer_seconds
      ? new Date(room.started_at).getTime() + room.timer_seconds * 1000
      : null;
    const timeUp = Boolean(deadline) && Date.now() >= deadline;

    if (!allSubmitted && !timeUp) return;

    supabase
      .from('category_blitz_rooms')
      .update({ status: 'reveal' })
      .eq('id', room.id)
      .eq('status', 'playing')
      .then(() => {});
  }, [room]);

  // ── Reveal → Finished once EVERY player has confirmed their votes ──────────

  useEffect(() => {
    if (!supabase || !room || room.status !== 'reveal') return;
    const ids = playersOf(room).map((p) => p.id);
    const reviewsDone = room.reviews_done ?? {};
    const allDone = ids.length > 0 && ids.every((id) => reviewsDone[id]);
    if (!allDone) return;

    const { scores } = computeScores({
      players: playersOf(room),
      categories: room.categories ?? [],
      answers: room.answers ?? {},
      votes: room.votes ?? {},
    });
    const winner = resolveWinner(scores);

    supabase
      .from('category_blitz_rooms')
      .update({ status: 'finished', scores, winner })
      .eq('id', room.id)
      .eq('status', 'reveal')
      .then(() => {});
  }, [room]);

  // ── Create room ────────────────────────────────────────────────────────────
  // round_letter/categories are picked once here purely so the room remembers
  // the creator's chosen category COUNT (there's no separate column for it);
  // `startGame` below re-picks a fresh letter + category set for the real round.

  const createRoom = async (config = {}) => {
    const { timerSeconds = 90, categoryCount = 8 } = config;

    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    setIsBusy(true);
    const categories = pickCategories(categoryCount);
    const { data, error: e } = await supabase
      .from('category_blitz_rooms')
      .insert({
        code:          generateRoomCode(),
        status:        'waiting',
        host_id:       playerId,
        players:       [{ id: playerId, name: 'Player 1' }],
        round_letter:  pickRandomLetter(),
        categories,
        timer_seconds: timerSeconds,
      })
      .select()
      .single();
    setIsBusy(false);
    if (e) { setError(e.message); return; }
    setRoom(data);
  };

  // ── Join room (RPC — safely appends to the shared `players` array) ─────────

  const joinRoom = async (rawCode) => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    const code = rawCode.trim().toUpperCase();
    if (code.length < 4) { setError('Enter the 4-6 character room code.'); return; }
    setIsBusy(true);

    const { data, error: joinError } = await supabase.rpc('category_blitz_join', {
      p_code: code,
      p_player_id: playerId,
    });
    setIsBusy(false);
    if (joinError) {
      if (joinError.message?.includes('ROOM_NOT_FOUND')) setError('No Category Blitz room found for that code.');
      else if (joinError.message?.includes('ROOM_FULL')) setError(`That room already has ${MAX_PLAYERS} players.`);
      else if (joinError.message?.includes('ROOM_NOT_JOINABLE')) setError('That room has already started.');
      else setError(joinError.message);
      return;
    }
    setRoom(data);
  };

  // ── Host starts the round from the waiting room ─────────────────────────────

  const startGame = async () => {
    if (!supabase || !room || room.status !== 'waiting' || !isHost) return;
    if (players.length < 2) return;

    const categoryCount = room.categories?.length || 8;
    const categories = pickCategories(categoryCount);
    const answers = Object.fromEntries(players.map((p) => [p.id, categories.map(() => '')]));

    await supabase
      .from('category_blitz_rooms')
      .update({
        status:       'playing',
        started_at:   new Date().toISOString(),
        round_letter: pickRandomLetter(),
        categories,
        answers,
        submitted:     {},
        votes:         {},
        reviews_done:  {},
        scores:        {},
        winner:        null,
      })
      .eq('id', room.id)
      .eq('status', 'waiting');
  };

  // ── Lock in answers (own key only, via RPC) ─────────────────────────────────

  const submitAnswers = async (answers) => {
    if (!supabase || !room || room.status !== 'playing' || !myPlayer) return;
    if (room.submitted?.[playerId]) return;
    await supabase.rpc('category_blitz_submit_answers', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_answers: answers,
    });
  };

  // ── Confirm my votes (own key only, via RPC) ────────────────────────────────

  const confirmVotes = async (votes) => {
    if (!supabase || !room || room.status !== 'reveal' || !myPlayer) return;
    if (room.reviews_done?.[playerId]) return;
    await supabase.rpc('category_blitz_submit_votes', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_votes: votes,
    });
  };

  // ── Leave — one contextual control ─────────────────────────────────────────
  // Category Blitz shares a single timer + joint reveal across everyone, so
  // there's no meaningful way for the room to continue without a player —
  // leaving (at any stage before finish) ends the whole room for everyone.

  const leaveGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    if (room.status === 'finished' || room.status === 'aborted' || room.status === 'closed') return;
    await supabase.from('category_blitz_rooms').update({ status: 'aborted' }).eq('id', room.id);
  };

  // ── Exit — after game finishes, everyone navigates home ────────────────────

  const exitGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from('category_blitz_rooms')
      .update({ status: 'closed' })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Play again ─────────────────────────────────────────────────────────────

  const playAgain = async () => {
    if (!supabase || !room) return;
    const categoryCount = room.categories?.length ?? 8;
    const categories = pickCategories(categoryCount);
    const answers = Object.fromEntries(players.map((p) => [p.id, categories.map(() => '')]));

    await supabase
      .from('category_blitz_rooms')
      .update({
        status:       'playing',
        round_letter: pickRandomLetter(),
        categories,
        answers,
        submitted:    {},
        votes:        {},
        reviews_done: {},
        scores:       {},
        winner:       null,
        started_at:   new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!room || !myPlayer || room.status === 'waiting') {
    return (
      <CategoryBlitzLobby
        room={room}
        playerId={playerId}
        isHost={isHost}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onStartGame={startGame}
        onLeaveRoom={leaveGame}
        isBusy={isBusy}
        error={error}
      />
    );
  }

  if (room.status === 'aborted') return <GameExitScreen status="aborted" />;
  if (room.status === 'closed')  return <GameExitScreen status="closed" />;

  if (room.status === 'reveal' || room.status === 'finished') {
    return (
      <CategoryBlitzReveal
        room={room}
        playerId={playerId}
        onConfirmVotes={confirmVotes}
        onPlayAgain={playAgain}
        onExit={exitGame}
      />
    );
  }

  return (
    <CategoryBlitzBoard
      room={room}
      playerId={playerId}
      onSubmitAnswers={submitAnswers}
      onLeave={leaveGame}
    />
  );
};

export default CategoryBlitz;
