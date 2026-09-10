export const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

export const childVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } },
};

export const DecoIcon = ({ Icon, className = '' }) => (
  <Icon className={className} aria-hidden="true" style={{ width: '100%', height: '100%' }} />
);
