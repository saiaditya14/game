import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Keyboard } from 'lucide-react';

const DrawOffRoleSelect = ({ onSelectRole, room, playerId, isCreator }) => {
  const isDrawerTaken = room.drawer_id && room.drawer_id !== playerId;
  const isGuesserTaken = room.guesser_id && room.guesser_id !== playerId;

  const myRole = room.drawer_id === playerId ? 'drawer' : room.guesser_id === playerId ? 'guesser' : null;

  if (!myRole && !isCreator) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="mx-auto w-full max-w-xl text-center border border-[color:var(--ring)] bg-[color:var(--surface)] p-10 shadow-[var(--shadow)]"
          style={{ borderRadius: 'var(--radius)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-3xl font-bold text-foreground">Waiting for Host...</h1>
          <p className="mt-3 text-[color:var(--muted)]">The person who created the room is picking a role.</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">You will automatically join the game as the remaining role.</p>
        </motion.div>
      </main>
    );
  }

  if (myRole) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="mx-auto w-full max-w-xl text-center border border-[color:var(--ring)] bg-[color:var(--surface)] p-10 shadow-[var(--shadow)]"
          style={{ borderRadius: 'var(--radius)' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="mb-6 mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--surface-strong)] text-[color:var(--pink)] border border-[color:var(--ring)]">
            {myRole === 'drawer' ? <PenTool className="h-8 w-8" /> : <Keyboard className="h-8 w-8" />}
          </div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Waiting for Partner...</h1>
          <p className="mt-3 text-[color:var(--muted)]">You are playing as the <span className="font-bold capitalize text-[color:var(--pink)]">{myRole}</span>.</p>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Waiting for someone else to join and pick the remaining role.</p>
          
          <div className="mt-8 bg-[color:var(--surface-strong)] py-4 text-center text-sm font-semibold text-[color:var(--muted)] border border-[color:var(--divider)]" style={{ borderRadius: 'var(--radius)' }}>
            Room Code: <span className="tracking-[0.22em] text-primary text-xl ml-2">{room.code}</span>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col items-center justify-center px-4 py-10">
      <motion.div
        className="mx-auto w-full max-w-xl text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-serif text-4xl font-bold text-foreground">Choose Role</h1>
        <p className="mt-3 text-[color:var(--muted)]">Who will do what?</p>
      </motion.div>

      <div className="mt-12 grid w-full max-w-2xl gap-6 sm:grid-cols-2">
        <motion.button
          onClick={() => onSelectRole('drawer')}
          disabled={isDrawerTaken}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex flex-col items-center rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface)] p-8 shadow-sm transition-all hover:shadow-[var(--shadow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-[color:var(--pink)] text-[color:var(--surface)]">
            <PenTool className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Drawer</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">You will be given a word to draw. No letters allowed!</p>
          {isDrawerTaken && <span className="absolute top-4 right-4 text-xs font-bold text-[color:var(--pink)] uppercase">Taken</span>}
        </motion.button>

        <motion.button
          onClick={() => onSelectRole('guesser')}
          disabled={isGuesserTaken}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex flex-col items-center rounded-2xl border border-[color:var(--ring)] bg-[color:var(--surface)] p-8 shadow-sm transition-all hover:shadow-[var(--shadow)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-primary text-[color:var(--surface)]">
            <Keyboard className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Guesser</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">You will guess what your partner is drawing in real-time.</p>
          {isGuesserTaken && <span className="absolute top-4 right-4 text-xs font-bold text-primary uppercase">Taken</span>}
        </motion.button>
      </div>
      
      <div className="mt-12 text-center text-sm font-semibold text-[color:var(--muted)]">
        Room Code: <span className="tracking-[0.22em] text-primary">{room.code}</span>
      </div>
    </main>
  );
};

export default DrawOffRoleSelect;