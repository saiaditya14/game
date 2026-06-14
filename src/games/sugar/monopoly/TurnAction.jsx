import React from 'react';
import { RotateCw, Sparkles } from 'lucide-react';

export const TurnAction = ({ isDouble, disabled, onClick }) => (
  <div className="monopoly-center-turn-action" aria-live="polite">
    <span className="monopoly-center-turn-kicker">
      <Sparkles aria-hidden="true" />
      Landing resolved
    </span>
    <strong>{isDouble ? 'The dice favor you again' : 'Your move is complete'}</strong>
    <button type="button" disabled={disabled} onClick={onClick}>
      {isDouble ? <RotateCw aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      {isDouble ? 'Roll Again' : 'End Turn'}
    </button>
  </div>
);
