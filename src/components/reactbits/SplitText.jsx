import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function SplitText({
  text = '',
  delay = 60,
  duration = 0.5,
  ease = 'backOut',
  splitType = 'chars',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  className = '',
  style = {},
  onAnimationComplete,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10px' });

  const units = splitType === 'chars'
    ? text.split('')
    : text.split(' ').map((w, i, arr) => i < arr.length - 1 ? w + ' ' : w);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: delay / 1000 },
    },
  };

  const unit = {
    hidden: from,
    show: {
      ...to,
      transition: { duration, ease },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      variants={container}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      onAnimationComplete={onAnimationComplete}
      aria-label={text}
    >
      {units.map((unit_text, i) => (
        <motion.span
          key={i}
          variants={unit}
          aria-hidden="true"
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {unit_text}
        </motion.span>
      ))}
    </motion.span>
  );
}
