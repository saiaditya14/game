import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';

// ─── Shared geometry shapes (created once at module load) ──────────────────────

// Teardrop petal: base at origin, tip at y=0.7, symmetric around x=0
const PETAL_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.28, 0.06, 0.28, 0.62, 0, 0.7);
  s.bezierCurveTo(-0.28, 0.62, -0.28, 0.06, 0, 0);
  return s;
})();


// ─── Pink — Cherry Blossom Flowers ────────────────────────────────────────────

// 3 saturated pinks — no pale washes
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
  // Stagger each flower's check so they don't all query the DOM on the same frame
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

    // Text-overlap check — throttled, staggered per flower
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

    // Smooth lerp toward target opacity and apply to all child materials
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
      {/* Yellow center */}
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

// ─── Vanilla — Soft Bokeh Orbs ────────────────────────────────────────────────

const BOKEH_COLORS = ['#e8c87a', '#f5e6a3', '#f0d090', '#fffbe8', '#d4aa60'];

function BokehOrb({ color }) {
  const meshRef = useRef();

  const data = useMemo(() => ({
    x: Math.random() * 16 - 8,
    y: Math.random() * 10 - 5,
    z: -0.8 - Math.random() * 3.5,
    driftSpeedX: 0.04 + Math.random() * 0.07,
    driftSpeedY: 0.03 + Math.random() * 0.06,
    driftAmpX:   0.3  + Math.random() * 0.6,
    driftAmpY:   0.2  + Math.random() * 0.5,
    phase: Math.random() * Math.PI * 2,
    scale:   0.35 + Math.random() * 0.55,
    opacity: 0.08 + Math.random() * 0.1,
  }), []);

  useFrame((state) => {
    meshRef.current.position.x =
      data.x + Math.sin(state.clock.elapsedTime * data.driftSpeedX + data.phase) * data.driftAmpX;
    meshRef.current.position.y =
      data.y + Math.sin(state.clock.elapsedTime * data.driftSpeedY + data.phase * 1.3) * data.driftAmpY;
  });

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]} scale={data.scale}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={data.opacity} depthWrite={false} />
    </mesh>
  );
}

function VanillaScene() {
  const orbs = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ id: i, color: BOKEH_COLORS[i % BOKEH_COLORS.length] })),
    []
  );

  return (
    <>
      {orbs.map(o => <BokehOrb key={o.id} color={o.color} />)}
    </>
  );
}

// ─── Arcade — Neon Crystals ───────────────────────────────────────────────────

const CRYSTAL_COLORS = ['#ff00ff', '#00ffff', '#a855f7', '#ff00ff', '#00ffff', '#7c3aed'];

function Crystal({ color }) {
  const meshRef = useRef();

  const data = useMemo(() => ({
    x: Math.random() * 22 - 11,
    y: Math.random() * 16 - 8,
    z: -1 - Math.random() * 4,
    rotX: (Math.random() - 0.5) * 2.5,
    rotY: (Math.random() - 0.5) * 2.5,
    rotZ: (Math.random() - 0.5) * 1.5,
    scale: 0.07 + Math.random() * 0.13,
    floatAmp: 0.15 + Math.random() * 0.35,
    floatSpeed: 0.4 + Math.random() * 0.8,
    phase: Math.random() * Math.PI * 2,
  }), []);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * data.rotX;
    meshRef.current.rotation.y += delta * data.rotY;
    meshRef.current.rotation.z += delta * data.rotZ;
    meshRef.current.position.y =
      data.y + Math.sin(state.clock.elapsedTime * data.floatSpeed + data.phase) * data.floatAmp;
  });

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]} scale={data.scale}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.65}
        metalness={0.7}
        roughness={0.15}
        transparent
        opacity={0.88}
      />
    </mesh>
  );
}

function ArcadeScene() {
  const crystals = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({ id: i, color: CRYSTAL_COLORS[i % CRYSTAL_COLORS.length] })),
    []
  );

  return (
    <>
      <ambientLight intensity={0.2} color="#220022" />
      <pointLight position={[-4, 5, 3]} intensity={1.6} color="#ff00ff" />
      <pointLight position={[4, -3, 2]} intensity={1.2} color="#00ffff" />
      {crystals.map(c => <Crystal key={c.id} color={c.color} />)}
      <Sparkles count={32} size={1.6} scale={[22, 16, 6]} color="#ff00ff" opacity={0.42} speed={0.5} />
      <Sparkles count={32} size={1.3} scale={[22, 16, 6]} color="#00ffff" opacity={0.36} speed={0.4} />
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
