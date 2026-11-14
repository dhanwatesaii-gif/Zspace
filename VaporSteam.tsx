import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const VaporSteam: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleCount = 45;

  // Particle simulation state
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 2.2;
      return {
        x: Math.cos(angle) * r,
        y: 0.2 + Math.random() * 3.5,
        z: Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.6 + Math.random() * 1.0, // Rising speed
        vz: (Math.random() - 0.5) * 0.4,
        scale: 0.4,
        maxScale: 1.8 + Math.random() * 1.4,
        age: Math.random() * 4.0,
        lifespan: 3.5 + Math.random() * 2.5,
        baseAngle: angle,
      };
    });
  }, [particleCount]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color('#f1f5f9'), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < particleCount; i++) {
      const p = particles[i];
      p.age += dt;

      // Reset when particle reaches end of lifespan
      if (p.age >= p.lifespan) {
        p.age = 0;
        const angle = Math.random() * Math.PI * 2;
        const r = 0.5 + Math.random() * 1.8;
        // Originating near the flame trench and rocket nozzles
        p.x = Math.cos(angle) * r;
        p.y = 0.3 + (Math.random() - 0.5) * 0.4;
        p.z = Math.sin(angle) * r;
        p.vx = (Math.random() - 0.5) * 0.35 + (p.x * 0.15); // gentle outward puff
        p.vy = 0.7 + Math.random() * 1.1;
        p.vz = (Math.random() - 0.5) * 0.35 + (p.z * 0.15);
      }

      // Physics update: rise and expand
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const progress = p.age / p.lifespan;
      // Expand smoothly over lifetime
      const currentScale = 0.4 + (p.maxScale - 0.4) * Math.sin(progress * Math.PI * 0.85);

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(currentScale, currentScale * 1.1, currentScale);
      dummy.rotation.set(progress * 1.5, progress * 0.8, progress * 1.1);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={[0, 0, 0]} name="VaporSteamSystem">
      {/* Semi-transparent billowy vapor spheres */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, particleCount]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.95}
          metalness={0.0}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </instancedMesh>
    </group>
  );
};
