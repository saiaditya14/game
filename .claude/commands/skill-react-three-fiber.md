---
description: React Three Fiber (R3F) skill — declarative Three.js 3D scenes in React. Use when adding 3D objects, particle systems, animated meshes, or interactive 3D game elements to Lovelyland.
---

# Skill: React Three Fiber (`@react-three/fiber`)

## Trigger

Use this skill when:
- Adding **3D objects, animated meshes, or particle systems** to a game or screen
- The user asks for "3D", "rotating objects", "floating particles", "3D game elements", or "three.js"
- Building a 3D minigame, 3D title animation, or interactive 3D scene in Lovelyland
- Pairing with `@react-three/drei` for helpers (OrbitControls, Text, Stars, etc.)

Do NOT use for simple 2D animations — Framer Motion is already installed and is cheaper. Only reach for R3F when genuine 3D geometry, lighting, or 3D physics is required.

---

## Installation

```bash
npm install three @types/three @react-three/fiber
# Recommended extras:
npm install @react-three/drei  # helpers: Text, Stars, OrbitControls, useGLTF, etc.
```

React 18 → `@react-three/fiber@8`. This project uses React 18 — do NOT install R3F v9.

---

## Core Canvas Boilerplate

```tsx
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

export function Scene3D() {
  return (
    // Canvas must have explicit dimensions — it does NOT inherit parent height by default
    <div className="w-full h-screen">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 1000, position: [0, 0, 5] }}
        dpr={[1, 1.5]}        // pixel ratio: min 1, max 1.5 — keep this tight
        frameloop="always"    // "always" | "demand" | "never"
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <YourMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

---

## Canvas Props Reference

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `camera` | object \| THREE.Camera | `{ fov:75, near:0.1, far:1000, position:[0,0,5] }` | Scene camera config |
| `dpr` | number \| [min, max] | `[1, 2]` | Device pixel ratio. Cap max at 1.5 for games |
| `frameloop` | `'always'` \| `'demand'` \| `'never'` | `'always'` | Use `'demand'` for static scenes |
| `gl` | object | `{}` | WebGLRenderer options (`antialias`, `alpha`, `powerPreference`) |
| `shadows` | boolean \| string | `false` | Enable shadow maps |
| `orthographic` | boolean | `false` | Switch to orthographic camera |
| `scene` | object | `{}` | THREE.Scene props |
| `fallback` | ReactNode | — | Shown when WebGL unavailable |
| `onCreated` | `(state) => void` | — | Fires after renderer created |

---

## Essential Hooks

### `useFrame` — Render loop
```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    // delta = seconds since last frame — always use delta, never fixed values
    meshRef.current.rotation.y += delta * 0.8;
    meshRef.current.rotation.x += delta * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f9a8d4" />
    </mesh>
  );
}
```

### `useThree` — Access renderer state
```tsx
import { useThree } from '@react-three/fiber';

function CameraController() {
  const { camera, size, gl, scene } = useThree();
  // camera: the active camera
  // size: { width, height } of the canvas
  // gl: the WebGLRenderer instance
  return null;
}
```

### `useRef` — Imperative Three.js mutations
```tsx
const meshRef = useRef<THREE.Mesh>(null!);
// Access: meshRef.current.position.set(x, y, z)
// Access: meshRef.current.material.color.set('#fff')
```

---

## Common Scene Patterns

### Floating particle field
```tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 500 }) {
  const meshRef = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#f9a8d4" sizeAttenuation />
    </points>
  );
}
```

### Interactive mesh with events
```tsx
import { useState } from 'react';

function ClickableStar() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  return (
    <mesh
      scale={clicked ? 1.3 : hovered ? 1.1 : 1}
      onClick={() => setClicked(c => !c)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={hovered ? '#e879f9' : '#f9a8d4'} />
    </mesh>
  );
}
```

### Lazy-load 3D scene (Vite, avoid blocking main bundle)
```tsx
import { lazy, Suspense } from 'react';

const Scene3D = lazy(() => import('./Scene3D'));

export function GamePage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-black" />}>
      <Scene3D />
    </Suspense>
  );
}
```

---

## Performance Constraints (strict)

1. **One `<Canvas>` per mounted route.** Each Canvas creates a WebGL context. Never mount two Canvas components simultaneously — iOS Safari caps at 8 WebGL contexts total across the tab. Clean up unmounted scenes by unmounting `<Canvas>` from the tree, not just hiding it with CSS.
2. **Always use `delta` in `useFrame`.** Never animate with a fixed step (`rotation += 0.01`) — it runs at different speeds on 60 vs 120 Hz displays.
3. **Cap `dpr={[1, 1.5]}`** in Lovelyland. The default `[1, 2]` renders at 2× on Retina/HiDPI, doubling GPU cost for minimal visual gain in a game context.
4. **Use `frameloop="demand"`** for any 3D scene that only needs to render on state change (static displays, menus). Only use `"always"` for animated/interactive scenes.
5. **Lazy-load every Canvas route.** Three.js + R3F is ~600 KB. Always wrap the import in `React.lazy()` + `<Suspense>`.
6. **Avoid creating new geometry/material objects in `useFrame`.** Do not call `new THREE.Vector3()` inside the render loop — allocate once in `useRef` or `useMemo`.
7. **No SSR.** R3F uses browser WebGL APIs. Safe in this Vite SPA, but add `typeof window !== 'undefined'` guards if component logic ever runs server-side.
8. **Coexistence with ShaderGradient:** Both create WebGL contexts. If using both on the same screen, count them toward the browser limit. Prefer one or the other per route.

---

## `@react-three/drei` Commonly Used Helpers

```bash
npm install @react-three/drei
```

```tsx
import {
  OrbitControls,   // drag-to-rotate camera
  Stars,           // starfield particle system
  Text,            // 3D text (troika-three-text)
  Float,           // floating bob animation
  MeshDistortMaterial, // animated distortion shader
  Environment,     // HDR environment lighting
  useGLTF,         // load .glb / .gltf models
} from '@react-three/drei';

// Stars example:
<Stars radius={80} depth={40} count={3000} factor={4} fade speed={1} />

// Floating mesh:
<Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
  <mesh>...</mesh>
</Float>

// 3D text:
<Text font="/fonts/inter.woff" fontSize={0.5} color="#f9a8d4">
  Lovelyland
</Text>
```

---

## Lovelyland Vibe Presets

### Pink (Cute / Kawaii) — Floating Hearts/Stars
```tsx
// Pastel pink particles with soft float
<ambientLight intensity={0.8} />
<pointLight position={[5, 5, 5]} intensity={0.6} color="#f9a8d4" />
<Stars count={800} factor={3} radius={60} fade speed={0.5} />
// Meshes: octahedronGeometry, torusGeometry (donut)
// Colors: #f9a8d4 #fbcfe8 #e879f9
// Material: meshStandardMaterial with metalness={0.2} roughness={0.6}
```

### Arcade (Pixelated) — Low-poly Neon Grid
```tsx
// Flat-shaded low-poly geometry, no smoothing
<ambientLight intensity={0.3} color="#06b6d4" />
<directionalLight position={[0, 10, 0]} intensity={1.5} color="#fbbf24" />
// Meshes: boxGeometry, coneGeometry, octahedronGeometry with args={[1, 0]} (no subdivisions!)
// Colors: #7c3aed #06b6d4 #fbbf24 #10b981
// Material: meshStandardMaterial flatShading={true} — this is the key pixel-art feel
// Use frameloop="always" with fast rotation delta * 2
// Optional: pass gl={{ pixelRatio: 0.5 }} for intentional chunky pixels (bold look)
```

### Sugar (Pastel) — Soft Bouncing Spheres
```tsx
<ambientLight intensity={1.0} />
<pointLight position={[3, 5, 3]} intensity={0.5} color="#fde68a" />
// Meshes: sphereGeometry with high subdivision, capsuleGeometry
// Colors: #fde68a #fbcfe8 #a5f3fc
// Material: meshStandardMaterial roughness={0.9} — matte pastel look
// Animation: Float component, slow sinusoidal bounce
```

### Plum (Moody) — Dark Crystalline
```tsx
<ambientLight intensity={0.2} />
<pointLight position={[-5, 5, -5]} intensity={2} color="#7c3aed" />
<spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} color="#818cf8" />
// Meshes: icosahedronGeometry, octahedronGeometry
// Colors: #4c1d95 #818cf8 #1e1b4b
// Material: meshStandardMaterial metalness={0.9} roughness={0.1} — mirror-like crystal
// Environment: <Environment preset="night" />
```

---

## Minimal Working Example (Copy-Paste Ready)

```tsx
// src/components/LovelyCube.tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function Cube() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.8;
    ref.current.rotation.x += delta * 0.2;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#f9a8d4" metalness={0.3} roughness={0.4} />
    </mesh>
  );
}

export function LovelyCube() {
  return (
    <div style={{ width: '100%', height: 400 }}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} />
        <Cube />
      </Canvas>
    </div>
  );
}
```
