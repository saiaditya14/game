import React from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { useTheme } from './ThemeProvider';

const presets = {
  'theme-pink': {
    color1: '#ff80b5',
    color2: '#f9a8d4',
    color3: '#e879f9',
    type: 'waterPlane',
    uSpeed: 0.2,
    uStrength: 2,
    uFrequency: 5.5,
    grain: 'on',
    brightness: 1.3,
    envPreset: 'lobby',
    cDistance: 28,
    cPolarAngle: 120,
  },
  'theme-arcade': {
    color1: '#7c3aed',
    color2: '#06b6d4',
    color3: '#fbbf24',
    type: 'plane',
    uSpeed: 0.6,
    uStrength: 3,
    uFrequency: 8,
    grain: 'off',
    brightness: 1.8,
    envPreset: 'city',
    cDistance: 28,
    cPolarAngle: 120,
  },
  'theme-vanilla': {
    color1: '#f5deb3',
    color2: '#daa520',
    color3: '#cd853f',
    type: 'waterPlane',
    uSpeed: 0.1,
    uStrength: 1,
    uFrequency: 5.5,
    grain: 'on',
    brightness: 0.9,
    envPreset: 'lobby',
    cDistance: 28,
    cPolarAngle: 120,
  },
  'theme-cozy': {
    color1: '#deb887',
    color2: '#8fbc8f',
    color3: '#d2691e',
    type: 'waterPlane',
    uSpeed: 0.12,
    uStrength: 1.2,
    uFrequency: 5.5,
    grain: 'on',
    brightness: 0.95,
    envPreset: 'dawn',
    cDistance: 28,
    cPolarAngle: 120,
  },
};

export function GradientBackground() {
  const { theme } = useTheme();
  const preset = presets[theme] || presets['theme-vanilla'];

  return (
    <div key={theme} className="fixed inset-0 -z-10" aria-hidden="true">
      <ShaderGradientCanvas
        pixelDensity={1}
        fov={45}
        style={{ width: '100%', height: '100%' }}
      >
        <ShaderGradient
          control="props"
          animate="on"
          lightType="3d"
          {...preset}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
