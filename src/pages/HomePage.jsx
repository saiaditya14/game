import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Disc, Hash, Calculator, Type, Brain, ListChecks, Coins, CupSoda } from 'lucide-react';
import { animate } from 'animejs';
import { GameCard } from '../components/GameCard';
import { useTheme } from '../components/ThemeProvider';
import DecryptedText from '../components/reactbits/DecryptedText';
import SplitText    from '../components/reactbits/SplitText';
import BlurText     from '../components/reactbits/BlurText';
import drawOffVanillaImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp.png';
import drawOffPinkImage    from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (1).png';
import drawOffArcadeImage  from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (2).png';
import adorableWallpaper from '../../images/adorableeeee.jpg';
import coupleCorner      from '../../images/couplehehe.png';
import arcadeVideo       from '../../images/video_eb9d7e6a96d3.mp4';
import blackHoleImg      from '../../images/black-hole-spin.png';

const newGames = [];

// ─── Explore pool — two of these are picked at random each visit ──────────────

const gamesList = [
  {
    path: '/draw-off',
    title: 'Draw Off',
    description: 'Draw it, guess it, race the clock.',
    badge: 'AI Racing',
    category: 'AI Racing',
    meta: 'multiple modes',
    imageKey: 'drawOff',
  },
  {
    path: '/connect-four',
    title: 'Connect Four',
    description: 'Classic four-in-a-row.',
    badge: 'New',
    category: 'Classic',
    meta: '2 player game',
    icon: Disc,
  },
  {
    path: '/monopoly',
    title: 'Sugaropoly',
    description: 'Monopoly, but cuter.',
    badge: 'Not Done',
    category: 'Board Game',
    meta: 'multiplayer',
    imageKey: 'sugaropoly',
  },
  {
    path: '/tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description: 'Bigger grid, same tic-tac-toe.',
    badge: 'New',
    category: 'Classic',
    meta: '2 player live',
    icon: Hash,
  },
  {
    path: '/quick-maths',
    title: 'Quick-Maths Duel',
    description: 'Quick math, whoever\'s faster wins.',
    badge: 'New',
    category: 'Puzzle',
    meta: '2 player live',
    icon: Calculator,
  },
  {
    path: '/word-race',
    title: 'Word Race',
    description: 'Wordle, but you\'re racing each other.',
    badge: 'New',
    category: 'Word',
    meta: '2 player live',
    icon: Type,
  },
  {
    path: '/verbal-memory',
    title: 'Verbal Memory Duel',
    description: 'Seen it or new? Three misses and you\'re out.',
    badge: 'New',
    category: 'Word',
    meta: '2 player live',
    icon: Brain,
  },
  {
    path: '/category-blitz',
    title: 'Category Blitz',
    description: 'Scattergories with a timer.',
    badge: 'New',
    category: 'Party',
    meta: '2-8 players',
    icon: ListChecks,
  },
  {
    path: '/gambling-corner',
    title: 'Gambling Corner',
    description: 'Poker night, shared chips.',
    badge: 'New',
    category: 'Bluff',
    meta: '2-8 players',
    icon: Coins,
  },
  {
    path: '/juice-bar',
    title: 'Juice Bar',
    description: 'One preps blind, one holds the order.',
    badge: 'New',
    category: 'Co-op',
    meta: '2 player live',
    icon: CupSoda,
  },
];

const pickRandomTwo = (pool) => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
};

const heroSubtitleByTheme = {
  'theme-pink':      'hii, your person is waiting for you',
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

// Per-theme card entrance variants
const cardItemVariantsByTheme = {
  'theme-pink': {
    hidden: { opacity: 0, scale: 0.90 },
    show:   { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
  },
  'theme-champagne': {
    hidden: { opacity: 0, x: -14 },
    show:   { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  },
  'theme-arcade': {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { duration: 0.10, ease: 'linear' } },
  },
  'theme-cozy': {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: 'easeOut' } },
  },
};

const ARCADE_STAR_STYLE = {
  color: 'var(--primary)',
  textShadow: '0 0 8px var(--primary), 0 0 18px var(--primary)',
  display: 'inline-block',
};

// ─── Section Header with Anime.js arcade star pulse ───────────────────────────

const SectionHeader = ({ title, eyebrow }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const leftStarRef  = useRef(null);
  const rightStarRef = useRef(null);

  useEffect(() => {
    if (!isArcade || !leftStarRef.current || !rightStarRef.current) return;

    const a1 = animate(leftStarRef.current, {
      opacity: [1, 0.18, 1],
      scale:   [1, 1.14, 1],
      duration: 1350,
      ease: 'inOutSine',
      loop: true,
    });
    const a2 = animate(rightStarRef.current, {
      opacity: [1, 0.18, 1],
      scale:   [1, 1.14, 1],
      duration: 1350,
      delay: 220,
      ease: 'inOutSine',
      loop: true,
    });

    return () => { a1.cancel(); a2.cancel(); };
  }, [isArcade]);

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
          {isArcade && (
            <span ref={leftStarRef} aria-hidden="true" style={{ ...ARCADE_STAR_STYLE, marginRight: '0.38em' }}>✦</span>
          )}
          {title}
          {isArcade && (
            <span ref={rightStarRef} aria-hidden="true" style={{ ...ARCADE_STAR_STYLE, marginLeft: '0.38em' }}>✦</span>
          )}
        </h2>
      </div>
    </motion.div>
  );
};

// ─── Hero Title — per-theme entry animation ───────────────────────────────────

const HeroTitle = ({ theme }) => {
  const titleClass = 'hero-title text-4xl font-bold leading-tight py-1 sm:text-6xl';

  if (theme === 'theme-arcade') {
    return (
      <h1 className={titleClass}>
        <DecryptedText
          text="Lovelyland"
          speed={30}
          maxIterations={5}
          sequential
          revealDirection="start"
        />
      </h1>
    );
  }

  if (theme === 'theme-pink') {
    return (
      <h1 className={titleClass}>
        <SplitText
          text="Lovelyland"
          delay={55}
          duration={0.48}
          ease="backOut"
          splitType="chars"
          from={{ opacity: 0, scale: 0.7, y: 12 }}
          to={{ opacity: 1, scale: 1, y: 0 }}
        />
      </h1>
    );
  }

  // Champagne / Cozy: standard stagger fade-up — clean and well-matched to both vibes
  return (
    <motion.h1
      variants={headerChildVariants}
      className={titleClass}
    >
      Lovelyland
    </motion.h1>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { theme } = useTheme();
  const drawOffImage = drawOffImagesByTheme[theme] || drawOffVanillaImage;
  const heroSubtitle = heroSubtitleByTheme[theme] || heroSubtitleByTheme['theme-champagne'];
  const isCozy   = theme === 'theme-cozy';
  const isArcade = theme === 'theme-arcade';

  const cardItemVariants = cardItemVariantsByTheme[theme] || cardItemVariantsByTheme['theme-cozy'];

  const imageByKey = { drawOff: drawOffImage, sugaropoly: drawOffPinkImage };
  const exploreGames = useMemo(() => pickRandomTwo(gamesList), []);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 180], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 180], [0, -28]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12" style={{ position: 'relative', zIndex: 2 }}>
      {/* Cozy: wallpaper background */}
      {isCozy && (
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, -7, 2, -4, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: [0.45, 0, 0.55, 1], times: [0, 0.3, 0.55, 0.78, 1] }}
          style={{
            position: 'fixed',
            top: '-2%',
            left: '-2%',
            right: '-2%',
            bottom: '-2%',
            zIndex: -2,
            backgroundImage: `url(${adorableWallpaper})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      {isCozy && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'linear-gradient(to bottom, rgba(8,18,6,0.08) 0%, rgba(8,18,6,0.36) 55%, rgba(8,18,6,0.60) 100%)',
          }}
        />
      )}
      {isCozy && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: 'clamp(0px, calc((100vw - 72rem) / 2), 320px)',
            height: 'clamp(0px, 56vh, 520px)',
            backgroundImage: `url(${coupleCorner})`,
            backgroundSize: 'auto 100%',
            backgroundPosition: 'left bottom',
            backgroundRepeat: 'no-repeat',
            maskImage: 'linear-gradient(to top, black 0%, black 38%, transparent 68%), linear-gradient(to right, black 0%, black 67%, transparent 96%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, black 38%, transparent 68%), linear-gradient(to right, black 0%, black 67%, transparent 96%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Arcade: video */}
      {isArcade && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            bottom: 0,
            right: 0,
            width: 'min(58vw, 680px)',
            zIndex: -2,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%)',
          }}
        >
          <video
            autoPlay muted loop playsInline
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center center',
              display: 'block',
              filter: 'brightness(0.7) saturate(0.85)',
            }}
          >
            <source src={arcadeVideo} type="video/mp4" />
          </video>
        </div>
      )}
      {isArcade && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            background: 'linear-gradient(to right, #000 0%, rgba(0,0,0,0.9) 38%, rgba(0,0,0,0.35) 52%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {isArcade && (
        <motion.img
          src={blackHoleImg}
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'fixed',
            bottom: '-260px',
            left: '-200px',
            width: 'min(28vw, 440px)',
            height: 'auto',
            zIndex: -1,
            opacity: 0.82,
            filter: 'brightness(0.75) saturate(1.1)',
            pointerEvents: 'none',
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
          <HeroTitle theme={theme} />

          {isCozy ? (
            <motion.p
              className="max-w-2xl text-base font-normal leading-7 sm:text-lg"
              style={{ color: '#ffe070', textShadow: '0 0 12px rgba(255,210,60,0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 5, times: [0, 0.18, 0.62, 1], delay: 0.4, ease: 'easeInOut' }}
            >
              {heroSubtitle}
            </motion.p>
          ) : (
            <motion.p
              variants={headerChildVariants}
              className="max-w-2xl text-base font-normal leading-7 text-[color:var(--muted)] sm:text-lg"
            >
              {heroSubtitle}
            </motion.p>
          )}
        </motion.div>
        <div className="hero-divider" aria-hidden="true" />
      </motion.div>

      <motion.section
        className="mb-14"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="game-section-shell">
          <SectionHeader title="Explore" eyebrow="try something new" />
          <motion.div
            className="game-grid hide-scrollbar"
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {exploreGames.map((game) => (
              <motion.div key={game.path} variants={cardItemVariants}>
                <Link to={game.path} className="game-card-link block text-inherit no-underline focus:outline-none" style={{ borderRadius: 'var(--radius)' }}>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    badge={game.badge}
                    category={game.category}
                    meta={game.meta}
                    icon={game.icon}
                    imageSrc={game.imageKey ? imageByKey[game.imageKey] : undefined}
                  />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="game-section-shell">
          <SectionHeader title="Start a New Game" eyebrow="fresh picks" />
          <motion.div
            className="game-grid hide-scrollbar"
            variants={gridVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {gamesList.map((game) => (
              <motion.div key={game.path} variants={cardItemVariants}>
                <Link to={game.path} className="game-card-link block text-inherit no-underline focus:outline-none" style={{ borderRadius: 'var(--radius)' }}>
                  <GameCard
                    title={game.title}
                    description={game.description}
                    badge={game.badge}
                    category={game.category}
                    meta={game.meta}
                    icon={game.icon}
                    imageSrc={game.imageKey ? imageByKey[game.imageKey] : undefined}
                  />
                </Link>
              </motion.div>
            ))}
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
