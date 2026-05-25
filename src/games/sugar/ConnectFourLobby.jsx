import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Plus, Users } from 'lucide-react';

const buttonBase =
  'inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed disabled:opacity-60';

const ConnectFourLobby = ({ onCreateRoom, onJoinRoom, isBusy, error, roomCode }) => {
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const submitJoin = (event) => {
    event.preventDefault();
    onJoinRoom(joinCode);
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center px-4 py-10 text-foreground">
      <motion.section
        className="w-full border bg-[color:var(--surface)] p-6 text-center sm:p-8"
        style={{ borderColor: 'var(--ring)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-[color:var(--surface)]">
          <Users className="h-6 w-6" />
        </div>

        <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">sugar game</p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-foreground sm:text-5xl">Connect Four</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
          Drop pieces into the grid and be the first player to connect four horizontally, vertically, or diagonally.
        </p>

        <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
          <motion.button
            type="button"
            onClick={onCreateRoom}
            disabled={isBusy}
            className={`${buttonBase} bg-primary text-[color:var(--surface)]`}
            style={{ borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            Create a Game
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setIsJoinOpen((value) => !value)}
            disabled={isBusy}
            className={`${buttonBase} border bg-[color:var(--surface-strong)] text-foreground`}
            style={{ borderColor: 'var(--ring)', borderRadius: 'var(--radius)' }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogIn className="h-4 w-4" />
            Join a Game
          </motion.button>
        </div>

        <AnimatePresence>
          {isJoinOpen && (
            <motion.form
              onSubmit={submitJoin}
              className="mx-auto mt-5 grid max-w-xl gap-3 border bg-[color:var(--surface-strong)] p-3 sm:grid-cols-[1fr_auto]"
              style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)' }}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
            >
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                className="min-h-12 border bg-[color:var(--surface)] px-4 text-center text-lg font-bold uppercase tracking-[0.2em] text-foreground outline-none transition placeholder:text-[color:var(--muted)] focus:ring-2 focus:ring-[color:var(--ring)]"
                style={{ borderColor: 'var(--divider)', borderRadius: 'var(--radius)' }}
                maxLength={6}
                placeholder="ROOM"
                aria-label="Room code"
              />
              <button
                type="submit"
                disabled={isBusy || joinCode.trim().length < 4}
                className={`${buttonBase} bg-primary text-[color:var(--surface)]`}
                style={{ borderRadius: 'var(--radius)' }}
              >
                Join
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {roomCode && (
          <p className="mt-5 text-sm font-semibold text-foreground">
            Room code: <span className="tracking-[0.22em] text-primary">{roomCode}</span>
          </p>
        )}

        {error && (
          <p className="mx-auto mt-4 max-w-xl border border-border/70 bg-[color:var(--surface-strong)] px-4 py-3 text-sm text-[color:var(--muted)]" style={{ borderRadius: 'var(--radius)' }}>
            {error}
          </p>
        )}
      </motion.section>
    </main>
  );
};

export default ConnectFourLobby;
