import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Home, LogOut, Maximize2, Minimize2, Palette, Sparkles } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import { supabase } from '../../../lib/supabaseClient';
import { MonopolyBoard } from './MonopolyBoard';
import { MonopolyLobby } from './MonopolyLobby';
import { MonopolySidebar } from './MonopolySidebar';
import { MonopolySetup } from './MonopolySetup';
import { PropertyCard } from './PropertyCard';
import { TradeEditor } from './TradeEditor';
import { TurnAction } from './TurnAction';
import { VictoryOverlay } from './VictoryOverlay';
import { ASSET_BY_ID, DEFAULT_RULES, spaces } from './monopolyData';
import { createRollVisualTracker } from './rollVisuals';

const ROOM_KEY = 'lovelyland-monopoly-room-id';
const generateRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();
const playersOf = (room) => Array.isArray(room?.players) ? room.players : [];
const LANDING_CARD_TYPES = new Set(['purchase', 'landed', 'rent', 'tax', 'free_park', 'time_out', 'time_out_failed']);

export const PastelMonopoly = () => {
  const { theme, setTheme } = useTheme();
  const pageRef = useRef(null);
  const rollVisualTrackerRef = useRef(createRollVisualTracker());
  const [userId, setUserId] = useState('');
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [localRoll, setLocalRoll] = useState(null);
  const [movementRoll, setMovementRoll] = useState(null);
  const [inspectedSpaceId, setInspectedSpaceId] = useState(null);
  const [showLandingCard, setShowLandingCard] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const themes = [{ id: 'theme-vanilla', label: 'Vanilla' }, { id: 'theme-pink', label: 'Pink' }, { id: 'theme-arcade', label: 'Arcade' }, { id: 'theme-cozy', label: 'Cozy' }];

  const players = playersOf(room);
  const currentPlayer = room?.status === 'playing' ? players[room.current_player_index] : null;
  const localPlayer = players.find((player) => player.id === userId);
  const isHost = room?.host_id === userId;
  const isLocalTurn = currentPlayer?.id === userId;
  const ownership = room?.ownership || {};
  const pendingSpaceId = Number(room?.pending_action?.spaceId);
  const hasVisibleLandingAction = LANDING_CARD_TYPES.has(room?.pending_action?.type);
  const selectedSpaceId = inspectedSpaceId ?? (
    showLandingCard && hasVisibleLandingAction && Number.isFinite(pendingSpaceId) ? pendingSpaceId : null
  );
  const selectedSpace = selectedSpaceId === null ? null : spaces[selectedSpaceId];
  const selectedDeed = selectedSpace ? ownership[selectedSpace.id] : null;
  const selectedOwner = players.find((player) => player.id === selectedDeed?.ownerId);
  const authoritativeCard = isLocalTurn && selectedSpaceId === pendingSpaceId && inspectedSpaceId === null;
  const canRoll = Boolean(isLocalTurn && room?.turn_phase === 'awaiting_roll' && !busy);
  const canManage = Boolean(isLocalTurn && ['awaiting_roll', 'awaiting_end_turn'].includes(room?.turn_phase));
  const myProperties = Object.entries(ownership).filter(([, deed]) => deed.ownerId === userId).map(([id]) => ASSET_BY_ID[id]).filter(Boolean);
  const tradeAssets = Object.values(ASSET_BY_ID);

  const applyRoom = useCallback((next, options) => {
    if (!next) return;
    const nextVisualRoll = rollVisualTrackerRef.current.observe(next, options);
    if (nextVisualRoll) setMovementRoll(nextVisualRoll);
    setRoom(next);
    window.localStorage.setItem(ROOM_KEY, next.id);
  }, []);

  const rpc = useCallback(async (name, args = {}) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    setBusy(true);
    setError('');
    const { data, error: rpcError } = await supabase.rpc(name, args);
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      throw rpcError;
    }
    applyRoom(data);
    return data;
  }, [applyRoom]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    (async () => {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const result = await supabase.auth.signInAnonymously();
        if (result.error) { setError(`Anonymous sign-in failed: ${result.error.message}`); return; }
        session = result.data.session;
      }
      if (!active) return;
      setUserId(session.user.id);
      const savedRoomId = window.localStorage.getItem(ROOM_KEY);
      if (savedRoomId) {
        const { data } = await supabase.from('monopoly_rooms').select('*').eq('id', savedRoomId).maybeSingle();
        if (data && active) applyRoom(data);
      }
    })();
    return () => { active = false; };
  }, [applyRoom]);

  useEffect(() => {
    if (!supabase || !room?.id) return;
    const channel = supabase.channel(`monopoly-room-${room.id}`).on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'monopoly_rooms', filter: `id=eq.${room.id}` },
      ({ new: next }) => applyRoom(next)).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [applyRoom, room?.id]);

  useEffect(() => {
    if (!movementRoll?.id || movementRoll.playerId !== userId) return;
    setLocalRoll(movementRoll);
    setShowLandingCard(false);
    const diceTimer = window.setTimeout(() => setLocalRoll(null), 1500);
    const cardTimer = window.setTimeout(() => setShowLandingCard(true), 1480);
    return () => { window.clearTimeout(diceTimer); window.clearTimeout(cardTimer); };
  }, [movementRoll?.id, userId]);

  useEffect(() => {
    if (room?.auction || LANDING_CARD_TYPES.has(room?.pending_action?.type)) return;
    setShowLandingCard(false);
    setInspectedSpaceId(null);
  }, [room?.auction, room?.pending_action?.type]);

  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === pageRef.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const leaveRoom = async () => {
    const id = room?.id;
    setRoom(null);
    setMovementRoll(null);
    setLocalRoll(null);
    rollVisualTrackerRef.current.reset();
    window.localStorage.removeItem(ROOM_KEY);
    if (id && supabase) {
      const { error: leaveError } = await supabase.rpc('monopoly_forfeit', { p_room_id: id });
      if (leaveError) setError(`You left locally, but forfeiture failed: ${leaveError.message}`);
    }
  };

  const roll = async () => {
    try {
      await rpc('monopoly_roll', { p_room_id: room.id });
    } catch { /* shown inline */ }
  };

  const endTurn = async () => {
    if (room.pending_action?.type === 'purchase') {
      setInspectedSpaceId(null);
      setShowLandingCard(true);
      return;
    }
    try {
      await rpc('monopoly_end_turn', { p_room_id: room.id });
      setShowLandingCard(false);
      setInspectedSpaceId(null);
    } catch {
      if (room.pending_action?.type === 'purchase') setShowLandingCard(true);
    }
  };

  const resolveLandingAction = async (name, args) => {
    const next = await rpc(name, args);
    setShowLandingCard(false);
    setInspectedSpaceId(null);
    return next;
  };

  const auction = room?.auction;
  const auctionBidder = auction ? auction.bidders?.[auction.bidderIndex] : null;
  const auctionSpace = auction ? spaces[auction.spaceId] : null;
  const winner = players.find((player) => player.id === room?.winner_id);
  const showCenterTurnAction = Boolean(
    isLocalTurn
    && room?.turn_phase === 'awaiting_end_turn'
    && !auction
    && !selectedSpace
    && !localRoll
    && !showLandingCard
    && room?.status === 'playing'
  );
  const trades = (room?.trades || []).map((trade) => ({
    ...trade,
    title: `${players.find((p) => p.id === trade.proposerId)?.name || 'Player'} → ${players.find((p) => p.id === trade.recipientId)?.name || 'Player'}`,
  }));

  return (
    <div className="sugaropoly-page" ref={pageRef}>
      <nav className="sugaropoly-topbar">
        <Link className="sugaropoly-brand-link" to="/"><span className="sugaropoly-brand-mark"><Gamepad2 /></span><span className="sugaropoly-brand-copy"><span>Lovelyland</span><small>minigame hub</small></span></Link>
        <div className="sugaropoly-title-lockup"><Sparkles /><span>Faerie Kingdom Quest</span></div>
        <div className="sugaropoly-topbar-actions">
          {room ? <button className="sugaropoly-room-pill" type="button" onClick={() => navigator.clipboard?.writeText(room.code)}>{room.code}</button> : null}
          {currentPlayer ? <span className={`sugaropoly-turn-pill ${isLocalTurn ? 'is-yours' : ''}`}>{isLocalTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}</span> : null}
          {room ? <button className="sugaropoly-nav-icon-button" type="button" onClick={leaveRoom}><LogOut /></button> : null}
          <Link className="sugaropoly-nav-icon-button" to="/"><Home /></Link>
          <label className="sugaropoly-theme-control"><Palette /><select value={theme} onChange={(e) => setTheme(e.target.value)}>{themes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button className="sugaropoly-nav-icon-button" type="button" onClick={() => document.fullscreenElement ? document.exitFullscreen() : pageRef.current?.requestFullscreen()}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
        </div>
      </nav>

      {!room || room.status === 'waiting' ? (
        <MonopolyLobby room={room} playerId={userId} isBusy={busy || !userId} error={error}
          onCreateRoom={() => rpc('monopoly_create_room', { p_code: generateRoomCode() })}
          onJoinRoom={(code) => rpc('monopoly_join_room', { p_code: code })}
          onStartGame={() => rpc('monopoly_start_setup', { p_room_id: room.id })}
          onLeaveRoom={leaveRoom} />
      ) : room.status === 'setup' ? (
        <MonopolySetup room={room} isHost={isHost} busy={busy}
          onConfigure={(rules) => rpc('monopoly_configure', { p_room_id: room.id, p_rules: rules }).catch(() => {})}
          onBegin={(rules) => rpc('monopoly_configure', { p_room_id: room.id, p_rules: rules }).then(() => rpc('monopoly_begin', { p_room_id: room.id }))} />
      ) : (
        <>
          {error ? <p className="sugaropoly-inline-error">{error}</p> : null}
          <div className="sugaropoly-layout">
            <div className="sugaropoly-board-pane">
              <MonopolyBoard players={players.filter((p) => p.active)} diceRoll={localRoll} movementRoll={movementRoll}
                canRoll={canRoll} isRolling={busy && isLocalTurn && room.turn_phase === 'awaiting_roll'} onRoll={roll} onSpaceClick={setInspectedSpaceId}
                overlay={selectedSpace ? <PropertyCard space={selectedSpace} deed={selectedDeed} owner={selectedOwner}
                  pending={authoritativeCard ? room.pending_action : null} authoritative={authoritativeCard} localPlayer={localPlayer}
                  canManage={canManage} busy={busy} onClose={() => { setInspectedSpaceId(null); setShowLandingCard(false); }}
                  onBuy={() => resolveLandingAction('monopoly_buy', { p_room_id: room.id })}
                  onDecline={() => resolveLandingAction('monopoly_decline', { p_room_id: room.id })}
                  onPropertyAction={(action) => rpc('monopoly_property_action', { p_room_id: room.id, p_action: action, p_space: selectedSpace.id })} />
                  : showCenterTurnAction ? <TurnAction isDouble={room.consecutive_doubles > 0} disabled={busy} onClick={endTurn} />
                  : null} />
              {auction ? <div className="monopoly-auction-panel"><h2>Auction: {auctionSpace?.name}</h2><p>Current bid: ${auction.bid || 0}</p><p>{auctionBidder?.id === userId ? 'Your bid' : `Waiting for ${players.find((p) => p.id === auctionBidder?.id)?.name || 'bidder'}`}</p>{auctionBidder?.id === userId ? <><button type="button" onClick={() => { const bid = Number(window.prompt('Your bid', Number(auction.bid || 0) + 1)); if (bid) resolveLandingAction('monopoly_auction', { p_room_id: room.id, p_bid: bid }); }}>Bid</button><button type="button" onClick={() => resolveLandingAction('monopoly_auction', { p_room_id: room.id, p_bid: null })}>Pass</button></> : null}</div> : null}
            </div>
            <div className="sugaropoly-sidebar-pane">
              <MonopolySidebar players={players} trades={trades} properties={myProperties} events={room.event_log || []}
                currentPlayerId={currentPlayer?.id} currentPlayerName={currentPlayer?.name} localPlayerId={userId} localPlayerName={localPlayer?.name}
                debt={localPlayer?.debt} onBankruptcy={() => rpc('monopoly_bankrupt', { p_room_id: room.id })}
                onCreateTrade={() => setTradeOpen(true)} onTradeAction={(action, trade) => rpc('monopoly_trade', { p_room_id: room.id, p_action: action, p_trade: { id: trade.id } })}
              />
            </div>
          </div>
          {localPlayer?.inTimeOut && isLocalTurn && room.turn_phase === 'awaiting_roll' ? <div className="monopoly-timeout-actions"><strong>Time Out</strong><button type="button" onClick={() => rpc('monopoly_time_out', { p_room_id: room.id, p_action: 'pay' })} disabled={localPlayer.money < 50}>Pay $50</button><span>or roll for doubles</span></div> : null}
          {tradeOpen ? <TradeEditor players={players} localPlayer={localPlayer} owned={tradeAssets} ownership={ownership} onClose={() => setTradeOpen(false)}
            onSubmit={(trade) => rpc('monopoly_trade', { p_room_id: room.id, p_action: 'create', p_trade: trade }).then(() => setTradeOpen(false))} /> : null}
          {room.status === 'finished' ? <VictoryOverlay winner={winner} reason={room.end_reason} isHost={isHost} busy={busy} onPlayAgain={() => rpc('monopoly_play_again', { p_room_id: room.id })} /> : null}
        </>
      )}
    </div>
  );
};

export default PastelMonopoly;
