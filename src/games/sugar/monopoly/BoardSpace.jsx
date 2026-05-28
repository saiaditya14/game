import React from 'react';
import { Car, Gift, Heart, Landmark, Sparkles, Train, Umbrella, WandSparkles } from 'lucide-react';

const COLOR_TILES = {
  darkOlive: '#c7d99a',
  crimson: '#f9a8b7',
  darkGreen: '#a7e8b2',
  darkBlue: '#a9d7ff',
  steelGray: '#d5d9e3',
  deepViolet: '#d8c4ff',
  burntAmber: '#ffc48f',
  babyBlue: '#aee9ff',
  paleGreen: '#d7f5bd',
  deepIndigo: '#b9b6ff',
  flameOrange: '#ffb48f',
  white: '#fff8fb',
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
  corner,
}) => {
  const Icon = isCorner ? ICONS[corner] || Sparkles : ICONS[kind] || Sparkles;
  const hasBand = Boolean(colorGroup);
  const bandColor = COLOR_TILES[colorGroup] || '#f6c4d6';
  const bandSide = bandPlacement[edge];
  const hasVisiblePrice = price !== undefined && price !== null;
  const shouldReservePriceSlot = !isCorner && !hasVisiblePrice;
  const nameWords = name.split(' ');
  const longestWordLength = Math.max(...nameWords.map((word) => word.length));
  const nameFitClass = longestWordLength >= 9 ? 'space-name-tight' : longestWordLength >= 7 ? 'space-name-compact' : '';

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
        <div className={`space-name ${nameFitClass}`}>
          {nameWords.map((word, index) => (
            <span key={`${word}-${index}`}>{word}</span>
          ))}
        </div>
        {hasVisiblePrice ? (
          <div className="space-price">${price}</div>
        ) : shouldReservePriceSlot ? (
          <div className="space-price space-price-placeholder" aria-hidden="true">$000</div>
        ) : null}
      </div>
    </div>
  );
};
