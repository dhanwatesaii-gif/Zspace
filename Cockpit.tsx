import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { soundManager } from '../../utils/audio';

interface CockpitProps {
  onLaunch?: () => void;
  isLaunching?: boolean;
  isCountingDown?: boolean;
  countdownSeconds?: number | null;
}

export const Cockpit: React.FC<CockpitProps> = ({
  onLaunch,
  isLaunching = false,
  isCountingDown = false,
  countdownSeconds = null,
}) => {
  const { camera } = useThree();
  const launchButtonRef = useRef<THREE.Mesh>(null);
  const blinkingLightsRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Blinking dashboard indicator lights (18 lights)
  const LIGHT_COUNT = 18;
  const lightsData = useMemo(() => {
    return Array.from({ length: LIGHT_COUNT }).map((_, i) => ({
      x: -0.85 + (i % 6) * 0.34,
      y: 0.15 - Math.floor(i / 6) * 0.18,
      z: -0.72 - Math.pow((i % 6) - 2.5, 2) * 0.025,
      rate: 1.5 + (i % 5) * 0.8,
      phase: i * 0.7,
      baseColor:
        i % 4 === 0
          ? new THREE.Color('#22c55e') // Green
          : i % 4 === 1
          ? new THREE.Color('#38bdf8') // Cyan
          : i % 4 === 2
          ? new THREE.Color('#f59e0b') // Amber
          : new THREE.Color('#ef4444'), // Red
    }));
  }, []);

  // Pulse animation for the big red LAUNCH button
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Pulse red launch button
    if (launchButtonRef.current) {
      const pulse = 1 + Math.sin(t * 5.0) * 0.08;
      launchButtonRef.current.scale.set(pulse, pulse, pulse);
      const mat = launchButtonRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = isLaunching ? 2.5 : 1.2 + Math.sin(t * 6.0) * 0.6;
      }
    }

    // Toggle blinking lights
    if (blinkingLightsRef.current) {
      for (let i = 0; i < LIGHT_COUNT; i++) {
        const d = lightsData[i];
        const isOn = Math.sin(t * d.rate + d.phase) > 0.1;
        dummy.position.set(d.x, d.y, d.z);
        dummy.scale.set(0.045, 0.045, 0.045);
        dummy.updateMatrix();

        blinkingLightsRef.current.setMatrixAt(i, dummy.matrix);
        blinkingLightsRef.current.setColorAt(
          i,
          isOn ? d.baseColor : new THREE.Color('#18181b')
        );
      }
      blinkingLightsRef.current.instanceMatrix.needsUpdate = true;
      if (blinkingLightsRef.current.instanceColor) {
        blinkingLightsRef.current.instanceColor.needsUpdate = true;
      }
    }

    // Subtle dashboard glow response
  });

  return (
    <group position={[0, 18.5, 0]} name="CockpitInterior">
      {/* ============================================================ */}
      {/* 1. COCKPIT INTERIOR SHELL & WARM CABIN LIGHT                 */}
      {/* ============================================================ */}
      {/* Cylindrical cabin enclosure */}
      <mesh>
        <cylinderGeometry args={[0.96, 0.96, 2.2, 24, 1, true]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.7}
          metalness={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ceiling & Floor Plates */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.96, 0.96, 0.05, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.96, 0.96, 0.05, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Soft Cyan/Amber Cockpit Ambient Glow */}
      <pointLight position={[0, 0.6, 0]} color="#38bdf8" intensity={1.8} distance={3.5} />
      <pointLight position={[0, -0.4, -0.4]} color="#f97316" intensity={1.2} distance={2.5} />

      {/* ============================================================ */}
      {/* 2. ROUND CABIN WINDOW TO OUTSIDE WORLD                       */}
      {/* ============================================================ */}
      {/* Placed on +Z flank overlooking launch tower and dawn sky */}
      <group position={[0, 0.35, 0.95]} rotation={[0, 0, 0]}>
        {/* Metallic Bezel Ring */}
        <mesh>
          <torusGeometry args={[0.32, 0.05, 12, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Anti-reflective Optical Glass Pane */}
        <mesh position={[0, 0, 0.01]}>
          <circleGeometry args={[0.31, 24]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transmission={0.92}
            opacity={0.3}
            transparent
            roughness={0.05}
            ior={1.5}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 3. ERGONOMIC PILOT SEAT & SEATED ASTRONAUT CREW              */}
      {/* ============================================================ */}
      <group position={[0, -0.35, 0.45]}>
        {/* Seat Base Pedestal */}
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.15, 0.22, 0.5, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Seat Cushion */}
        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[0.62, 0.16, 0.58]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Ergonomic Backrest */}
        <mesh position={[0, 0.32, 0.24]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[0.56, 0.82, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Padded Headrest */}
        <mesh position={[0, 0.82, 0.32]}>
          <boxGeometry args={[0.36, 0.24, 0.16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        {/* Left & Right Flight Control Armrests */}
        <mesh position={[-0.34, 0.05, -0.05]}>
          <boxGeometry args={[0.1, 0.32, 0.44]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.34, 0.05, -0.05]}>
          <boxGeometry args={[0.1, 0.32, 0.44]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Flight Joystick on Right Armrest */}
        <mesh position={[0.34, 0.28, -0.12]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.18, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh position={[0.34, 0.38, -0.1]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>

        {/* 3b. SEATED ASTRONAUT PILOT IN SUIT */}
        <group position={[0, 0.02, 0.05]}>
          {/* Torso */}
          <mesh position={[0, 0.24, 0]}>
            <boxGeometry args={[0.42, 0.5, 0.3]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>
          {/* Mission Patch on Torso */}
          <mesh position={[0.1, 0.32, -0.155]}>
            <boxGeometry args={[0.09, 0.06, 0.01]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          {/* Life support backpack */}
          <mesh position={[0, 0.26, 0.2]}>
            <boxGeometry args={[0.36, 0.42, 0.14]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          {/* Oxygen tanks on backpack */}
          <mesh position={[-0.1, 0.26, 0.28]}>
            <cylinderGeometry args={[0.045, 0.045, 0.34, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.1, 0.26, 0.28]}>
            <cylinderGeometry args={[0.045, 0.045, 0.34, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Helmet */}
          <mesh position={[0, 0.62, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          {/* Helmet Gold Visor (facing forward toward dashboard and mirror) */}
          <mesh position={[0, 0.62, -0.13]} scale={[1, 0.85, 0.6]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshPhysicalMaterial
              color="#d97706"
              emissive="#b45309"
              emissiveIntensity={0.2}
              roughness={0.08}
              metalness={0.95}
              clearcoat={1.0}
            />
          </mesh>
          {/* Antenna */}
          <mesh position={[0, 0.86, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.93, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>

          {/* Seated Thighs (extending forward towards console) */}
          <mesh position={[-0.13, -0.06, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.32, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[0.13, -0.06, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.32, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* Lower Legs (bent down to floor) */}
          <mesh position={[-0.13, -0.26, -0.34]}>
            <cylinderGeometry args={[0.08, 0.08, 0.34, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[0.13, -0.26, -0.34]}>
            <cylinderGeometry args={[0.08, 0.08, 0.34, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>

          {/* Space Boots */}
          <mesh position={[-0.13, -0.42, -0.36]}>
            <boxGeometry args={[0.14, 0.1, 0.22]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>
          <mesh position={[0.13, -0.42, -0.36]}>
            <boxGeometry args={[0.14, 0.1, 0.22]} />
            <meshStandardMaterial color="#334155" roughness={0.8} />
          </mesh>

          {/* Arms reaching to controls */}
          <mesh position={[-0.26, 0.18, -0.12]} rotation={[0.6, 0.2, -0.2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.32, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[0.26, 0.18, -0.12]} rotation={[0.6, -0.2, 0.2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.32, 10]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          {/* Gloves on controls */}
          <mesh position={[-0.30, 0.04, -0.26]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0.30, 0.04, -0.26]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 4. CURVED COCKPIT DASHBOARD & CONTROL PANELS                 */}
      {/* ============================================================ */}
      <group position={[0, 0, -0.1]}>
        {/* Main Curved Dashboard Console Table */}
        <mesh position={[0, -0.22, -0.65]} rotation={[0.26, 0, 0]}>
          <boxGeometry args={[1.5, 0.55, 0.48]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.4} />
        </mesh>

        {/* Console Bevel Apron Lip */}
        <mesh position={[0, -0.42, -0.48]}>
          <boxGeometry args={[1.54, 0.12, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* ============================================================ */}
        {/* 5. MULTI-FUNCTION DISPLAY SCREENS (Colored rectangles)       */}
        {/* ============================================================ */}

        {/* 5a. MAIN CENTER SCREEN: "LAUNCH SEQUENCE READY" */}
        <group position={[0, 0.12, -0.74]} rotation={[-0.22, 0, 0]}>
          {/* Outer Screen Bezel Frame */}
          <mesh>
            <boxGeometry args={[0.72, 0.44, 0.03]} />
            <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Glowing Display Surface */}
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[0.68, 0.4]} />
            <meshBasicMaterial color="#022c22" />
          </mesh>

          {/* Main Title Text */}
          <group position={[0, 0.08, 0.022]}>
            <Text
              fontSize={0.046}
              color={
                isLaunching
                  ? '#ef4444'
                  : isCountingDown
                  ? '#f59e0b'
                  : '#34d399'
              }
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.10}
            >
              {isLaunching
                ? 'LIFTOFF! ASCENDING TO ORBIT'
                : isCountingDown
                ? `COUNTDOWN: T - ${countdownSeconds ?? 0}s`
                : 'LAUNCH SEQUENCE READY'}
            </Text>
          </group>

          {/* Subtitle Telemetry Readings on Screen */}
          <group position={[0, -0.02, 0.022]}>
            <Text
              fontSize={0.028}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
            >
              {isCountingDown
                ? 'ALL ENGINES ARMED • TERMINAL COUNT'
                : 'STAGE 1 CRYO LOX: 100% • TANK PRESSURE: 142 PSI'}
            </Text>
          </group>
          <group position={[0, -0.08, 0.022]}>
            <Text
              fontSize={0.028}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.08}
            >
              {isCountingDown
                ? 'RANGE SAFETY: ARMED • GO FOR FLIGHT'
                : 'ATTITUDE: 0.0° • TARGET ORBIT: 240 KM • STATUS: GO'}
            </Text>
          </group>
        </group>

        {/* Chrome Rearview Inspection Mirror above Dashboard */}
        <group position={[0, 0.44, -0.62]} rotation={[-0.1, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.34, 0.12, 0.02]} />
            <meshStandardMaterial color="#090d16" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <planeGeometry args={[0.31, 0.09]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.05} />
          </mesh>
        </group>

        {/* 5b. LEFT TELEMETRY SCREEN: Trajectory Diagram */}
        <group position={[-0.58, 0.05, -0.66]} rotation={[-0.2, 0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.34, 0.03]} />
            <meshStandardMaterial color="#090d16" />
          </mesh>
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[0.39, 0.31]} />
            <meshBasicMaterial color="#082f49" />
          </mesh>
          {/* Left Screen Text */}
          <group position={[0, 0.09, 0.022]}>
            <Text fontSize={0.032} color="#38bdf8" anchorX="center" anchorY="middle">
              TRAJECTORY / NAV
            </Text>
          </group>
          {/* Simulated flight horizon bar */}
          <mesh position={[0, -0.02, 0.02]}>
            <planeGeometry args={[0.28, 0.02]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        {/* 5c. RIGHT TELEMETRY SCREEN: Propulsion Engine Bay */}
        <group position={[0.58, 0.05, -0.66]} rotation={[-0.2, -0.35, 0]}>
          <mesh>
            <boxGeometry args={[0.42, 0.34, 0.03]} />
            <meshStandardMaterial color="#090d16" />
          </mesh>
          <mesh position={[0, 0, 0.016]}>
            <planeGeometry args={[0.39, 0.31]} />
            <meshBasicMaterial color="#1e1b4b" />
          </mesh>
          <group position={[0, 0.09, 0.022]}>
            <Text fontSize={0.032} color="#a855f7" anchorX="center" anchorY="middle">
              MAIN PROPULSION
            </Text>
          </group>
          {/* Engine chamber temperature bars */}
          {[-0.08, 0, 0.08].map((ex, ei) => (
            <mesh key={ei} position={[ex, -0.03, 0.02]}>
              <planeGeometry args={[0.04, 0.12]} />
              <meshBasicMaterial color={ei === 1 ? '#22c55e' : '#06b6d4'} />
            </mesh>
          ))}
        </group>

        {/* ============================================================ */}
        {/* 6. BIG RED "LAUNCH" BUTTON (Cylinder, glowing red, pulsing)  */}
        {/* ============================================================ */}
        <group position={[0, -0.21, -0.48]} rotation={[0.26, 0, 0]}>
          {/* Yellow Hazard Border Collar */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.14, 0.06, 24]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>

          {/* Big Glowing Red Launch Button */}
          <mesh
            ref={launchButtonRef}
            position={[0, 0.04, 0]}
            onClick={() => {
              if (onLaunch) onLaunch();
            }}
          >
            <cylinderGeometry args={[0.10, 0.10, 0.07, 24]} />
            <meshStandardMaterial
              color="#dc2626"
              emissive="#ef4444"
              emissiveIntensity={1.4}
              roughness={0.2}
              metalness={0.3}
            />
          </mesh>

          {/* Stenciled "LAUNCH" Label on Button Face */}
          <group position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Text
              fontSize={0.028}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.12}
            >
              LAUNCH
            </Text>
          </group>
        </group>

        {/* ============================================================ */}
        {/* 7. BLINKING LIGHTS AND BUTTONS ON DASHBOARD                  */}
        {/* ============================================================ */}
        <instancedMesh
          ref={blinkingLightsRef}
          args={[undefined, undefined, LIGHT_COUNT]}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshBasicMaterial />
        </instancedMesh>
      </group>
    </group>
  );
};
