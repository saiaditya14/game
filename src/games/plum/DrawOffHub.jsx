import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, Users, Beaker, ArrowRight, Palette } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const PRIMARY_MODES = [
  {
    title: 'Single Player',
    tagline: 'You vs. the AI judge',
    description: 'Draw the prompt as fast as you can and race the sketch judge to three correct guesses.',
    path: '/draw-off-single',
    icon: Bot,
    accent: 'var(--primary)',
  },
  {
    title: 'Co-op',
    tagline: 'Two players, one sketchpad',
    description: 'Team up! One of you draws while the other races to type the right guess.',
    path: '/draw-off-coop',
    icon: Users,
    accent: 'var(--accent)',
  },
];

// Tailwind's preflight reset is not active in this project, so `box-sizing` is
// content-box everywhere. Any box that combines padding with a width/height
// constraint has to opt into border-box explicitly or it overflows its parent.
const BORDER_BOX = { boxSizing: 'border-box' };

const DrawOffHub = () => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';

  const glow = (color, strength) => (isArcade ? `drop-shadow(0 0 ${strength} ${color})` : 'none');

  return (
    <main
      style={{
        ...BORDER_BOX,
        position: 'relative',
        marginInline: 'auto',
        width: '100%',
        maxWidth: 'min(72rem, 100%)',
        paddingInline: 'clamp(1rem, 4vw, 2.5rem)',
        paddingBlock: 'clamp(2rem, 6vh, 4rem)',
        color: 'var(--foreground)',
      }}
    >
      {/* Ambient wash so the page reads as a designed surface, not bare background */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: isArcade
            ? 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,0,255,0.10) 0%, rgba(0,255,255,0.05) 45%, transparent 78%)'
            : 'radial-gradient(ellipse 85% 55% at 50% 0%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 72%)',
        }}
      />

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
        <motion.header variants={childVariants} style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vh, 3rem)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.9rem',
              paddingInline: '0.85rem',
              paddingBlock: '0.4rem',
              border: '1px solid var(--divider)',
              borderRadius: 'calc(var(--radius) + 0.5rem)',
              background: 'var(--surface-strong)',
            }}
          >
            <Palette className="h-3.5 w-3.5" style={{ color: 'var(--primary)', filter: glow('var(--primary)', '6px') }} />
            <span
              className="font-bold uppercase"
              style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--muted)' }}
            >
              sketch games
            </span>
          </div>

          <h1
            className="font-serif font-bold"
            style={{
              fontSize: 'clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)',
              lineHeight: 1.15,
              color: 'var(--foreground)',
              filter: glow('var(--foreground)', '10px'),
            }}
          >
            Draw Off
          </h1>

          <p
            style={{
              marginTop: '0.85rem',
              marginInline: 'auto',
              maxWidth: '34rem',
              fontSize: 'clamp(0.9rem, 0.85rem + 0.2vw, 1.05rem)',
              lineHeight: 1.6,
              color: 'var(--muted)',
            }}
          >
            Pick a mode and start sketching.
          </p>
        </motion.header>

        {/* Primary modes - auto-fit so two cards fill a wide screen instead of hugging a column.
            motion.div (not a plain div) so the parent's stagger keeps propagating to the cards. */}
        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))',
            gap: 'clamp(1rem, 2.2vw, 1.75rem)',
          }}
        >
          {PRIMARY_MODES.map((mode) => (
            <motion.div key={mode.title} variants={childVariants}>
              <Link to={mode.path} style={{ display: 'block', textDecoration: 'none', color: 'inherit', height: '100%' }}>
                <motion.article
                  style={{
                    ...BORDER_BOX,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    padding: 'clamp(1.5rem, 3vw, 2.25rem)',
                    border: '1px solid var(--ring)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface)',
                    boxShadow: 'var(--shadow)',
                  }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: mode.accent,
                      opacity: isArcade ? 0.9 : 0.65,
                    }}
                  />

                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '3.75rem',
                      height: '3.75rem',
                      marginBottom: '1.25rem',
                      borderRadius: 'calc(var(--radius) + 0.35rem)',
                      border: `1px solid ${mode.accent}`,
                      background: 'var(--surface-strong)',
                      color: mode.accent,
                      filter: glow(mode.accent, '10px'),
                    }}
                  >
                    <mode.icon className="h-7 w-7" />
                  </div>

                  <p
                    className="font-bold uppercase"
                    style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: mode.accent, marginBottom: '0.5rem' }}
                  >
                    {mode.tagline}
                  </p>

                  <h2
                    className="font-serif font-bold"
                    style={{
                      fontSize: 'clamp(1.35rem, 1.15rem + 0.7vw, 1.85rem)',
                      lineHeight: 1.2,
                      color: 'var(--foreground)',
                    }}
                  >
                    {mode.title}
                  </h2>

                  <p
                    style={{
                      marginTop: '0.7rem',
                      marginBottom: '1.5rem',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: 'var(--muted)',
                    }}
                  >
                    {mode.description}
                  </p>

                  <span
                    className="font-bold uppercase"
                    style={{
                      marginTop: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.65rem',
                      letterSpacing: '0.16em',
                      color: 'var(--foreground)',
                    }}
                  >
                    Play
                    <ArrowRight className="h-4 w-4" style={{ color: mode.accent }} />
                  </span>
                </motion.article>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Developer tier - deliberately quieter than the two real modes */}
        <motion.div variants={childVariants} style={{ marginTop: 'clamp(1.75rem, 4vh, 2.75rem)' }}>
          <p
            className="font-bold uppercase"
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.22em',
              color: 'var(--muted)',
              opacity: 0.75,
              marginBottom: '0.75rem',
            }}
          >
            developer tools
          </p>

          <Link to="/draw-off-byok" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <motion.div
              style={{
                ...BORDER_BOX,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: 'clamp(0.9rem, 2vw, 1.25rem)',
                border: '1px dashed var(--divider)',
                borderRadius: 'var(--radius)',
                background: 'transparent',
              }}
              whileHover={{ y: -3, backgroundColor: 'var(--surface-strong)' }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            >
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: '2.5rem',
                  height: '2.5rem',
                  flexShrink: 0,
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--divider)',
                  color: 'var(--muted)',
                }}
              >
                <Beaker className="h-4 w-4" />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p className="font-bold" style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>
                  BYOK Testing
                </p>
                <p style={{ marginTop: '0.2rem', fontSize: '0.78rem', lineHeight: 1.5, color: 'var(--muted)' }}>
                  Bring your own key - for testing the judge, not for playing.
                </p>
              </div>

              <ArrowRight className="h-4 w-4 shrink-0" style={{ color: 'var(--muted)' }} />
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default DrawOffHub;
