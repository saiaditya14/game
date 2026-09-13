import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

// Per-theme hover / tap / transition — presentation only
const HOVER_PROPS = {
  'theme-pink': {
    whileHover: { y: -6, scale: 1.025 },
    whileTap:   { scale: 0.95 },
    transition: { type: 'spring', stiffness: 280, damping: 18 },
  },
  'theme-champagne': {
    whileHover: { y: -3 },
    whileTap:   { scale: 0.97 },
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  'theme-arcade': {
    whileHover: { x: 3 },
    whileTap:   { scale: 0.98, x: 0 },
    transition: { duration: 0.06, ease: 'linear' },
  },
  'theme-cozy': {
    whileHover: { y: -2 },
    whileTap:   { scale: 0.98 },
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// Per-theme badge pulse — Action Required indicator
const BADGE_PULSE = {
  'theme-arcade': {
    animate:    { opacity: [1, 0.14, 1] },
    transition: { duration: 1.1, repeat: Infinity, ease: 'circIn' },
  },
};

const DEFAULT_HOVER = {
  whileHover: { y: -4 },
  whileTap:   { scale: 0.97 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

const DEFAULT_BADGE_PULSE = {
  animate:    { opacity: [1, 0.55, 1] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

export const GameCard = ({
  title,
  description,
  badge,
  category = 'Classic',
  imageSrc,
  icon: Icon,
  meta = '15 minigames',
}) => {
  const { theme } = useTheme();
  const isActionRequired = badge === 'Action Required';
  const label = isActionRequired ? 'Your Turn' : badge || category;

  const hoverProps  = HOVER_PROPS[theme]      || DEFAULT_HOVER;
  const badgePulse  = BADGE_PULSE[theme]       || DEFAULT_BADGE_PULSE;

  return (
    <motion.article
      {...hoverProps}
      className="group flex h-[27rem] overflow-hidden border border-border/70 bg-[color:var(--surface)] shadow-sm transition duration-300 hover:border-primary/30 hover:shadow-[var(--shadow)]"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div className="flex w-full flex-col">
        <div className="relative flex h-[52%] items-center justify-center overflow-hidden" style={{ background: 'var(--card-gradient)' }}>
          {isActionRequired ? (
            <motion.span
              animate={badgePulse.animate}
              transition={badgePulse.transition}
              className="game-card-badge absolute left-5 top-5 z-10 rounded-full bg-[color:var(--surface)]/92 px-3.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-primary shadow-sm"
            >
              {label}
            </motion.span>
          ) : (
            <span className="game-card-badge absolute left-5 top-5 z-10 rounded-full bg-[color:var(--surface)]/92 px-3.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-primary shadow-sm">
              {label}
            </span>
          )}

          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-[7rem] w-[7rem] place-items-center rounded-full border border-white/60 bg-[color:var(--surface)]/45 text-primary shadow-sm backdrop-blur-sm transition duration-300 group-hover:scale-105">
              {Icon ? <Icon className="h-[3rem] w-[3rem]" strokeWidth={1.5} /> : <ImageIcon className="h-[3rem] w-[3rem]" strokeWidth={1.5} />}
            </div>
          )}
        </div>

        <div className="game-card-body flex flex-1 flex-col">
          <div>
            <h3 className="game-card-title line-clamp-2 font-normal leading-tight text-foreground">{title}</h3>
            <div className="game-card-divider game-card-title-divider" />
            <p className="game-card-description line-clamp-3 text-[color:var(--muted)]">{description}</p>
          </div>

          <div className="mt-auto">
            <div className="game-card-divider game-card-footer-divider" />
            <div className="game-card-footer flex items-center justify-between gap-4">
              <span className="game-card-meta font-medium text-[color:var(--muted)]">{meta}</span>
              <span className="game-card-action inline-flex items-center gap-1.5 font-bold text-primary transition-colors duration-200 group-hover:text-[color:var(--accent)]">
                Play now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
