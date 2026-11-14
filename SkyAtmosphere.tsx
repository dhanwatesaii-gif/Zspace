import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const SkyAtmosphere: React.FC = () => {
  const cloudsRef = useRef<THREE.Group>(null);
  const sunHaloRef = useRef<THREE.Mesh>(null);

  // 1. Sky Dome Shader Material (Dawn gradient: Dark navy -> rose pink -> golden horizon)
  const skyDomeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color('#080d26') },     // Deep dark navy zenith
        midColor: { value: new THREE.Color('#311b4a') },     // Dawn twilight purple
        roseColor: { value: new THREE.Color('#e11d48') },    // Sunrise rose
        horizonColor: { value: new THREE.Color('#fb923c') }, // Bright golden-orange horizon
        groundColor: { value: new THREE.Color('#1c1917') },  // Dark ground horizon
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 roseColor;
        uniform vec3 horizonColor;
        uniform vec3 groundColor;
        varying vec3 vWorldPosition;

        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 sky;

          if (h > 0.35) {
            float f = (h - 0.35) / 0.65;
            sky = mix(midColor, topColor, f);
          } else if (h > 0.08) {
            float f = (h - 0.08) / 0.27;
            sky = mix(roseColor, midColor, f);
          } else if (h >= 0.0) {
            float f = h / 0.08;
            sky = mix(horizonColor, roseColor, f);
          } else {
            sky = mix(horizonColor, groundColor, clamp(-h * 4.0, 0.0, 1.0));
          }

          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });
  }, []);

  // 2. Stars: 500 small points placed in upper atmosphere (y > 60)
  const starsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(500 * 3);
    const opacities = new Float32Array(500);

    for (let i = 0; i < 500; i++) {
      // Sphere coordinates in upper dome
      const u = Math.random();
      const v = 0.4 + Math.random() * 0.6; // Keep in upper dome
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const radius = 350 + Math.random() * 20;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(65, radius * Math.cos(phi));
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      opacities[i] = 0.3 + Math.random() * 0.7;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));
    return geo;
  }, []);

  // 3. Volumetric Cloud Clusters (10 procedural clouds at varying heights)
  const cloudData = useMemo(() => {
    const clouds: Array<{
      id: number;
      x: number;
      y: number;
      z: number;
      speed: number;
      scale: number;
      spheres: Array<{ x: number; y: number; z: number; r: number }>;
    }> = [];

    const altitudes = [32, 42, 36, 50, 40, 48, 54, 38, 44, 52];
    const xOffsets = [-90, -45, 10, 60, -80, 40, 95, -20, 80, -60];
    const zOffsets = [-120, -80, -140, -100, 80, 120, -50, 130, 60, -90];

    for (let i = 0; i < 10; i++) {
      const spheres: Array<{ x: number; y: number; z: number; r: number }> = [];
      const puffCount = 5 + (i % 3);
      for (let p = 0; p < puffCount; p++) {
        spheres.push({
          x: (p - puffCount / 2) * 4.2 + (Math.sin(p * 2.1) * 2.5),
          y: Math.sin(p * 1.7) * 1.8,
          z: Math.cos(p * 2.3) * 3.2,
          r: 4.5 + Math.sin(p * 1.3) * 2.2,
        });
      }
      clouds.push({
        id: i,
        x: xOffsets[i],
        y: altitudes[i],
        z: zOffsets[i],
        speed: 0.3 + (i % 4) * 0.15,
        scale: 0.85 + (i % 3) * 0.25,
        spheres,
      });
    }
    return clouds;
  }, []);

  useFrame((_, delta) => {
    // Slowly drift clouds across dawn sky
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((cloudChild, idx) => {
        const speed = cloudData[idx]?.speed || 0.4;
        cloudChild.position.x += delta * speed;
        // Wrap around when past boundary
        if (cloudChild.position.x > 180) {
          cloudChild.position.x = -180;
        }
      });
    }

    // Gentle sun halo pulse
    if (sunHaloRef.current) {
      const pulse = 1 + Math.sin(Date.now() * 0.0015) * 0.04;
      sunHaloRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group name="SkyAtmosphereGroup">
      {/* 1. Gradient Sky Dome */}
      <mesh material={skyDomeMaterial}>
        <sphereGeometry args={[380, 32, 24]} />
      </mesh>

      {/* 2. Stars Points in Upper Sky */}
      <points geometry={starsGeo}>
        <pointsMaterial
          size={1.6}
          color="#f8fafc"
          transparent
          opacity={0.85}
          sizeAttenuation={false}
        />
      </points>

      {/* 3. Glowing Dawn Sun near the horizon (over the ocean direction) */}
      <group position={[140, 18, -60]}>
        {/* Core Sun Sphere */}
        <mesh>
          <sphereGeometry args={[14, 32, 32]} />
          <meshBasicMaterial color="#ffedd5" />
        </mesh>

        {/* Emissive Inner Glow */}
        <mesh>
          <sphereGeometry args={[16.5, 32, 32]} />
          <meshBasicMaterial
            color="#fb923c"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Outer Atmospheric Corona */}
        <mesh ref={sunHaloRef}>
          <sphereGeometry args={[26, 32, 32]} />
          <meshBasicMaterial
            color="#f43f5e"
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. Scattered Volumetric-Looking Clouds */}
      <group ref={cloudsRef}>
        {cloudData.map((c) => (
          <group key={c.id} position={[c.x, c.y, c.z]} scale={c.scale}>
            {c.spheres.map((s, sIdx) => (
              <mesh key={sIdx} position={[s.x, s.y, s.z]}>
                <sphereGeometry args={[s.r, 12, 10]} />
                <meshStandardMaterial
                  color="#fed7aa" // Warm peach/dawn pink tint
                  roughness={0.9}
                  metalness={0.0}
                  transparent
                  opacity={0.42}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
};
