import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Dices, Eye, Spade } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import DecryptedText from '../../../components/reactbits/DecryptedText';
import SplitText from '../../../components/reactbits/SplitText';
import BlurText from '../../../components/reactbits/BlurText';

// ─── Per-theme copy ────────────────────────────────────────────────────────────

const eyebrowByTheme = {
  'theme-pink':      'sugar game ♡',
  'theme-arcade':    'SUGAR GAME',
  'theme-cozy':      'sugar game',
  'theme-champagne': 'sugar game',
};

const descByTheme = {
  'theme-pink':      'One shared chip bankroll, three bluff games. Pick your table~',
  'theme-arcade':    'ONE CHIP BANKROLL. THREE BLUFF GAMES. PICK YOUR TABLE.',
  'theme-cozy':      'One shared chip bankroll, three bluff games. Pick a table to sit at.',
  'theme-champagne': 'One shared chip bankroll, three bluff games — pick a table to sit at.',
};

const comingSoonByTheme = {
  'theme-pink':      'coming soon~',
  'theme-arcade':    'COMING SOON',
  'theme-cozy':      'coming soon',
  'theme-champagne': 'Coming Soon',
};

// ─── Per-theme card shell (matches Category Blitz / Quick-Maths lobby) ────────

const cardStyleByTheme = {
  'theme-pink': {
    background: 'rgba(255,247,251,0.82)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(251,113,133,0.28)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 32px 96px rgba(190,24,93,0.18), inset 0 1px 0 rgba(255,255,255,0.55)',
  },
  'theme-champagne': {
    background: 'var(--surface)',
    border: '1px solid var(--ring)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  },
  'theme-arcade': {
    background: 'rgba(4,4,4,0.97)',
    border: '1px solid var(--ring)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 0 0 1px rgba(0,255,255,0.10), 0 0 48px rgba(0,255,255,0.06), 0 0 96px rgba(255,0,255,0.05)',
  },
  'theme-cozy': {
    background: 'rgba(16,8,2,0.90)',
    border: '1px solid rgba(205,144,64,0.26)',
    borderRadius: 'var(--radius)',
    boxShadow: '0 32px 96px rgba(160,90,20,0.38), 0 0 0 1px rgba(205,144,64,0.12)',
  },
};

const iconStyleByTheme = {
  'theme-pink':      { background: 'var(--primary)', borderRadius: '50%',           boxShadow: '0 4px 22px rgba(190,24,93,0.38)',                       color: 'white' },
  'theme-champagne': { background: 'var(--primary)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',                                          color: 'var(--surface)' },
  'theme-arcade':    { background: 'var(--primary)', borderRadius: '0',             boxShadow: '0 0 18px var(--primary), 0 0 36px rgba(255,0,255,0.55)', color: '#000' },
  'theme-cozy':      { background: 'var(--primary)', borderRadius: 'var(--radius)', boxShadow: '0 4px 24px rgba(205,144,64,0.42)',                       color: 'var(--surface)' },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const childVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Decorative corner watermark ───────────────────────────────────────────

const DecoIcon = ({ Icon, className = '' }) => (
  <Icon className={className} aria-hidden="true" style={{ width: '100%', height: '100%' }} />
);

// ─── Mode tiles ─────────────────────────────────────────────────────────────

const MODES = [
  {
    id: 'indian_poker',
    icon: Eye,
    title: 'Indian Poker',
    difficulty: 'Easy · Silly',
    desc: "See everyone else's card, never your own. Stay or fold on the bluff.",
    enabled: true,
  },
  {
    id: 'dice_poker',
    icon: Dices,
    title: 'Dice Poker',
    difficulty: 'Medium',
    desc: '5 dice, one re-roll, classic poker hands — real turn-based betting.',
    enabled: true,
  },
  {
    id: 'holdem',
    icon: Spade,
    title: "Hold'em",
    difficulty: 'Hard · Standard',
    desc: 'Hole cards, community cards, blinds, real betting rounds.',
    enabled: true,
  },
];

const ModeTile = ({ mode, theme, isArcade, onSelectMode }) => {
  const comingSoon = comingSoonByTheme[theme] ?? comingSoonByTheme['theme-champagne'];
  const Icon = mode.icon;
  const disabled = !mode.enabled;

  return (
    <motion.button
      type="button"
      variants={childVariants}
      disabled={disabled}
      onClick={() => mode.enabled && onSelectMode(mode.id)}
      className="relative flex flex-1 flex-col items-center gap-[0.625rem] border px-[1.25rem] py-[1.75rem] text-center transition focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] disabled:cursor-not-allowed"
      style={{
        borderRadius: 'var(--radius)',
        borderColor: disabled ? 'var(--divider)' : 'var(--ring)',
        background: disabled ? 'transparent' : (isArcade ? 'rgba(255,0,255,0.05)' : 'var(--surface-strong)'),
        opacity: disabled ? 0.55 : 1,
        minWidth: '9rem',
      }}
      whileHover={mode.enabled ? (theme === 'theme-pink' ? { scale: 1.06, y: -4 } : isArcade ? { scale: 1.04 } : { scale: 1.02, y: -3 }) : {}}
      whileTap={mode.enabled ? { scale: 0.97 } : {}}
    >
      {disabled && (
        <span
          className="absolute right-[0.625rem] top-[0.625rem] text-[0.56rem] font-bold uppercase tracking-[0.14em]"
          style={{ color: 'var(--muted)' }}
        >
          {comingSoon}
        </span>
      )}
      <span
        className="grid place-items-center"
        style={{
          width: '3rem',
          height: '3rem',
          color: disabled ? 'var(--muted)' : 'var(--primary)',
          ...(isArcade && !disabled ? { filter: 'drop-shadow(0 0 10px var(--primary))' } : {}),
        }}
      >
        <Icon style={{ width: '1.75rem', height: '1.75rem' }} />
      </span>
      <span className="text-base font-bold" style={{ color: disabled ? 'var(--muted)' : 'var(--foreground)' }}>
        {mode.title}
      </span>
      <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--primary)', opacity: disabled ? 0.7 : 1 }}>
        {mode.difficulty}
      </span>
      <span className="text-xs leading-5" style={{ color: 'var(--muted)' }}>
        {mode.desc}
      </span>
    </motion.button>
  );
};

// ─── Hub ────────────────────────────────────────────────────────────────────

const GamblingHub = ({ onSelectMode }) => {
  const { theme } = useTheme();
  const isPink   = theme === 'theme-pink';
  const isArcade = theme === 'theme-arcade';
  const isCozy   = theme === 'theme-cozy';

  const eyebrow   = eyebrowByTheme[theme]   ?? eyebrowByTheme['theme-champagne'];
  const desc      = descByTheme[theme]      ?? descByTheme['theme-champagne'];
  const cardStyle = cardStyleByTheme[theme] ?? cardStyleByTheme['theme-champagne'];
  const iconStyle = iconStyleByTheme[theme] ?? iconStyleByTheme['theme-champagne'];

  return (
    <main
      className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[46rem] items-center justify-center px-[1rem] py-[2.5rem]"
      style={{ color: 'var(--foreground)' }}
    >
      {isArcade && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(255,0,255,0.07) 0%, rgba(0,255,255,0.04) 45%, transparent 80%)' }} />
      )}
      {isCozy && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(205,144,64,0.16) 0%, transparent 72%)' }} />
      )}

      <motion.section
        className="relative w-full overflow-hidden p-[2rem] text-center sm:p-[3rem]"
        style={cardStyle}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          aria-hidden="true"
          style={{ position: 'absolute', bottom: -20, left: -20, width: 120, height: 120, pointerEvents: 'none', color: 'var(--primary)', opacity: isArcade ? 0.13 : 0.08, ...(isArcade ? { filter: 'drop-shadow(0 0 14px var(--primary))' } : {}) }}
          initial={{ opacity: 0, scale: 0.55, rotate: -18 }} animate={{ opacity: isArcade ? 0.13 : 0.08, scale: 1, rotate: 0 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        >
          <DecoIcon Icon={Spade} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, pointerEvents: 'none', color: 'var(--accent)', opacity: isArcade ? 0.13 : 0.08, ...(isArcade ? { filter: 'drop-shadow(0 0 14px var(--accent))' } : {}) }}
          initial={{ opacity: 0, scale: 0.55 }} animate={{ opacity: isArcade ? 0.13 : 0.08, scale: 1 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
        >
          <DecoIcon Icon={Dices} />
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div variants={childVariants} className="mx-auto grid place-items-center" style={{ ...iconStyle, width: '4rem', height: '4rem' }}>
            <Coins style={{ width: '1.75rem', height: '1.75rem' }} />
          </motion.div>

          <motion.p variants={childVariants} className="mt-[1.25rem] text-[0.68rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--primary)' }}>
            {eyebrow}
          </motion.p>

          <motion.div variants={childVariants} className="mt-[0.5rem]">
            {isArcade ? (
              <h1 className="font-serif text-3xl font-medium sm:text-4xl" style={{ color: 'var(--foreground)', textShadow: '0 0 18px var(--primary), 0 0 38px rgba(255,0,255,0.42)' }}>
                <DecryptedText text="Gambling Corner" speed={38} maxIterations={9} sequential revealDirection="start" />
              </h1>
            ) : isPink ? (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <SplitText text="Gambling Corner" delay={44} duration={0.44} ease="backOut" splitType="chars" from={{ opacity: 0, scale: 0.52, y: 18 }} to={{ opacity: 1, scale: 1, y: 0 }} />
              </h1>
            ) : (
              <h1 className="font-serif text-4xl font-medium sm:text-5xl" style={{ color: 'var(--foreground)' }}>
                <BlurText text="Gambling Corner" delay={68} animateBy="words" direction="top" />
              </h1>
            )}
          </motion.div>

          <motion.p
            variants={childVariants}
            className="mx-auto mt-[1rem] max-w-[26rem] text-sm leading-6 sm:text-base"
            style={{ color: 'var(--muted)' }}
          >
            {desc}
          </motion.p>

          <motion.div
            variants={childVariants}
            className="mt-[2rem] flex flex-col gap-[0.875rem] sm:flex-row"
          >
            {MODES.map((mode) => (
              <ModeTile key={mode.id} mode={mode} theme={theme} isArcade={isArcade} onSelectMode={onSelectMode} />
            ))}
          </motion.div>
        </motion.div>
      </motion.section>
    </main>
  );
};

export default GamblingHub;
