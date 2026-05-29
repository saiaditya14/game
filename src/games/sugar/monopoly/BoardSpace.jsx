import React from 'react';
import { ArrowLeft, Car, CloudSun, Earth, Gem, Gift, Heart, Landmark, Sparkles, Train, Umbrella, WandSparkles } from 'lucide-react';

const COLOR_TILES = {
  darkOlive: '#c7d99a',
  crimson: '#f9a8b7',
  darkGreen: '#a7e8b2',
  darkBlue: '#a9d7ff',
  steelGray: '#d9bf9e',
  deepViolet: '#d8c4ff',
  burntAmber: '#ffc48f',
  babyBlue: '#aee9ff',
  paleGreen: '#ffe66d',
  deepIndigo: '#b9b6ff',
  flameOrange: '#ffb48f',
  white: '#e5e7eb',
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
  gem: Gem,
  air: CloudSun,
  earth: Earth,
};

const edgeRotation = {
  bottom: 'rotate(0deg)',
  top: 'rotate(0deg)',
  right: 'rotate(270deg)',
  left: 'rotate(90deg)',
};

const bandPlacement = {
  bottom: 'top',
  top: 'bottom',
  right: 'left',
  left: 'right',
};

const COMPACT_NAME_SPACES = new Set(['Tribute Tax', 'Grim Burrows', 'Rotroot Fen', 'Emerald']);
const RAISED_NAME_SPACES = new Set(['Emerald']);

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
  const showIcon = name !== 'GO';
  const hasBand = Boolean(colorGroup);
  const bandColor = COLOR_TILES[colorGroup] || '#f6c4d6';
  const bandSide = bandPlacement[edge];
  const spaceClassName = [
    'monopoly-space',
    isCorner ? 'monopoly-corner' : 'monopoly-tile',
    isCorner && corner ? `monopoly-corner-${corner}` : '',
  ].filter(Boolean).join(' ');
  const nameClassName = [
    'space-name',
    COMPACT_NAME_SPACES.has(name) ? 'space-name-compact' : '',
    RAISED_NAME_SPACES.has(name) ? 'space-name-raised' : '',
  ].filter(Boolean).join(' ');
  const displayName = name === 'GO'
    ? (
      <span className="go-corner-label">
        <span className="go-corner-word">GO</span>
        <ArrowLeft className="go-corner-arrow" strokeWidth={3} />
      </span>
    )
    : name === 'Go To Time Out'
    ? (
      <>
        Go To
        <br />
        Time Out
      </>
    )
    : name;

  return (
    <div className={spaceClassName}>
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
        {showIcon ? <Icon className="space-icon" strokeWidth={2.4} /> : null}
        <div className={nameClassName}>{displayName}</div>
        {price ? <div className="space-price">${price}</div> : null}
      </div>
    </div>
  );
};
