import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Ocean: React.FC = () => {
  const oceanMeshRef = useRef<THREE.Mesh>(null);
  const timeUniform = useMemo(() => ({ value: 0 }), []);

  // Large ocean plane extending from shoreline to horizon
  // 260 units wide, 400 units deep, subdivided for smooth waves
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(280, 420, 96, 96);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0f766e'), // Deep teal/blue-green
      roughness: 0.18,
      metalness: 0.75,
      flatShading: false,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = timeUniform;

      // Inject custom wave vertex displacement and coordinate varying
      shader.vertexShader = `
        varying vec3 vOceanPos;
        uniform float uTime;
        ${shader.vertexShader}
      `;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vOceanPos = position;
        // Multi-frequency directional ocean swells
        float w1 = sin(position.x * 0.12 + uTime * 1.6) * 0.42;
        float w2 = cos(position.z * 0.09 + uTime * 1.1) * 0.35;
        float w3 = sin((position.x * 0.08 + position.z * 0.08) + uTime * 2.1) * 0.22;
        float w4 = cos((position.x * 0.2 - position.z * 0.15) + uTime * 2.8) * 0.12;

        transformed.y += (w1 + w2 + w3 + w4);
        `
      );

      // Inject subtle surface foam/shimmer color variation
      shader.fragmentShader = `
        varying vec3 vOceanPos;
        uniform float uTime;
        ${shader.fragmentShader}
      `;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        // Foam crest highlights on top of waves
        float wavePattern = sin(vOceanPos.x * 0.12 + uTime * 1.6) + cos(vOceanPos.z * 0.09 + uTime * 1.1);
        float crest = smoothstep(0.4, 0.95, wavePattern);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.65, 0.92, 0.96), crest * 0.35);
        `
      );
    };

    return mat;
  }, [timeUniform]);

  useFrame((_, delta) => {
    timeUniform.value += delta;
    if (oceanMeshRef.current) {
      // Subtle vertical tide breathing
      oceanMeshRef.current.position.y = -1.1 + Math.sin(timeUniform.value * 0.4) * 0.08;
    }
  });

  return (
    <group position={[170, 0, 0]} name="OceanGroup">
      <mesh
        ref={oceanMeshRef}
        geometry={geometry}
        material={material}
        receiveShadow
      />

      {/* Shoreline gentle foam wash strip */}
      <mesh position={[-138, -0.98, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 400]} />
        <meshBasicMaterial
          color="#99f6e4"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
