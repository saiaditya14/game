import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Crown, LogIn, LogOut, Plus, Sparkles, Users } from 'lucide-react';

const lobbyButtonClass =
  'inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

export const MonopolyLobby = ({
  room,
  playerId,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  isBusy,
  error,
}) => {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const players = Array.isArray(room?.players) ? room.players : [];
  const isHost = room?.host_id === playerId;
  const canStart = isHost && room?.status === 'waiting' && players.length >= 1;

  const submitJoin = (event) => {
    event.preventDefault();
    onJoinRoom(joinCode);
  };

  return (
    <main className="sugaropoly-lobby">
      <motion.section
        className="sugaropoly-lobby-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div className="sugaropoly-lobby-mark">
          <Sparkles aria-hidden="true" />
        </div>

        <p className="sugaropoly-lobby-kicker">sugar game</p>
        <h1>Faerie Kingdom Quest</h1>
        <p className="sugaropoly-lobby-copy">
          Create a pastel kingdom room, gather your party, then roll 2d8 around the board together.
        </p>

        {!room ? (
          <>
            <div className="sugaropoly-lobby-actions">
              <motion.button
                type="button"
                onClick={onCreateRoom}
                disabled={isBusy}
                className={`${lobbyButtonClass} sugaropoly-lobby-primary`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                CREATE
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setIsJoinOpen((value) => !value)}
                disabled={isBusy}
                className={`${lobbyButtonClass} sugaropoly-lobby-secondary`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogIn className="h-4 w-4" />
                JOIN
              </motion.button>
            </div>

            <AnimatePresence>
              {isJoinOpen && (
                <motion.form
                  onSubmit={submitJoin}
                  className="sugaropoly-join-form"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                >
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="ROOM"
                    aria-label="Room code"
                  />
                  <button
                    type="submit"
                    disabled={isBusy || joinCode.trim().length < 4}
                    className={`${lobbyButtonClass} sugaropoly-lobby-primary`}
                  >
                    Join
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="sugaropoly-waiting-room">
            <div className="sugaropoly-room-code">
              <span>Room Code</span>
              <strong>{room.code}</strong>
              <button type="button" onClick={() => navigator.clipboard?.writeText(room.code)} aria-label="Copy room code"><Copy /></button>
            </div>

            <div className="sugaropoly-waiting-header">
              <Users aria-hidden="true" />
              <span>{players.length}/8 players joined</span>
            </div>

            <div className="sugaropoly-waiting-list">
              {players.map((player) => (
                <div className="sugaropoly-waiting-player" key={player.id}>
                  <span
                    className="sugaropoly-waiting-avatar"
                    style={{ '--player-color': player.color || '#f9a8d4' }}
                  >
                    {room.host_id === player.id ? <Crown aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  </span>
                  <span>{player.name}</span>
                  {room.host_id === player.id ? <strong>Host</strong> : null}
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                type="button"
                onClick={onStartGame}
                disabled={!canStart || isBusy}
                className={`${lobbyButtonClass} sugaropoly-lobby-primary sugaropoly-start-button`}
              >
                <Sparkles className="h-4 w-4" />
                Choose Rules
              </button>
            ) : (
              <p className="sugaropoly-lobby-note">Waiting for the host to start the quest.</p>
            )}

            <button
              type="button"
              onClick={onLeaveRoom}
              className={`${lobbyButtonClass} sugaropoly-lobby-secondary sugaropoly-leave-button`}
            >
              <LogOut className="h-4 w-4" />
              Leave Room
            </button>
          </div>
        )}

        {error ? <p className="sugaropoly-lobby-error">{error}</p> : null}
      </motion.section>
    </main>
  );
};

export default MonopolyLobby;
