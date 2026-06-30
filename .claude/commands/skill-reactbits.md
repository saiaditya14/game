---
description: ReactBits skill — 130+ animated React UI components (text effects, backgrounds, interactive elements). Use when adding SplitText, ShinyText, Aurora, Particles, SpotlightCard, or other pre-built animated components to Lovelyland.
---

# Skill: ReactBits

## Trigger

Use this skill when:
- Adding **animated text effects** — letter-by-letter reveals, blur-in, scramble, shiny shimmer, gradient text
- Adding **animated backgrounds** — Aurora, Silk, Particles, Orb, Hyperspeed, LetterGlitch
- Adding **interactive UI components** — SpotlightCard, TiltCard, MagneticButton, AnimatedList
- The user asks for "split text animation", "text scramble", "aurora background", "spotlight card", "shiny text", "particles background"

Do NOT use when Framer Motion already covers the need (simple fade/slide/stagger). ReactBits is for effects that would take significant custom work to build from scratch.

---

## Installation

ReactBits is **not an npm package** — components are copied into your project as local files via CLI. Each component becomes source code you own and can edit.

```bash
# Add a specific component (JS + Tailwind variant)
npx reactbits@latest add ComponentName

# Examples:
npx reactbits@latest add SplitText
npx reactbits@latest add Aurora
npx reactbits@latest add SpotlightCard
npx reactbits@latest add ShinyText
npx reactbits@latest add DecryptedText
```

Components are placed in `src/components/reactbits/` by default. Import from there.

**This project uses JS + Tailwind** — always pick the JavaScript + Tailwind variant when prompted.

---

## Component Catalogue (Lovelyland-relevant)

### Text Animations

| Component | What it does |
|-----------|-------------|
| `SplitText` | Reveals text letter-by-letter or word-by-word with configurable delay and easing |
| `BlurText` | Text fades in from a blurred state, letter by letter |
| `ShinyText` | Animated light shimmer passes across static text |
| `GradientText` | Animated gradient that moves through the text |
| `FuzzyText` | Text has a fuzzy/glitchy hover effect |
| `DecryptedText` | Scrambles random characters then resolves to the real text (hacker-style) |
| `RotatingText` | Cycles through a list of words with a rotation/flip animation |
| `CountUp` | Numbers animate upward to their final value |
| `TextPressure` | Font weight changes based on cursor proximity |
| `ScrambleText` | Characters randomise on hover then resolve |

### Backgrounds

| Component | What it does |
|-----------|-------------|
| `Aurora` | Smooth colour-shifting aurora borealis effect (WebGL) |
| `Particles` | Floating particle field — configurable density, colour, movement |
| `Silk` | Fluid silky gradient that slowly morphs |
| `Orb` | Single glowing ambient orb with drift animation |
| `Hyperspeed` | Star-warp / hyperspace speed lines (strong arcade energy) |
| `LetterGlitch` | Text-based glitch effect suitable for dark backgrounds |
| `GridDistortion` | Warping grid mesh that reacts to mouse |

### Interactive Components

| Component | What it does |
|-----------|-------------|
| `SpotlightCard` | Card with a radial light that follows the cursor |
| `TiltCard` | Card that tilts in 3D toward the cursor with parallax |
| `MagneticButton` | Button that magnetically attracts toward the cursor |
| `AnimatedList` | List items animate in with stagger on mount |
| `Dock` | macOS-style dock with magnification on hover |

---

## Usage Pattern in React

```jsx
// After: npx reactbits@latest add SplitText
import SplitText from '../components/reactbits/SplitText';

<SplitText
  text="Lovelyland"
  delay={80}           // ms between each character
  duration={0.6}       // seconds per character animation
  ease="power3.out"    // easing function
  splitType="chars"    // 'chars' | 'words' | 'lines'
  from={{ opacity: 0, y: 20 }}
  to={{ opacity: 1, y: 0 }}
  className="hero-title"
/>
```

```jsx
// After: npx reactbits@latest add Aurora
import Aurora from '../components/reactbits/Aurora';

<Aurora
  colorStops={['#7c3aed', '#06b6d4', '#000000']}
  speed={0.4}
  amplitude={1.2}
  className="fixed inset-0 -z-10"
/>
```

```jsx
// After: npx reactbits@latest add SpotlightCard
import SpotlightCard from '../components/reactbits/SpotlightCard';

<SpotlightCard
  spotlightColor="rgba(139, 92, 246, 0.15)"
  className="rounded-xl p-6"
>
  {cardContent}
</SpotlightCard>
```

---

## Constraints

1. **Components are local source files** — after `npx reactbits add`, the file is yours to edit. Customise freely.
2. **Some components use GSAP internally** — SplitText in particular. Check if the component pulls in `gsap` as a peer dependency and install it if prompted.
3. **Background components that use WebGL count toward the browser WebGL context limit.** Aurora, GridDistortion, and Silk create WebGL contexts. Do not combine with ShaderGradient or R3F on the same route without checking the total context count (iOS Safari caps at 8).
4. **Tailwind v4 caveat** — if a copied component uses Tailwind classes with CSS variables inside `className`, move those to inline `style` props (Tailwind v4 Vite can't scan runtime vars).
5. **Do not use for locked themes** — Pink, Champagne, and Arcade backgrounds/title gradients are locked. ReactBits text effects may be applied to title entry animations if they don't conflict with the existing gradient treatment.

---

## Lovelyland Vibe Presets

### Arcade — DecryptedText title entrance
```jsx
<DecryptedText
  text="Lovelyland"
  speed={60}
  maxIterations={12}
  sequential
  revealDirection="start"
  className="hero-title"
/>
```

### Arcade — Hyperspeed background (replaces or layers behind video)
```jsx
<Hyperspeed
  effectOptions={{ starCount: 600, starColor: '#a855f7', speed: 1.2 }}
  className="fixed inset-0 -z-10"
/>
```

### Pink — SplitText title entrance
```jsx
<SplitText
  text="Lovelyland"
  delay={60}
  duration={0.5}
  ease="back.out(1.4)"
  splitType="chars"
  from={{ opacity: 0, scale: 0.7, y: 12 }}
  to={{ opacity: 1, scale: 1, y: 0 }}
  className="hero-title"
/>
```

### Cozy — BlurText title entrance
```jsx
<BlurText
  text="Lovelyland"
  delay={100}
  animateBy="words"
  direction="top"
  className="hero-title"
/>
```

### Any theme — SpotlightCard on GameCard
```jsx
// Wrap existing GameCard content
<SpotlightCard
  spotlightColor={spotlightByTheme[theme]}
  className="h-full rounded-[var(--radius)]"
>
  <GameCard {...props} />
</SpotlightCard>
```
