import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';

// ─── Shared geometry shapes (created once at module load) ──────────────────────

const PETAL_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.28, 0.06, 0.28, 0.62, 0, 0.7);
  s.bezierCurveTo(-0.28, 0.62, -0.28, 0.06, 0, 0);
  return s;
})();

// ─── Radial glow texture for star coronas ─────────────────────────────────────
// Additive-blended sprite placed behind each sphere — light adds to background
const GLOW_TEXTURE = (() => {
  const sz = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = sz;
  const ctx = canvas.getContext('2d');
  const cx = sz / 2, cy = sz / 2;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz / 2);
  grd.addColorStop(0.00, 'rgba(220,235,255,0.90)');
  grd.addColorStop(0.25, 'rgba(200,220,255,0.38)');
  grd.addColorStop(0.60, 'rgba(180,210,255,0.08)');
  grd.addColorStop(1.00, 'rgba(160,200,255,0.00)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, sz, sz);
  return new THREE.CanvasTexture(canvas);
})();

// ─── 4-pointed silver star sprite texture ─────────────────────────────────────
// Sharp diamond cross — Stardew-esque, renders as a sprite on Points.
const STAR_SPRITE = (() => {
  const sz = 32;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = sz;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, sz, sz);
  const cx = sz / 2, cy = sz / 2;
  // Faint central glow so the star has depth without being blurry
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz * 0.28);
  grd.addColorStop(0, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, sz, sz);
  // Sharp 4-pointed star: outer spike at 15px, inner waist at 2px
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI / 4) - Math.PI / 2;
    const r = (i % 2 === 0) ? (sz / 2 - 1) : (sz / 16);
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
})();


// ─── Pink — Cherry Blossom Flowers ────────────────────────────────────────────

const FLOWER_COLORS = ['#f472b6', '#ec4899', '#db2777'];
const PETAL_ANGLES_DEG = [0, 72, 144, 216, 288];

function CherryBlossom({ color }) {
  const groupRef = useRef();
  const baseX = useRef(Math.random() * 22 - 11);
  const { camera } = useThree();

  const data = useMemo(() => ({
    y: 9 + Math.random() * 10,
    z: -2 - Math.random() * 5,
    speed: 0.38 + Math.random() * 0.28,
    swayAmp: 0.4 + Math.random() * 1.0,
    swaySpeed: 0.35 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    selfRot: (Math.random() - 0.5) * 0.5,
    scale: 0.22 + Math.random() * 0.18,
    opacity: 0.5 + Math.random() * 0.28,
  }), []);

  const yRef = useRef(data.y);
  const frameCount = useRef(Math.floor(Math.random() * 12));
  const targetOpacity = useRef(data.opacity);
  const liveOpacity = useRef(data.opacity);
  const projVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    yRef.current -= delta * data.speed;
    if (yRef.current < -10) {
      yRef.current = 9 + Math.random() * 5;
      baseX.current = Math.random() * 22 - 11;
    }
    groupRef.current.position.x =
      baseX.current + Math.sin(state.clock.elapsedTime * data.swaySpeed + data.phase) * data.swayAmp;
    groupRef.current.position.y = yRef.current;
    groupRef.current.rotation.z += delta * data.selfRot;

    frameCount.current++;
    if (frameCount.current % 12 === 0) {
      projVec.copy(groupRef.current.position).project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
      let hit = false;
      const els = document.querySelectorAll('h1, h2, p, .hero-title');
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (sx > r.left - 28 && sx < r.right + 28 && sy > r.top - 28 && sy < r.bottom + 28) {
          hit = true;
          break;
        }
      }
      targetOpacity.current = hit ? 0.06 : data.opacity;
    }

    liveOpacity.current += (targetOpacity.current - liveOpacity.current) * Math.min(1, delta * 4);
    groupRef.current.traverse(child => {
      if (child.isMesh && child.material) child.material.opacity = liveOpacity.current;
    });
  });

  return (
    <group ref={groupRef} position={[baseX.current, data.y, data.z]} scale={data.scale}>
      {PETAL_ANGLES_DEG.map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh
            key={deg}
            position={[Math.sin(rad) * 0.26, Math.cos(rad) * 0.26, 0]}
            rotation={[0, 0, -rad]}
          >
            <shapeGeometry args={[PETAL_SHAPE]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={data.opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color="#fde68a" transparent opacity={0.92} depthWrite={false} />
      </mesh>
    </group>
  );
}

function PinkScene() {
  const flowers = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ id: i, color: FLOWER_COLORS[i % FLOWER_COLORS.length] })),
    []
  );

  return (
    <>
      <ambientLight intensity={0.65} />
      <pointLight position={[0, 5, 4]} intensity={0.45} color="#f9a8d4" />
      {flowers.map(f => <CherryBlossom key={f.id} color={f.color} />)}
      <Sparkles count={35} size={1.2} scale={[24, 18, 7]} color="#fbcfe8" opacity={0.3} speed={0.22} />
    </>
  );
}

// ─── Champagne — Physics Bubble Simulation ────────────────────────────────────

const BOKEH_COLORS = ['#e8c87a', '#f5e6a3', '#f0d090', '#fffbe8', '#d4aa60'];
const CAM_Z = 5;                                    // matches Canvas camera position
const TAN_HALF_FOV = Math.tan(30 * Math.PI / 180); // fov=60 → half=30°

// Returns world-space half-extents for a bubble at depth z
function boundsAt(z, aspect) {
  const depth = CAM_Z - z;          // distance from camera to bubble plane
  const halfH = TAN_HALF_FOV * depth;
  return { bX: halfH * aspect, bY: halfH };
}

function VanillaScene() {
  const { size } = useThree();
  const aspect = size.width / size.height || 1;

  const bubbles = useRef(
    Array.from({ length: 18 }, (_, i) => {
      const z = -1.0 - Math.random() * 4.5;
      const { bX, bY } = boundsAt(z, aspect);
      const scale = 0.28 + Math.random() * 0.44;
      return {
        x:  (Math.random() * 2 - 1) * bX * 0.85,
        y:  (Math.random() * 2 - 1) * bY * 0.85,
        z,
        vx: (Math.random() < 0.5 ? 1 : -1) * (0.12 + Math.random() * 0.22),
        vy: (Math.random() < 0.5 ? 1 : -1) * (0.08 + Math.random() * 0.16),
        scale,
        r:       scale * 0.5, // collision core — smaller than visual so they touch gently
        color:   BOKEH_COLORS[i % BOKEH_COLORS.length],
        opacity: 0.09 + Math.random() * 0.07,
        meshRef: { current: null },
      };
    })
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const asp = state.size.width / state.size.height || 1;
    const bs = bubbles.current;

    // Move + wall bounce
    for (const b of bs) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const { bX, bY } = boundsAt(b.z, asp);
      if      (b.x >  bX) { b.x =  bX; b.vx = -Math.abs(b.vx); }
      else if (b.x < -bX) { b.x = -bX; b.vx =  Math.abs(b.vx); }
      if      (b.y >  bY) { b.y =  bY; b.vy = -Math.abs(b.vy); }
      else if (b.y < -bY) { b.y = -bY; b.vy =  Math.abs(b.vy); }
    }

    // Elastic bubble-bubble collision on small cores (~2% packing, occasional gentle nudge)
    for (let i = 0; i < bs.length; i++) {
      for (let j = i + 1; j < bs.length; j++) {
        const bi = bs[i], bj = bs[j];
        const dx = bj.x - bi.x, dy = bj.y - bi.y;
        const dist2 = dx * dx + dy * dy;
        const minD = bi.r + bj.r;
        if (dist2 < minD * minD && dist2 > 0.0001) {
          const dist = Math.sqrt(dist2);
          const nx = dx / dist, ny = dy / dist;
          const overlap = (minD - dist) * 0.5;
          bi.x -= nx * overlap; bi.y -= ny * overlap;
          bj.x += nx * overlap; bj.y += ny * overlap;
          const dvx = bi.vx - bj.vx, dvy = bi.vy - bj.vy;
          const dot = dvx * nx + dvy * ny;
          if (dot > 0) {
            bi.vx -= dot * nx; bi.vy -= dot * ny;
            bj.vx += dot * nx; bj.vy += dot * ny;
          }
        }
      }
    }

    for (const b of bs) b.meshRef.current?.position.set(b.x, b.y, b.z);
  });

  return (
    <>
      {bubbles.current.map((b, i) => (
        <mesh key={i} ref={b.meshRef} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.scale, 14, 14]} />
          <meshBasicMaterial color={b.color} transparent opacity={b.opacity} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Arcade — Deep Space ──────────────────────────────────────────────────────

// Dim nebula wisps — neon colour clouds far behind everything
const NEBULA_DATA = [
  { x: -4.5, y:  2.5, z: -9,  color: '#ff00ff', scale: 5.0, rotSpeed: 0.04  },
  { x:  5.5, y: -2.0, z: -11, color: '#00ffff', scale: 6.0, rotSpeed: 0.03  },
  { x:  0.5, y:  4.0, z: -13, color: '#7c3aed', scale: 7.5, rotSpeed: 0.025 },
];

function NebulaCloud({ x, y, z, color, scale, rotSpeed }) {
  const meshRef = useRef();
  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * rotSpeed;
    meshRef.current.rotation.z += delta * rotSpeed * 0.6;
  });
  return (
    <mesh ref={meshRef} position={[x, y, z]} scale={scale}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color={color} transparent opacity={0.045} depthWrite={false} />
    </mesh>
  );
}

// 220 tiny round/square points — all-screen, fast independent twinkle
function TwinkleStarField({ count = 220 }) {
  const geoRef = useRef();

  const { positions, colors, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    const phases    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 26;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = -0.5 - Math.random() * 13;
      colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 1;
      speeds[i] = 0.5 + Math.random() * 2.0; // faster twinkle
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, speeds, phases };
  }, [count]);

  useFrame((state) => {
    if (!geoRef.current) return;
    const attr = geoRef.current.attributes.color;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const b = 0.04 + 0.96 * (0.5 + 0.5 * Math.sin(t * speeds[i] + phases[i]));
      attr.array[i * 3] = attr.array[i * 3 + 1] = attr.array[i * 3 + 2] = b;
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} vertexColors transparent opacity={0.95} depthWrite={false} sizeAttenuation />
    </points>
  );
}

// ~38 4-pointed silver star sprites — all-screen, moderate twinkle
// Cool blue-silver tint: R×0.82, G×0.90, B×1.0
function PixelStarLayer({ count = 38 }) {
  const geoRef = useRef();

  const { positions, colors, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const speeds    = new Float32Array(count);
    const phases    = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = -0.4 - Math.random() * 7;
      colors[i * 3] = 0.82; colors[i * 3 + 1] = 0.90; colors[i * 3 + 2] = 1.0;
      speeds[i] = 0.3 + Math.random() * 1.1;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, colors, speeds, phases };
  }, [count]);

  useFrame((state) => {
    if (!geoRef.current) return;
    const attr = geoRef.current.attributes.color;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const b = 0.08 + 0.92 * (0.5 + 0.5 * Math.sin(t * speeds[i] + phases[i]));
      attr.array[i * 3]     = b * 0.82; // R — cooler silver
      attr.array[i * 3 + 1] = b * 0.90; // G
      attr.array[i * 3 + 2] = b * 1.00; // B — blue-white
    }
    attr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
      </bufferGeometry>
      <pointsMaterial
        map={STAR_SPRITE}
        size={0.22}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        sizeAttenuation
        alphaTest={0.04}
      />
    </points>
  );
}

// Bright steady stars with radial corona — no twinkling, static bright
function GalaxyStar({ x, y, z, size, opacity }) {
  const glowScale = size * 13; // corona is 13× the star radius
  return (
    <group position={[x, y, z]}>
      {/* Soft radiating halo — additive so it adds light, never darkens */}
      <sprite scale={[glowScale, glowScale, 1]}>
        <spriteMaterial
          map={GLOW_TEXTURE}
          transparent
          opacity={opacity * 0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[size, 7, 7]} />
        <meshBasicMaterial color="#d8eeff" transparent opacity={opacity} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ArcadeScene() {
  const galaxyStars = useMemo(() => {
    // Poisson-style placement: reject candidates within MIN_DIST of any placed star
    const W = 22, H = 14, MIN_DIST = 2.4, TARGET = 28;
    const placed = [];
    let tries = 0;
    while (placed.length < TARGET && tries < TARGET * 40) {
      tries++;
      const x = (Math.random() - 0.5) * W;
      const y = (Math.random() - 0.5) * H;
      const tooClose = placed.some(s => {
        const dx = s.x - x, dy = s.y - y;
        return dx * dx + dy * dy < MIN_DIST * MIN_DIST;
      });
      if (!tooClose) placed.push({
        x, y,
        z:       -0.8 - Math.random() * 2.5,
        size:    0.025 + Math.random() * 0.038,
        opacity: 0.72 + Math.random() * 0.28,
      });
    }
    return placed;
  }, []);

  return (
    <>
      {NEBULA_DATA.map((c, i) => <NebulaCloud key={i} {...c} />)}
      <TwinkleStarField count={220} />
      <PixelStarLayer   count={38}  />
      {galaxyStars.map((s, i) => <GalaxyStar key={i} {...s} />)}
    </>
  );
}

// ─── Cozy — Outdoor rainy garden scene ────────────────────────────────────────

const GARDEN_TREE_DATA = [
  { x: -9, y: -1, z: -14, scale: 5, color: '#1a3020' },
  { x: -5, y:  2, z: -17, scale: 6, color: '#243828' },
  { x: -2, y: -3, z: -16, scale: 4, color: '#1e2c1c' },
  { x:  1, y:  1, z: -20, scale: 7, color: '#1a3020' },
  { x:  4, y: -2, z: -15, scale: 5, color: '#243828' },
  { x:  7, y:  2, z: -18, scale: 6, color: '#1e2c1c' },
  { x:  9, y: -1, z: -14, scale: 4, color: '#1a3020' },
];

function TreeMass() {
  return (
    <>
      {GARDEN_TREE_DATA.map((t, i) => (
        <mesh key={i} position={[t.x, t.y, t.z]} scale={t.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={t.color} transparent opacity={0.30 + (i % 3) * 0.05} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

const GARDEN_FOG_DATA = [
  { x: -6, z: -7,  scale: 9,  color: '#7090a8', opacity: 0.05, phase: 0.0,  period: 24 },
  { x:  3, z: -9,  scale: 12, color: '#8aacbe', opacity: 0.04, phase: 1.2,  period: 32 },
  { x: -2, z: -11, scale: 8,  color: '#7898b0', opacity: 0.06, phase: 2.4,  period: 28 },
  { x:  7, z: -8,  scale: 10, color: '#8aacbe', opacity: 0.07, phase: 0.8,  period: 38 },
  { x: -5, z: -10, scale: 7,  color: '#7090a8', opacity: 0.05, phase: 3.1,  period: 22 },
];

function GardenFog() {
  const meshRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    GARDEN_FOG_DATA.forEach((f, i) => {
      if (meshRefs.current[i]) {
        meshRefs.current[i].position.x = f.x + Math.sin((t / f.period) * Math.PI * 2 + f.phase) * 0.4;
      }
    });
  });

  return (
    <>
      {GARDEN_FOG_DATA.map((f, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[f.x, 0, f.z]} scale={f.scale}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={f.color} transparent opacity={f.opacity} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

const GARDEN_LIGHT_COLORS = ['#d8c448', '#e0cd50', '#e8c448', '#f0d860', '#dcc040'];

function GardenLights() {
  const lightData = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    x:         (Math.random() - 0.5) * 22,
    y:         (Math.random() - 0.5) * 8,
    z:         -1.5 - Math.random() * 3.5,
    scale:     0.08 + Math.random() * 0.10,
    baseOp:    0.18 + Math.random() * 0.22,
    bobPeriod: 3 + Math.random() * 4,
    phase:     Math.random() * Math.PI * 2,
    opPhase:   Math.random() * Math.PI * 2,
    color:     GARDEN_LIGHT_COLORS[i % GARDEN_LIGHT_COLORS.length],
  })), []);

  const meshRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lightData.forEach((l, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      mesh.position.y = l.y + Math.sin((t / l.bobPeriod) * Math.PI * 2 + l.phase) * 0.15;
      mesh.material.opacity = l.baseOp + Math.sin((t / l.bobPeriod) * Math.PI * 2 + l.opPhase) * 0.08;
    });
  });

  return (
    <>
      {lightData.map((l, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el; }} position={[l.x, l.y, l.z]} scale={l.scale}>
          <sphereGeometry args={[1, 7, 7]} />
          <meshBasicMaterial color={l.color} transparent opacity={l.baseOp} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function DepthRain() {
  const COUNT = 1400;
  const geoRef = useRef();

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds    = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 32;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = -3 - Math.random() * 10;
      speeds[i] = 0.5 + Math.random() * 0.7;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    if (!geoRef.current) return;
    const dt  = Math.min(delta, 0.05);
    const pos = geoRef.current.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] -= speeds[i] * dt;
      if (pos[i * 3 + 1] < -11) {
        pos[i * 3 + 1] = 11;
        pos[i * 3]     = (Math.random() - 0.5) * 32;
      }
    }
    geoRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#ffffff" transparent opacity={0.07} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function CozyScene() {
  return (
    <>
      <TreeMass />
      <GardenFog />
      <DepthRain />
      <GardenLights />
    </>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

const SCENE_MAP = {
  'theme-arcade':    ArcadeScene,
  'theme-pink':      PinkScene,
  'theme-champagne': VanillaScene,
};

const canvasStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
};

export default function ThemeScene() {
  const { theme } = useTheme();
  const Scene = SCENE_MAP[theme];
  if (!Scene) return null;

  return (
    <div style={canvasStyle}>
      <Canvas
        key={theme}
        dpr={[1, 1.5]}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }}
        gl={{ alpha: true, antialias: false }}
        frameloop="always"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
