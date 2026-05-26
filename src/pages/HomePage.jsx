import React from 'react';
import { Link } from 'react-router-dom';
import { GameCard } from '../components/GameCard';
import { useTheme } from '../components/ThemeProvider';
import drawOffVanillaImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp.png';
import drawOffPinkImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (1).png';
import drawOffArcadeImage from '../../images/Gemini_Generated_Image_mvrpnvmvrpnvmvrp (2).png';

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

const drawOffImagesByTheme = {
  'theme-vanilla': drawOffVanillaImage,
  'theme-pink': drawOffPinkImage,
  'theme-arcade': drawOffArcadeImage,
  'theme-cozy': drawOffVanillaImage,
};

const SectionHeader = ({ title, eyebrow }) => (
  <div className="mb-5 flex items-end justify-between gap-4">
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-serif text-2xl font-medium text-foreground">{title}</h2>
    </div>
  </div>
);

const HomePage = () => {
  const { theme } = useTheme();
  const drawOffImage = drawOffImagesByTheme[theme] || drawOffVanillaImage;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      <header className="mb-12 mt-10 flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-extrabold leading-none text-primary sm:text-6xl">Lovelyland</h1>
        <p className="max-w-2xl text-base font-normal leading-7 text-[color:var(--muted)] sm:text-lg">
          Welcome back! Keep track of your ongoing matches, challenge your partner to new asynchronous games, and see who takes the crown this week.
        </p>
      </header>

      <section className="mb-14">
        <div className="game-section-shell">
          <SectionHeader title="Your Turn" eyebrow="games waiting" />
          <div className="game-grid hide-scrollbar">
            {turnGames.map((game) => (
              <GameCard key={game.title} {...game} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="game-section-shell">
          <SectionHeader title="Start a New Game" eyebrow="fresh picks" />
          <div className="game-grid hide-scrollbar">
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
            <Link to="/connect-four" className="block text-inherit no-underline focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]" style={{ borderRadius: 'var(--radius)' }}>
              <GameCard
                title="Connect Four"
                description="A classic game of strategy. Drop your pieces and race to connect four in a row."
                badge="New"
                category="Classic"
                meta="2 player game"
              />
            </Link>
            {newGames.map((game) => (
              <GameCard key={game.title} {...game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
