import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import TicTacToeLobby from './TicTacToeLobby';
import TicTacToeBoard from './TicTacToeBoard';
import GameExitScreen from './GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-tic-tac-toe-player-id';

// 4x4 board, 3-in-a-row wins. Row-major indices 0-15.
const WINNING_LINES = [
  // rows
  [0, 1, 2], [1, 2, 3], [4, 5, 6], [5, 6, 7],
  [8, 9, 10], [9, 10, 11], [12, 13, 14], [13, 14, 15],
  // columns
  [0, 4, 8], [4, 8, 12], [1, 5, 9], [5, 9, 13],
  [2, 6, 10], [6, 10, 14], [3, 7, 11], [7, 11, 15],
  // diagonals (top-left to bottom-right)
  [0, 5, 10], [5, 10, 15], [1, 6, 11], [4, 9, 14],
  // diagonals (top-right to bottom-left)
  [2, 5, 8], [3, 6, 9], [6, 9, 12], [7, 10, 13],
];

const createPlayerId = () =>
  window.crypto?.randomUUID?.() ?? `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getPlayerId = () => {
  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id = createPlayerId();
  window.localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
};

const generateRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const randomPlayer = () => (Math.random() < 0.5 ? 1 : 2);

const getPlayerNumber = (room, playerId) => {
  if (room?.player_one === playerId) return 1;
  if (room?.player_two === playerId) return 2;
  return null;
};

const checkWinner = (board) => {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
};

const TicTacToe = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getPlayerId, []);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const playerNumber = getPlayerNumber(room, playerId);

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;
    const channel = supabase
      .channel(`tic-tac-toe-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tic_tac_toe_rooms', filter: `id=eq.${room.id}` },
        (payload) => { if (payload.new) setRoom(payload.new); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  useEffect(() => {
    if (room?.status !== 'aborted') return;
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [room?.status, navigate]);

  const createRoom = async () => {
    setError('');
    if (!supabase) { setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.'); return; }
    setIsBusy(true);
    const code = generateRoomCode();
    const xPlayer = randomPlayer();
    const { data, error: e } = await supabase
      .from('tic_tac_toe_rooms')
      .insert({
        code,
        board: Array(16).fill(null),
        current_player: xPlayer,
        x_player: xPlayer,
        status: 'waiting',
        winner: null,
        winning_line: null,
        player_one: playerId,
        player_two: null,
      })
      .select()
      .single();
    setIsBusy(false);
    if (e) { setError(e.message); return; }
    setRoom(data);
  };

  const joinRoom = async (rawCode) => {
    setError('');
    if (!supabase) { setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.'); return; }
    const code = rawCode.trim().toUpperCase();
    if (code.length < 4) { setError('Enter the 4-6 character room code.'); return; }
    setIsBusy(true);
    const { data: existing, error: lookupError } = await supabase
      .from('tic_tac_toe_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();
    if (lookupError || !existing) { setIsBusy(false); setError('No Tic-Tac-Toe room found for that code.'); return; }
    if (existing.player_one === playerId || existing.player_two === playerId) {
      setIsBusy(false); setRoom(existing); return;
    }
    if (existing.player_two) { setIsBusy(false); setError('That room already has two players.'); return; }
    const { data, error: joinError } = await supabase
      .from('tic_tac_toe_rooms')
      .update({ player_two: playerId, status: 'playing', started_at: new Date().toISOString() })
      .eq('id', existing.id)
      .is('player_two', null)
      .select()
      .single();
    setIsBusy(false);
    if (joinError) { setError(joinError.message); return; }
    setRoom(data);
  };

  const placeMarker = useCallback(async (index) => {
    if (!supabase || !room || room.status !== 'playing' || room.current_player !== playerNumber) return;
    const board = [...room.board];
    if (board[index]) return;
    board[index] = playerNumber;
    const result = checkWinner(board);
    const isDraw = !result && board.every(Boolean);
    const nextStatus = result ? 'won' : isDraw ? 'draw' : 'playing';
    const { error: moveError } = await supabase
      .from('tic_tac_toe_rooms')
      .update({
        board,
        current_player: playerNumber === 1 ? 2 : 1,
        status: nextStatus,
        winner: result ? playerNumber : null,
        winning_line: result ? result.line : null,
        last_move: { index, player: playerNumber, at: new Date().toISOString() },
      })
      .eq('id', room.id)
      .eq('current_player', playerNumber)
      .eq('status', 'playing');
    if (moveError) setError(moveError.message);
  }, [playerNumber, room]);

  const playAgain = async () => {
    if (!supabase || !room) return;
    const xPlayer = randomPlayer();
    const { error: e } = await supabase
      .from('tic_tac_toe_rooms')
      .update({
        board: Array(16).fill(null),
        current_player: xPlayer,
        x_player: xPlayer,
        status: 'playing',
        winner: null,
        winning_line: null,
        last_move: null,
      })
      .eq('id', room.id);
    if (e) setError(e.message);
  };

  const abortGame = async () => {
    if (!supabase || !room) { setRoom(null); return; }
    const { error: e } = await supabase
      .from('tic_tac_toe_rooms')
      .update({ status: 'aborted' })
      .eq('id', room.id);
    if (e) setError(e.message);
  };

  if (!room || !playerNumber || !room.player_two) {
    return <TicTacToeLobby onCreateRoom={createRoom} onJoinRoom={joinRoom} isBusy={isBusy} error={error} roomCode={room?.code} />;
  }

  if (room.status === 'aborted') return <GameExitScreen status="aborted" />;

  return (
    <TicTacToeBoard
      room={room}
      playerNumber={playerNumber}
      onPlaceMarker={placeMarker}
      onPlayAgain={playAgain}
      onAbortGame={abortGame}
      onExitGame={() => setRoom(null)}
    />
  );
};

export default TicTacToe;
