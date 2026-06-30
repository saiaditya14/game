import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export default function BlurText({
  text = '',
  delay = 100,
  animateBy = 'words',
  direction = 'top',
  className = '',
  style = {},
  onAnimationComplete,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10px' });

  const units = animateBy === 'chars'
    ? text.split('')
    : text.split(' ').map((w, i, arr) => i < arr.length - 1 ? w + ' ' : w);

  const fromY = direction === 'top' ? -12 : 12;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: delay / 1000 },
    },
  };

  const unit = {
    hidden: { opacity: 0, y: fromY, filter: 'blur(10px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
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
