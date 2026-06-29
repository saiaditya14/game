---
description: Liquid Glass JS skill — frosted glass morphism UI elements with WebGL refraction using liquid-glass-js. Use when adding glass-effect panels, cards, buttons, or overlays to Lovelyland UI.
---

# Skill: Liquid Glass (`liquid-glass-js`)

## Trigger

Use this skill when:
- Adding a **glass morphism / frosted glass** effect to a UI panel, card, modal, or button
- The user asks for "Apple Vision Pro glass", "liquid glass", "glassmorphism with refraction", or "frosted blur panels"
- Building overlays, HUD elements, or card containers where the background content visually refracts through the glass
- The glass must feel physically realistic — not just a CSS `backdrop-filter: blur()`

Do NOT use for subtle translucent panels where `backdrop-filter: blur(12px)` in Tailwind (`backdrop-blur-md bg-white/10`) is sufficient and cheaper.

---

## Installation

**No npm package yet.** Use CDN or local copy.

```html
<!-- In index.html, before closing </body> -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

Then download `container.js` and `button.js` from the repo and place in `public/lib/`:

```
public/
  lib/
    liquid-glass-container.js
    liquid-glass-button.js
```

```html
<!-- index.html -->
<script src="/lib/liquid-glass-container.js"></script>
<script src="/lib/liquid-glass-button.js"></script>
```

### React wrapper (manual — no official package)

Since there's no React package, create a thin wrapper:

```tsx
// src/components/LiquidGlassContainer.tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    LiquidGlassContainer: new (el: HTMLElement, options?: LiquidGlassOptions) => LiquidGlassInstance;
    LiquidGlassButton: new (el: HTMLElement, options?: LiquidGlassButtonOptions) => LiquidGlassInstance;
    glassControls?: { update: (params: Partial<GlassParams>) => void };
  }
}

interface LiquidGlassOptions {
  borderRadius?: number;     // default: 48
  type?: 'rounded' | 'circle' | 'pill';
  tintOpacity?: number;      // 0-1, default: 0.2
}

interface LiquidGlassButtonOptions extends LiquidGlassOptions {
  text?: string;             // default: 'Button'
  size?: number;             // font size px, default: 48
  onClick?: () => void;
  warp?: boolean;            // center distortion, default: false
}

interface GlassParams {
  edgeIntensity: number;     // 0 – 0.1
  rimIntensity: number;      // 0 – 0.2
  baseIntensity: number;     // 0 – 0.05
  blurRadius: number;        // 1 – 15
  ripple: number;            // 0 – 0.5
}

interface LiquidGlassInstance {
  addChild: (el: HTMLElement) => void;
  removeChild: (el: HTMLElement) => void;
  updateSizeFromDOM: () => void;
}

interface LiquidGlassContainerProps {
  options?: LiquidGlassOptions;
  className?: string;
  children?: React.ReactNode;
}

export function LiquidGlassPanel({ options, className, children }: LiquidGlassContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGlassInstance | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.LiquidGlassContainer) return;

    instanceRef.current = new window.LiquidGlassContainer(el, {
      borderRadius: 32,
      tintOpacity: 0.15,
      type: 'rounded',
      ...options,
    });

    return () => {
      // Cleanup: remove the WebGL canvas the library injected
      const canvas = el.querySelector('canvas');
      canvas?.remove();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

---

## Core API

### Container Class

```js
const container = new LiquidGlassContainer(element, {
  borderRadius: 48,        // px
  type: 'rounded',         // 'rounded' | 'circle' | 'pill'
  tintOpacity: 0.2,        // 0–1
});

container.addChild(childElement);
container.removeChild(childElement);
container.updateSizeFromDOM();  // call after resize
```

### Button Class

```js
const btn = new LiquidGlassButton(element, {
  text: 'Play',
  size: 32,
  borderRadius: 24,
  tintOpacity: 0.15,
  warp: true,              // center distortion on hover
  onClick: () => startGame(),
});
```

### Global glass controls

The library exposes `window.glassControls` after first instantiation:

```js
window.glassControls?.update({
  edgeIntensity: 0.08,
  rimIntensity: 0.12,
  baseIntensity: 0.02,
  blurRadius: 8,
  ripple: 0.3,
});
```

---

## Constraints (strict)

1. **One WebGL instance per page.** `liquid-glass-js` uses a single shared WebGL 2.0 renderer. All glass elements share it via `window.glassControls`. Never instantiate separate containers on different pages simultaneously without cleanup.
2. **Requires `html2canvas` for real-time page capture.** The glass effect captures what's behind it by re-rendering the DOM. This means:
   - Elements behind the glass using `backdrop-filter` may not render correctly in the capture
   - Iframes, video, and WebGL canvases (ShaderGradient!) will NOT be captured — they appear black in the glass refraction
   - Position ShaderGradient as a `<img>` snapshot or static fallback behind the glass
3. **No SSR.** The library is browser-only. Never import at module level — only call `new window.LiquidGlassContainer(...)` inside `useEffect`.
4. **Mobile not yet optimized.** Touch/mobile optimizations are on the roadmap but not released. Disable or replace with CSS `backdrop-filter` on `(hover: none)` devices.
5. **No npm package.** Scripts must be in `public/lib/` and loaded via `<script>` in `index.html`. React cannot import them as ES modules.
6. **`warp: true` is expensive.** Only enable on a single focused interactive button, not on every card.
7. **Call `updateSizeFromDOM()`** after any layout shift or window resize that changes the glass container's bounds.

---

## React Integration Pattern (Vite)

### Step 1: Add scripts to `index.html`
```html
<body>
  <div id="root"></div>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="/lib/liquid-glass-container.js"></script>
  <script src="/lib/liquid-glass-button.js"></script>
  <script type="module" src="/src/main.tsx"></script>
</body>
```

### Step 2: Use the wrapper component
```tsx
import { LiquidGlassPanel } from '@/components/LiquidGlassPanel';

<LiquidGlassPanel
  options={{ borderRadius: 24, tintOpacity: 0.18 }}
  className="p-6 text-white"
>
  <h2 className="text-2xl font-bold">Game Select</h2>
  <p className="text-white/70">Choose your adventure</p>
</LiquidGlassPanel>
```

### Step 3: Tune globally after mount
```tsx
useEffect(() => {
  window.glassControls?.update({
    edgeIntensity: 0.07,
    rimIntensity: 0.10,
    baseIntensity: 0.02,
    blurRadius: 6,
    ripple: 0.2,
  });
}, []);
```

---

## Lovelyland Vibe Presets

### Pink (Cute / Kawaii) — Bubblegum Glass
```js
// Container options
{ borderRadius: 32, tintOpacity: 0.25, type: 'rounded' }

// glassControls
{
  edgeIntensity: 0.09,
  rimIntensity: 0.15,
  baseIntensity: 0.03,
  blurRadius: 10,
  ripple: 0.15,
}

// CSS on the container wrapper:
// className="border border-pink-200/30 shadow-lg shadow-pink-300/20"
```

### Arcade (Pixelated) — Neon Visor
```js
// Container options
{ borderRadius: 4, tintOpacity: 0.1, type: 'rounded' }  // sharp corners

// glassControls
{
  edgeIntensity: 0.1,   // max edge — strong neon rim
  rimIntensity: 0.2,    // max rim — bright border light
  baseIntensity: 0.01,
  blurRadius: 2,        // minimal blur for that crisp pixel look
  ripple: 0.4,
}

// CSS: pair with a 1px pixelated border
// className="border border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
// style={{ imageRendering: 'pixelated' }}
```

### Sugar (Pastel) — Cotton Candy Frost
```js
{ borderRadius: 48, tintOpacity: 0.3, type: 'pill' }

{
  edgeIntensity: 0.05,
  rimIntensity: 0.08,
  baseIntensity: 0.04,
  blurRadius: 14,
  ripple: 0.1,
}
// className="border border-white/40"
```

### Plum (Moody) — Dark Mirror
```js
{ borderRadius: 16, tintOpacity: 0.08, type: 'rounded' }

{
  edgeIntensity: 0.06,
  rimIntensity: 0.18,
  baseIntensity: 0.01,
  blurRadius: 4,
  ripple: 0.35,
}
// className="border border-violet-500/20 shadow-inner"
```

---

## Coexistence with ShaderGradient

ShaderGradient renders to a `<canvas>` which `html2canvas` (used internally by liquid-glass-js) **cannot capture**. The glass refraction will show black where the gradient canvas sits.

**Fix:** Render the gradient as a CSS background instead, or add a static fallback image:

```tsx
// Instead of:
<ShaderGradientCanvas>...</ShaderGradientCanvas>

// Use a static or Framer Motion animated gradient behind glass:
<div
  className="fixed inset-0 -z-10"
  style={{
    background: 'linear-gradient(135deg, #ff80b5, #c084fc, #818cf8)',
  }}
/>
// Then place LiquidGlassPanel over it — html2canvas CAN capture CSS backgrounds
```
