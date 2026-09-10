import React from 'react';
import { Canvas } from '@react-three/fiber';
import { PinkScene } from '../../../components/ThemeScene';

const canvasStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
};

export default function SugaropolyBackdrop() {
  return (
    <div style={canvasStyle} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 60, near: 0.1, far: 100, position: [0, 0, 5] }}
        gl={{ alpha: true, antialias: false }}
        frameloop="always"
      >
        <PinkScene />
      </Canvas>
    </div>
  );
}
