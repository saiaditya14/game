import React from 'react';
import { GameCard } from '../components/GameCard';

const DummyPage = ({ title }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-4 capitalize">{title} Hub</h1>
        <p className="opacity-70">Select a minigame to play your next turn.</p>
      </header>
      
      <div className="game-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <GameCard 
            key={i} 
            title={`Minigame ${i}`} 
            description="It is your turn! The other player is waiting for you to make a move." 
            badge="Your Turn"
            category="Classic"
            meta="placeholder"
          />
        ))}
      </div>
    </div>
  );
};

export default DummyPage;
