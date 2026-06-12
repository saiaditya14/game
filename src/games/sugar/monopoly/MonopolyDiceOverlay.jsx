import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, Sparkles } from 'lucide-react';

const randomD8 = () => Math.floor(Math.random() * 8) + 1;

export const MonopolyDiceOverlay = ({ roll, canRoll, onRoll, isRolling }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayDice, setDisplayDice] = useState([1, 1]);

  useEffect(() => {
    if (!isRolling || roll) return undefined;

    setIsAnimating(true);
    const intervalId = window.setInterval(() => {
      setDisplayDice([randomD8(), randomD8()]);
    }, 90);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRolling, roll]);

  useEffect(() => {
    if (!roll?.id) return undefined;

    setIsAnimating(true);
    setDisplayDice([randomD8(), randomD8()]);

    const intervalId = window.setInterval(() => {
      setDisplayDice([randomD8(), randomD8()]);
    }, 90);

    const revealId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      setDisplayDice(roll.dice || [1, 1]);
      setIsAnimating(false);
    }, 620);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(revealId);
    };
  }, [roll]);

  if (!canRoll && !isRolling && !roll) return null;

  const dice = roll || isRolling ? displayDice : ['?', '?'];
  const total = roll?.total;
  const shouldShowRolling = roll ? isAnimating : isRolling;

  return (
    <div className="monopoly-dice-overlay" aria-live="polite">
      {(roll || isRolling) ? (
        <div className="monopoly-dice-sparkles" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((sparkle) => (
            <span key={sparkle}>
              <Sparkles />
            </span>
          ))}
        </div>
      ) : null}

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

        {roll || isRolling ? (
          <div className="monopoly-dice-result">
            {shouldShowRolling ? (
              <span>Rolling...</span>
            ) : (
              <>
                <strong>{total}</strong>
                <span>{roll.playerName} moved {total} spaces</span>
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
