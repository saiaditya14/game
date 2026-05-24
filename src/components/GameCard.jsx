import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';

export const GameCard = ({
  title,
  description,
  badge,
  category = 'Classic',
  imageSrc,
  meta = '15 minigames',
}) => {
  const isActionRequired = badge === 'Action Required';
  const label = isActionRequired ? 'Your Turn' : badge || category;

  return (
    <motion.article
      whileHover={{ y: -4, transition: { duration: 0.18, ease: 'easeOut' } }}
      className="group flex h-[27rem] overflow-hidden border border-border/70 bg-[color:var(--surface)] shadow-sm transition duration-300 hover:border-primary/30 hover:shadow-[var(--shadow)]"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div className="flex w-full flex-col">
        <div className="relative flex h-[52%] items-center justify-center overflow-hidden" style={{ background: 'var(--card-gradient)' }}>
          <span className="absolute left-5 top-5 z-10 rounded-full bg-[color:var(--surface)]/92 px-3.5 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.3em] text-primary shadow-sm">
            {label}
          </span>

          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full border border-white/60 bg-[color:var(--surface)]/45 text-primary shadow-sm backdrop-blur-sm transition duration-300 group-hover:scale-105">
              <ImageIcon className="h-12 w-12" strokeWidth={1.5} />
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
              <span className="game-card-action inline-flex items-center gap-1.5 font-bold text-primary">
                Play now
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
