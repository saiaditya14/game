import React, { useEffect, useState } from 'react';
import { DEFAULT_RULES } from './monopolyData';

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
      <section className="sugaropoly-lobby-card monopoly-rules-card">
        <p className="sugaropoly-lobby-kicker">quest rules</p>
        <h1>Prepare the Kingdom</h1>
        <div className="monopoly-rule-grid">
          <label>Starting cash<input type="number" min="1" value={rules.startingCash} disabled={!isHost} onChange={(e) => set('startingCash', Number(e.target.value))} /></label>
          <label><input type="checkbox" checked={rules.auctions} disabled={!isHost} onChange={(e) => set('auctions', e.target.checked)} /> Auctions</label>
          <label><input type="checkbox" checked={rules.doubleUndevelopedRent} disabled={!isHost} onChange={(e) => set('doubleUndevelopedRent', e.target.checked)} /> Double full-group base rent</label>
          <label><input type="checkbox" checked={rules.freeParkJackpot} disabled={!isHost} onChange={(e) => set('freeParkJackpot', e.target.checked)} /> Free Park jackpot</label>
          <label><input type="checkbox" checked={rules.targetCashEnabled} disabled={!isHost} onChange={(e) => set('targetCashEnabled', e.target.checked)} /> Target-cash victory</label>
          {rules.targetCashEnabled ? <label>Target cash<input type="number" min="1" value={rules.targetCash} disabled={!isHost} onChange={(e) => set('targetCash', Number(e.target.value))} /></label> : null}
        </div>
        {isHost ? <button className="sugaropoly-lobby-primary monopoly-begin-button" type="button" disabled={busy} onClick={() => onBegin(rules)}>Begin Quest</button> : <p className="sugaropoly-lobby-note">The host is choosing the kingdom rules.</p>}
      </section>
    </main>
  );
};
