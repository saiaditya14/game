// Seeded deterministic question generator — mulberry32 PRNG
// Both players derive identical questions from the shared room seed.

function mulberry32(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s += 0x6D2B79F5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed() {
  return (Math.random() * 0xFFFFFFFF) >>> 0;
}

// Number ranges per size
const RANGES = {
  small:  [2, 12],
  medium: [10, 50],
  large:  [25, 100],
};

// Available ops per setting
const OP_SETS = {
  add_sub:     ['+', '−'],
  add_sub_mul: ['+', '−', '×'],
  all:         ['+', '−', '×', '÷'],
};

function buildQuestion(int, numberSize, operations, operandCount) {
  const [lo, hi] = RANGES[numberSize] ?? RANGES.small;
  const n = (a = lo, b = hi) => int(b - a + 1) + a;
  const opSet = OP_SETS[operations] ?? OP_SETS.add_sub;
  const pickOp = () => opSet[int(opSet.length)];

  // ── 2-operand: all ops including clean division ──────────────────────────
  if (operandCount === 2) {
    const op = pickOp();
    if (op === '+') {
      const a = n(), b = n();
      return { expr: `${a} + ${b}`, answer: a + b };
    }
    if (op === '−') {
      const a = n(), b = n();
      const [x, y] = a >= b ? [a, b] : [b, a];
      return { expr: `${x} − ${y}`, answer: x - y };
    }
    if (op === '×') {
      const a = n(), b = n();
      return { expr: `${a} × ${b}`, answer: a * b };
    }
    // ÷ — generate as (b × c) ÷ b = c
    const b = n(2, Math.min(12, hi));  // divisor ≤ 12
    const c = n(2, Math.max(12, lo));  // quotient
    return { expr: `${b * c} ÷ ${b}`, answer: c };
  }

  // ── Chain (3–4 operands): + − × only, no division in chains ─────────────
  const chainOps = opSet.filter(o => o !== '÷');
  const pickChain = () => chainOps.length ? chainOps[int(chainOps.length)] : '+';
  // Cap multipliers in chains so answers don't explode
  const mulCap = Math.min(12, hi);

  const nums = [];
  const ops  = [];
  let result = n();
  nums.push(result);

  for (let i = 1; i < operandCount; i++) {
    const op = pickChain();
    ops.push(op);

    if (op === '×') {
      const b = n(2, mulCap);
      nums.push(b);
      result *= b;
    } else if (op === '−') {
      // Stay positive: subtract at most result-1
      if (result <= 1) {
        // Fallback to +
        ops[ops.length - 1] = '+';
        const b = n();
        nums.push(b);
        result += b;
      } else {
        const b = n(1, result - 1);
        nums.push(b);
        result -= b;
      }
    } else {
      const b = n();
      nums.push(b);
      result += b;
    }
  }

  let expr = String(nums[0]);
  for (let i = 0; i < ops.length; i++) expr += ` ${ops[i]} ${nums[i + 1]}`;
  return { expr, answer: result };
}

/**
 * Returns `config.totalRounds` question objects.
 * config: { totalRounds, numberSize, operations, operandCount }
 */
export function generateQuestions(seed, config = {}) {
  const {
    totalRounds  = 10,
    numberSize   = 'small',
    operations   = 'add_sub',
    operandCount = 2,
  } = config;

  const rand = mulberry32(seed);
  const int  = (max) => Math.floor(rand() * max);

  return Array.from({ length: totalRounds }, (_, i) => ({
    ...buildQuestion(int, numberSize, operations, operandCount),
    round: i + 1,
  }));
}
