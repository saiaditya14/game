import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import DrawOffCoopLobby from './DrawOffCoopLobby';
import DrawOffRoleSelect from './DrawOffRoleSelect';
import DrawOffCoopCanvas from './DrawOffCoopCanvas';
import { getRandomWord } from './coopWords';
import { motion } from 'framer-motion';
import { Trophy, Clock, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface)] p-12 text-center shadow-[var(--shadow)]"
        >
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-yellow-400 text-yellow-900">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="font-serif text-5xl font-bold text-foreground">You Won!</h1>
          <p className="mt-4 text-lg text-[color:var(--muted)]">Your team successfully guessed 3 words.</p>
          
          <div className="mt-8 flex items-center justify-center gap-3 rounded-full bg-[color:var(--surface-strong)] px-6 py-3 border border-[color:var(--divider)]">
            <Clock className="h-5 w-5 text-[color:var(--pink)]" />
            <span className="text-xl font-bold font-mono text-foreground">{room.time_elapsed} Seconds</span>
          </div>

          <Link
            to="/draw-off"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-bold text-[color:var(--surface)] transition hover:-translate-y-1 hover:shadow-lg"
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
        <div className="w-full bg-[color:var(--surface-strong)] py-2 text-center text-sm font-bold tracking-widest text-[color:var(--muted)] border-b border-[color:var(--divider)]">
          TIME: <span className="text-foreground">{elapsed}s</span> | ROOM: <span className="text-primary">{room.code}</span>
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