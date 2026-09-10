import React from 'react';
import { Car, CloudSun, Earth, Gem, Gift, Heart, Home, Landmark, Lock, Sparkles, Train, Umbrella, WandSparkles } from 'lucide-react';

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
const CORNER_FIT_SPACES = new Set(['Visiting', 'Go To Time Out']);

export const BoardSpace = ({
  kind = 'property',
  name,
  price,
  colorGroup,
  edge = 'bottom',
  isCorner = false,
  corner,
  deed,
  ownerColor,
  onClick,
}) => {
  const isMortgaged = Boolean(deed?.mortgaged);
  const buildings = Number(deed?.buildings) || 0;
  const hasHotel = buildings >= 5;
  const houseCount = hasHotel ? 0 : buildings;
  const Icon = isCorner ? ICONS[corner] || Sparkles : ICONS[kind] || Sparkles;
  const showIcon = name !== 'GO';
  const hasBand = Boolean(colorGroup);
  const bandColor = COLOR_TILES[colorGroup] || '#f6c4d6';
  const bandSide = bandPlacement[edge];
  const spaceClassName = [
    'monopoly-space',
    isCorner ? 'monopoly-corner' : 'monopoly-tile',
    isCorner && corner ? `monopoly-corner-${corner}` : '',
    isMortgaged ? 'is-mortgaged' : '',
    deed ? 'is-owned' : '',
  ].filter(Boolean).join(' ');
  const nameClassName = [
    'space-name',
    COMPACT_NAME_SPACES.has(name) ? 'space-name-compact' : '',
    RAISED_NAME_SPACES.has(name) ? 'space-name-raised' : '',
    CORNER_FIT_SPACES.has(name) ? 'space-name-corner-fit' : '',
  ].filter(Boolean).join(' ');
  const displayName = name === 'GO'
    ? (
      <span className="go-corner-label">
        <span className="go-corner-word">GO</span>
        <svg className="go-corner-arrow" viewBox="0 0 72 18" aria-hidden="true">
          <path d="M70 9H8" />
          <path d="M13 4L7 9L13 14" />
        </svg>
      </span>
    )
    : name === 'Go To Time Out'
    ? (
      <>
        <span className="corner-line">Go To</span>
        <br />
        <span className="corner-line">Time Out</span>
      </>
    )
    : name;

  return (
    <button
      className={spaceClassName}
      type="button"
      onClick={onClick}
      aria-label={`Inspect ${name}`}
      style={deed ? { '--owner-color': ownerColor || '#be185d' } : undefined}
    >
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
        {houseCount > 0 || hasHotel ? (
          <div className="space-buildings" aria-hidden="true">
            {hasHotel
              ? <Home className="space-building-icon is-hotel" strokeWidth={2.6} />
              : Array.from({ length: houseCount }, (_, index) => (
                <Home key={index} className="space-building-icon" strokeWidth={2.6} />
              ))}
          </div>
        ) : null}
        {isMortgaged ? <Lock className="space-mortgage-icon" strokeWidth={2.6} aria-label="Mortgaged" /> : null}
      </div>
    </button>
  );
};
