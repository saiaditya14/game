import React from 'react';
import { Car, Gift, Heart, Landmark, Sparkles, Train, Umbrella, WandSparkles } from 'lucide-react';

const COLOR_TILES = {
  cocoa: '#d9a38e',
  sky: '#a9dff3',
  blush: '#f6aacb',
  peach: '#ffc48f',
  berry: '#ff9aa8',
  lemon: '#fff08a',
  mint: '#aee7bd',
  lilac: '#b9b6ff',
};

const ICONS = {
  go: Heart,
  parking: Umbrella,
  jail: Landmark,
  gotojail: Car,
  chance: WandSparkles,
  chest: Gift,
  station: Train,
  utility: Sparkles,
  tax: Landmark,
};

const edgeRotation = {
  bottom: 'rotate(0deg)',
  top: 'rotate(0deg)',
  right: 'rotate(90deg)',
  left: 'rotate(90deg)',
};

const bandPlacement = {
  bottom: 'top',
  top: 'bottom',
  right: 'left',
  left: 'right',
};

export const BoardSpace = ({
  kind = 'property',
  name,
  price,
  colorGroup,
  edge = 'bottom',
  isCorner = false,
  corner = 'go',
}) => {
  const Icon = ICONS[corner] || ICONS[kind] || Sparkles;
  const hasBand = Boolean(colorGroup);
  const bandColor = COLOR_TILES[colorGroup] || '#f6c4d6';
  const bandSide = bandPlacement[edge];

  return (
    <div className={`monopoly-space ${isCorner ? 'monopoly-corner' : 'monopoly-tile'}`}>
      {hasBand && (
        <div
          className={`property-band property-band-${bandSide}`}
          style={{ backgroundColor: bandColor }}
        />
      )}

      <div
        className={`space-face space-face-${edge}`}
        style={{ transform: isCorner ? 'rotate(0deg)' : edgeRotation[edge] }}
      >
        <Icon className="space-icon" strokeWidth={2.4} />
        <div className="space-name">{name}</div>
        {price ? <div className="space-price">${price}</div> : null}
      </div>
    </div>
  );
};
