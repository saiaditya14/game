import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Home } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const THEME_SWATCHES = {
  'theme-vanilla': '#c08b52',
  'theme-pink':    '#be185d',
  'theme-arcade':  '#ff00ff',
  'theme-cozy':    '#8b5a2b',
};

const ALL_THEMES = [
  { id: 'theme-vanilla', label: 'Vanilla' },
  { id: 'theme-pink',    label: 'Pink'    },
  { id: 'theme-arcade',  label: 'Arcade'  },
  { id: 'theme-cozy',    label: 'Cozy'    },
];

function GradientPill({ children, style = {} }) {
  return (
    <div
      style={{
        padding: 1,
        borderRadius: 20,
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        boxShadow: '0 8px 32px color-mix(in srgb, var(--primary) 30%, transparent), 0 2px 8px rgba(0,0,0,0.1)',
        ...style,
      }}
    >
      <div
        style={{
          borderRadius: 19,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: 'color-mix(in srgb, var(--surface) 82%, transparent)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 10px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const NavBar = () => {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const isGameRoute     = pathname.startsWith('/draw-off');
  const isMonopolyRoute = pathname.startsWith('/monopoly');

  if (isMonopolyRoute) return null;

  return (
    <motion.header
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 1152,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 16px',
          pointerEvents: 'auto',
        }}
      >
        {/* ── Brand pill ── */}
        <GradientPill>
          <NavLink
            to="/"
            aria-label="Lovelyland home"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', outline: 'none' }}
          >
            <motion.div
              whileHover={{ rotate: -10, scale: 1.12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 14 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                display: 'grid',
                placeItems: 'center',
                background: 'var(--primary)',
                color: 'var(--background)',
                flexShrink: 0,
              }}
            >
              <Gamepad2 size={17} />
            </motion.div>
            <div style={{ lineHeight: 1, userSelect: 'none' }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--foreground)' }}>
                Lovelyland
              </span>
              <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 1 }}>
                minigame hub
              </span>
            </div>
          </NavLink>
        </GradientPill>

        {/* ── Controls pill ── */}
        <GradientPill>
          {/* Home icon */}
          <NavLink
            to="/"
            aria-label="Home"
            style={{ outline: 'none' }}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  display: 'grid',
                  placeItems: 'center',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'var(--background)' : 'var(--muted)',
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                <Home size={16} />
              </motion.div>
            )}
          </NavLink>

          {/* Divider + theme swatches */}
          {!isGameRoute && (
            <>
              <div style={{ width: 1, height: 22, background: 'var(--border)', opacity: 0.55, margin: '0 4px', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                {ALL_THEMES.map(({ id, label }) => {
                  const isActive = theme === id;
                  const color    = THEME_SWATCHES[id];
                  return (
                    <motion.button
                      key={id}
                      title={label}
                      onClick={() => setTheme(id)}
                      aria-label={`${label} theme`}
                      aria-pressed={isActive}
                      whileHover={{ scale: isActive ? 1.18 : 1.14 }}
                      whileTap={{ scale: 0.82 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      style={{
                        width:  isActive ? 18 : 14,
                        height: isActive ? 18 : 14,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        backgroundColor: color,
                        boxShadow: isActive
                          ? `0 0 0 2.5px var(--surface), 0 0 0 4px ${color}, 0 4px 16px ${color}99`
                          : '0 1px 4px rgba(0,0,0,0.25)',
                        opacity: isActive ? 1 : 0.52,
                        transition: 'width 0.2s, height 0.2s, box-shadow 0.2s, opacity 0.2s',
                        flexShrink: 0,
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
        </GradientPill>
      </div>
    </motion.header>
  );
};
