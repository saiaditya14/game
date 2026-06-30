---
description: Anime.js v4 skill — imperative JavaScript animation engine (24.5KB). Use when adding complex sequenced timelines, scroll-triggered animations, staggered grid effects, SVG drawing/morphing, or text scramble that Framer Motion can't express cleanly.
---

# Skill: Anime.js v4

## Trigger

Use this skill when:
- You need **timeline-sequenced animations** — step A finishes, then B starts, then C and D in parallel
- You need **scroll-triggered animations** that sync position to scroll offset (not just trigger-on-enter)
- You need **stagger with grid patterns** — elements animate outward from a centre point, or in a wave
- You need **SVG path drawing** — lines animate as if being drawn
- You need **text scramble / character-level sequencing** that's more controlled than ReactBits DecryptedText
- Framer Motion variants feel too declarative for what you're orchestrating

Do NOT use for simple entry animations, hover states, or press feedback — Framer Motion is already installed and is simpler for those cases. Anime.js and Framer Motion coexist fine; use each where it's strongest.

---

## Installation

```bash
npm install animejs
```

24.5KB core. Tree-shakeable — import only what you use.

---

## Core API (v4)

### Basic animation

```js
import { animate } from 'animejs';

animate('.my-element', {
  translateY: [-20, 0],
  opacity: [0, 1],
  duration: 600,
  delay: 100,
  ease: 'outExpo',
});
```

### Animate a ref in React

```jsx
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

function MyComponent() {
  const ref = useRef(null);

  useEffect(() => {
    animate(ref.current, {
      translateY: [-24, 0],
      opacity: [0, 1],
      duration: 700,
      ease: 'outQuart',
    });
  }, []);

  return <div ref={ref}>Hello</div>;
}
```

### Timeline — sequenced steps

```js
import { createTimeline } from 'animejs';

const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 500 } });

tl
  .add('.title',    { opacity: [0, 1], translateY: [-20, 0] })
  .add('.subtitle', { opacity: [0, 1], translateY: [-12, 0] }, '+=100')  // 100ms after prev ends
  .add('.divider',  { scaleX: [0, 1], opacity: [0, 1] },      '+=60')
  .add('.cards',    { opacity: [0, 1], translateY: [16, 0] },  '<200');   // 200ms after divider starts
```

### Stagger — cascading delays

```js
import { animate, stagger } from 'animejs';

// Simple stagger — 60ms between each element
animate('.card', {
  opacity: [0, 1],
  translateY: [16, 0],
  delay: stagger(60),
  duration: 400,
  ease: 'outQuart',
});

// Grid stagger — radiates outward from centre
animate('.grid-cell', {
  scale: [0.8, 1],
  opacity: [0, 1],
  delay: stagger(40, { grid: [4, 3], from: 'centre' }),
  duration: 500,
});

// Stagger with random spread
animate('.star', {
  opacity: [0, 1],
  delay: stagger([0, 300]),  // random 0–300ms per element
});
```

### Scroll-triggered animation

```js
import { animate, onScroll } from 'animejs';

animate('.section', {
  opacity: [0, 1],
  translateY: [32, 0],
  duration: 800,
  ease: 'outQuart',
  autoplay: onScroll({
    target: '.section',
    enter: 'bottom-=100 top',   // trigger when bottom of viewport is 100px above element top
  }),
});
```

### Scroll-synced (scrub) animation

```js
import { animate, onScroll } from 'animejs';

// Animation plays/reverses in sync with scroll position
animate('.parallax-el', {
  translateY: [0, -80],
  autoplay: onScroll({
    sync: 0.8,           // 0 = instant, 1 = fully scrubbed
    container: 'body',
  }),
});
```

### SVG path drawing

```js
import { animate, createDrawable } from 'animejs';

animate(createDrawable('path#my-path'), {
  draw: ['0% 0%', '0% 100%'],   // start empty, draw to full length
  duration: 1200,
  ease: 'inOutQuart',
});
```

### Text scramble (character-level)

```js
import { animate, createScope, stagger } from 'animejs';

// Split text into spans first (in JSX), then animate each span
animate('.hero-char', {
  opacity: [0, 1],
  translateY: ['-0.5em', 0],
  delay: stagger(40, { start: 200 }),
  duration: 500,
  ease: 'outBack(1.5)',
});
```

---

## Easing Reference

```js
// Built-in named eases
ease: 'linear'
ease: 'inOutQuad'
ease: 'outExpo'
ease: 'outQuart'
ease: 'outBack(1.7)'    // overshoot — good for bouncy/kawaii
ease: 'outElastic(1, 0.5)'  // elastic spring

// Spring physics
ease: 'spring(mass, stiffness, damping, velocity)'
ease: 'spring(1, 80, 10, 0)'

// Steps (arcade / pixel feel)
ease: 'steps(8)'
```

---

## React Integration Patterns

### Pattern 1: useEffect + ref (single element)

```jsx
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

function AnimatedTitle({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [-16, 0],
      duration: 600,
      ease: 'outExpo',
    });
  }, []);

  return <h1 ref={ref}>{children}</h1>;
}
```

### Pattern 2: Timeline on mount (multi-element sequence)

```jsx
import { useEffect } from 'react';
import { createTimeline } from 'animejs';

function HeroSection() {
  useEffect(() => {
    const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 550 } });
    tl
      .add('[data-anime="title"]',    { opacity: [0, 1], translateY: [-20, 0] })
      .add('[data-anime="subtitle"]', { opacity: [0, 1], translateY: [-12, 0] }, '+=80')
      .add('[data-anime="divider"]',  { scaleX: [0, 1] }, '+=40')
      .add('[data-anime="cards"]',    { opacity: [0, 1], translateY: [16, 0] }, '+=100');
  }, []);

  return (
    <>
      <h1 data-anime="title">Lovelyland</h1>
      <p data-anime="subtitle">…</p>
      <div data-anime="divider" />
      <div data-anime="cards">…</div>
    </>
  );
}
```

### Pattern 3: Scroll-triggered on section enter

```jsx
import { useEffect, useRef } from 'react';
import { animate, onScroll } from 'animejs';

function GameSection({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const anim = animate(el.querySelectorAll('.game-card'), {
      opacity: [0, 1],
      translateY: [20, 0],
      delay: stagger(70),
      duration: 400,
      ease: 'outQuart',
      autoplay: onScroll({ target: el, enter: 'bottom top+=80' }),
    });
    return () => anim.cancel();
  }, []);

  return <section ref={ref}>{children}</section>;
}
```

---

## Constraints

1. **Imperative, not declarative** — Anime.js uses `useEffect` + DOM refs, not JSX props. Keep animation code in effects, not in render.
2. **Always cancel on unmount** — `animate()` returns an animation object with a `.cancel()` method. Return it from `useEffect` cleanup to avoid memory leaks and animations firing on unmounted components.
3. **Don't fight Framer Motion** — if an element already has Framer Motion applied (`motion.div` with variants), don't also anime.js animate it. Pick one per element.
4. **Tailwind classes are fine** — anime.js targets DOM elements directly. Tailwind classes on the element don't interfere.
5. **v4 API is different from v3** — `anime()` (v3 default export) is gone. Use named exports: `animate`, `createTimeline`, `stagger`, `onScroll`. Don't copy v3 examples from the internet.
6. **No SSR** — anime.js is browser-only. Safe in this Vite SPA, but never import at module top level on any file that might run server-side.

---

## Lovelyland Vibe Presets

### Champagne — Luxury sequential hero entrance
```js
const tl = createTimeline({ defaults: { ease: 'outQuart', duration: 700 } });
tl
  .add('[data-anime="title"]',    { opacity: [0, 1], translateY: [-8, 0], letterSpacing: ['0.12em', '0.06em'] })
  .add('[data-anime="subtitle"]', { opacity: [0, 1] }, '+=120')
  .add('[data-anime="divider"]',  { scaleX: [0, 1], opacity: [0, 0.6] }, '+=80');
```

### Arcade — Glitchy stagger card entrance
```js
animate('.game-card', {
  opacity: [0, 1],
  translateX: [stagger([-8, 8]), 0],
  delay: stagger(50),
  duration: 300,
  ease: 'steps(4)',   // stepped easing for pixel feel
});
```

### Pink — Bouncy stagger entrance
```js
animate('.game-card', {
  opacity: [0, 1],
  scale: [0.88, 1],
  delay: stagger(60, { start: 200 }),
  duration: 500,
  ease: 'outBack(1.6)',
});
```

### Cozy — Slow dreamy fade-up sequence
```js
const tl = createTimeline({ defaults: { ease: 'outSine', duration: 900 } });
tl
  .add('[data-anime="title"]',    { opacity: [0, 1], translateY: [-6, 0] })
  .add('[data-anime="subtitle"]', { opacity: [0, 0.85] }, '+=200')
  .add('[data-anime="cards"]',    { opacity: [0, 1], translateY: [12, 0] }, '+=300');
```
