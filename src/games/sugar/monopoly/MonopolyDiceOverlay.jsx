import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Sparkles } from 'lucide-react';

const randomD8 = () => Math.floor(Math.random() * 8) + 1;

export const MonopolyDiceOverlay = ({ latestRoll, canRoll, onRoll, isRolling }) => {
  const [visibleRoll, setVisibleRoll] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayDice, setDisplayDice] = useState([1, 1]);
  const lastRollIdRef = useRef(null);

  useEffect(() => {
    if (!latestRoll?.id || latestRoll.id === lastRollIdRef.current) return undefined;

    lastRollIdRef.current = latestRoll.id;
    setVisibleRoll(latestRoll);
    setIsAnimating(true);
    setDisplayDice([randomD8(), randomD8()]);

    const intervalId = window.setInterval(() => {
      setDisplayDice([randomD8(), randomD8()]);
    }, 90);

    const revealId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setDisplayDice(latestRoll.dice || [1, 1]);
      setIsAnimating(false);
    }, 820);

    const hideId = window.setTimeout(() => {
      setVisibleRoll(null);
    }, 2600);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(revealId);
      window.clearTimeout(hideId);
    };
  }, [latestRoll]);

  if (!canRoll && !visibleRoll) return null;

  const dice = visibleRoll ? displayDice : ['?', '?'];
  const total = visibleRoll?.total;

  return (
    <div className="monopoly-dice-overlay" aria-live="polite">
      <motion.div
        className="monopoly-dice-card"
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.18 }}
      >
        <div className="monopoly-dice-kicker">
          <Dices aria-hidden="true" />
          <span>2d8 roll</span>
        </div>

        <div className={`monopoly-dice-pair ${isAnimating ? 'is-rolling' : ''}`}>
          <span className="monopoly-die">{dice[0]}</span>
          <span className="monopoly-die">{dice[1]}</span>
        </div>

        {visibleRoll ? (
          <div className="monopoly-dice-result">
            {isAnimating ? (
              <span>Rolling...</span>
            ) : (
              <>
                <strong>{total}</strong>
                <span>{visibleRoll.playerName} moved {total} spaces</span>
              </>
            )}
          </div>
        ) : (
          <button
            className="monopoly-roll-button"
            type="button"
            onClick={onRoll}
            disabled={isRolling}
          >
            <Sparkles aria-hidden="true" />
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default MonopolyDiceOverlay;
