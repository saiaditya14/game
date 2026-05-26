import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Users, Beaker } from 'lucide-react';

const DrawOffHub = () => {
  const modes = [
    {
      title: 'Single Player (AI)',
      description: 'Draw fast while our AI judge tries to guess what it is!',
      path: '/draw-off-single',
      icon: Bot,
      color: 'bg-primary text-[color:var(--surface)]',
    },
    {
      title: 'Co-op (2-Player)',
      description: 'Team up! One player draws while the other types guesses.',
      path: '/draw-off-coop',
      icon: Users,
      color: 'bg-[color:var(--pink)] text-[color:var(--surface)]',
    },
    {
      title: 'BYOK (Testing)',
      description: 'Bring Your Own Key testing mode for developers.',
      path: '/draw-off-byok',
      icon: Beaker,
      color: 'bg-[color:var(--surface-strong)] text-foreground border border-[color:var(--divider)]',
    }
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <motion.div 
        className="mx-auto mb-10 max-w-2xl text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-serif text-4xl font-bold text-foreground">Draw Off</h1>
        <p className="mt-3 text-[color:var(--muted)]">Choose your game mode</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {modes.map((mode, i) => (
          <Link to={mode.path} key={mode.title} className="block">
            <motion.div
              className="flex h-full flex-col items-center p-6 text-center bg-[color:var(--surface)] border border-[color:var(--ring)] transition-shadow hover:shadow-[var(--shadow)]"
              style={{ borderRadius: 'var(--radius)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`mb-4 grid h-14 w-14 place-items-center rounded-full ${mode.color}`}>
                <mode.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{mode.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{mode.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </main>
  );
};

export default DrawOffHub;
