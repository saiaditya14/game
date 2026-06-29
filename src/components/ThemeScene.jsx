import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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

// 4-pointed sparkle star (elongated tips, tight inner radius)
const STAR_SHAPE = (() => {
  const s = new THREE.Shape();
  const outer = 0.5;
  const inner = 0.09;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8 + Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
})();

// ─── Pink — Cherry Blossom Flowers ────────────────────────────────────────────

const FLOWER_COLORS = ['#f9a8d4', '#f472b6', '#fbcfe8', '#ec4899', '#fce7f3'];
const PETAL_ANGLES_DEG = [0, 72, 144, 216, 288];

function CherryBlossom({ color }) {
  const groupRef = useRef();
  const baseX = useRef(Math.random() * 22 - 11);

  const data = useMemo(() => ({
    y: 9 + Math.random() * 10,
    z: -2 - Math.random() * 5,          // pushed deep so never covers text
    speed: 0.18 + Math.random() * 0.28,
    swayAmp: 0.4 + Math.random() * 1.0,
    swaySpeed: 0.35 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    selfRot: (Math.random() - 0.5) * 0.5,
    scale: 0.22 + Math.random() * 0.18,
    opacity: 0.5 + Math.random() * 0.28,
  }), []);

  const yRef = useRef(data.y);

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

// ─── Vanilla — Golden Sparkle Stars ───────────────────────────────────────────

const STAR_COLORS = ['#d4aa60', '#e8c87a', '#c9a84c', '#f2d478', '#e0b84a'];

function GoldStar({ color }) {
  const meshRef = useRef();

  const data = useMemo(() => ({
    x: Math.random() * 22 - 11,
    y: Math.random() * 18 - 9,
    z: -1.5 - Math.random() * 4,
    riseSpeed: 0.06 + Math.random() * 0.12,
    swayAmp: 0.25 + Math.random() * 0.65,
    swaySpeed: 0.3 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    selfRot: (Math.random() - 0.5) * 1.2,
    scale: 0.045 + Math.random() * 0.04,
    opacity: 0.55 + Math.random() * 0.38,
  }), []);

  const yRef = useRef(data.y);

  useFrame((state, delta) => {
    yRef.current += delta * data.riseSpeed;
    if (yRef.current > 10) yRef.current = -10;
    meshRef.current.position.y = yRef.current;
    meshRef.current.position.x =
      data.x + Math.sin(state.clock.elapsedTime * data.swaySpeed + data.phase) * data.swayAmp;
    meshRef.current.rotation.z += delta * data.selfRot;
  });

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]} scale={data.scale}>
      <shapeGeometry args={[STAR_SHAPE]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        transparent
        opacity={data.opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function VanillaScene() {
  const stars = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ id: i, color: STAR_COLORS[i % STAR_COLORS.length] })),
    []
  );

  return (
    <>
      <ambientLight intensity={0.9} />
      <pointLight position={[0, 3, 4]} intensity={0.35} color="#e8c87a" />
      {stars.map(s => <GoldStar key={s.id} color={s.color} />)}
      <Sparkles count={25} size={0.85} scale={[22, 16, 6]} color="#d4aa60" opacity={0.18} speed={0.14} />
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
  'theme-pink': PinkScene,
  'theme-vanilla': VanillaScene,
  'theme-arcade': ArcadeScene,
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
