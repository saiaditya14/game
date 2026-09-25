import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import JuiceBarLobby from './JuiceBarLobby';
import JuiceBarRoleSelect from './JuiceBarRoleSelect';
import PrepStation from './PrepStation';
import BlendStation from './BlendStation';
import GameExitScreen from '../GameExitScreen';
import { generateOrder, isServeCorrect } from './juiceBarData';

const PLAYER_ID_KEY = 'lovelyland-juicebar-player-id';

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

const JuiceBar = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getPlayerId, []);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const role = room?.prep_id === playerId ? 'prep' : room?.blend_id === playerId ? 'blend' : null;

  // Auto-assign the joiner to whichever role the creator didn't take.
  useEffect(() => {
    if (room && room.status === 'waiting' && !isCreator && !role) {
      if (room.prep_id && room.prep_id !== playerId) {
        selectRole('blend', room);
      } else if (room.blend_id && room.blend_id !== playerId) {
        selectRole('prep', room);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, isCreator, role]);

  useEffect(() => {
    if (!supabase || !room?.id) return undefined;
    const channel = supabase
      .channel(`juice-bar-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'juice_bar_rooms', filter: `id=eq.${room.id}` },
        (payload) => { if (payload.new) setRoom(payload.new); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room?.id]);

  useEffect(() => {
    if (room?.status !== 'aborted' && room?.status !== 'closed') return undefined;
    const t = setTimeout(() => navigate('/'), 1800);
    return () => clearTimeout(t);
  }, [room?.status, navigate]);

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
      .from('juice_bar_rooms')
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
      .from('juice_bar_rooms')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (dbError && !data) {
      setError('Room not found. Check the code and try again.');
    } else {
      setRoom(data);
      if (data.status === 'waiting') {
        if (data.prep_id && !data.blend_id && data.prep_id !== playerId) {
          selectRole('blend', data);
        } else if (data.blend_id && !data.prep_id && data.blend_id !== playerId) {
          selectRole('prep', data);
        }
      }
    }
    setIsBusy(false);
  };

  const selectRole = async (selectedRole, currentRoom = room) => {
    if (!currentRoom || !supabase) return;
    setIsBusy(true);

    const updates = {};
    if (selectedRole === 'prep') updates.prep_id = playerId;
    if (selectedRole === 'blend') updates.blend_id = playerId;

    const willBeFull =
      (selectedRole === 'prep' && currentRoom.blend_id) ||
      (selectedRole === 'blend' && currentRoom.prep_id);

    if (willBeFull && currentRoom.status === 'waiting') {
      const order = generateOrder();
      updates.status = 'playing';
      updates.round = 1;
      updates.score = 0;
      updates.bin = [];
      updates.order_combo = order.combo;
      updates.order_topping = order.topping;
      updates.last_result = null;
    }

    const { data, error: dbError } = await supabase
      .from('juice_bar_rooms')
      .update(updates)
      .eq('id', currentRoom.id)
      .select()
      .single();

    if (!dbError && data) setRoom(data);
    setIsBusy(false);
  };

  const sendIngredient = async (fruitId) => {
    if (!room || !supabase || role !== 'prep' || room.status !== 'playing') return;
    const nextBin = [...(room.bin ?? []), fruitId];
    const { data } = await supabase
      .from('juice_bar_rooms')
      .update({ bin: nextBin })
      .eq('id', room.id)
      .select()
      .single();
    if (data) setRoom(data);
  };

  const serveOrder = async (selectedTopping) => {
    if (!room || !supabase || role !== 'blend' || room.status !== 'playing') return;
    if (!selectedTopping || (room.bin ?? []).length === 0) return;

    const correct = isServeCorrect(room.bin ?? [], selectedTopping, {
      combo: room.order_combo ?? [],
      topping: room.order_topping,
    });

    const nextRound = room.round + 1;
    const isDone = nextRound > room.target_rounds;
    const nextOrder = isDone ? { combo: room.order_combo, topping: room.order_topping } : generateOrder();

    const updates = {
      score: correct ? room.score + 1 : room.score,
      last_result: correct ? 'correct' : 'wrong',
      bin: [],
      round: isDone ? room.round : nextRound,
      status: isDone ? 'finished' : 'playing',
      order_combo: isDone ? room.order_combo : nextOrder.combo,
      order_topping: isDone ? room.order_topping : nextOrder.topping,
    };

    const { data } = await supabase
      .from('juice_bar_rooms')
      .update(updates)
      .eq('id', room.id)
      .select()
      .single();
    if (data) setRoom(data);
  };

  const leaveTable = async () => {
    if (!room || !supabase) { navigate('/'); return; }
    if (room.status === 'finished' || room.status === 'aborted' || room.status === 'closed') {
      navigate('/');
      return;
    }
    await supabase.from('juice_bar_rooms').update({ status: 'closed' }).eq('id', room.id);
  };

  if (!room) {
    return <JuiceBarLobby onCreateRoom={createRoom} onJoinRoom={joinRoom} isBusy={isBusy} error={error} />;
  }

  if (room.status === 'aborted') return <GameExitScreen status="aborted" />;
  if (room.status === 'closed') return <GameExitScreen status="closed" />;

  if (!role || room.status === 'waiting') {
    return <JuiceBarRoleSelect room={room} playerId={playerId} onSelectRole={selectRole} isCreator={isCreator} />;
  }

  if (room.status === 'finished') {
    return (
      <main
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 5rem)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--foreground)',
        }}
      >
        <h1 className="font-serif font-bold" style={{ fontSize: 'clamp(2rem, 1.6rem + 1.8vw, 3rem)' }}>
          Shift's over!
        </h1>
        <p style={{ marginTop: '0.85rem', fontSize: '1rem', color: 'var(--muted)' }}>
          You served {room.score} out of {room.target_rounds} orders correctly.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="font-bold transition hover:brightness-95"
          style={{
            boxSizing: 'border-box',
            marginTop: '2rem',
            minHeight: '3rem',
            paddingInline: '2rem',
            border: '2px solid var(--primary)',
            borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            color: 'var(--surface)',
          }}
        >
          Back to Hub
        </button>
      </main>
    );
  }

  return role === 'prep'
    ? <PrepStation room={room} onSendIngredient={sendIngredient} onLeave={leaveTable} />
    : <BlendStation room={room} onServe={serveOrder} onLeave={leaveTable} />;
};

export default JuiceBar;
