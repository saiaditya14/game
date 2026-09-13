import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DrawOffCoopLobby from './DrawOffCoopLobby';
import DrawOffRoleSelect from './DrawOffRoleSelect';
import DrawOffCoopCanvas from './DrawOffCoopCanvas';
import { getRandomWord } from './coopWords';
import { motion } from 'framer-motion';
import { Trophy, Clock, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import RoomCodeCopy from '../../components/RoomCodeCopy';

const PLAYER_ID_KEY = 'lovelyland-drawoff-player-id';

const createPlayerId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getPlayerId = () => {
  let existingId = null;
  try {
    existingId = window.localStorage.getItem(PLAYER_ID_KEY);
  } catch (e) {}
  if (existingId) return existingId;

  const playerId = createPlayerId();
  try { window.localStorage.setItem(PLAYER_ID_KEY, playerId); } catch (e) {}
  return playerId;
};

const generateRoomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

const DrawOffCoop = () => {
  const playerId = useMemo(getPlayerId, []);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isCreator, setIsCreator] = useState(false);

  const role = room?.drawer_id === playerId ? 'drawer' : room?.guesser_id === playerId ? 'guesser' : null;

  // Auto-assign joiner when creator picks a role
  useEffect(() => {
    if (room && room.status === 'waiting' && !isCreator && !role) {
      if (room.drawer_id && room.drawer_id !== playerId) {
        selectRole('guesser', room);
      } else if (room.guesser_id && room.guesser_id !== playerId) {
        selectRole('drawer', room);
      }
    }
  }, [room, isCreator, role]);

  useEffect(() => {
    if (!supabase || !room?.id) return;

    const channel = supabase
      .channel(`draw-off-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'draw_off_rooms', filter: `id=eq.${room.id}` },
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
    let interval;
    if (room?.status === 'playing') {
      if (!startTime) setStartTime(Date.now());
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startTime || Date.now())) / 1000) + (room.time_elapsed || 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [room?.status, startTime]);

  const createRoom = async () => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }

    setIsBusy(true);
    setIsCreator(true);
    const code = generateRoomCode();
    
    const { data, error: dbError } = await supabase
      .from('draw_off_rooms')
      .insert({ code })
      .select()
      .single();

    if (dbError) {
      setError('Failed to create room. Please try again.');
    } else {
      setRoom(data);
    }
    setIsBusy(false);
  };

  const joinRoom = async (code) => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    setIsBusy(true);
    setIsCreator(false);
    const { data, error: dbError } = await supabase
      .from('draw_off_rooms')
      .select('*')
      .eq('code', code)
      .single();

    if (dbError && !data) {
      setError('Room not found. Check the code and try again.');
    } else {
      setRoom(data);
      // Auto-assign second player if creator has already chosen a role
      if (data.status === 'waiting') {
        if (data.drawer_id && !data.guesser_id && data.drawer_id !== playerId) {
          selectRole('guesser', data);
        } else if (data.guesser_id && !data.drawer_id && data.guesser_id !== playerId) {
          selectRole('drawer', data);
        }
      }
    }
    setIsBusy(false);
  };

  const selectRole = async (selectedRole, currentRoom = room) => {
    if (!currentRoom || !supabase) return;
    setIsBusy(true);

    const updates = {};
    if (selectedRole === 'drawer') updates.drawer_id = playerId;
    if (selectedRole === 'guesser') updates.guesser_id = playerId;

    // Auto-start if both roles are filled after this selection
    const willBeFull = 
      (selectedRole === 'drawer' && currentRoom.guesser_id) || 
      (selectedRole === 'guesser' && currentRoom.drawer_id);
    
    if (willBeFull && currentRoom.status === 'waiting') {
      updates.status = 'playing';
      updates.current_word = getRandomWord('easy'); // Start with easy word
      updates.time_elapsed = 0;
    }

    const { data, error: dbError } = await supabase
      .from('draw_off_rooms')
      .update(updates)
      .eq('id', currentRoom.id)
      .select()
      .single();

    if (!dbError && data) {
      setRoom(data);
    }
    setIsBusy(false);
  };

  const handleGuessCorrect = async () => {
    if (!room || !supabase || role !== 'guesser') return;
    
    const newGuessed = room.words_guessed + 1;
    const isWin = newGuessed >= room.target_words;
    
    const updates = {
      words_guessed: newGuessed,
      current_word: isWin ? room.current_word : getRandomWord(newGuessed >= 2 ? 'hard' : 'easy'),
      status: isWin ? 'won' : 'playing',
      time_elapsed: elapsed
    };

    const { data } = await supabase
      .from('draw_off_rooms')
      .update(updates)
      .eq('id', room.id)
      .select()
      .single();

    if (data) setRoom(data);
  };

  if (!room) {
    return (
      <DrawOffCoopLobby 
        onCreateRoom={createRoom} 
        onJoinRoom={joinRoom} 
        isBusy={isBusy} 
        error={error} 
      />
    );
  }

  if (!role || room.status === 'waiting') {
    return <DrawOffRoleSelect room={room} playerId={playerId} onSelectRole={selectRole} isCreator={isCreator} />;
  }

  if (room.status === 'won') {
    return (
      <main
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 5rem)',
          marginInline: 'auto',
          width: '100%',
          maxWidth: 'min(56rem, 100%)',
          paddingInline: 'clamp(1rem, 4vw, 2.5rem)',
          paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '34rem',
            padding: 'clamp(1.75rem, 4vw, 3rem)',
            textAlign: 'center',
            border: '1px solid var(--ring)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              boxSizing: 'border-box',
              display: 'grid',
              placeItems: 'center',
              width: '4.5rem',
              height: '4.5rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--accent)',
              borderRadius: 'calc(var(--radius) + 0.5rem)',
              background: 'var(--surface-strong)',
              color: 'var(--accent)',
            }}
          >
            <Trophy className="h-9 w-9" />
          </div>

          <h1
            className="font-serif font-bold"
            style={{
              fontSize: 'clamp(2rem, 1.6rem + 1.8vw, 3rem)',
              lineHeight: 1.15,
              color: 'var(--foreground)',
            }}
          >
            You Won!
          </h1>

          <p style={{ marginTop: '0.85rem', fontSize: '1rem', lineHeight: 1.6, color: 'var(--muted)' }}>
            Your team successfully guessed 3 words.
          </p>

          <div
            style={{
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginTop: '1.75rem',
              paddingInline: '1.4rem',
              paddingBlock: '0.75rem',
              border: '1px solid var(--divider)',
              borderRadius: 'calc(var(--radius) + 1rem)',
              background: 'var(--surface-strong)',
            }}
          >
            <Clock className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            <span className="font-mono font-bold" style={{ fontSize: '1.15rem', color: 'var(--foreground)' }}>
              {room.time_elapsed} seconds
            </span>
          </div>

          <Link
            to="/draw-off"
            className="font-bold transition hover:brightness-95"
            style={{
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              marginTop: '2rem',
              minHeight: '3.25rem',
              paddingInline: '2rem',
              fontSize: '0.9rem',
              textDecoration: 'none',
              border: '2px solid var(--primary)',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: 'var(--surface)',
            }}
          >
            <Home className="h-5 w-5" />
            Back to Hub
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="flex flex-col">
      {room.status === 'playing' && (
        <div
          className="font-bold"
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            width: '100%',
            paddingBlock: '0.65rem',
            paddingInline: '1rem',
            fontSize: '0.72rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderBottom: '1px solid var(--divider)',
            background: 'var(--surface-strong)',
            color: 'var(--muted)',
          }}
        >
          <span>
            Time <span style={{ color: 'var(--foreground)' }}>{elapsed}s</span>
          </span>
          <span aria-hidden="true" style={{ width: '1px', height: '0.9rem', background: 'var(--divider)' }} />
          <span>
            Room <RoomCodeCopy code={room.code} style={{ color: 'var(--primary)' }} />
          </span>
        </div>
      )}
      <DrawOffCoopCanvas 
        room={room} 
        role={role} 
        currentWord={room.current_word} 
        onGuessCorrect={handleGuessCorrect} 
      />
    </div>
  );
};

export default DrawOffCoop;