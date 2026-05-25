import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ConnectFourBoard from './ConnectFourBoard';
import ConnectFourLobby from './ConnectFourLobby';

const COLUMNS = 7;
const ROWS = 6;
const EMPTY_BOARD = Array(COLUMNS * ROWS).fill(null);
const PLAYER_ID_KEY = 'lovelyland-connect-four-player-id';

const createPlayerId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getPlayerId = () => {
  const existingId = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existingId) return existingId;

  const playerId = createPlayerId();
  window.localStorage.setItem(PLAYER_ID_KEY, playerId);
  return playerId;
};

const generateRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const getPlayerNumber = (room, playerId) => {
  if (room?.player_one === playerId) return 1;
  if (room?.player_two === playerId) return 2;
  return null;
};

const getLandingRow = (board, column) => {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    const index = row * COLUMNS + column;
    if (!board[index]) return row;
  }

  return -1;
};

const countDirection = (board, row, column, rowDelta, columnDelta, player) => {
  let count = 0;
  let nextRow = row + rowDelta;
  let nextColumn = column + columnDelta;

  while (nextRow >= 0 && nextRow < ROWS && nextColumn >= 0 && nextColumn < COLUMNS) {
    const index = nextRow * COLUMNS + nextColumn;
    if (board[index] !== player) break;
    count += 1;
    nextRow += rowDelta;
    nextColumn += columnDelta;
  }

  return count;
};

const hasWinningLine = (board, row, column, player) => {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  return directions.some(([rowDelta, columnDelta]) => {
    const total =
      1 +
      countDirection(board, row, column, rowDelta, columnDelta, player) +
      countDirection(board, row, column, -rowDelta, -columnDelta, player);

    return total >= 4;
  });
};

const ConnectFour = () => {
  const playerId = useMemo(getPlayerId, []);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const playerNumber = getPlayerNumber(room, playerId);

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;

    const channel = supabase
      .channel(`connect-four-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connect_four_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new) setRoom(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const createRoom = async () => {
    setError('');

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }

    setIsBusy(true);

    const code = generateRoomCode();
    const { data, error: createError } = await supabase
      .from('connect_four_rooms')
      .insert({
        code,
        board: EMPTY_BOARD,
        current_player: 1,
        status: 'waiting',
        winner: null,
        player_one: playerId,
        player_two: null,
      })
      .select()
      .single();

    setIsBusy(false);

    if (createError) {
      setError(createError.message);
      return;
    }

    setRoom(data);
  };

  const joinRoom = async (rawCode) => {
    setError('');

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }

    const code = rawCode.trim().toUpperCase();
    if (code.length < 4) {
      setError('Enter the 4-6 character room code.');
      return;
    }

    setIsBusy(true);

    const { data: existingRoom, error: lookupError } = await supabase
      .from('connect_four_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (lookupError || !existingRoom) {
      setIsBusy(false);
      setError('No Connect Four room found for that code.');
      return;
    }

    if (existingRoom.player_one === playerId || existingRoom.player_two === playerId) {
      setIsBusy(false);
      setRoom(existingRoom);
      return;
    }

    if (existingRoom.player_two) {
      setIsBusy(false);
      setError('That room already has two players.');
      return;
    }

    const { data, error: joinError } = await supabase
      .from('connect_four_rooms')
      .update({
        player_two: playerId,
        status: 'playing',
        started_at: new Date().toISOString(),
      })
      .eq('id', existingRoom.id)
      .is('player_two', null)
      .select()
      .single();

    setIsBusy(false);

    if (joinError) {
      setError(joinError.message);
      return;
    }

    setRoom(data);
  };

  const dropPiece = useCallback(
    async (column) => {
      if (!supabase || !room || room.status !== 'playing' || playerNumber !== room.current_player) return;

      const board = [...room.board];
      const landingRow = getLandingRow(board, column);
      if (landingRow < 0) return;

      const index = landingRow * COLUMNS + column;
      board[index] = playerNumber;

      const didWin = hasWinningLine(board, landingRow, column, playerNumber);
      const isDraw = !didWin && board.every(Boolean);
      const nextStatus = didWin ? 'won' : isDraw ? 'draw' : 'playing';

      const { error: moveError } = await supabase
        .from('connect_four_rooms')
        .update({
          board,
          current_player: playerNumber === 1 ? 2 : 1,
          status: nextStatus,
          winner: didWin ? playerNumber : null,
          last_move: { row: landingRow, column, player: playerNumber, at: new Date().toISOString() },
        })
        .eq('id', room.id)
        .eq('current_player', playerNumber)
        .eq('status', 'playing');

      if (moveError) setError(moveError.message);
    },
    [playerNumber, room],
  );

  const abortGame = async () => {
    if (!supabase || !room) {
      setRoom(null);
      return;
    }

    const { error: abortError } = await supabase
      .from('connect_four_rooms')
      .update({ status: 'aborted' })
      .eq('id', room.id);

    if (abortError) setError(abortError.message);
  };

  if (!room || !playerNumber) {
    return <ConnectFourLobby onCreateRoom={createRoom} onJoinRoom={joinRoom} isBusy={isBusy} error={error} roomCode={room?.code} />;
  }

  return <ConnectFourBoard room={room} playerNumber={playerNumber} onDropPiece={dropPiece} onAbortGame={abortGame} />;
};

export default ConnectFour;
