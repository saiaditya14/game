import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

// Drop-in copy affordance for a room code that already renders inline inside
// some other themed container (a status box, a bare text line, a CSS-class
// pill) — it renders the code plus a tiny icon button and inherits the
// surrounding text's font/color, so it doesn't need its own per-theme
// styling to fit into TicTacToe/QuickMaths/ConnectFour/WordRace/VerbalMemory/
// DrawOff/Monopoly's very different headers. See gambling/TableStatusBar.jsx
// for the equivalent full standalone pill used in Gambling Corner.
const RoomCodeCopy = ({
  code,
  as: Tag = 'span',
  iconSize = '0.85em',
  gap = '0.4em',
  idleColor = 'currentColor',
  copiedColor = 'var(--primary)',
  resetMs = 1600,
  className,
  style,
}) => {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const doCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), resetMs);
  };

  return (
    <Tag
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}
    >
      {code}
      <button
        type="button"
        onClick={doCopy}
        aria-label="Copy room code"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          lineHeight: 0,
          color: copied ? copiedColor : idleColor,
        }}
      >
        {copied ? (
          <Check style={{ width: iconSize, height: iconSize }} />
        ) : (
          <Copy style={{ width: iconSize, height: iconSize }} />
        )}
      </button>
    </Tag>
  );
};

export default RoomCodeCopy;
