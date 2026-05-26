import React from 'react';
import { MonopolyBoard } from './MonopolyBoard';
import { MonopolySidebar } from './MonopolySidebar';

export const PastelMonopoly = () => {
  return (
    <div className="sugaropoly-page">
      <header className="sugaropoly-header">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-500 uppercase drop-shadow-sm">Sugaropoly</h1>
          <p className="text-rose-500 font-semibold mt-1">A sweet pastel property trading game</p>
        </div>
      </header>

      <div className="sugaropoly-layout">
        <div className="sugaropoly-board-pane">
          <MonopolyBoard />
        </div>

        <div className="sugaropoly-sidebar-pane">
          <MonopolySidebar />
        </div>
      </div>
    </div>
  );
};

export default PastelMonopoly;
