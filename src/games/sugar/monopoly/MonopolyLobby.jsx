import React, { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { Check, Copy, Crown, LogIn, LogOut, Plus, Sparkles, Users } from 'lucide-react';
import SplitText from '../../../components/reactbits/SplitText';
import { containerVariants, childVariants, DecoIcon } from './monopolyMotion';

const lobbyButtonClass =
  'inline-flex min-h-[2.75rem] min-w-[10rem] items-center justify-center gap-[0.5rem] px-[1.75rem] py-[0.625rem] text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

const lobbySpring = { whileHover: { scale: 1.06, y: -3 }, whileTap: { scale: 0.94 }, transition: { type: 'spring', stiffness: 320, damping: 18 } };

const MagneticButton = ({ children, strength = 0.28, disabled = false }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 380, damping: 28 });
  const sy = useSpring(y, { stiffness: 380, damping: 28 });

  const onMove = (event) => {
    if (disabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((event.clientX - rect.left - rect.width / 2) * strength);
    y.set((event.clientY - rect.top - rect.height / 2) * strength);
  };

  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-flex' }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
};

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
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const players = Array.isArray(room?.players) ? room.players : [];
  const isHost = room?.host_id === playerId;
  const canStart = isHost && room?.status === 'waiting' && players.length >= 1;

  const submitJoin = (event) => {
    event.preventDefault();
    onJoinRoom(joinCode);
  };

  const copyRoomCode = () => {
    navigator.clipboard?.writeText(room.code);
    setIsCodeCopied(true);
    window.setTimeout(() => setIsCodeCopied(false), 1400);
  };

  return (
    <main className="sugaropoly-lobby">
      <motion.section
        className="sugaropoly-lobby-card"
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="sugaropoly-lobby-watermark sugaropoly-lobby-watermark-crown"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.55, rotate: -18 }}
          animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        >
          <DecoIcon Icon={Crown} />
        </motion.div>
        <motion.div
          className="sugaropoly-lobby-watermark sugaropoly-lobby-watermark-sparkle"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
        >
          <DecoIcon Icon={Sparkles} />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div variants={childVariants} className="sugaropoly-lobby-mark">
            <Sparkles aria-hidden="true" />
          </motion.div>

          <motion.p variants={childVariants} className="sugaropoly-lobby-kicker">sugar game</motion.p>
          <motion.div variants={childVariants}>
            <h1>
              <SplitText text="Faerie Kingdom Quest" delay={26} duration={0.4} ease="backOut" splitType="words" from={{ opacity: 0, scale: 0.5, y: 16 }} to={{ opacity: 1, scale: 1, y: 0 }} />
            </h1>
          </motion.div>
          <motion.p variants={childVariants} className="sugaropoly-lobby-copy">
            Create a pastel kingdom room, gather your party, then roll 2d8 around the board together.
          </motion.p>

          <motion.div variants={childVariants}>
          {!room ? (
          <>
            <div className="sugaropoly-lobby-actions">
              <MagneticButton disabled={isBusy}>
                <motion.button
                  type="button"
                  onClick={onCreateRoom}
                  disabled={isBusy}
                  className={`${lobbyButtonClass} sugaropoly-lobby-primary`}
                  {...lobbySpring}
                >
                  <Plus className="h-4 w-4" />
                  CREATE
                </motion.button>
              </MagneticButton>

              <MagneticButton disabled={isBusy}>
                <motion.button
                  type="button"
                  onClick={() => setIsJoinOpen((value) => !value)}
                  disabled={isBusy}
                  className={`${lobbyButtonClass} sugaropoly-lobby-secondary`}
                  {...lobbySpring}
                >
                  <LogIn className="h-4 w-4" />
                  JOIN
                </motion.button>
              </MagneticButton>
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
                  <motion.button
                    type="submit"
                    disabled={isBusy || joinCode.trim().length < 4}
                    className={`${lobbyButtonClass} sugaropoly-lobby-primary`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    Join
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="sugaropoly-waiting-room">
            <div className="sugaropoly-room-code">
              <div className="sugaropoly-room-code-text">
                <span>Room Code</span>
                <strong>{room.code}</strong>
              </div>
              <motion.button
                type="button"
                onClick={copyRoomCode}
                aria-label="Copy room code"
                className="sugaropoly-nav-icon-button sugaropoly-room-code-copy-button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {isCodeCopied ? <Check /> : <Copy />}
              </motion.button>
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
              <motion.button
                type="button"
                onClick={onStartGame}
                disabled={!canStart || isBusy}
                className={`${lobbyButtonClass} sugaropoly-lobby-primary sugaropoly-start-button`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Sparkles className="h-4 w-4" />
                Choose Rules
              </motion.button>
            ) : (
              <p className="sugaropoly-lobby-note">Waiting for the host to start the quest.</p>
            )}

            <motion.button
              type="button"
              onClick={onLeaveRoom}
              className={`${lobbyButtonClass} sugaropoly-lobby-secondary sugaropoly-leave-button`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <LogOut className="h-4 w-4" />
              Leave Room
            </motion.button>
          </div>
        )}
          </motion.div>

          {error ? <motion.p variants={childVariants} className="sugaropoly-lobby-error">{error}</motion.p> : null}
        </motion.div>
      </motion.section>
    </main>
  );
};

export default MonopolyLobby;
