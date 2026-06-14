import React from 'react';
import { Crown, Home, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VictoryOverlay = ({ winner, reason, isHost, busy, onPlayAgain }) => (
  <div className="monopoly-winner-overlay" role="dialog" aria-modal="true" aria-label="Quest complete">
    <div className="monopoly-victory-card">
      <div className="monopoly-victory-sparkles" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((item) => <Sparkles key={item} />)}
      </div>
      <span className="monopoly-victory-crown"><Crown aria-hidden="true" /></span>
      <p>{reason === 'solo_bankrupt' ? 'Quest Over' : 'Quest Complete'}</p>
      <h2>{reason === 'solo_bankrupt' ? 'The kingdom claimed your last coin' : `${winner?.name || 'A brave adventurer'} wins!`}</h2>
      <span className="monopoly-victory-reason">
        {reason === 'solo_bankrupt'
          ? 'You went bankrupt, but the board is ready for another adventure.'
          : reason === 'target_cash'
          ? 'They reached the kingdom cash target.'
          : 'They are the last solvent adventurer standing.'}
      </span>
      <div className="monopoly-victory-actions">
        {isHost ? (
          <button type="button" onClick={onPlayAgain} disabled={busy}>
            <RotateCcw aria-hidden="true" />
            Play Again
          </button>
        ) : (
          <span className="monopoly-victory-waiting">Waiting for the host to begin another quest.</span>
        )}
        <Link to="/"><Home aria-hidden="true" /> Lovelyland Home</Link>
      </div>
    </div>
  </div>
);
