import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import { getFlagTexture } from '../../utils/proceduralTextures';

interface RocketProps {
  position?: [number, number, number];
  isDoorOpen?: boolean;
  showDoorPrompt?: boolean;
}

export const Rocket: React.FC<RocketProps> = ({
  position = [0, 0, 0],
  isDoorOpen = false,
  showDoorPrompt = false,
}) => {
  const doorHingeRef = useRef<THREE.Group>(null);
  const flagTexture = useMemo(() => getFlagTexture(), []);

  // Shared rocket materials
  const whiteHullMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        roughness: 0.32,
        metalness: 0.15,
      }),
    []
  );

  const redAccentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#dc2626',
        roughness: 0.35,
        metalness: 0.2,
      }),
    []
  );

  const darkMetalMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#27272a',
        roughness: 0.45,
        metalness: 0.8,
      }),
    []
  );

  const windowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0284c7',
        emissive: '#38bdf8',
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.9,
      }),
    []
  );

  // Smoothly rotate door open or closed
  useFrame((_, delta) => {
    if (doorHingeRef.current) {
      const targetAngle = isDoorOpen ? -Math.PI * 0.58 : 0;
      doorHingeRef.current.rotation.y = THREE.MathUtils.damp(
        doorHingeRef.current.rotation.y,
        targetAngle,
        5.5,
        delta
      );
    }
  });

  return (
    <group position={position} name="RocketAndMount">
      {/* ========================================================== */}
      {/* 1. LAUNCH MOUNT STRUCTURE (Beams & Hold-Down Clamps)       */}
      {/* ========================================================== */}
      <group position={[0, 0, 0]} name="LaunchMount">
        {/* Ring Base Platform */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[2.8, 3.2, 0.6, 16]} />
          <meshStandardMaterial color="#3f3f46" roughness={0.6} metalness={0.7} />
        </mesh>

        {/* 4 Metal Grey Support Beams connecting pad to rocket */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const x = Math.cos(angle) * 1.8;
          const z = Math.sin(angle) * 1.8;
          return (
            <group key={i} position={[x, 1.1, z]}>
              {/* Slanted main support column */}
              <mesh rotation={[0.15 * Math.sin(angle), 0, -0.15 * Math.cos(angle)]}>
                <cylinderGeometry args={[0.18, 0.22, 1.8, 8]} />
                <primitive object={darkMetalMaterial} />
              </mesh>
              {/* Hydraulic hold-down clamp claw */}
              <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[0.4, 0.3, 0.5]} />
                <meshStandardMaterial color="#eab308" roughness={0.5} metalness={0.6} />
              </mesh>
            </group>
          );
        })}

        {/* Central Engine Exhaust Collar Ring */}
        <mesh position={[0, 1.9, 0]}>
          <torusGeometry args={[1.35, 0.12, 8, 24]} />
          <meshStandardMaterial color="#52525b" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* ========================================================== */}
      {/* 2. THE ROCKET ASSEMBLY (Base at y = 2.1)                   */}
      {/* ========================================================== */}
      <group position={[0, 2.1, 0]} name="RocketVehicle">
        {/* 2a. Main Rocket Body: Cylinder (width: 2 -> r=1, height: 20) */}
        {/* Center of 20 unit cylinder is at y = 10 */}
        <mesh position={[0, 10, 0]} material={whiteHullMaterial} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 20, 36]} />
        </mesh>

        {/* 2b. Nose Cone: Red/orange cone on top (3 units tall, r=1) */}
        {/* Sits at y = 20 to y = 23 (center at y = 21.5) */}
        <mesh position={[0, 21.5, 0]} material={redAccentMaterial} castShadow>
          <coneGeometry args={[1, 3, 36]} />
        </mesh>

        {/* Tip Pitot Probe / Lightning Needle */}
        <mesh position={[0, 23.3, 0]}>
          <cylinderGeometry args={[0.03, 0.05, 0.8, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* 2c. 4 Aerodynamic Fins at the Base: Red colored, angled outward */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <group key={`fin-${i}`} rotation={[0, angle, 0]} position={[0, 1.8, 0]}>
              {/* Swept Main Fin Box */}
              <mesh position={[1.4, 0, 0]} rotation={[0, 0, -0.22]} material={redAccentMaterial} castShadow>
                <boxGeometry args={[1.1, 2.8, 0.08]} />
              </mesh>
              {/* Fin Root Fairing fillet */}
              <mesh position={[0.95, -0.4, 0]}>
                <boxGeometry args={[0.25, 3.2, 0.16]} />
                <primitive object={darkMetalMaterial} />
              </mesh>
            </group>
          );
        })}

        {/* 2d. Engine Nozzles: 3 dark grey cones pointing downward at the base */}
        {/* Placed at base inside the thrust structure */}
        {[0, 1, 2].map((i) => {
          const angle = (i * 2 * Math.PI) / 3;
          const x = Math.cos(angle) * 0.42;
          const z = Math.sin(angle) * 0.42;
          return (
            <group key={`engine-${i}`} position={[x, -0.2, z]}>
              {/* Conical Bell Nozzle pointing down */}
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.34, 0.7, 20, 1, true]} />
                <meshStandardMaterial
                  color="#1c1917"
                  roughness={0.6}
                  metalness={0.9}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {/* Glowing internal throat ignition ring */}
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.18, 0.15, 0.2, 12]} />
                <meshStandardMaterial
                  color="#f97316"
                  emissive="#ea580c"
                  emissiveIntensity={0.6}
                />
              </mesh>
            </group>
          );
        })}

        {/* 2e. Windows: 4 small blue emissive circles on upper body */}
        {[18.2, 17.2, 16.2, 15.2].map((yPos, idx) => (
          <group key={`window-${idx}`} position={[0, yPos, 1.01]}>
            {/* Outer window bezel rim */}
            <mesh>
              <ringGeometry args={[0.16, 0.22, 24]} />
              <primitive object={darkMetalMaterial} />
            </mesh>
            {/* Emissive circular pane */}
            <mesh position={[0, 0, 0.005]}>
              <circleGeometry args={[0.16, 24]} />
              <primitive object={windowMaterial} />
            </mesh>
          </group>
        ))}

        {/* 2f. Crew Hatch / Door: Animating Door aligned with Gantry Walkway Bridge */}
        {/* Positioned at y = 16.8 on rocket (world y = 18.9) at walkway interface */}
        <group position={[-1.01, 16.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          {/* Outer hatch frame fixed to the hull */}
          <mesh>
            <planeGeometry args={[0.96, 1.8]} />
            <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} />
          </mesh>

          {/* Door Hinge Pivot on the side (x = -0.42) */}
          <group ref={doorHingeRef} position={[-0.42, 0, 0]}>
            {/* Inner door panel offset from hinge */}
            <mesh position={[0.42, 0, 0.018]}>
              <planeGeometry args={[0.82, 1.64]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Metallic Door Latch Handle */}
            <mesh position={[0.72, 0, 0.05]}>
              <boxGeometry args={[0.06, 0.26, 0.04]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Hatch Status Indicator Light */}
            <mesh position={[0.42, 0.72, 0.035]}>
              <circleGeometry args={[0.045, 12]} />
              <meshBasicMaterial color={isDoorOpen ? '#38bdf8' : '#10b981'} />
            </mesh>
          </group>

          {/* Floating UI prompt above the door when player is nearby (within 3 units) */}
          {showDoorPrompt && (
            <group position={[0, 1.35, 0.45]}>
              <Billboard follow={true}>
                {/* Glowing cyan outline blur halo */}
                <mesh position={[0, 0, -0.02]}>
                  <planeGeometry args={[3.08, 0.86]} />
                  <meshBasicMaterial color="#06b6d4" transparent opacity={0.45} />
                </mesh>
                {/* Glowing cyan outline stroke */}
                <mesh position={[0, 0, -0.01]}>
                  <planeGeometry args={[2.95, 0.74]} />
                  <meshBasicMaterial color="#22d3ee" />
                </mesh>
                {/* Dark semi-transparent card background */}
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[2.84, 0.63]} />
                  <meshBasicMaterial color="#090d16" transparent opacity={0.94} />
                </mesh>
                {/* Cyan glowing text: "Press E to Enter Rocket" */}
                <Text
                  fontSize={0.175}
                  color="#67e8f9"
                  anchorX="center"
                  anchorY="middle"
                  position={[0, 0, 0.02]}
                  letterSpacing={0.06}
                >
                  Press E to Enter Rocket
                </Text>
              </Billboard>
            </group>
          )}
        </group>

        {/* 2g. Indian National Flag (Tiranga) Decals on Rocket Fuselage (+Z & +X sides) */}
        <mesh position={[0, 13.8, 1.01]}>
          <planeGeometry args={[1.25, 0.82]} />
          <meshStandardMaterial
            map={flagTexture}
            roughness={0.35}
            metalness={0.1}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <mesh position={[1.01, 13.8, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.25, 0.82]} />
          <meshStandardMaterial
            map={flagTexture}
            roughness={0.35}
            metalness={0.1}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>

        {/* 2h. "SOL-7" Bold Text Label on the body */}
        <group position={[0, 10.4, 1.01]}>
          <Text
            fontSize={0.85}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            SOL-7
          </Text>
        </group>

        {/* Second "SOL-7" label on the opposite side (+X) */}
        <group position={[1.01, 10.4, 0]} rotation={[0, Math.PI / 2, 0]}>
          <Text
            fontSize={0.85}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            SOL-7
          </Text>
        </group>

        {/* 2i. Panel Lines & Mechanical Detailing along the body */}
        {/* Circumferential stage separation interstage rings */}
        {[6.2, 12.5, 18.8].map((yRing) => (
          <mesh key={`ring-${yRing}`} position={[0, yRing, 0]}>
            <cylinderGeometry args={[1.015, 1.015, 0.08, 36]} />
            <primitive object={darkMetalMaterial} />
          </mesh>
        ))}

        {/* Longitudinal Cable Raceway / Umbilical Conduit Cover */}
        <mesh position={[0, 9.8, -1.01]}>
          <boxGeometry args={[0.16, 17.5, 0.06]} />
          <meshStandardMaterial color="#475569" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* LOX Feed Pipe Fairings running along opposite flanks */}
        <mesh position={[0.98, 7.5, 0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 12, 12]} />
          <primitive object={whiteHullMaterial} />
        </mesh>
        <mesh position={[-0.98, 7.5, 0.3]}>
          <cylinderGeometry args={[0.06, 0.06, 12, 12]} />
          <primitive object={whiteHullMaterial} />
        </mesh>
      </group>
    </group>
  );
};
