import React from 'react';
import { motion } from 'framer-motion';
import { RotateCw, Sparkles } from 'lucide-react';

export const TurnAction = ({ isDouble, disabled, onClick }) => (
  <motion.div
    className="monopoly-center-turn-action"
    aria-live="polite"
    initial={{ opacity: 0, scale: 0.94, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  >
    <span className="monopoly-center-turn-kicker">
      <Sparkles aria-hidden="true" />
      Landing resolved
    </span>
    <strong>{isDouble ? 'The dice favor you again' : 'Your move is complete'}</strong>
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={isDouble ? 'is-double' : undefined}
      whileHover={disabled ? undefined : { scale: 1.05, y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
    >
      {isDouble ? <RotateCw aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      {isDouble ? 'Roll Again' : 'End Turn'}
    </motion.button>
  </motion.div>
);
