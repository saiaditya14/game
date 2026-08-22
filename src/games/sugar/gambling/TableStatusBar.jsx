import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, LogOut } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';

// A warning/danger red, distinct from every theme's primary accent — Leave
// is a destructive action (forfeits the whole table) and shouldn't blend
// into the same neutral outline every other icon button uses.
const LEAVE_COLOR = {
  'theme-pink':      '#e11d48',
  'theme-arcade':    '#ff2d55',
  'theme-cozy':      '#c2410c',
  'theme-champagne': '#c2410c',
};

// The site's global NavBar (src/components/NavBar.jsx) is already sticky at
// the top of every route and already owns the Lovelyland brand link, the
// Home icon, and the theme-swatch picker — including on /gambling-corner,
// since NavBar only hides its theme swatches on /draw-off. The old per-table
// nav duplicated all three. This bar only renders what's actually unique to
// being at a table: the room code (to share/copy) and the leave/forfeit
// action. Everything else was dead weight.
const TableStatusBar = ({ code, onLeave, showLeave = true }) => {
  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const leaveColor = LEAVE_COLOR[theme] ?? LEAVE_COLOR['theme-champagne'];
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex items-center justify-end gap-[0.5rem] py-[1rem]">
      {code && (
        <motion.button
          type="button"
          onClick={doCopy}
          className="inline-flex items-center gap-[0.4rem] border px-[0.75rem] py-[0.375rem] text-xs font-bold uppercase tracking-[0.14em]"
          style={{
            borderRadius: 'var(--radius)',
            borderColor: isArcade ? 'rgba(0,255,255,0.22)' : 'var(--divider)',
            background: isArcade ? 'rgba(0,14,14,0.85)' : 'var(--surface)',
            color: copied ? 'var(--primary)' : 'var(--muted)',
          }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          aria-label="Copy room code"
        >
          {code}
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </motion.button>
      )}
      {showLeave && (
        <motion.button
          type="button"
          onClick={onLeave}
          className="grid place-items-center border"
          style={{
            width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius)',
            borderColor: leaveColor, color: leaveColor,
            background: isArcade ? 'rgba(20,0,4,0.85)' : 'transparent',
            boxShadow: isArcade ? `0 0 10px ${leaveColor}66` : undefined,
          }}
          whileHover={{ y: -1, scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Leave table"
        >
          <LogOut className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
};

export default TableStatusBar;
