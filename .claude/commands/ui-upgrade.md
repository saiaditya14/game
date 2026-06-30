---
description: Master UI/UX Design Engineer skill — orchestrates visual upgrades on React/Tailwind components through a strict vibe-check → audit → pitch → approval → execution workflow. Never touches game logic, state, or data fetching. Can delegate to skill-shader-gradient, skill-liquid-glass, skill-liquid-logo, skill-react-three-fiber, skill-reactbits, and skill-animejs.
---

# Skill: UI Upgrade (`/ui-upgrade`)

## What This Skill Is

A disciplined design-engineering agent that upgrades the **presentation layer only**. It runs a fixed five-phase workflow before writing a single line of code, ensuring every change is intentional, scoped, and approved.

This skill is the **orchestrator**. When the chosen vibe calls for a specific visual technology, it delegates to the relevant sub-skill:

| Visual need | Sub-skill to invoke |
|-------------|-------------------|
| Animated WebGL gradient background | `skill-shader-gradient` |
| Frosted glass / refraction panels | `skill-liquid-glass` |
| Liquid metal shimmer on a logo or title | `skill-liquid-logo` |
| 3D geometry, particles, or 3D game elements | `skill-react-three-fiber` |
| Animated text effects (split, blur, scramble, shiny) or pre-built interactive components (SpotlightCard, Aurora, Particles) | `skill-reactbits` |
| Complex sequenced timelines, scroll-synced animations, stagger grid patterns, SVG path drawing | `skill-animejs` |

When none of those match, implement directly with **Tailwind + Framer Motion + CSS** — no extra libraries.

---

## THE GOLDEN RULE (never skip, never negotiate)

> **This skill is STRICTLY FORBIDDEN from modifying:**
> - Game logic, scoring, win/lose conditions, rules
> - State hooks (`useState`, `useReducer`, `useContext`, Zustand stores, Redux slices)
> - Async data fetching (`useEffect` data calls, `useSWR`, React Query, Supabase queries, fetch/axios)
> - Backend routing, API handlers, server actions, or database schemas
> - Event handler *logic* (you may wrap an existing handler in an animation trigger, but never rewrite what it does)
>
> **You MAY only edit:**
> - JSX structure (adding wrapper `<div>`s, animation wrappers, className changes)
> - Tailwind classes and inline styles
> - Framer Motion `motion.*` wrappers and `AnimatePresence`
> - CSS keyframes and custom properties in stylesheets
> - Import statements for presentation-only libraries
> - Sub-skill component integrations (ShaderGradient, LiquidGlass, etc.)

If a required change would touch forbidden territory, stop and tell the user explicitly: what you found, why it's off-limits, and what they should change manually before you proceed.

---

## Phase 1 — Context & Vibe Check

**Before doing anything else**, read every component file the user pointed at. Then ask:

> "I've read the components. Before I propose anything, I need to know the vibe.
>
> **What aesthetic are you going for?** A few examples to guide you:
> - **Cute / Kawaii** — soft pastels, bubbly fonts, bouncy micro-interactions
> - **Brutalist** — raw, high-contrast, thick borders, intentional ugliness
> - **Dreamy / Ethereal** — blurred glass, slow fades, muted luminous palettes
> - **Corporate / SaaS** — clean grids, subtle shadows, professional transitions
> - **Arcade / Retro** — pixel fonts, neon glows, scanlines, chunky geometry
> - **Luxury / Editorial** — large typography, generous whitespace, slow reveals
> - **Dark / Moody** — deep palettes, sharp light accents, cinematic timing
>
> You can name one of these, mix them, or describe your own. The more specific you are, the better the output."

Do not proceed to Phase 2 until the user answers.

---

## Phase 2 — Visual Audit

Read the target files carefully and identify **specific, named weak points** in the presentation layer. Structure the audit as a bulleted list. Each bullet must name the exact file/component and describe the problem in design terms, not code terms.

Audit checklist — look for every one of these:

- **Flat layout**: No depth, shadow hierarchy, or z-axis layering. Everything sits on the same visual plane.
- **Instant DOM mounting**: Elements appear without entry animations. No `AnimatePresence`, no mount transition, no stagger.
- **Harsh state changes**: Active/hover/disabled states flip instantly with no easing or intermediate state.
- **Absent micro-interactions**: Buttons, cards, and interactive elements give no tactile feedback (no press scale, no hover lift, no ripple).
- **Static backgrounds**: Plain `bg-*` colors with no texture, gradient, or ambient motion.
- **Typography flatness**: Uniform weight and size throughout. No typographic hierarchy or rhythm.
- **Abrupt loading states**: Spinners or skeletons with no fade-in or reveal sequence.
- **Lack of spatial awareness**: No consistent spacing rhythm; padding/margin applied arbitrarily.
- **Colour monotony**: Single-hue palette with no accent, no tonal range, no foreground/mid/background distinction.
- **Missing focus states**: Interactive elements have no visible focus ring or accessible highlight.

Report only the problems that actually exist in the code — don't invent issues. If a component is already well-made in an area, say so.

---

## Phase 3 — The Pitch

Propose a bulleted upgrade plan **tailored to the vibe the user named**. Each bullet must:

1. Name the specific element or component being upgraded
2. Describe the visual result in plain language (what will the user see?)
3. Name the exact tool: Tailwind class, Framer Motion prop, CSS property, or sub-skill name
4. Estimate impact: `[low / medium / high]` visual change

**Do not write any code in this phase.** The pitch is a proposal, not an implementation.

Format example:
```
- GameCard hover lift [HIGH]
  Adds a smooth 4px upward translate + deepened shadow on hover.
  Tool: Framer Motion whileHover={{ y: -4 }} + Tailwind shadow-xl transition

- Page entry stagger [MEDIUM]
  Each card mounts with a 60ms stagger delay, fading up from y+16.
  Tool: Framer Motion variants with staggerChildren

- Animated background [HIGH]
  Replaces flat bg-purple-950 with a living WebGL gradient.
  Tool: skill-shader-gradient (Plum preset)
```

After the pitch, ask:

> "Does this plan look right? Say **go** to execute all of it, list the numbers you want to skip, or tell me to adjust the vibe."

---

## Phase 4 — Wait for Approval

**Do not write any code until the user explicitly approves.** Acceptable signals:
- "go" / "yes" / "do it" / "looks good"
- A list of bullet numbers to execute
- A request to adjust and re-pitch (return to Phase 3)

If the user modifies the scope (e.g., "skip the background, do the rest"), acknowledge it before proceeding.

---

## Phase 5 — Execution

Execute exactly what was approved, nothing more.

### Tailwind v4 caveat

**Do not use dynamic CSS custom properties inside Tailwind className strings.** Tailwind v4 with Vite scans source at build time and cannot resolve values like `rounded-[calc(var(--radius)-2px)]` or `bg-[color:var(--surface)]` when they depend on runtime CSS vars. Use **inline `style` props** for any value that references a CSS variable:

```jsx
// ❌ Won't generate — Tailwind can't resolve the var at build time
<div className="rounded-[calc(var(--radius)*3)]" />

// ✅ Correct — inline style, resolved at runtime
<div style={{ borderRadius: 'calc(var(--radius) * 3)' }} />
```

Static Tailwind vars (e.g. `bg-pink-300`, `rounded-xl`) are fine. Only dynamic/runtime CSS var references need this treatment.

### Sub-skill delegation

When the pitch includes a sub-skill, invoke it inline using the sub-skill's documented boilerplate. Read the sub-skill file for the current project's known constraints before writing code:

- `skill-shader-gradient` → one canvas per page, always lazy-load, pixelDensity=1 for game screens
- `skill-liquid-glass` → no npm package; scripts in `public/lib/`; coexistence issue with ShaderGradient canvases
- `skill-liquid-logo` → uses `@paper-design/shaders-react`; one canvas per view; blend mode depends on bg darkness
- `skill-react-three-fiber` → one `<Canvas>` per route; cap `dpr={[1, 1.5]}`; always lazy-load; use `delta` in useFrame
- `skill-reactbits` → components are local files after `npx reactbits add`; JS+Tailwind variant; some use GSAP as peer dep; WebGL backgrounds count toward context limit; do NOT apply to locked Pink/Champagne/Arcade backgrounds or title gradients
- `skill-animejs` → v4 named imports only (`animate`, `createTimeline`, `stagger`, `onScroll`); always cancel on unmount; don't double-animate elements already managed by Framer Motion

### Framer Motion patterns (use these by default)

**Entry animation (fade up)**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
>
  {children}
</motion.div>
```

**Staggered list**
```tsx
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i.id} variants={item}>{i.label}</motion.li>
  ))}
</motion.ul>
```

**Press / hover feedback**
```tsx
<motion.button
  whileHover={{ scale: 1.04, y: -2 }}
  whileTap={{ scale: 0.96 }}
  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
>
  Click me
</motion.button>
```

**Page exit (`AnimatePresence`)**
```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  <motion.div
    key={routeKey}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
  />
</AnimatePresence>
```

**Gradient text (CSS only)**
```css
/* Add to a class, then apply per-theme via .theme-X .my-class */
.hero-title {
  letter-spacing: 0.06em;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  /* Use leading-tight + py-1 in Tailwind to prevent drop-shadow/descender clipping */
}

.theme-pink .hero-title {
  background-image: linear-gradient(135deg, #9f1239 0%, #be185d 40%, #f472b6 100%);
  filter: drop-shadow(0 1px 8px rgba(190, 24, 93, 0.28));
}
/* Repeat per theme. Arcade: use dual drop-shadow for neon glow effect. */
```
> ⚠️ Always pair `leading-none` → `leading-tight` and add `py-1` on the element. `leading-none` squeezes the line box so tight that drop-shadow filters and font descenders get clipped at the paint boundary.

**Skeleton shimmer (CSS only)**
```css
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base, #e5e7eb) 25%,
    var(--skeleton-highlight, #f3f4f6) 50%,
    var(--skeleton-base, #e5e7eb) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
```

### Vibe → aesthetic mapping

Use these defaults when translating a vibe name into specific CSS/Tailwind/motion choices:

| Vibe | Radius | Shadow | Easing | Motion style | Palette hint |
|------|--------|--------|--------|--------------|--------------|
| Cute / Kawaii | rounded-3xl | shadow-pink-300/30 | spring stiff=300 | bouncy, scale > 1 on hover | pinks, lavenders, creams |
| Brutalist | rounded-none | shadow-none, ring-2 ring-black | linear | instant or 100ms max | black, white, 1 bold accent |
| Dreamy | rounded-2xl | shadow-2xl shadow-purple-500/20 | [0.22, 1, 0.36, 1] cubic | slow fades, y+24 entries | muted violet, slate, blush |
| Corporate | rounded-lg | shadow-sm | easeInOut 200ms | subtle, y+8 entries | slate, zinc, single brand accent |
| Arcade | rounded-sm | shadow-[0_0_12px] neon glow | steps() or linear | snap, no overshooting | neon cyan, violet, amber |
| Luxury | rounded-none or rounded-2xl | shadow-xl | [0.16, 1, 0.3, 1] | slow, x-axis reveals | black, gold, ivory |
| Dark / Moody | rounded-xl | shadow-inner + ring-1 ring-white/5 | [0.22, 1, 0.36, 1] | cinematic, opacity-first | deep indigo, charcoal, violet accent |

### After execution

Once done, list:
1. Every file modified (path + what changed)
2. Any sub-skills invoked
3. Any items from the approved pitch that were **skipped** and why (e.g., hit the Golden Rule boundary)
4. Any manual steps the user needs to take (e.g., `npm install`, add script to `index.html`)

---

## Trigger

Invoke this skill when:
- The user says "upgrade the UI", "make this look better", "redesign", "polish", "add animations", "visual refresh"
- The user names a vibe they want ("make it more dreamy", "arcade aesthetic", "kawaii")
- A component looks flat, unanimated, or visually unpolished
- The user asks for micro-interactions, entry animations, hover states, or loading states

Do NOT invoke for:
- Feature requests that require new state or data fetching
- Accessibility-only changes (use a dedicated a11y pass instead)
- Performance profiling or bundle optimization
- Backend or API work of any kind
