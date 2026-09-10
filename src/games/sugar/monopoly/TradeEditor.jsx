import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export const TradeEditor = ({ players, localPlayer, owned, ownership, onClose, onSubmit }) => {
  const others = players.filter((player) => player.id !== localPlayer.id && player.active);
  const [recipientId, setRecipientId] = useState(others[0]?.id || '');
  const [giveCash, setGiveCash] = useState(0);
  const [takeCash, setTakeCash] = useState(0);
  const [giveProperties, setGiveProperties] = useState([]);
  const [takeProperties, setTakeProperties] = useState([]);
  const recipientOwned = owned.filter((asset) => ownership[asset.id]?.ownerId === recipientId && !ownership[asset.id]?.buildings);
  const mine = owned.filter((asset) => ownership[asset.id]?.ownerId === localPlayer.id && !ownership[asset.id]?.buildings);
  const toggle = (id, values, setter) => setter(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  return (
    <div className="monopoly-modal-backdrop">
      <form className="monopoly-trade-editor" onSubmit={(e) => { e.preventDefault(); onSubmit({ recipientId, giveCash, takeCash, giveProperties, takeProperties }); }}>
        <button type="button" onClick={onClose} aria-label="Close"><X /></button>
        <h2>Create Trade</h2>
        <label>Trade with<select value={recipientId} onChange={(e) => setRecipientId(e.target.value)}>{others.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label>You give cash<input type="number" min="0" value={giveCash} onChange={(e) => setGiveCash(Number(e.target.value))} /></label>
        <label>You request cash<input type="number" min="0" value={takeCash} onChange={(e) => setTakeCash(Number(e.target.value))} /></label>
        <fieldset><legend>Your properties</legend>{mine.map((a) => <label key={a.id}><input type="checkbox" checked={giveProperties.includes(a.id)} onChange={() => toggle(a.id, giveProperties, setGiveProperties)} /> {a.name}</label>)}</fieldset>
        <fieldset><legend>Their properties</legend>{recipientOwned.map((a) => <label key={a.id}><input type="checkbox" checked={takeProperties.includes(a.id)} onChange={() => toggle(a.id, takeProperties, setTakeProperties)} /> {a.name}</label>)}</fieldset>
        <p className="sugaropoly-lobby-note">Developed properties cannot be traded.</p>
        <motion.button
          type="submit"
          disabled={!recipientId}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        >
          Send Offer
        </motion.button>
      </form>
    </div>
  );
};
