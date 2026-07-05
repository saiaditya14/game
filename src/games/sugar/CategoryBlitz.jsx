import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { computeScores, pickCategories, pickRandomLetter, resolveWinner } from './CategoryBlitzRules';
import CategoryBlitzLobby from './CategoryBlitzLobby';
import CategoryBlitzBoard from './CategoryBlitzBoard';
import CategoryBlitzReveal from './CategoryBlitzReveal';
import GameExitScreen from './GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-category-blitz-player-id';

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

const CategoryBlitz = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getOrCreatePlayerId, []);
  const [room, setRoom]     = useState(null);
  const [error, setError]   = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const playerNumber = getPlayerNumber(room, playerId);

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

  // ── Navigate both players home on abort or exit ────────────────────────────

  useEffect(() => {
    if (room?.status !== 'aborted' && room?.status !== 'closed') return;
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [room?.status, navigate]);

  // ── Playing → Reveal once both players have locked in answers ─────────────

  useEffect(() => {
    if (!supabase || !room || room.status !== 'playing') return;
    if (!room.submitted_one_at || !room.submitted_two_at) return;

    supabase
      .from('category_blitz_rooms')
      .update({ status: 'reveal' })
      .eq('id', room.id)
      .eq('status', 'playing')
      .then(() => {});
  }, [room]);

  // ── Reveal → Finished once both players confirm their reviews ─────────────

  useEffect(() => {
    if (!supabase || !room || room.status !== 'reveal') return;
    if (!room.review_one_done || !room.review_two_done) return;

    const { scoreOne, scoreTwo } = computeScores({
      categories: room.categories ?? [],
      answersOne: room.answers_one ?? [],
      answersTwo: room.answers_two ?? [],
      approvalsOne: room.approvals_one ?? [],
      approvalsTwo: room.approvals_two ?? [],
    });

    supabase
      .from('category_blitz_rooms')
      .update({
        status: 'finished',
        score_one: scoreOne,
        score_two: scoreTwo,
        winner: resolveWinner(scoreOne, scoreTwo),
      })
      .eq('id', room.id)
      .eq('status', 'reveal')
      .then(() => {});
  }, [room]);

  // ── Create room ────────────────────────────────────────────────────────────

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
        player_one:    playerId,
        round_letter:  pickRandomLetter(),
        categories,
        timer_seconds: timerSeconds,
        answers_one:   categories.map(() => ''),
        answers_two:   categories.map(() => ''),
        approvals_one: categories.map(() => null),
        approvals_two: categories.map(() => null),
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
      .from('category_blitz_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (lookupError || !existing) {
      setIsBusy(false);
      setError('No Category Blitz room found for that code.');
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
      .from('category_blitz_rooms')
      .update({ player_two: playerId, status: 'playing', started_at: new Date().toISOString() })
      .eq('id', existing.id)
      .is('player_two', null)
      .select()
      .single();
    setIsBusy(false);
    if (joinError) { setError(joinError.message); return; }
    setRoom(data);
  };

  // ── Lock in answers (own column only) ──────────────────────────────────────

  const submitAnswers = async (answers) => {
    if (!supabase || !room || room.status !== 'playing' || !playerNumber) return;
    const isOne = playerNumber === 1;
    if (isOne ? room.submitted_one_at : room.submitted_two_at) return;

    await supabase
      .from('category_blitz_rooms')
      .update({
        [isOne ? 'answers_one' : 'answers_two']: answers,
        [isOne ? 'submitted_one_at' : 'submitted_two_at']: new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'playing');
  };

  // ── Confirm my review — commit my verdicts on the PARTNER's answers plus my
  // review-done flag in ONE atomic write. I judge the other player's answers,
  // so I write the column named after THEM. Writing per-toggle instead raced:
  // concurrent whole-array overwrites from stale snapshots dropped verdicts.

  const confirmReview = async (verdicts = []) => {
    if (!supabase || !room || room.status !== 'reveal' || !playerNumber) return;
    const isOne = playerNumber === 1;
    await supabase
      .from('category_blitz_rooms')
      .update({
        [isOne ? 'approvals_two' : 'approvals_one']: verdicts,
        [isOne ? 'review_one_done' : 'review_two_done']: true,
      })
      .eq('id', room.id)
      .eq('status', 'reveal');
  };

  // ── Leave — one contextual control ─────────────────────────────────────────
  // No opponent yet: nothing to forfeit, so it aborts the unstarted room.
  // Mid-round (playing or reveal): the round is a shared timer + joint reveal,
  // so there's no meaningful way for the other player to continue solo —
  // leaving ends the whole room for both, same as an abort.

  const leaveGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    if (room.status === 'finished' || room.status === 'aborted' || room.status === 'closed') return;
    await supabase.from('category_blitz_rooms').update({ status: 'aborted' }).eq('id', room.id);
  };

  // ── Exit — after game finishes, both clients navigate home ────────────────

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
    const categories = pickCategories(room.categories?.length ?? 8);
    await supabase
      .from('category_blitz_rooms')
      .update({
        status:            'playing',
        round_letter:      pickRandomLetter(),
        categories,
        answers_one:       categories.map(() => ''),
        answers_two:       categories.map(() => ''),
        approvals_one:     categories.map(() => null),
        approvals_two:     categories.map(() => null),
        submitted_one_at:  null,
        submitted_two_at:  null,
        review_one_done:   false,
        review_two_done:   false,
        score_one:         null,
        score_two:         null,
        winner:            null,
        started_at:        new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!room || !playerNumber) {
    return (
      <CategoryBlitzLobby
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

  if (room.status === 'reveal' || room.status === 'finished') {
    return (
      <CategoryBlitzReveal
        room={room}
        playerNumber={playerNumber}
        onConfirmReview={confirmReview}
        onPlayAgain={playAgain}
        onExit={exitGame}
      />
    );
  }

  return (
    <CategoryBlitzBoard
      room={room}
      playerNumber={playerNumber}
      onSubmitAnswers={submitAnswers}
      onLeave={leaveGame}
    />
  );
};

export default CategoryBlitz;
