import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Dices, Sparkles } from 'lucide-react';
import SplitText from '../../../components/reactbits/SplitText';
import { containerVariants, childVariants, DecoIcon } from './monopolyMotion';
import { DEFAULT_RULES } from './monopolyData';

const RuleCheckbox = ({ label, checked, disabled, onChange }) => (
  <label className="monopoly-rule-check-row">
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <span className="monopoly-rule-check-box"><Check /></span>
    <span className="monopoly-rule-check-label">{label}</span>
  </label>
);

export const MonopolySetup = ({ room, isHost, busy, onConfigure, onBegin }) => {
  const [rules, setRules] = useState({ ...DEFAULT_RULES, ...(room.rules || {}) });
  useEffect(() => setRules({ ...DEFAULT_RULES, ...(room.rules || {}) }), [room.rules]);
  const set = (key, value) => {
    const next = { ...rules, [key]: value };
    setRules(next);
    if (isHost) onConfigure(next);
  };
  return (
    <main className="sugaropoly-lobby">
      <motion.section
        className="sugaropoly-lobby-card monopoly-rules-card"
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="sugaropoly-lobby-watermark sugaropoly-lobby-watermark-crown"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.55, rotate: -18 }}
          animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        >
          <DecoIcon Icon={Dices} />
        </motion.div>
        <motion.div
          className="sugaropoly-lobby-watermark sugaropoly-lobby-watermark-sparkle"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
        >
          <DecoIcon Icon={Sparkles} />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
          <motion.p variants={childVariants} className="sugaropoly-lobby-kicker">quest rules</motion.p>
          <motion.div variants={childVariants}>
            <h1>
              <SplitText text="Prepare the Kingdom" delay={26} duration={0.4} ease="backOut" splitType="words" from={{ opacity: 0, scale: 0.5, y: 16 }} to={{ opacity: 1, scale: 1, y: 0 }} />
            </h1>
          </motion.div>
          <motion.div variants={childVariants} className="monopoly-rule-section">
            <p className="monopoly-rule-kicker">starting cash</p>
            <label className="monopoly-rule-field">
              <input type="number" min="1" value={rules.startingCash} disabled={!isHost} onChange={(e) => set('startingCash', Number(e.target.value))} />
            </label>
          </motion.div>

          <motion.div variants={childVariants} className="monopoly-rule-section">
            <p className="monopoly-rule-kicker">quest options</p>
            <div className="monopoly-rule-checklist">
              <RuleCheckbox label="Auctions" checked={rules.auctions} disabled={!isHost} onChange={(v) => set('auctions', v)} />
              <RuleCheckbox label="Double full-group base rent" checked={rules.doubleUndevelopedRent} disabled={!isHost} onChange={(v) => set('doubleUndevelopedRent', v)} />
              <RuleCheckbox label="Free Park jackpot" checked={rules.freeParkJackpot} disabled={!isHost} onChange={(v) => set('freeParkJackpot', v)} />
              <RuleCheckbox label="Target-cash victory" checked={rules.targetCashEnabled} disabled={!isHost} onChange={(v) => set('targetCashEnabled', v)} />
            </div>
            {rules.targetCashEnabled ? (
              <label className="monopoly-rule-field monopoly-rule-field-inline">
                <span>Target cash</span>
                <input type="number" min="1" value={rules.targetCash} disabled={!isHost} onChange={(e) => set('targetCash', Number(e.target.value))} />
              </label>
            ) : null}
          </motion.div>
          {isHost ? (
            <motion.button
              variants={childVariants}
              className="sugaropoly-lobby-primary monopoly-begin-button"
              type="button"
              disabled={busy}
              onClick={() => onBegin(rules)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Begin Quest
            </motion.button>
          ) : (
            <motion.p variants={childVariants} className="sugaropoly-lobby-note">The host is choosing the kingdom rules.</motion.p>
          )}
        </motion.div>
      </motion.section>
    </main>
  );
};
