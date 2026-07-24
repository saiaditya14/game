import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import { dealHands, isRoundComplete, resolveRound, checkTableGameOver } from './IndianPokerRules';
import {
  dealDice, rerollDice, resolveShowdown, splitPot,
  checkTableGameOver as checkDiceTableGameOver,
} from './DicePokerRules';
import { createBettingRound, applyAction, isRoundClosed, remainingContenders } from './BettingRound';
import GamblingHub from './GamblingHub';
import GamblingLobby from './GamblingLobby';
import IndianPokerTable from './IndianPokerTable';
import DicePokerTable from './DicePokerTable';
import GameExitScreen from '../GameExitScreen';

const PLAYER_ID_KEY = 'lovelyland-gambling-corner-player-id';
const MAX_PLAYERS = 8;
const STARTING_CHIPS = 200;
const ANTE = 20;

const getOrCreatePlayerId = () => {
  const existing = window.localStorage.getItem(PLAYER_ID_KEY);
  if (existing) return existing;
  const id =
    window.crypto?.randomUUID?.() ??
    `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(PLAYER_ID_KEY, id);
  return id;
};

const generateRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const playersOf = (room) => (Array.isArray(room?.players) ? room.players : []);

const GamblingCorner = () => {
  const navigate = useNavigate();
  const playerId = useMemo(getOrCreatePlayerId, []);
  const [mode, setMode]     = useState(null); // 'indian_poker' chosen in the hub, before a room exists
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
      .channel(`gambling-corner-room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gambling_corner_rooms', filter: `id=eq.${room.id}` },
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

  // ── Settle the round once every dealt-in player has decided ────────────────
  // The RPC itself is guarded (no-op unless round_phase==='dealt'), so it's
  // safe for more than one client to race to call this.

  useEffect(() => {
    if (!supabase || !room || room.status !== 'playing' || room.round_phase !== 'dealt') return;
    if (!isRoundComplete(room.hands ?? {}, room.decisions ?? {})) return;

    const { winners, payouts } = resolveRound({
      hands: room.hands ?? {},
      decisions: room.decisions ?? {},
      pot: room.pot ?? 0,
    });

    supabase.rpc('gambling_corner_settle', {
      p_room_id: room.id,
      p_payouts: payouts,
      p_winner_ids: winners,
    }).then(() => {});
  }, [room]);

  // ── Dice Poker: advance reroll → bet2 once every non-folded player has
  // committed their reroll. Guarded server-side on dice_phase='reroll', so a
  // race between two clients detecting completion at once is harmless.

  useEffect(() => {
    if (!supabase || !room || room.mode !== 'dice_poker' || room.status !== 'playing') return;
    if (room.dice_phase !== 'reroll') return;

    const folded = room.betting?.folded ?? {};
    const dealtIds = Object.keys(room.dice ?? {});
    const activeIds = dealtIds.filter((id) => !folded[id]);
    const allDone = activeIds.length > 0 && activeIds.every((id) => room.reroll_done?.[id]);
    if (!allDone) return;

    const order = (room.betting?.order ?? []).filter((id) => !folded[id]);
    const nextBetting = createBettingRound({ order, minBet: room.ante ?? ANTE });

    supabase.rpc('dice_poker_advance_phase', {
      p_room_id: room.id,
      p_betting: nextBetting,
    }).then(() => {});
  }, [room]);

  // ── Dice Poker: settle a hand once its current betting round has closed —
  // either everyone but one player folded, or the final betting round
  // finished with 2+ contenders (real showdown). The RPC is idempotent
  // (no-op once dice_phase is already 'showdown'), so a race between
  // multiple clients noticing the close at once is harmless.

  useEffect(() => {
    if (!supabase || !room || room.mode !== 'dice_poker' || room.status !== 'playing') return;
    if (room.dice_phase !== 'bet1' && room.dice_phase !== 'bet2') return;
    if (!room.betting || room.betting.currentActor) return; // still someone's turn

    const contenders = remainingContenders(room.betting);
    const winners = contenders.length <= 1
      ? contenders
      : resolveShowdown({ dice: room.dice ?? {}, folded: room.betting.folded ?? {} }).winners;
    const payouts = splitPot(room.pot ?? 0, winners);

    supabase.rpc('dice_poker_settle', {
      p_room_id: room.id,
      p_payouts: payouts,
      p_winner_ids: winners,
      p_hands_played: (room.hands_played ?? 0) + 1,
    }).then(() => {});
  }, [room]);

  // ── Create room ──────────────────────────────────────────────────────────
  // `diceConfig` (end_mode/hand_cap) only matters for Dice Poker; Indian
  // Poker ignores it and keeps its Part 1 defaults.

  const createRoom = async (diceConfig = {}) => {
    setError('');
    if (!supabase) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to play online.');
      return;
    }
    if (!mode) return;
    setIsBusy(true);
    const { data, error: e } = await supabase
      .from('gambling_corner_rooms')
      .insert({
        code: generateRoomCode(),
        status: 'waiting',
        mode,
        host_id: playerId,
        players: [{ id: playerId, name: 'Player 1', chips: STARTING_CHIPS, seat: 0, active: true }],
        starting_chips: STARTING_CHIPS,
        ante: ANTE,
        round_phase: 'idle',
        end_mode: diceConfig.endMode ?? 'hands',
        hand_cap: diceConfig.handCap ?? 8,
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

    const { data, error: joinError } = await supabase.rpc('gambling_corner_join', {
      p_code: code,
      p_player_id: playerId,
    });
    setIsBusy(false);
    if (joinError) {
      if (joinError.message?.includes('ROOM_NOT_FOUND')) setError('No Gambling Corner table found for that code.');
      else if (joinError.message?.includes('ROOM_FULL')) setError(`That table already has ${MAX_PLAYERS} players.`);
      else if (joinError.message?.includes('ROOM_NOT_JOINABLE')) setError('That table has already started.');
      else setError(joinError.message);
      return;
    }
    setRoom(data);
    setMode(data.mode);
  };

  // ── Host deals the first round from the waiting room ───────────────────────

  const startGame = async () => {
    if (!supabase || !room || room.status !== 'waiting' || !isHost) return;
    if (players.length < 2) return;

    if (room.mode === 'dice_poker') {
      await dealDiceHand();
      return;
    }

    const dealtIds = players.filter((p) => p.chips > 0).map((p) => p.id);
    const hands = dealHands(dealtIds);

    await supabase
      .from('gambling_corner_rooms')
      .update({
        status: 'playing',
        round_phase: 'dealt',
        hands,
        decisions: {},
        pot: 0,
        winner_ids: [],
        started_at: new Date().toISOString(),
      })
      .eq('id', room.id)
      .eq('status', 'waiting');
  };

  // ── Player decides to stay or fold this round (own key only, via RPC) ──────

  const decide = async (action) => {
    if (!supabase || !room || room.round_phase !== 'dealt' || !myPlayer) return;
    if (room.decisions?.[playerId]) return;
    await supabase.rpc('gambling_corner_decide', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_action: action,
    });
  };

  // ── Host deals the next round from the reveal screen ────────────────────────

  const dealNextRound = async () => {
    if (!supabase || !room || room.round_phase !== 'revealed' || !isHost) return;

    const { gameOver } = checkTableGameOver(players);
    if (gameOver) {
      await supabase
        .from('gambling_corner_rooms')
        .update({ status: 'finished' })
        .eq('id', room.id)
        .eq('status', 'playing');
      return;
    }

    const dealtIds = players.filter((p) => p.chips > 0).map((p) => p.id);
    const hands = dealHands(dealtIds);

    await supabase
      .from('gambling_corner_rooms')
      .update({ round_phase: 'dealt', hands, decisions: {}, pot: 0, winner_ids: [] })
      .eq('id', room.id)
      .eq('round_phase', 'revealed');
  };

  // ── Dice Poker: deal a hand (first deal from the waiting room, or the next
  // hand from showdown) — host-gated, applied atomically by dice_poker_deal.

  const dealDiceHand = async () => {
    if (!supabase || !room || !isHost) return;
    const ante = room.ante ?? ANTE;
    const dealtIn = players.filter((p) => p.chips > 0).sort((a, b) => a.seat - b.seat);
    if (dealtIn.length < 2) return;

    const dealerSeat = room.dealer_seat ?? 0;
    let startIdx = dealtIn.findIndex((p) => p.seat > dealerSeat);
    if (startIdx === -1) startIdx = 0;
    const order = [...dealtIn.slice(startIdx), ...dealtIn.slice(0, startIdx)].map((p) => p.id);

    const dice = dealDice(order);
    const newPlayers = players.map((p) =>
      order.includes(p.id) ? { ...p, chips: p.chips - ante } : p,
    );
    const pot = ante * order.length;
    const betting = createBettingRound({ order, minBet: ante });
    const nextDealerSeat = (dealerSeat + 1) % Math.max(players.length, 1);

    await supabase.rpc('dice_poker_deal', {
      p_room_id: room.id,
      p_host_id: playerId,
      p_players: newPlayers,
      p_dice: dice,
      p_betting: betting,
      p_pot: pot,
      p_dealer_seat: nextDealerSeat,
    });
  };

  // ── Dice Poker: one turn-based betting action ───────────────────────────────

  const diceBetAction = async (action, amount = 0) => {
    if (!supabase || !room || !myPlayer) return;
    if (room.dice_phase !== 'bet1' && room.dice_phase !== 'bet2') return;
    if (room.betting?.currentActor !== playerId) return;

    const { round: nextBetting, stack: nextStack, error: actionError } =
      applyAction(room.betting, playerId, action, amount, myPlayer.chips);
    if (actionError) return;

    const newPlayers = players.map((p) => (p.id === playerId ? { ...p, chips: nextStack } : p));
    const delta = (nextBetting.committed[playerId] ?? 0) - (room.betting.committed?.[playerId] ?? 0);
    const newPot = (room.pot ?? 0) + delta;

    let nextPhase = room.dice_phase;
    if (isRoundClosed(nextBetting)) {
      const contenders = remainingContenders(nextBetting);
      if (contenders.length > 1 && room.dice_phase === 'bet1') nextPhase = 'reroll';
    }

    await supabase.rpc('dice_poker_bet_action', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_betting: nextBetting,
      p_players: newPlayers,
      p_pot: newPot,
      p_next_phase: nextPhase,
    });
  };

  // ── Dice Poker: commit my one reroll (keep/reroll decided locally, only
  // the final 5 dice ever reach the server) ──────────────────────────────────

  const diceRerollCommit = async (keepMask) => {
    if (!supabase || !room || room.dice_phase !== 'reroll') return;
    const myDice = room.dice?.[playerId];
    if (!myDice) return;
    const newDice = rerollDice(myDice, keepMask);
    await supabase.rpc('dice_poker_reroll_commit', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_dice: newDice,
    });
  };

  // ── Dice Poker: host deals the next hand, or ends the table if the
  // end-condition (hand cap / bust) has been reached ─────────────────────────

  const dealNextDiceHand = async () => {
    if (!supabase || !room || room.dice_phase !== 'showdown' || !isHost) return;

    const { gameOver, winnerIds } = checkDiceTableGameOver({
      players,
      endMode: room.end_mode,
      handCap: room.hand_cap,
      handsPlayed: room.hands_played ?? 0,
    });
    if (gameOver) {
      await supabase
        .from('gambling_corner_rooms')
        .update({ status: 'finished', winner_ids: winnerIds })
        .eq('id', room.id)
        .eq('status', 'playing');
      return;
    }

    await dealDiceHand();
  };

  // ── Leave — one contextual control ─────────────────────────────────────────
  // Like Category Blitz, chips/hands are shared table state with no clean way
  // to continue without a seated player, so leaving ends the whole table.

  const leaveGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    if (room.status === 'finished' || room.status === 'aborted' || room.status === 'closed') return;
    await supabase.from('gambling_corner_rooms').update({ status: 'aborted' }).eq('id', room.id);
  };

  // ── Exit — after the table finishes, everyone navigates home ───────────────

  const exitGame = async () => {
    if (!supabase || !room) { navigate('/'); return; }
    await supabase
      .from('gambling_corner_rooms')
      .update({ status: 'closed' })
      .eq('id', room.id)
      .eq('status', 'finished');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (room?.status === 'aborted') return <GameExitScreen status="aborted" />;
  if (room?.status === 'closed')  return <GameExitScreen status="closed" />;

  if (!room) {
    if (!mode) {
      return <GamblingHub onSelectMode={setMode} />;
    }
    return (
      <GamblingLobby
        mode={mode}
        onBack={() => setMode(null)}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        isBusy={isBusy}
        error={error}
      />
    );
  }

  if (!myPlayer || room.status === 'waiting') {
    return (
      <GamblingLobby
        mode={room.mode}
        room={room}
        playerId={playerId}
        isHost={isHost}
        onStartGame={startGame}
        onLeaveRoom={leaveGame}
        isBusy={isBusy}
        error={error}
      />
    );
  }

  if (room.mode === 'dice_poker') {
    return (
      <DicePokerTable
        room={room}
        playerId={playerId}
        onBetAction={diceBetAction}
        onRerollCommit={diceRerollCommit}
        onDealNextHand={dealNextDiceHand}
        onLeave={leaveGame}
        onExit={exitGame}
      />
    );
  }

  return (
    <IndianPokerTable
      room={room}
      playerId={playerId}
      onDecide={decide}
      onDealNextRound={dealNextRound}
      onLeave={leaveGame}
      onExit={exitGame}
    />
  );
};

export default GamblingCorner;
