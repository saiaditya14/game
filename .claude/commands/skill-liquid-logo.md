---
description: Liquid Metal Logo skill — animated liquid-metal shader effect on images/logos using @paper-design/shaders-react. Use when adding a premium liquid metal or iridescent shimmer effect to a logo, title image, or hero graphic.
---

# Skill: Liquid Metal Logo (`@paper-design/shaders-react`)

## Trigger

Use this skill when:
- Adding a **liquid metal / iridescent shimmer** effect to a logo, title card, or hero image
- The user wants a logo that "melts", "morphs", or has a **chrome/liquid** appearance
- Theming the Lovelyland logo or any game's title screen with premium visual polish
- The user references `paper-design/liquid-logo` or "liquid metal"

**Important:** `paper-design/liquid-logo` (github.com/paper-design/liquid-logo) is a **demo web app**, not an npm package. Its underlying shader engine is published as `@paper-design/shaders-react`. Use that package.

---

## Installation

```bash
npm i @paper-design/shaders-react
```

No additional Three.js or WebGL peer deps required — it uses HTML Canvas shaders internally.

---

## What the Library Provides

`@paper-design/shaders-react` is a zero-dependency canvas shader library. The liquid-metal effect relevant to `liquid-logo` is achievable through the shader components that simulate:
- Refraction / dispersion (light bending through glass/liquid)
- Edge glow intensity
- Pattern blur (soft diffusion)
- Liquify deformation (fluid warp)
- Animated speed control
- Pattern scale (surface detail density)

### Core ShaderParams (from liquid-logo source)

| Parameter | Range | Visual Effect |
|-----------|-------|---------------|
| `refraction` | 0 – 1 | Light dispersion / chromatic spread |
| `edge` | 0 – 0.1 | Edge rim intensity |
| `patternBlur` | 0 – 1 | Soft blur on the liquid pattern |
| `liquid` | 0 – 1 | Fluid deformation / liquify strength |
| `speed` | 0 – 2 | Animation speed of the liquid flow |
| `patternScale` | 0 – 10 | Surface texture detail scale |

---

## Core Boilerplate

```tsx
import { MeshGradient } from '@paper-design/shaders-react';

// Basic animated shimmer as a logo backdrop
export function LiquidLogoBackdrop() {
  return (
    <div className="relative inline-block">
      {/* Shader fills behind the logo */}
      <MeshGradient
        colors={['#e8e8e8', '#b0b0b0', '#f5f5f5', '#c0c0c0']}
        distortion={0.8}
        swirl={0.4}
        speed={0.15}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
        }}
      />
      {/* Logo sits on top, clipped to the same shape */}
      <img
        src="/logo.svg"
        className="relative z-10 w-48 h-auto mix-blend-multiply"
        alt="Lovelyland"
      />
    </div>
  );
}
```

### Recreating the full liquid-logo effect (canvas compositing)

The demo app processes an uploaded image as `ImageData` and composites it onto the shader canvas. To replicate this in Lovelyland:

```tsx
import { useEffect, useRef } from 'react';

export function LiquidMetalLogo({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // From here you can read pixel data and apply shader logic
      // or use as a mask over the MeshGradient component
    };
    img.src = src;
  }, [src]);

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <MeshGradient
        colors={['#d4d4d4', '#a8a8a8', '#f0f0f0', '#888888']}
        distortion={1}
        swirl={0.6}
        speed={0.2}
        style={{ position: 'absolute', inset: 0 }}
      />
      {/* Canvas mask approach: draw logo as alpha mask */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 mix-blend-luminosity"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
```

### Using MeshGradient as the full liquid metal background

```tsx
import { MeshGradient } from '@paper-design/shaders-react';

<MeshGradient
  colors={['#c0c0c0', '#888', '#e8e8e8', '#aaa']}
  distortion={1}
  swirl={0.8}
  speed={0.2}
  style={{ width: 300, height: 300, borderRadius: 24 }}
/>
```

---

## Full MeshGradient Props

| Prop | Type | Notes |
|------|------|-------|
| `colors` | `string[]` | Array of 2–4 hex colors |
| `distortion` | number | Mesh warp intensity |
| `swirl` | number | Swirl/rotation of the mesh |
| `speed` | number | Animation speed |
| `style` | CSSProperties | Width + height required |

---

## Constraints (strict)

1. **One canvas per view** — every `<MeshGradient>` creates an HTML Canvas. Limit to 1–2 per screen.
2. **No SSR concern** in this Vite SPA, but the canvas is browser-only. Wrap in `useEffect` if logic runs before mount.
3. **No `mix-blend-mode: multiply`** on dark backgrounds — it will black out. Use `luminosity` or `screen` for dark themes.
4. **Avoid `speed > 0.5`** — above this threshold the animation becomes nauseating on mobile. The liquid-logo demo caps effective speed at ~0.3 for the default experience.
5. **`patternScale` vs `swirl`** — patternScale adds surface micro-detail (good for chrome), swirl adds global rotation (good for liquid flow). Don't max both simultaneously.
6. **Image as mask, not texture input** — the library doesn't accept an `imageData` prop directly. Use CSS blend modes (`mix-blend-mode`) or a canvas compositing pass to combine a logo SVG with the shader output.

---

## Lovelyland Vibe Presets

### Pink (Cute / Kawaii) — Rose Gold Metal
```tsx
colors={['#f9a8d4', '#fbcfe8', '#e879f9', '#f0abfc']}
distortion={0.5}
swirl={0.3}
speed={0.12}
// Pair: mix-blend-mode="luminosity" over a white logo
```

### Arcade (Pixelated) — Holographic Chrome
```tsx
colors={['#7c3aed', '#06b6d4', '#fbbf24', '#10b981']}
distortion={1.5}
swirl={1.0}
speed={0.35}
// Pair: CSS filter: contrast(1.3) saturate(1.5) on the container
// For pixel feel: imageRendering: 'pixelated' on the canvas
```

### Sugar (Pastel) — Opalescent Pearl
```tsx
colors={['#fde68a', '#fbcfe8', '#a5f3fc', '#d9f99d']}
distortion={0.4}
swirl={0.2}
speed={0.1}
```

### Plum (Moody) — Dark Mercury
```tsx
colors={['#1e1b4b', '#4c1d95', '#312e81', '#0f0a3c']}
distortion={1.2}
swirl={0.7}
speed={0.25}
// Add: filter: brightness(1.4) on the canvas for the metallic sheen
```

---

## Common Patterns

### Animated title with liquid shimmer
```tsx
export function LiquidTitle({ text }: { text: string }) {
  return (
    <div className="relative inline-block">
      <MeshGradient
        colors={['#f9a8d4', '#e879f9', '#c084fc', '#fbcfe8']}
        distortion={0.6}
        swirl={0.4}
        speed={0.15}
        style={{ position: 'absolute', inset: 0 }}
      />
      <span
        className="relative z-10 font-black text-6xl tracking-tight"
        style={{
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          // The MeshGradient behind will show through the text
        }}
      >
        {text}
      </span>
    </div>
  );
}
```
