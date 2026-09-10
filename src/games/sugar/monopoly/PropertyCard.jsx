import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const primaryButtonMotion = {
  whileHover: { scale: 1.04, y: -2 },
  whileTap: { scale: 0.95 },
  transition: { type: 'spring', stiffness: 380, damping: 18 },
};

const money = (value) => `$${Number(value || 0).toLocaleString('en-US')}`;

export const PropertyCard = ({
  space,
  deed,
  owner,
  pending,
  authoritative = false,
  localPlayer,
  canManage = false,
  busy = false,
  onClose,
  onBuy,
  onDecline,
  onPropertyAction,
}) => {
  if (!space) return null;
  const isProperty = space.type === 'property';
  const isAsset = Boolean(space.price);
  const actionType = pending?.type;
  const amount = pending?.amount;

  return (
    <div className="monopoly-card-overlay" role="dialog" aria-modal="true" aria-label={`${space.name} card`}>
      <div className={`monopoly-deed-card monopoly-card-${space.type || space.kind}`}>
        <button className="monopoly-card-close" type="button" onClick={onClose} aria-label="Close card"><X /></button>
        <header style={{ '--deed-color': `var(--property-${space.colorGroup || 'special'}, #f9a8d4)` }}>
          <span>{isProperty ? 'Title Deed' : space.type || space.kind || 'Kingdom Space'}</span>
          <h2>{space.name}</h2>
        </header>
        <div className="monopoly-card-art"><span>{deed?.mortgaged ? 'Mortgaged' : owner ? `Owned by ${owner.name}` : 'Unclaimed kingdom treasure'}</span></div>
        <div className="monopoly-card-body">
          {isProperty ? (
            <>
              {space.rents.map((rent, index) => (
                <div className={amount === rent ? 'is-highlighted' : ''} key={rent}>
                  <span>{index === 0 ? 'Rent' : index === 5 ? 'With hotel' : `With ${index} house${index > 1 ? 's' : ''}`}</span>
                  <strong>{money(rent)}</strong>
                </div>
              ))}
            </>
          ) : null}
          {space.type === 'portal' ? <p>Rent: $25 / $50 / $100 / $200 for 1-4 portals.</p> : null}
          {space.type === 'utility' ? <p>Rent is 4x, 10x, or 15x the rolled total for 1-3 utilities.</p> : null}
          {space.type === 'crystal' ? <p>Add $10, $25, or $65 to rent on normal properties for 1-3 crystals.</p> : null}
          {space.id === 4 ? <p>Pay 10% of current cash, capped at $200.</p> : null}
          {space.id === 52 ? <p>Pay $100 to the Treasury.</p> : null}
          {['chance', 'chest'].includes(space.kind) ? <p>The magic is still a harmless black box. Nothing happens yet.</p> : null}
          {space.isCorner ? <p>{space.id === 0 ? 'Collect $200 when passing or landing here.' : space.id === 28 ? 'Collect the recent tax jackpot when enabled.' : space.id === 14 ? 'Visiting is harmless unless you are in Time Out.' : 'Go directly to Time Out.'}</p> : null}
          {amount ? <div className="monopoly-card-charge">Resolved amount: {money(amount)}</div> : null}
        </div>
        {isAsset ? (
          <footer>
            <span>Price <strong>{money(space.price)}</strong></span>
            <span>{space.buildingCost ? `Build ${money(space.buildingCost)}` : 'Special deed'}</span>
            <span>Mortgage <strong>{money(space.mortgage)}</strong></span>
          </footer>
        ) : null}
      </div>
      <div className="monopoly-card-actions">
        {authoritative && actionType === 'purchase' ? (
          <>
            <motion.button type="button" onClick={onBuy} disabled={busy || Number(localPlayer?.money) < space.price} {...primaryButtonMotion}>Buy {money(space.price)}</motion.button>
            <motion.button type="button" onClick={onDecline} disabled={busy} {...primaryButtonMotion}>Ignore / Auction</motion.button>
          </>
        ) : null}
        {canManage && deed?.ownerId === localPlayer?.id ? (
          <>
            {!deed.mortgaged && isProperty ? <motion.button type="button" onClick={() => onPropertyAction('build')} disabled={busy} {...primaryButtonMotion}>Build</motion.button> : null}
            {Number(deed.buildings) > 0 ? <motion.button type="button" onClick={() => onPropertyAction('sell')} disabled={busy} {...primaryButtonMotion}>Sell Building</motion.button> : null}
            {!deed.mortgaged ? <motion.button type="button" onClick={() => onPropertyAction('mortgage')} disabled={busy} {...primaryButtonMotion}>Mortgage</motion.button> : <motion.button type="button" onClick={() => onPropertyAction('unmortgage')} disabled={busy} {...primaryButtonMotion}>Unmortgage</motion.button>}
          </>
        ) : null}
      </div>
    </div>
  );
};
