import React from 'react';
import { GameCard } from '../components/GameCard';

const HomePage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12">
      <header className="mb-12 mt-10 flex flex-col items-center gap-3 text-center">
        <h1 className="text-4xl font-extrabold leading-none text-primary sm:text-6xl">Lovelyland</h1>
        <p className="max-w-2xl text-base font-normal leading-7 text-[color:var(--muted)] sm:text-lg">
          Welcome back! Keep track of your ongoing matches, challenge your partner to new asynchronous games, and see who takes the crown this week.
        </p>
      </header>

      <section className="mb-16">
        <div className="mb-6 flex items-end justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-xl font-semibold">Your Turn</h2>
            <p className="text-sm font-normal text-[color:var(--muted)]">Games waiting for you</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">2 ready</span>
        </div>
        <div className="game-grid">
          <GameCard
            title="Tic-Tac-Toe"
            description="They played top-right. Your move to block!"
            badge="Action Required"
          />
          <GameCard
            title="Wordle Race"
            description="They guessed in 4 tries. Can you beat them?"
            badge="Action Required"
          />
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between border-b border-border/60 pb-3">
          <div>
            <h2 className="text-xl font-semibold">Start a New Game</h2>
            <p className="text-sm font-normal text-[color:var(--muted)]">Challenge them</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">fresh picks</span>
        </div>
        <div className="game-grid">
          <GameCard
            title="Connect Four"
            description="A classic game of strategy. Drop your pieces to connect four in a row."
            badge="New"
          />
          <GameCard
            title="Battleship"
            description="Deploy your fleet and hunt down their ships before they find yours."
          />
          <GameCard
            title="Guess Who?"
            description="Ask the right questions to guess their secret character."
          />
          <GameCard
            title="Checkers"
            description="Jump and capture! Who is the better tactician?"
          />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
