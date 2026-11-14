import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export type CameraPreset = 'astronaut' | 'cinematic' | 'hatch' | 'engines' | 'sunrise' | 'bunker';

interface CameraControllerProps {
  currentPreset: CameraPreset;
  isAutoRotating?: boolean;
}

const PRESET_CONFIGS: Record<Exclude<CameraPreset, 'astronaut'>, { pos: [number, number, number]; target: [number, number, number] }> = {
  cinematic: {
    pos: [28, 12, 28],
    target: [0, 9, 0],
  },
  hatch: {
    pos: [-9, 19.5, 5.5],
    target: [-1, 17.5, 0],
  },
  engines: {
    pos: [6, 2.8, 6.5],
    target: [0, 2.2, 0],
  },
  sunrise: {
    pos: [-35, 9, -25],
    target: [15, 11, 0],
  },
  bunker: {
    pos: [-21, 6.5, 24],
    target: [0, 9, 0],
  },
};

export const CameraController: React.FC<CameraControllerProps> = ({
  currentPreset,
  isAutoRotating = false,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const targetPosRef = useRef(new THREE.Vector3(28, 12, 28));
  const targetLookRef = useRef(new THREE.Vector3(0, 9, 0));
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (currentPreset === 'astronaut') {
      isTransitioningRef.current = false;
      return;
    }
    const config = PRESET_CONFIGS[currentPreset];
    if (config) {
      targetPosRef.current.set(...config.pos);
      targetLookRef.current.set(...config.target);
      isTransitioningRef.current = true;
    }
  }, [currentPreset]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioningRef.current) {
      const step = Math.min(delta * 2.8, 0.12);
      camera.position.lerp(targetPosRef.current, step);
      controlsRef.current.target.lerp(targetLookRef.current, step);
      controlsRef.current.update();

      // Check if settled
      if (
        camera.position.distanceTo(targetPosRef.current) < 0.25 &&
        controlsRef.current.target.distanceTo(targetLookRef.current) < 0.25
      ) {
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={currentPreset !== 'astronaut'}
      makeDefault={currentPreset !== 'astronaut'}
      enableDamping
      dampingFactor={0.06}
      minDistance={6}
      maxDistance={140}
      // Never allow camera to go below ground surface
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI / 2 - 0.04}
      autoRotate={isAutoRotating && currentPreset !== 'astronaut'}
      autoRotateSpeed={0.65}
      target={PRESET_CONFIGS.cinematic.target}
    />
  );
};
