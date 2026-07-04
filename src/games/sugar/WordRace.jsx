import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  MAX_GUESSES,
  evaluateGuess,
  isPlayerDone,
  isSolvedRow,
  isValidWord,
  pickSecretWord,
  resolveWinner,
} from './WordRaceRules';
import WordRaceLobby from './WordRaceLobby';
import WordRaceBoard from './WordRaceBoard';
import GameExitScreen from './GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-word-race-player-id';

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

const WordRace = () => {
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
      .channel(`word-race-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'word_race_rooms', filter: `id=eq.${room.id}` },
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

  // ── Finalize the race once both players are done (solved/gave up/out of guesses) ──

  useEffect(() => {
    if (!supabase || !room || room.status !== 'playing' || !room.player_two) return;
    const oneDone = isPlayerDone({ progress: room.progress_one, solved: room.solved_one, gaveUp: room.gave_up_one });
    const twoDone = isPlayerDone({ progress: room.progress_two, solved: room.solved_two, gaveUp: room.gave_up_two });
    if (!oneDone || !twoDone) return;

    const winner = resolveWinner({
      solvedOne: room.solved_one,
      solvedTwo: room.solved_two,
      progressOne: room.progress_one ?? [],
      progressTwo: room.progress_two ?? [],
      gaveUpOne: room.gave_up_one,
      gaveUpTwo: room.gave_up_two,
      finishedOneAt: room.finished_one_at,
      finishedTwoAt: room.finished_two_at,
    });

    supabase
      .from('word_race_rooms')
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
      .from('word_race_rooms')
      .insert({
        code:         generateRoomCode(),
        secret_word:  pickSecretWord(),
        status:       'waiting',
        player_one:   playerId,
        progress_one: [],
        progress_two: [],
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
      .from('word_race_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (lookupError || !existing) {
      setIsBusy(false);
      setError('No Word Race room found for that code.');
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
      .from('word_race_rooms')
      .update({ player_two: playerId, status: 'playing', started_at: new Date().toISOString() })
      .eq('id', existing.id)
      .is('player_two', null)
      .select()
      .single();
    setIsBusy(false);
    if (joinError) { setError(joinError.message); return; }
    setRoom(data);
  };

  // ── Submit a guess (own columns only — opponent only ever sees colors) ─────

  const submitGuess = async (word) => {
    if (!supabase || !room || room.status !== 'playing' || !playerNumber) return { ok: false };
    if (!isValidWord(word)) return { ok: false, reason: 'invalid' };

    const isOne = playerNumber === 1;
    const currentProgress = (isOne ? room.progress_one : room.progress_two) ?? [];
    if (currentProgress.length >= MAX_GUESSES) return { ok: false, reason: 'exhausted' };

    const colors = evaluateGuess(word, room.secret_word);
    const solved = isSolvedRow(colors);
    const newProgress = [...currentProgress, colors];
    const done = solved || newProgress.length >= MAX_GUESSES;

    const update = { [isOne ? 'progress_one' : 'progress_two']: newProgress };
    if (solved) update[isOne ? 'solved_one' : 'solved_two'] = true;
    if (done) update[isOne ? 'finished_one_at' : 'finished_two_at'] = new Date().toISOString();

    const { data, error: e } = await supabase
      .from('word_race_rooms')
      .update(update)
      .eq('id', room.id)
      .select()
      .single();
    if (e) return { ok: false, reason: 'error', message: e.message };
    setRoom(data);
    return { ok: true, colors, solved };
  };

  // ── Leave — one contextual control ─────────────────────────────────────────
  // No opponent yet: nothing to forfeit, so it aborts the unstarted room outright.
  // Mid-race: it forfeits this player's race only — the opponent keeps playing
  // to their own finish, and resolveWinner() awards them the win once done.

  const leaveGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    if (!room.player_two) {
      await supabase.from('word_race_rooms').update({ status: 'aborted' }).eq('id', room.id);
      return;
    }
    if (room.status !== 'playing' || !playerNumber) return;
    const isOne = playerNumber === 1;
    await supabase
      .from('word_race_rooms')
      .update({
        [isOne ? 'gave_up_one' : 'gave_up_two']: true,
        [isOne ? 'finished_one_at' : 'finished_two_at']: new Date().toISOString(),
      })
      .eq('id', room.id);
  };

  // ── Exit — after game finishes, both clients navigate home ────────────────

  const exitGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from('word_race_rooms')
      .update({ status: 'closed' })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Play again ─────────────────────────────────────────────────────────────

  const playAgain = async () => {
    if (!supabase || !room) return;
    await supabase
      .from('word_race_rooms')
      .update({
        secret_word:     pickSecretWord(),
        status:          'playing',
        progress_one:    [],
        progress_two:    [],
        solved_one:      false,
        solved_two:      false,
        gave_up_one:     false,
        gave_up_two:     false,
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
      <WordRaceLobby
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
    <WordRaceBoard
      room={room}
      playerNumber={playerNumber}
      onSubmitGuess={submitGuess}
      onLeave={leaveGame}
      onPlayAgain={playAgain}
      onExit={exitGame}
    />
  );
};

export default WordRace;
