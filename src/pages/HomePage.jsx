import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GameCard } from '../components/GameCard';
import { useTheme } from '../components/ThemeProvider';
import drawOffVanillaImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp.png';
import drawOffPinkImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (1).png';
import drawOffArcadeImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (2).png';
import adorableWallpaper from '../../adorableeeee.jpg';

const turnGames = [
  {
    title: 'Tic-Tac-Toe',
    description: 'They played top-right. Your move to block the line and keep the match alive.',
    badge: 'Action Required',
    category: 'Classic',
    meta: '1 move waiting',
  },
  {
    title: 'Wordle Race',
    description: 'They guessed in 4 tries. Take your shot and see if you can beat their score.',
    badge: 'Action Required',
    category: 'Word',
    meta: '1 round waiting',
  },
];

const newGames = [
  {
    title: 'Battleship',
    description: 'Deploy your fleet, hide your ships, and hunt theirs down before they find yours.',
    category: 'Strategy',
    meta: 'async turns',
  },
  {
    title: 'Guess Who?',
    description: 'Ask the right questions, narrow the board, and uncover their secret character.',
    category: 'Deduction',
    meta: 'quick match',
  },
  {
    title: 'Checkers',
    description: 'Jump, capture, and set up the board for a clean little tactical win.',
    category: 'Classic',
    meta: 'board game',
  },
];

const heroSubtitleByTheme = {
  'theme-pink':      'hii ♡ your person is waiting for you~',
  'theme-champagne': 'Welcome back! Keep track of your ongoing matches, challenge your partner to new games, and see who takes the crown.',
  'theme-arcade':    'Welcome back! Keep track of your ongoing matches, challenge your partner to new games, and see who takes the crown.',
  'theme-cozy':      'Settle in. The kettle\'s on. Your games are waiting.',
};

const drawOffImagesByTheme = {
  'theme-champagne': drawOffVanillaImage,
  'theme-pink':      drawOffPinkImage,
  'theme-arcade':    drawOffArcadeImage,
  'theme-cozy':      drawOffVanillaImage,
};

const headerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const headerChildVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const ARCADE_STAR_STYLE = {
  color: 'var(--primary)',
  textShadow: '0 0 8px var(--primary), 0 0 18px var(--primary)',
};

const SectionHeader = ({ title, eyebrow }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  return (
    <motion.div
      className="mb-5 flex items-end justify-between gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">
          {isArcade && <span aria-hidden="true" style={{ ...ARCADE_STAR_STYLE, marginRight: '0.38em' }}>✦</span>}
          {title}
          {isArcade && <span aria-hidden="true" style={{ ...ARCADE_STAR_STYLE, marginLeft: '0.38em' }}>✦</span>}
        </h2>
      </div>
    </motion.div>
  );
};

const HomePage = () => {
  const { theme } = useTheme();
  const drawOffImage = drawOffImagesByTheme[theme] || drawOffVanillaImage;
  const heroSubtitle = heroSubtitleByTheme[theme] || heroSubtitleByTheme['theme-vanilla'];
  const isCozy = theme === 'theme-cozy';

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 180], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 180], [0, -28]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      {/* Cozy wallpaper background */}
      {isCozy && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            backgroundImage: `url(${adorableWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {/* Cozy: bottom gradient to darken under cards so text stays readable */}
      {isCozy && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'linear-gradient(to bottom, rgba(8,18,6,0.10) 0%, rgba(8,18,6,0.38) 55%, rgba(8,18,6,0.62) 100%)',
          }}
        />
      )}

      {/* Scroll-fade wrapper */}
      <motion.div key={theme} style={{ opacity: heroOpacity, y: heroY }} className="mt-10 mb-12">
        {/* Hero */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-3 text-center px-6 py-10 sm:py-14"
        >
          <motion.h1
            variants={headerChildVariants}
            className="hero-title text-4xl font-bold leading-tight py-1 sm:text-6xl"
          >
            Lovelyland
          </motion.h1>
          <motion.p
            variants={headerChildVariants}
            className="max-w-2xl text-base font-normal leading-7 text-[color:var(--muted)] sm:text-lg"
          >
            {heroSubtitle}
          </motion.p>
        </motion.div>
        <div className="hero-divider" aria-hidden="true" />
      </motion.div>

      <motion.section
        className="mb-14"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="game-section-shell">
          <SectionHeader title="Your Turn" eyebrow="games waiting" />
          <motion.div
            className="game-grid hide-scrollbar"
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: '-60px' }}
          >
            {turnGames.map((game) => (
              <motion.div key={game.title} variants={cardItemVariants}>
                <GameCard {...game} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: '-80px' }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="game-section-shell">
          <SectionHeader title="Start a New Game" eyebrow="fresh picks" />
          <motion.div
            className="game-grid hide-scrollbar"
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: '-60px' }}
          >
            <motion.div variants={cardItemVariants}>
              <Link to="/draw-off" className="block text-inherit no-underline focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]" style={{ borderRadius: 'var(--radius)' }}>
                <GameCard
                  title="Draw Off"
                  description="Sketch against the clock, play with a friend, or experiment in testing modes."
                  badge="AI RACING"
                  category="AI Racing"
                  meta="multiple modes"
                  imageSrc={drawOffImage}
                />
              </Link>
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <Link to="/connect-four" className="block text-inherit no-underline focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]" style={{ borderRadius: 'var(--radius)' }}>
                <GameCard
                  title="Connect Four"
                  description="A classic game of strategy. Drop your pieces and race to connect four in a row."
                  badge="New"
                  category="Classic"
                  meta="2 player game"
                />
              </Link>
            </motion.div>
            <motion.div variants={cardItemVariants}>
              <Link to="/monopoly" className="block text-inherit no-underline focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]" style={{ borderRadius: 'var(--radius)' }}>
                <GameCard
                  title="Sugaropoly"
                  description="A super cutesy, pastel property trading game. Buy properties, build bakeries, and collect pastry rent!"
                  badge="Cutesy"
                  category="Board Game"
                  meta="multiplayer"
                  imageSrc={drawOffPinkImage}
                />
              </Link>
            </motion.div>
            {newGames.map((game) => (
              <motion.div key={game.title} variants={cardItemVariants}>
                <GameCard {...game} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
