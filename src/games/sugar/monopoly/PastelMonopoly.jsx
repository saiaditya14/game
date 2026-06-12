import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Home, Maximize2, Minimize2, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { supabase } from '../../../lib/supabaseClient';
import { MonopolyBoard, BOARD_SPACE_COUNT, spaces } from './MonopolyBoard';
import { MonopolyLobby } from './MonopolyLobby';
import { MonopolySidebar } from './MonopolySidebar';

const PLAYER_ID_KEY = 'lovelyland-monopoly-player-id';
const PLAYER_COLORS = ['#f9a8d4', '#a7e8b2', '#aee9ff', '#d8c4ff', '#ffe66d', '#ffc48f', '#b9b6ff', '#ffb48f'];
const PLAYER_ICONS = ['heart', 'crown', 'sparkles', 'wand', 'gem', 'user', 'gift', 'heart'];

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

const createPlayer = (id, index) => ({
  id,
  name: `Player ${index + 1}`,
  money: 1500,
  position: 0,
  color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  icon: PLAYER_ICONS[index % PLAYER_ICONS.length],
  joinedAt: new Date().toISOString(),
});

const getPlayers = (room) => (Array.isArray(room?.players) ? room.players : []);

const getSpaceName = (position) => {
  const safePosition = ((Number(position || 0) % BOARD_SPACE_COUNT) + BOARD_SPACE_COUNT) % BOARD_SPACE_COUNT;
  return spaces[safePosition]?.name || `Space ${safePosition + 1}`;
};

const rollD8 = () => Math.floor(Math.random() * 8) + 1;

const buildRollEvent = ({ id, playerName, total, to }) => ({
  id,
  player: playerName,
  action: `rolled ${total} and landed on ${getSpaceName(to)}`,
  kind: 'visit',
});

export const PastelMonopoly = () => {
  const { theme, setTheme } = useTheme();
  const pageRef = useRef(null);
  const playerId = useMemo(getPlayerId, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [localDiceRoll, setLocalDiceRoll] = useState(null);
  const themes = [
    { id: 'theme-vanilla', label: 'Vanilla' },
    { id: 'theme-pink', label: 'Pink' },
    { id: 'theme-arcade', label: 'Arcade' },
    { id: 'theme-cozy', label: 'Cozy' },
  ];

  const players = getPlayers(room);
  const currentPlayer = room?.status === 'playing' && players.length
    ? players[room.current_player_index % players.length]
    : null;
  const isHost = room?.host_id === playerId;
  const isCurrentPlayer = currentPlayer?.id === playerId;
  const canRoll = Boolean(room?.status === 'playing' && isCurrentPlayer && !isRolling);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === pageRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;

    const channel = supabase
      .channel(`monopoly-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monopoly_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new) setRoom(payload.new);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  useEffect(() => {
    if (!localDiceRoll?.id) return undefined;

    const hideId = window.setTimeout(() => {
      setLocalDiceRoll(null);
    }, 1500);

    return () => {
      window.clearTimeout(hideId);
    };
  }, [localDiceRoll?.id]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await pageRef.current?.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  const createRoom = async () => {
    setError('');

    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }

    setIsBusy(true);

    const firstPlayer = createPlayer(playerId, 0);
    const { data, error: createError } = await supabase
      .from('monopoly_rooms')
      .insert({
        code: generateRoomCode(),
        host_id: playerId,
        players: [firstPlayer],
        current_player_index: 0,
        status: 'waiting',
        latest_roll: null,
        event_log: [
          { id: `join-${firstPlayer.id}`, player: firstPlayer.name, action: 'created the room', kind: 'card' },
        ],
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
      .from('monopoly_rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (lookupError || !existingRoom) {
      setIsBusy(false);
      setError('No Sugaropoly room found for that code.');
      return;
    }

    const existingPlayers = getPlayers(existingRoom);
    if (existingPlayers.some((player) => player.id === playerId)) {
      setIsBusy(false);
      setRoom(existingRoom);
      return;
    }

    if (existingRoom.status !== 'waiting') {
      setIsBusy(false);
      setError('That room has already started.');
      return;
    }

    if (existingPlayers.length >= 8) {
      setIsBusy(false);
      setError('That room is full.');
      return;
    }

    const nextPlayer = createPlayer(playerId, existingPlayers.length);
    const nextPlayers = [...existingPlayers, nextPlayer];
    const nextEvents = [
      { id: `join-${nextPlayer.id}`, player: nextPlayer.name, action: 'joined the room', kind: 'card' },
      ...(Array.isArray(existingRoom.event_log) ? existingRoom.event_log : []),
    ].slice(0, 24);

    const { data, error: joinError } = await supabase
      .from('monopoly_rooms')
      .update({ players: nextPlayers, event_log: nextEvents })
      .eq('id', existingRoom.id)
      .eq('status', 'waiting')
      .select()
      .single();

    setIsBusy(false);

    if (joinError) {
      setError(joinError.message);
      return;
    }

    setRoom(data);
  };

  const startGame = async () => {
    setError('');
    if (!supabase || !room || !isHost || players.length < 2) return;

    setIsBusy(true);

    const startEvent = {
      id: `start-${Date.now()}`,
      player: 'Quest',
      action: 'started around GO',
      kind: 'money',
    };

    const { data, error: startError } = await supabase
      .from('monopoly_rooms')
      .update({
        status: 'playing',
        current_player_index: 0,
        started_at: new Date().toISOString(),
        event_log: [startEvent, ...(Array.isArray(room.event_log) ? room.event_log : [])].slice(0, 24),
      })
      .eq('id', room.id)
      .eq('host_id', playerId)
      .eq('status', 'waiting')
      .select()
      .single();

    setIsBusy(false);

    if (startError) {
      setError(startError.message);
      return;
    }

    setRoom(data);
  };

  const rollDice = useCallback(async () => {
    setError('');
    if (!supabase || !room || !canRoll || !currentPlayer) return;

    setIsRolling(true);

    const dieOne = rollD8();
    const dieTwo = rollD8();
    const total = dieOne + dieTwo;
    const from = Number(currentPlayer.position || 0);
    const to = (from + total) % BOARD_SPACE_COUNT;
    const rollId = `roll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nextPlayers = players.map((player) => (
      player.id === currentPlayer.id ? { ...player, position: to } : player
    ));
    const nextIndex = (room.current_player_index + 1) % players.length;
    const latestRoll = {
      id: rollId,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      dice: [dieOne, dieTwo],
      total,
      from,
      to,
      at: new Date().toISOString(),
    };
    setLocalDiceRoll(latestRoll);

    const nextEvents = [
      buildRollEvent({ id: rollId, playerName: currentPlayer.name, total, to }),
      ...(Array.isArray(room.event_log) ? room.event_log : []),
    ].slice(0, 24);

    const { data, error: moveError } = await supabase
      .from('monopoly_rooms')
      .update({
        players: nextPlayers,
        current_player_index: nextIndex,
        latest_roll: latestRoll,
        event_log: nextEvents,
      })
      .eq('id', room.id)
      .eq('current_player_index', room.current_player_index)
      .eq('status', 'playing')
      .select()
      .single();

    setIsRolling(false);

    if (moveError) {
      setError(moveError.message);
      return;
    }

    setRoom(data);
  }, [canRoll, currentPlayer, players, room]);

  const sidebarPlayers = players.map((player) => ({
    ...player,
    money: player.money ?? 1500,
  }));
  const events = Array.isArray(room?.event_log) ? room.event_log : [];

  return (
    <div className="sugaropoly-page" ref={pageRef}>
      <nav className="sugaropoly-topbar" aria-label="Sugaropoly navigation">
        <Link className="sugaropoly-brand-link" to="/" aria-label="Lovelyland home">
          <span className="sugaropoly-brand-mark">
            <Gamepad2 aria-hidden="true" />
          </span>
          <span className="sugaropoly-brand-copy">
            <span>Lovelyland</span>
            <small>minigame hub</small>
          </span>
        </Link>

        <div className="sugaropoly-title-lockup" aria-label="Current game">
          <Sparkles aria-hidden="true" />
          <span>Faerie Kingdom Quest</span>
        </div>

        <div className="sugaropoly-topbar-actions">
          {room ? (
            <span className="sugaropoly-room-pill" title={`Room ${room.code}`}>
              {room.code}
            </span>
          ) : null}

          <Link className="sugaropoly-nav-icon-button" to="/" aria-label="Home" title="Home">
            <Home aria-hidden="true" />
          </Link>

          <label className="sugaropoly-theme-control">
            <Palette aria-hidden="true" />
            <span className="sr-only">Theme</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              className="theme-select"
            >
              {themes.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="sugaropoly-nav-icon-button"
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen mode' : 'Enable fullscreen mode'}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {!room || room.status === 'waiting' ? (
        <MonopolyLobby
          room={room}
          playerId={playerId}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onStartGame={startGame}
          isBusy={isBusy}
          error={error}
        />
      ) : (
        <>
          {error ? <p className="sugaropoly-inline-error">{error}</p> : null}
          <div className="sugaropoly-layout">
            <div className="sugaropoly-board-pane">
              <MonopolyBoard
                players={players}
                diceRoll={localDiceRoll}
                canRoll={canRoll}
                isRolling={isRolling}
                onRoll={rollDice}
              />
            </div>

            <div className="sugaropoly-sidebar-pane">
              <MonopolySidebar
                players={sidebarPlayers}
                trades={[]}
                properties={[]}
                events={events}
                currentPlayerId={currentPlayer?.id}
                onBankruptcy={() => setError('Bankruptcy is coming later. For now, keep rolling.')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PastelMonopoly;
