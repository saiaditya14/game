---
description: ShaderGradient visual skill — animated WebGL mesh gradient backgrounds using @shadergradient/react. Use when adding animated gradient backgrounds, hero sections, or ambient visual backdrops to any Lovelyland screen.
---

# Skill: ShaderGradient (`@shadergradient/react`)

## Trigger

Use this skill when:
- Adding an **animated gradient background** to a page, card, modal, or hero section
- The user asks for a "flowing", "dreamy", "wavy", or "glowing" background effect
- Replacing a static Tailwind `bg-*` gradient with something alive
- Building the Lovelyland hub landing screen or any game's ambient backdrop

Do NOT use for subtle static backgrounds — a plain Tailwind gradient is cheaper. Only reach for ShaderGradient when motion and depth are intentional.

---

## Installation

```bash
npm i @shadergradient/react @react-three/fiber three three-stdlib camera-controls
npm i -D @types/three
```

React 18 → R3F v8. React 19 → R3F v9. This project uses React 18, so pin R3F to v8.

---

## Core Boilerplate

```tsx
// Always lazy-load — contains WebGL, must be client-side only
import dynamic from 'react-router-dom'; // NOT applicable in Vite
// In Vite/React Router: wrap the import in a lazy() + Suspense

import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export function GradientBackground() {
  return (
    // ShaderGradientCanvas MUST have an explicit size — it does not inherit parent height
    <div className="absolute inset-0 -z-10">
      <ShaderGradientCanvas
        pixelDensity={1}          // Keep at 1 on mobile; 1.5 max on desktop
        fov={45}
        style={{ width: '100%', height: '100%' }}
      >
        <ShaderGradient
          type="waterPlane"       // "plane" | "sphere" | "waterPlane"
          animate="on"
          uSpeed={0.3}
          uStrength={1.5}
          uFrequency={5.5}
          color1="#ff80b5"
          color2="#c084fc"
          color3="#818cf8"
          lightType="3d"
          brightness={1.2}
          envPreset="city"        // "city" | "dawn" | "lobby"
          grain="on"
          cDistance={28}
          cPolarAngle={120}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
```

### Lazy-load pattern for Vite (avoids SSR issues on any future Next.js migration)

```tsx
import { lazy, Suspense } from 'react';
const GradientBackground = lazy(() =>
  import('./GradientBackground').then(m => ({ default: m.GradientBackground }))
);

// Usage:
<Suspense fallback={<div className="absolute inset-0 -z-10 bg-pink-950" />}>
  <GradientBackground />
</Suspense>
```

---

## Full Props Reference

### `<ShaderGradientCanvas>`

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `pixelDensity` | number | 1 | Max 1.5. Higher = sharper but slower |
| `fov` | number | 45 | Camera field of view |
| `style` | CSSProperties | — | Must set width + height explicitly |

### `<ShaderGradient>`

| Prop | Type | Options/Range | Notes |
|------|------|--------------|-------|
| `type` | string | `"plane"` `"sphere"` `"waterPlane"` | Shape of the mesh |
| `animate` | string | `"on"` `"off"` | Toggle animation |
| `uSpeed` | number | 0 – 1 | Animation speed |
| `uStrength` | number | 0 – 5 | Wave amplitude |
| `uFrequency` | number | 0 – 10 | Wave frequency |
| `color1` | string | hex | Primary color |
| `color2` | string | hex | Secondary color |
| `color3` | string | hex | Tertiary color |
| `wireframe` | boolean | — | Debug mesh overlay |
| `lightType` | string | `"3d"` `"env"` | Lighting model |
| `brightness` | number | 0 – 2 | Light intensity |
| `envPreset` | string | `"city"` `"dawn"` `"lobby"` | IBL preset |
| `grain` | string | `"on"` `"off"` | Film grain overlay |
| `reflection` | number | 0 – 1 | Metallic reflection |
| `cDistance` | number | 0 – 100 | Camera distance |
| `cPolarAngle` | number | 0 – 180 | Camera polar angle |
| `cAzimuthAngle` | number | 0 – 360 | Camera azimuth |
| `cameraZoom` | number | — | Additional zoom |
| `rotationX/Y/Z` | number | — | Mesh rotation |
| `positionX/Y/Z` | number | — | Mesh position offset |
| `control` | string | `"props"` `"query"` | Config source |
| `urlString` | string | shareable URL | Used when `control="query"` |

---

## Constraints (strict)

1. **One canvas per page.** ShaderGradientCanvas creates a WebGL context. Never mount two instances simultaneously — this will silently fail on iOS Safari (max 8 WebGL contexts per browser tab). Use a single background canvas and layer UI over it.
2. **Always set `pixelDensity={1}`** for game screens. Only bump to 1.5 for static showcase/landing screens where frame rate does not matter.
3. **Never render inside a scroll container** without `position: fixed` or `absolute` — the WebGL canvas does not scroll with the page and will misalign.
4. **Wrap in Suspense** — the import pulls in Three.js (~600 KB). Without Suspense, the entire route will block paint.
5. **No server-side rendering.** This is a Vite SPA so it's fine, but if pages are ever server-rendered, add `typeof window !== 'undefined'` guards.

---

## Lovelyland Vibe Presets

### Pink (Cute / Kawaii)
```tsx
color1="#ff80b5"   // hot pink
color2="#f9a8d4"   // blush
color3="#e879f9"   // magenta
type="waterPlane"
uSpeed={0.2}
uStrength={2}
grain="on"
brightness={1.3}
envPreset="lobby"
```

### Arcade (Pixelated / Neon)
```tsx
color1="#7c3aed"   // violet
color2="#06b6d4"   // cyan
color3="#fbbf24"   // amber
type="plane"
uSpeed={0.6}
uStrength={3}
uFrequency={8}
grain="off"
brightness={1.8}
envPreset="city"
wireframe={false}
// Pair with a CSS pixelation filter on the parent:
// style={{ imageRendering: 'pixelated', filter: 'contrast(1.2)' }}
```

### Sugar (Pastel / Soft)
```tsx
color1="#fde68a"   // cream yellow
color2="#fbcfe8"   // petal pink
color3="#a5f3fc"   // sky
type="sphere"
uSpeed={0.15}
uStrength={1}
grain="on"
brightness={1.0}
envPreset="dawn"
```

### Plum (Moody / Dark)
```tsx
color1="#4c1d95"   // deep violet
color2="#1e1b4b"   // indigo night
color3="#831843"   // crimson
type="waterPlane"
uSpeed={0.4}
uStrength={4}
grain="on"
brightness={0.8}
envPreset="city"
```

---

## Common Patterns

### Fixed full-screen background behind React Router outlet
```tsx
// In your root layout:
<div className="relative min-h-screen">
  <div className="fixed inset-0 -z-10">
    <ShaderGradientCanvas style={{ width: '100%', height: '100%' }} pixelDensity={1}>
      <ShaderGradient {...vibePreset} />
    </ShaderGradientCanvas>
  </div>
  <Outlet />
</div>
```

### Pause animation when tab is hidden (performance)
```tsx
import { useEffect, useState } from 'react';

function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);
  return visible;
}

// Then:
<ShaderGradient animate={visible ? 'on' : 'off'} ... />
```
