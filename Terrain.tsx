import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { getGroundTexture, getLaunchPadTexture } from '../../utils/proceduralTextures';

export const Terrain: React.FC = () => {
  const rocksRef = useRef<THREE.InstancedMesh>(null);
  const bushesRef = useRef<THREE.InstancedMesh>(null);

  const groundTexture = useMemo(() => getGroundTexture(), []);
  const padTexture = useMemo(() => getLaunchPadTexture(), []);

  // 200x200 Terrain geometry with subtle bumps and flat launchpad center
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 64, 64);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);

      // Keep pad area (within radius 18) perfectly flat at y = 0
      if (distFromCenter < 18) {
        pos.setY(i, 0);
      } else {
        // Natural gentle rolling hills outside pad
        const blend = Math.min(1, (distFromCenter - 18) / 15);
        let height = (
          Math.sin(x * 0.06) * Math.cos(z * 0.05) * 1.8 +
          Math.sin(x * 0.02 + z * 0.03) * 2.2 +
          Math.cos(x * 0.1) * 0.4
        ) * blend;

        // Sloping down towards the ocean on +X side (starting around x = 32)
        if (x > 25) {
          const oceanSlope = Math.min(1, (x - 25) / 25);
          height = height * (1 - oceanSlope) - oceanSlope * 2.2;
        }

        pos.setY(i, height);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Instanced rocks and bushes
  useEffect(() => {
    if (!rocksRef.current || !bushesRef.current) return;

    const dummy = new THREE.Object3D();
    const rockColors = [
      new THREE.Color('#475569'),
      new THREE.Color('#334155'),
      new THREE.Color('#52525b'),
      new THREE.Color('#64748b'),
    ];
    const bushColors = [
      new THREE.Color('#2d3f27'),
      new THREE.Color('#384b2a'),
      new THREE.Color('#1f2d1a'),
      new THREE.Color('#415532'),
    ];

    // Seeded pseudo-random placement
    const seedPoints: Array<{ x: number; z: number }> = [];
    let count = 0;
    while (count < 30) {
      const angle = (count / 30) * Math.PI * 2 + (Math.sin(count * 3) * 0.5);
      const radius = 22 + (Math.abs(Math.sin(count * 7.7)) * 48);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Keep away from ocean (+x > 35)
      if (x < 32) {
        seedPoints.push({ x, z });
        count++;
      } else {
        count++;
      }
    }

    // Populate rocks (25 instances)
    const rockCount = Math.min(25, seedPoints.length);
    for (let i = 0; i < rockCount; i++) {
      const pt = seedPoints[i];
      const scale = 0.5 + Math.random() * 0.9;
      dummy.position.set(pt.x + (Math.random() - 0.5) * 4, 0.2, pt.z + (Math.random() - 0.5) * 4);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.set(scale * (0.8 + Math.random() * 0.4), scale * 0.6, scale * (0.8 + Math.random() * 0.4));
      dummy.updateMatrix();

      rocksRef.current.setMatrixAt(i, dummy.matrix);
      rocksRef.current.setColorAt(i, rockColors[i % rockColors.length]);
    }
    rocksRef.current.instanceMatrix.needsUpdate = true;
    if (rocksRef.current.instanceColor) rocksRef.current.instanceColor.needsUpdate = true;
    rocksRef.current.computeBoundingSphere();

    // Populate bushes (25 instances)
    for (let i = 0; i < rockCount; i++) {
      const pt = seedPoints[(i + 7) % seedPoints.length];
      const scale = 0.7 + Math.random() * 0.8;
      dummy.position.set(pt.x + (Math.random() - 0.5) * 6, 0.4, pt.z + (Math.random() - 0.5) * 6);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
      dummy.updateMatrix();

      bushesRef.current.setMatrixAt(i, dummy.matrix);
      bushesRef.current.setColorAt(i, bushColors[i % bushColors.length]);
    }
    bushesRef.current.instanceMatrix.needsUpdate = true;
    if (bushesRef.current.instanceColor) bushesRef.current.instanceColor.needsUpdate = true;
    bushesRef.current.computeBoundingSphere();
  }, []);

  return (
    <group name="TerrainGroup">
      {/* 1. Main 200x200 Terrain */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial
          map={groundTexture}
          roughness={0.85}
          metalness={0.05}
          color="#7c8a5e"
        />
      </mesh>

      {/* 2. Sandy Shoreline Strip along the beach (+X transition zone) */}
      <mesh position={[40, -0.65, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 200, 16, 32]} />
        <meshStandardMaterial
          color="#d2b887"
          roughness={0.95}
          metalness={0.02}
        />
      </mesh>

      {/* 3. Concrete Launch Pad (30x30 units, slightly elevated) */}
      <group position={[0, 0.08, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[30, 0.25, 30]} />
          <meshStandardMaterial
            map={padTexture}
            roughness={0.7}
            metalness={0.15}
          />
        </mesh>

        {/* Concrete Pad Foundation Edge Bevel */}
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry args={[30.6, 0.2, 30.6]} />
          <meshStandardMaterial color="#474a51" roughness={0.8} />
        </mesh>

        {/* 4. Flame Trench / Blast Pit below the rocket */}
        <group position={[0, -0.1, 0]}>
          {/* Scorched Sunken Pit Well */}
          <mesh position={[0, -0.7, 0]}>
            <boxGeometry args={[7, 1.4, 11]} />
            <meshStandardMaterial color="#18181b" roughness={0.95} metalness={0.1} />
          </mesh>

          {/* Flame Deflector Wedge (Angled dual-chute diverter) */}
          <mesh position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[2.8, 1.6, 4]} />
            <meshStandardMaterial color="#27272a" roughness={0.8} metalness={0.4} />
          </mesh>

          {/* Heavy Steel Grating across pit edges */}
          <mesh position={[-3.6, 0.05, 0]}>
            <boxGeometry args={[0.5, 0.15, 11]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[3.6, 0.05, 0]}>
            <boxGeometry args={[0.5, 0.15, 11]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* 5. Instanced Rocks */}
      <instancedMesh
        ref={rocksRef}
        args={[undefined, undefined, 25]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial roughness={0.85} metalness={0.1} />
      </instancedMesh>

      {/* 6. Instanced Bushes (Low-poly foliage clusters) */}
      <instancedMesh
        ref={bushesRef}
        args={[undefined, undefined, 25]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[0.9, 1.4, 6]} />
        <meshStandardMaterial roughness={0.9} metalness={0.05} />
      </instancedMesh>
    </group>
  );
};
