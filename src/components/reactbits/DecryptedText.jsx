import { useEffect, useRef, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

export default function DecryptedText({
  text = '',
  speed = 60,
  maxIterations = 12,
  sequential = true,
  revealDirection = 'start',
  className = '',
  style = {},
}) {
  const [displayed, setDisplayed] = useState(() => text.split('').map(() => ' '));
  const [done, setDone] = useState(false);
  const frameRef = useRef(null);
  const resolvedCount = useRef(0);
  const iterCounts = useRef(text.split('').map(() => 0));

  useEffect(() => {
    resolvedCount.current = 0;
    iterCounts.current = text.split('').map(() => 0);
    setDone(false);
    setDisplayed(text.split('').map(() => ' '));

    const chars = text.split('');
    const total = chars.length;
    let frame = 0;

    const tick = () => {
      setDisplayed(prev => {
        const next = [...prev];
        if (sequential) {
          const idx = revealDirection === 'start' ? resolvedCount.current : total - 1 - resolvedCount.current;
          if (resolvedCount.current < total) {
            iterCounts.current[idx]++;
            if (iterCounts.current[idx] >= maxIterations) {
              next[idx] = chars[idx];
              resolvedCount.current++;
            } else {
              next[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
            }
          }
        } else {
          for (let i = 0; i < total; i++) {
            if (next[i] !== chars[i]) {
              iterCounts.current[i]++;
              if (iterCounts.current[i] >= maxIterations) {
                next[i] = chars[i];
              } else {
                next[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
              }
            }
          }
        }
        return next;
      });

      frame++;
      const allDone = sequential
        ? resolvedCount.current >= total
        : iterCounts.current.every((c, i) => c >= maxIterations || text[i] === ' ');

      if (allDone) {
        setDisplayed(chars);
        setDone(true);
      } else {
        frameRef.current = setTimeout(tick, speed);
      }
    };

    frameRef.current = setTimeout(tick, speed);
    return () => clearTimeout(frameRef.current);
  }, [text, speed, maxIterations, sequential, revealDirection]);

  return (
    <span className={className} style={style} aria-label={text}>
      {displayed.map((char, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ display: 'inline-block', minWidth: char === ' ' ? '0.28em' : undefined }}
        >
          {char === ' ' ? ' ' : char}
        </span>
      ))}
    </span>
  );
}
