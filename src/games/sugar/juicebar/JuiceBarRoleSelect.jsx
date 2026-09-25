import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Blender } from 'lucide-react';
import { useTheme } from '../../../components/ThemeProvider';
import RoomCodeCopy from '../../../components/RoomCodeCopy';

// Tailwind's preflight reset is not active in this project, so `box-sizing` is
// content-box everywhere, and the spacing scale generates no CSS at all. Any box
// combining padding with a size constraint needs border-box + real values.
const BORDER_BOX = { boxSizing: 'border-box' };

const shellStyle = {
  ...BORDER_BOX,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 'calc(100vh - 5rem)',
  marginInline: 'auto',
  width: '100%',
  maxWidth: 'min(64rem, 100%)',
  paddingInline: 'clamp(1rem, 4vw, 2.5rem)',
  paddingBlock: 'clamp(1.5rem, 4vh, 2.5rem)',
  color: 'var(--foreground)',
};

const cardStyle = {
  ...BORDER_BOX,
  marginInline: 'auto',
  width: '100%',
  maxWidth: '34rem',
  padding: 'clamp(1.75rem, 4vw, 2.75rem)',
  textAlign: 'center',
  border: '1px solid var(--ring)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface)',
  boxShadow: 'var(--shadow)',
};

const RoomCode = ({ code, glow }) => (
  <div
    style={{
      ...BORDER_BOX,
      marginTop: '1.75rem',
      paddingBlock: '0.85rem',
      paddingInline: '1rem',
      textAlign: 'center',
      fontSize: '0.72rem',
      fontWeight: 700,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      border: '1px solid var(--divider)',
      borderRadius: 'var(--radius)',
      background: 'var(--surface-strong)',
      color: 'var(--muted)',
    }}
  >
    Room code{' '}
    <RoomCodeCopy
      code={code}
      idleColor="var(--primary)"
      style={{
        marginLeft: '0.75rem',
        fontSize: '1.15rem',
        letterSpacing: '0.22em',
        color: 'var(--primary)',
        filter: glow('var(--primary)', '8px'),
      }}
    />
  </div>
);

const JuiceBarRoleSelect = ({ onSelectRole, room, playerId, isCreator }) => {
  const isPrepTaken = room.prep_id && room.prep_id !== playerId;
  const isBlendTaken = room.blend_id && room.blend_id !== playerId;

  const myRole = room.prep_id === playerId ? 'prep' : room.blend_id === playerId ? 'blend' : null;

  const { theme } = useTheme();
  const isArcade = theme === 'theme-arcade';
  const glow = (color, strength) => (isArcade ? `drop-shadow(0 0 ${strength} ${color})` : 'none');

  const headingStyle = {
    fontSize: 'clamp(1.6rem, 1.35rem + 1.1vw, 2.25rem)',
    lineHeight: 1.2,
    color: 'var(--foreground)',
  };

  if (!myRole && !isCreator) {
    return (
      <main style={shellStyle}>
        <motion.div
          style={cardStyle}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-serif font-bold" style={headingStyle}>
            Waiting for host...
          </h1>
          <p style={{ marginTop: '0.85rem', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--muted)' }}>
            The person who created the room is picking a role.
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted)', opacity: 0.85 }}>
            You will automatically join as the remaining role.
          </p>
        </motion.div>
      </main>
    );
  }

  if (myRole) {
    return (
      <main style={shellStyle}>
        <motion.div
          style={cardStyle}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            style={{
              ...BORDER_BOX,
              display: 'grid',
              placeItems: 'center',
              width: '3.75rem',
              height: '3.75rem',
              marginInline: 'auto',
              marginBottom: '1.25rem',
              border: '1px solid var(--accent)',
              borderRadius: 'calc(var(--radius) + 0.35rem)',
              background: 'var(--surface-strong)',
              color: 'var(--accent)',
              filter: glow('var(--accent)', '10px'),
            }}
          >
            {myRole === 'prep' ? <ChefHat className="h-7 w-7" /> : <Blender className="h-7 w-7" />}
          </div>

          <h1 className="font-serif font-bold" style={headingStyle}>
            Waiting for partner...
          </h1>

          <p style={{ marginTop: '0.85rem', fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--muted)' }}>
            You are working the{' '}
            <span className="font-bold" style={{ textTransform: 'capitalize', color: 'var(--accent)' }}>
              {myRole === 'prep' ? 'Prep Station' : 'Blend Station'}
            </span>
            .
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted)', opacity: 0.85 }}>
            Waiting for someone else to join and pick the remaining role.
          </p>

          <RoomCode code={room.code} glow={glow} />
        </motion.div>
      </main>
    );
  }

  const ROLES = [
    {
      id: 'prep',
      label: 'Prep Station',
      blurb: "You'll chop whatever your partner calls out — you can't see the order.",
      icon: ChefHat,
      accent: 'var(--accent)',
      taken: isPrepTaken,
    },
    {
      id: 'blend',
      label: 'Blend Station',
      blurb: "You hold the order. Call out the combo, then blend and top it right.",
      icon: Blender,
      accent: 'var(--primary)',
      taken: isBlendTaken,
    },
  ];

  return (
    <main style={shellStyle}>
      <motion.div
        style={{ textAlign: 'center', marginBottom: 'clamp(1.75rem, 4vh, 2.75rem)' }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="font-serif font-bold"
          style={{
            fontSize: 'clamp(1.9rem, 1.5rem + 1.8vw, 2.9rem)',
            lineHeight: 1.15,
            color: 'var(--foreground)',
            filter: glow('var(--foreground)', '10px'),
          }}
        >
          Choose your station
        </h1>
        <p style={{ marginTop: '0.7rem', fontSize: '0.95rem', color: 'var(--muted)' }}>Who's prepping, who's blending?</p>
      </motion.div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
          gap: 'clamp(1rem, 2.2vw, 1.5rem)',
          width: '100%',
          maxWidth: '44rem',
        }}
      >
        {ROLES.map((role, i) => (
          <motion.button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            disabled={role.taken}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
            whileHover={role.taken ? undefined : { y: -6 }}
            whileTap={role.taken ? undefined : { scale: 0.985 }}
            className="transition disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]"
            style={{
              ...BORDER_BOX,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflow: 'hidden',
              padding: 'clamp(1.5rem, 3vw, 2.25rem)',
              textAlign: 'center',
              border: '1px solid var(--ring)',
              borderRadius: 'var(--radius)',
              background: 'var(--surface)',
              boxShadow: 'var(--shadow)',
              opacity: role.taken ? 0.5 : 1,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: role.accent,
                opacity: isArcade ? 0.9 : 0.65,
              }}
            />

            {role.taken && (
              <span
                className="font-bold uppercase"
                style={{
                  position: 'absolute',
                  top: '0.85rem',
                  right: '0.85rem',
                  fontSize: '0.55rem',
                  letterSpacing: '0.16em',
                  color: role.accent,
                }}
              >
                Taken
              </span>
            )}

            <div
              style={{
                ...BORDER_BOX,
                display: 'grid',
                placeItems: 'center',
                width: '3.75rem',
                height: '3.75rem',
                marginBottom: '1.25rem',
                border: `1px solid ${role.accent}`,
                borderRadius: 'calc(var(--radius) + 0.35rem)',
                background: 'var(--surface-strong)',
                color: role.accent,
                filter: glow(role.accent, '10px'),
              }}
            >
              <role.icon className="h-7 w-7" />
            </div>

            <h2
              className="font-serif font-bold"
              style={{ fontSize: 'clamp(1.3rem, 1.15rem + 0.6vw, 1.7rem)', lineHeight: 1.2, color: 'var(--foreground)' }}
            >
              {role.label}
            </h2>

            <p style={{ marginTop: '0.7rem', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--muted)' }}>
              {role.blurb}
            </p>
          </motion.button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '34rem' }}>
        <RoomCode code={room.code} glow={glow} />
      </div>
    </main>
  );
};

export default JuiceBarRoleSelect;
