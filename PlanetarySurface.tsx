import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Destination } from './SpaceOrbitNav';
import {
  getFlagTexture,
  getRegolithTexture,
  getSolarPanelTexture,
  getMetalHullTexture,
  getSuitFabricTexture,
  getEarthTexture,
} from '../../utils/proceduralTextures';
import { StoryChapterId, STORY_CHAPTERS, InteractableTargetId } from '../../data/storyMissionData';
import { Cockpit } from './Cockpit';
import { ViewMode } from './ThirdPersonCamera';

interface PlanetarySurfaceProps {
  destination: Destination;
  viewMode?: ViewMode;
  isDescentPhase?: boolean;
  descentProgress?: number; // 0.0 to 1.0
  isAirlockOpen?: boolean;
  onNearAirlockChange?: (isNear: boolean) => void;
  astronautPos?: THREE.Vector3;
  activeChapterId?: StoryChapterId;
  elevatorPosY?: number;
  returnRocketYRef?: React.MutableRefObject<number>;
  countdownSeconds?: number | null;
  onLaunchReturnRocket?: () => void;
  onNearTargetChange?: (targetId: InteractableTargetId | null, distance: number) => void;
}

/**
 * Reusable 3D NPC Crew Member (Systems Engineer Raj, Engineer Leo, or Dr. Sarah)
 * - RAJ: Crimson Red & Matte Charcoal (#B71C1C / #37474F), Ruby-tinted reflective visor, Indian Flag shoulder patch.
 * - ENGINEER LEO: High-visibility Aerospace Hazard Orange (#E65100), dark grey heavy reinforcement knee/elbow pads,
 *   polished Amber/Copper visor, industrial matte dark grey backpack with blinking battery LEDs, Indian Flag shoulder patch.
 * - DR. SARAH: Medical Teal / Cyan & Light Grey (#00838F / #ECEFF1), polished Emerald-tinted visor,
 *   medical bio-sensor display panel on forearm sleeve, Indian Flag shoulder patch.
 */
const CrewMemberNPC: React.FC<{
  crewVariant: 'RAJ' | 'LEO' | 'SARAH';
  nameBadge: string;
  roleTitle: string;
  stripeColor: string;
  homePos: [number, number, number];
  homeFacing: number;
  followPlayer: boolean;
  followOffset: [number, number];
  playerPos?: THREE.Vector3;
  isBoardingElevator: boolean;
  elevatorPosY: number;
  isVisible: boolean;
}> = ({
  crewVariant,
  nameBadge,
  roleTitle,
  stripeColor,
  homePos,
  homeFacing,
  followPlayer,
  followOffset,
  playerPos,
  isBoardingElevator,
  elevatorPosY,
  isVisible,
}) => {
  const isRaj = crewVariant === 'RAJ';
  const isLeo = crewVariant === 'LEO';
  const isSarah = crewVariant === 'SARAH';
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const led1Ref = useRef<THREE.Mesh>(null);
  const led2Ref = useRef<THREE.Mesh>(null);
  const led3Ref = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(homePos[0], homePos[1], homePos[2]));
  const currentYaw = useRef(homeFacing);

  const suitTex = useMemo(() => getSuitFabricTexture(), []);
  const flagTexture = useMemo(() => getFlagTexture(), []);

  const primarySuitMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isRaj ? '#B71C1C' : isLeo ? '#E65100' : '#00838F',
        map: suitTex,
        bumpMap: suitTex,
        bumpScale: 0.016,
        roughness: 0.45,
        metalness: 0.26,
      }),
    [isRaj, isLeo, suitTex]
  );

  const secondarySuitMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isRaj ? '#37474F' : isLeo ? '#263238' : '#ECEFF1',
        map: suitTex,
        bumpMap: suitTex,
        bumpScale: 0.014,
        roughness: 0.5,
        metalness: 0.28,
      }),
    [isRaj, isLeo, suitTex]
  );

  const darkReinforcedMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isRaj ? '#37474F' : '#212121',
        roughness: 0.65,
        metalness: 0.35,
      }),
    [isRaj]
  );

  const visorMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: isRaj ? '#E11D48' : isLeo ? '#FF8F00' : '#00E676',
        emissive: isRaj ? '#881337' : isLeo ? '#B45309' : '#047857',
        emissiveIntensity: 0.24,
        roughness: 0.1,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      }),
    [isRaj, isLeo]
  );

  useFrame(({ clock }, delta) => {
    if (!groupRef.current || !isVisible) return;
    const t = clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    if (isLeo) {
      if (led1Ref.current) {
        (led1Ref.current.material as THREE.MeshBasicMaterial).color.set(
          Math.sin(t * 4.5) > -0.2 ? '#22c55e' : '#14532d'
        );
      }
      if (led2Ref.current) {
        (led2Ref.current.material as THREE.MeshBasicMaterial).color.set(
          Math.sin(t * 4.5 + 1.5) > -0.2 ? '#f59e0b' : '#78350f'
        );
      }
      if (led3Ref.current) {
        (led3Ref.current.material as THREE.MeshBasicMaterial).color.set(
          Math.sin(t * 6.0) > 0.0 ? '#38bdf8' : '#0c4a6e'
        );
      }
    }

    if (isBoardingElevator) {
      currentPos.current.set(-4.2 + followOffset[0] * 0.25, elevatorPosY, 18.0 + followOffset[1] * 0.25);
      currentYaw.current = Math.PI / 2;
      groupRef.current.position.copy(currentPos.current);
      groupRef.current.rotation.y = currentYaw.current;
      return;
    }

    let isWalking = false;

    if (followPlayer && playerPos) {
      const targetX = playerPos.x + followOffset[0];
      const targetZ = playerPos.z + followOffset[1];
      const dx = targetX - currentPos.current.x;
      const dz = targetZ - currentPos.current.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1.4) {
        isWalking = true;
        const moveStep = Math.min(dist, 5.2 * dt);
        currentPos.current.x += (dx / dist) * moveStep;
        currentPos.current.z += (dz / dist) * moveStep;
        currentYaw.current = Math.atan2(dx, dz);
      } else {
        const lookDx = playerPos.x - currentPos.current.x;
        const lookDz = playerPos.z - currentPos.current.z;
        currentYaw.current = Math.atan2(lookDx, lookDz);
      }
    } else {
      const dx = homePos[0] - currentPos.current.x;
      const dz = homePos[2] - currentPos.current.z;
      const distHome = Math.hypot(dx, dz);
      if (distHome > 0.2) {
        currentPos.current.x += dx * dt * 2.5;
        currentPos.current.z += dz * dt * 2.5;
      }
      if (playerPos) {
        const pDist = Math.hypot(playerPos.x - currentPos.current.x, playerPos.z - currentPos.current.z);
        if (pDist < 10) {
          currentYaw.current = Math.atan2(
            playerPos.x - currentPos.current.x,
            playerPos.z - currentPos.current.z
          );
        } else {
          currentYaw.current = homeFacing;
        }
      }
    }

    groupRef.current.position.copy(currentPos.current);
    groupRef.current.rotation.y = currentYaw.current;

    if (isWalking) {
      const swing = Math.sin(t * 9.0) * 0.55;
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = swing;
        rightLegRef.current.rotation.x = -swing;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.x = -swing;
        rightArmRef.current.rotation.x = swing;
      }
    } else {
      if (leftLegRef.current && rightLegRef.current) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.45 + Math.sin(t * 2.5) * 0.15;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.08;
      }
    }
  });

  return (
    <group ref={groupRef} position={homePos} visible={isVisible}>
      {/* Floating Nameplate above Crew Member */}
      <group position={[0, 3.25, 0]}>
        <mesh>
          <planeGeometry args={[2.0, 0.44]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
        <Text
          position={[0, 0.06, 0.02]}
          fontSize={0.14}
          color={stripeColor}
          anchorX="center"
          anchorY="middle"
        >
          {nameBadge}
        </Text>
        <Text
          position={[0, -0.1, 0.02]}
          fontSize={0.085}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
        >
          {roleTitle}
        </Text>
      </group>

      {/* Torso */}
      <group position={[0, 1.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.44, 1.38, 18]} />
          <primitive object={primarySuitMat} />
        </mesh>
        <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.495, 0.49, 0.2, 18]} />
          <primitive object={secondarySuitMat} />
        </mesh>
        <mesh position={[0, -0.32, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.465, 0.46, 0.18, 18]} />
          <primitive object={secondarySuitMat} />
        </mesh>

        {/* Chest Telemetry Unit + Indian Flag Badge */}
        <group position={[0, 0.12, 0.46]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.48, 0.38, 0.08]} />
            <primitive object={darkReinforcedMat} />
          </mesh>
          <mesh position={[0.13, 0.08, 0.045]}>
            <planeGeometry args={[0.14, 0.09]} />
            <meshStandardMaterial map={flagTexture} roughness={0.35} />
          </mesh>
          <mesh position={[-0.12, 0.08, 0.045]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshBasicMaterial color={isLeo ? '#f59e0b' : '#00E676'} />
          </mesh>
        </group>

        {/* Life-Support Backpack */}
        <group position={[0, 0.05, -0.45]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.76, 1.15, 0.44]} />
            <primitive object={isLeo ? darkReinforcedMat : secondarySuitMat} />
          </mesh>
          {isLeo && (
            <group position={[0, 0.25, -0.23]}>
              <mesh ref={led1Ref} position={[-0.18, 0, 0]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshBasicMaterial color="#22c55e" />
              </mesh>
              <mesh ref={led2Ref} position={[0, 0, 0]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshBasicMaterial color="#f59e0b" />
              </mesh>
              <mesh ref={led3Ref} position={[0.18, 0, 0]}>
                <sphereGeometry args={[0.045, 10, 10]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            </group>
          )}
        </group>

        {/* Helmet & Tinted Visor */}
        <group position={[0, 0.96, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.48, 22, 18]} />
            <primitive object={isLeo ? primarySuitMat : secondarySuitMat} />
          </mesh>
          <mesh position={[0, 0.24, 0.11]} rotation={[0.3, 0, 0]} castShadow>
            <torusGeometry args={[0.43, 0.045, 10, 22, Math.PI]} />
            <primitive object={isLeo ? darkReinforcedMat : primarySuitMat} />
          </mesh>
          <mesh position={[0, 0.04, 0.21]} scale={[0.85, 0.72, 0.65]} castShadow>
            <sphereGeometry args={[0.44, 20, 18]} />
            <primitive object={visorMat} />
          </mesh>
        </group>
      </group>

      {/* Left Arm with Miniature Indian Flag Shoulder Patch & Elbow Pad */}
      <group ref={leftArmRef} position={[-0.65, 2.02, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.25, 12, 12]} />
          <primitive object={primarySuitMat} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.22, 1.05, 12]} />
          <primitive object={isLeo ? primarySuitMat : secondarySuitMat} />
        </mesh>
        <mesh position={[-0.22, -0.24, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial map={flagTexture} roughness={0.35} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.56, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.228, 0.228, 0.16, 12]} />
          <primitive object={isLeo ? darkReinforcedMat : primarySuitMat} />
        </mesh>
        <mesh position={[0, -1.18, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.23, 12, 12]} />
          <primitive object={darkReinforcedMat} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.65, 2.02, 0]}>
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.25, 12, 12]} />
          <primitive object={primarySuitMat} />
        </mesh>
        <mesh position={[0, -0.58, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.22, 1.05, 12]} />
          <primitive object={isLeo ? primarySuitMat : secondarySuitMat} />
        </mesh>
        <mesh position={[0, -0.56, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.228, 0.228, 0.16, 12]} />
          <primitive object={isLeo ? darkReinforcedMat : primarySuitMat} />
        </mesh>
        {(isSarah || isRaj) && (
          <group position={[0.18, -0.82, 0.08]} rotation={[0, 0.35, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.26, 0.16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
            <mesh position={[0.045, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.13, 0.22]} />
              <meshBasicMaterial color={isRaj ? '#E11D48' : '#00E676'} />
            </mesh>
          </group>
        )}
        <mesh position={[0, -1.18, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.23, 12, 12]} />
          <primitive object={darkReinforcedMat} />
        </mesh>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-0.26, 1.45, 0]}>
        <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.26, 1.18, 14]} />
          <primitive object={primarySuitMat} />
        </mesh>
        <mesh position={[0, -0.62, 0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.268, 0.268, 0.2, 14]} />
          <primitive object={isLeo || isRaj ? darkReinforcedMat : secondarySuitMat} />
        </mesh>
        <mesh position={[0, -1.28, 0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.28, 0.48]} />
          <primitive object={darkReinforcedMat} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.26, 1.45, 0]}>
        <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.26, 1.18, 14]} />
          <primitive object={primarySuitMat} />
        </mesh>
        <mesh position={[0, -0.62, 0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.268, 0.268, 0.2, 14]} />
          <primitive object={isLeo || isRaj ? darkReinforcedMat : secondarySuitMat} />
        </mesh>
        <mesh position={[0, -1.28, 0.06]} castShadow receiveShadow>
          <boxGeometry args={[0.38, 0.28, 0.48]} />
          <primitive object={darkReinforcedMat} />
        </mesh>
      </group>
    </group>
  );
};

export const PlanetarySurface: React.FC<PlanetarySurfaceProps> = ({
  destination,
  viewMode = 'PLANET_SURFACE',
  isDescentPhase = false,
  descentProgress = 1.0,
  isAirlockOpen = false,
  onNearAirlockChange,
  astronautPos,
  activeChapterId = 'CHAPTER_1_DONKI',
  elevatorPosY = 0.0,
  returnRocketYRef,
  countdownSeconds = null,
  onLaunchReturnRocket,
  onNearTargetChange,
}) => {
  const isMoon = destination === 'MOON';
  const flagTexture = useMemo(() => getFlagTexture(), []);
  const regolithTexture = useMemo(() => getRegolithTexture(isMoon), [isMoon]);
  const solarTexture = useMemo(() => getSolarPanelTexture(), []);
  const hullTexture = useMemo(() => getMetalHullTexture(), []);
  const earthTexture = useMemo(() => getEarthTexture(), []);

  // Animated scene refs
  const dishRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);
  const solarArraysRef = useRef<THREE.Group>(null);
  const waypointArrowRef = useRef<THREE.Group>(null);
  const dustMotesRef = useRef<THREE.InstancedMesh>(null);
  const descentDustRef = useRef<THREE.InstancedMesh>(null);
  const shockwaveRingRef = useRef<THREE.Mesh>(null);
  const returnRocketGroupRef = useRef<THREE.Group>(null);
  const returnPlumeRef = useRef<THREE.Group>(null);
  const wavingFlagGeoRef = useRef<THREE.PlaneGeometry>(null);

  const isReturnFlight =
    viewMode === 'IN_FLIGHT_WINDOW' || viewMode === 'IN_FLIGHT_CINEMATIC';
  const isCockpitOrFlight =
    viewMode === 'COCKPIT' ||
    viewMode === 'COUNTDOWN' ||
    viewMode === 'IN_FLIGHT_WINDOW' ||
    viewMode === 'IN_FLIGHT_CINEMATIC';

  // Black Starfield for Moon sky (1,800 stars)
  const lunarStarsGeo = useMemo(() => {
    const COUNT = 1800;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.48; // Upper hemisphere above horizon
      const r = 210 + Math.random() * 50;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) + 8;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Atmospheric dust motes around base floodlights
  const MOTE_COUNT = 80;
  const moteDummy = useMemo(() => new THREE.Object3D(), []);
  const motesData = useMemo(() => {
    return Array.from({ length: MOTE_COUNT }).map(() => ({
      x: (Math.random() - 0.5) * 42,
      y: 0.8 + Math.random() * 9.5,
      z: -18 + (Math.random() - 0.5) * 36,
      speedY: 0.15 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Descent Touchdown Dust Spray / Mars Swirling Dust Storm Particles (90 instanced puffs)
  const DESCENT_DUST_COUNT = 90;
  const descentDustDummy = useMemo(() => new THREE.Object3D(), []);
  const descentDustData = useMemo(() => {
    return Array.from({ length: DESCENT_DUST_COUNT }).map((_, i) => ({
      angle: (i / DESCENT_DUST_COUNT) * Math.PI * 2 + (i % 5) * 0.15,
      speedR: 3.5 + (i % 7) * 1.4,
      speedY: 1.2 + (i % 4) * 0.9,
      phase: (i * 0.37) % 1.0,
      baseScale: 0.45 + (i % 5) * 0.28,
    }));
  }, []);

  // Surface footprints ring buffer (last 48 footprints)
  const [footprints, setFootprints] = useState<Array<{ x: number; z: number; rot: number; id: number }>>([]);
  const lastFootprintPos = useRef(new THREE.Vector3(999, 0, 999));
  const footprintIdCounter = useRef(0);

  // Determine current active waypoint from story chapter
  const currentChapterConfig =
    activeChapterId !== 'MISSION_COMPLETE' ? STORY_CHAPTERS[activeChapterId] : null;

  useEffect(() => {
    if (!astronautPos || isDescentPhase) return;
    const dist = Math.hypot(
      astronautPos.x - lastFootprintPos.current.x,
      astronautPos.z - lastFootprintPos.current.z
    );
    if (dist >= 0.8) {
      lastFootprintPos.current.copy(astronautPos);
      footprintIdCounter.current += 1;
      setFootprints((prev) => {
        const next = [
          ...prev,
          {
            x: astronautPos.x,
            z: astronautPos.z,
            rot: Math.random() * 0.4 - 0.2,
            id: footprintIdCounter.current,
          },
        ];
        return next.slice(-48);
      });
    }
  }, [astronautPos, isDescentPhase]);

  const terrainMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isMoon ? '#546E7A' : '#B7410E',
        map: regolithTexture,
        bumpMap: regolithTexture,
        bumpScale: 0.06,
        roughness: 0.86,
        metalness: 0.06,
      }),
    [isMoon, regolithTexture]
  );

  const mliGoldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.28,
        metalness: 0.88,
      }),
    []
  );

  const habitatWhiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        map: hullTexture,
        bumpMap: hullTexture,
        bumpScale: 0.015,
        roughness: 0.42,
        metalness: 0.25,
      }),
    [hullTexture]
  );

  const solarCellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: solarTexture,
        roughness: 0.2,
        metalness: 0.85,
      }),
    [solarTexture]
  );

  const rocksData = useMemo(() => {
    return Array.from({ length: 55 }).map((_, idx) => {
      const angle = (idx / 55) * Math.PI * 2 + (idx % 3) * 0.2;
      const r = 14 + ((idx * 17) % 65);
      return {
        pos: [Math.cos(angle) * r, 0.35 + (idx % 4) * 0.15, Math.sin(angle) * r] as [
          number,
          number,
          number,
        ],
        scale: [0.7 + (idx % 3) * 0.5, 0.45 + (idx % 2) * 0.35, 0.7 + (idx % 4) * 0.4] as [
          number,
          number,
          number,
        ],
        rot: [idx * 0.4, idx * 0.8, idx * 0.3] as [number, number, number],
      };
    });
  }, []);

  const padPos = useMemo(() => new THREE.Vector3(0, 0, 18), []);

  // Frame animations
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle cloth wave animation on the Indian National Flag (Tiranga)
    if (wavingFlagGeoRef.current) {
      const posAttr = wavingFlagGeoRef.current.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const pinFactor = Math.max(0, (vx + 1.15) / 2.3);
        const waveZ =
          Math.sin(vx * 3.2 - t * 3.8) * 0.11 * pinFactor +
          Math.cos(vy * 2.5 - t * 2.6) * 0.04 * pinFactor;
        posAttr.setZ(i, waveZ);
      }
      posAttr.needsUpdate = true;
      wavingFlagGeoRef.current.computeVertexNormals();
    }

    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.25) * 0.75 + 0.3;
      dishRef.current.rotation.x = -0.4 + Math.sin(t * 0.15) * 0.1;
    }

    if (solarArraysRef.current) {
      solarArraysRef.current.children.forEach((panel, i) => {
        panel.rotation.x = 0.35 + Math.sin(t * 0.05 + i) * 0.05;
      });
    }

    if (beaconRef.current) {
      const isBeaconOn = Math.sin(t * 4.0) > 0.2;
      (beaconRef.current.material as THREE.MeshBasicMaterial).color.set(
        isBeaconOn ? '#22d3ee' : '#0e7490'
      );
    }

    if (waypointArrowRef.current) {
      waypointArrowRef.current.position.y = 4.6 + Math.sin(t * 3.2) * 0.38;
      waypointArrowRef.current.rotation.y = t * 1.8;
    }

    if (dustMotesRef.current) {
      for (let i = 0; i < MOTE_COUNT; i++) {
        const m = motesData[i];
        const curY = ((m.y + t * m.speedY) % 9.5) + 0.5;
        const curX = m.x + Math.sin(t * 0.6 + m.phase) * 0.8;
        const curZ = m.z + Math.cos(t * 0.5 + m.phase) * 0.8;
        moteDummy.position.set(curX, curY, curZ);
        const s = 0.05 + Math.sin(t * 2.0 + m.phase) * 0.02;
        moteDummy.scale.set(s, s, s);
        moteDummy.updateMatrix();
        dustMotesRef.current.setMatrixAt(i, moteDummy.matrix);
      }
      dustMotesRef.current.instanceMatrix.needsUpdate = true;
    }

    // Descent Dust Spray (Moon white regolith spray / Mars swirling red dust storm)
    if (descentDustRef.current) {
      // Active when rocket is descending near surface (0.35..0.97) and clears after touchdown
      const isTouchdownSprayActive =
        isDescentPhase && descentProgress > 0.35 && descentProgress < 0.98;
      const fadeOut =
        descentProgress > 0.9
          ? Math.max(0, 1.0 - (descentProgress - 0.9) / 0.08)
          : Math.min(1.0, (descentProgress - 0.35) / 0.25);

      for (let i = 0; i < DESCENT_DUST_COUNT; i++) {
        if (!isTouchdownSprayActive) {
          descentDustDummy.scale.set(0, 0, 0);
          descentDustDummy.updateMatrix();
          descentDustRef.current.setMatrixAt(i, descentDustDummy.matrix);
          continue;
        }
        const d = descentDustData[i];
        const cycle = (t * 1.35 + d.phase) % 1.0;

        if (isMoon) {
          // Moon: Low-angle ballistic white/grey regolith dust spray shooting radially outward
          const rad = 1.2 + cycle * d.speedR * 2.4;
          const px = padPos.x + Math.cos(d.angle) * rad;
          const pz = padPos.z + Math.sin(d.angle) * rad;
          const py = 0.15 + Math.sin(cycle * Math.PI) * 1.6;
          const sc = d.baseScale * (1.0 - cycle * 0.5) * fadeOut;
          descentDustDummy.position.set(px, py, pz);
          descentDustDummy.scale.set(sc * 1.4, sc * 0.7, sc * 1.4);
        } else {
          // Mars: Swirling red dust storm vortex billowing upward around landing pad
          const swirlAngle = d.angle + t * 2.8 + cycle * 2.2;
          const rad = 1.5 + cycle * d.speedR * 2.1;
          const px = padPos.x + Math.cos(swirlAngle) * rad;
          const pz = padPos.z + Math.sin(swirlAngle) * rad;
          const py = 0.3 + cycle * d.speedY * 5.2;
          const sc = d.baseScale * (0.8 + cycle * 1.5) * fadeOut;
          descentDustDummy.position.set(px, py, pz);
          descentDustDummy.scale.set(sc * 1.6, sc * 1.2, sc * 1.6);
        }

        descentDustDummy.rotation.set(t + i, t * 0.7, i);
        descentDustDummy.updateMatrix();
        descentDustRef.current.setMatrixAt(i, descentDustDummy.matrix);
      }
      descentDustRef.current.instanceMatrix.needsUpdate = true;
    }

    // Expanding Ground Shockwave Ring during Mars / Moon touchdown
    if (shockwaveRingRef.current) {
      if (isDescentPhase && descentProgress > 0.55 && descentProgress < 0.98) {
        const waveCycle = (t * 1.6) % 1.0;
        const ringScale = 1.0 + waveCycle * 11.5;
        shockwaveRingRef.current.visible = true;
        shockwaveRingRef.current.scale.set(ringScale, ringScale, 1);
        (shockwaveRingRef.current.material as THREE.MeshBasicMaterial).opacity =
          (1.0 - waveCycle) * 0.65;
      } else {
        shockwaveRingRef.current.visible = false;
      }
    }

    if (astronautPos && !isDescentPhase) {
      const distToAirlock = Math.hypot(astronautPos.x - 0, astronautPos.z - -6.5);
      onNearAirlockChange?.(distToAirlock <= 3.6);

      if (currentChapterConfig && onNearTargetChange) {
        const [tx, , tz] = currentChapterConfig.targetPosition;
        const distTarget = Math.hypot(astronautPos.x - tx, astronautPos.z - tz);
        if (distTarget <= 4.5) {
          onNearTargetChange(currentChapterConfig.targetId, distTarget);
        } else {
          onNearTargetChange(null, distTarget);
        }
      }
    }

    // Update Return Rocket vertical position (Descent from orbit OR Return liftoff)
    if (returnRocketGroupRef.current) {
      const returnY = returnRocketYRef ? returnRocketYRef.current : 0;
      const descentY = isDescentPhase ? (1.0 - descentProgress) * 38.0 : 0.0;
      returnRocketGroupRef.current.position.y = descentY + returnY;
    }

    if (returnPlumeRef.current) {
      const pulse = 0.95 + Math.sin(t * 14.0) * 0.05;
      returnPlumeRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const legDeployAngle =
    Math.min(1.0, Math.max(0.0, (descentProgress - 0.4) / 0.48)) * (Math.PI / 4.2);
  const rampDeployProgress = Math.min(1.0, Math.max(0.0, (descentProgress - 0.92) / 0.08));

  const isChapter4Assemble = activeChapterId === 'CHAPTER_4_DELAY';
  const isChapter5Launch = activeChapterId === 'CHAPTER_5_LAUNCH';
  const isCrewInsideRocket =
    viewMode === 'ENTERING' ||
    viewMode === 'COCKPIT' ||
    viewMode === 'COUNTDOWN' ||
    isReturnFlight;

  return (
    <group name="PlanetarySurfaceScene">
      {/* ========================================================== */}
      {/* 1. SKY, STARFIELD, EARTHRISE & HEMISPHERE LIGHTING         */}
      {/* ========================================================== */}
      {isMoon ? (
        <group>
          {/* Crisp Black Lunar Starfield */}
          <points geometry={lunarStarsGeo}>
            <pointsMaterial color="#f8fafc" size={1.1} transparent opacity={0.92} depthWrite={false} />
          </points>

          {/* Radiant Earthrise in the lunar sky */}
          <group position={[55, 44, -110]}>
            <mesh>
              <sphereGeometry args={[15.5, 36, 36]} />
              <meshStandardMaterial
                map={earthTexture}
                roughness={0.35}
                metalness={0.1}
                emissive="#0284c7"
                emissiveIntensity={0.22}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[16.5, 32, 32]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.32}
                side={THREE.BackSide}
              />
            </mesh>
          </group>

          <ambientLight color="#FFE0B2" intensity={0.62} />
          <hemisphereLight args={['#FFE0B2', '#37474F', 0.9]} />
          <directionalLight
            position={[90, 75, 45]}
            color="#f8fafc"
            intensity={2.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-camera-left={-65}
            shadow-camera-right={65}
            shadow-camera-top={65}
            shadow-camera-bottom={-65}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-70, 35, -80]} color="#90A4AE" intensity={0.65} />
        </group>
      ) : (
        <group>
          <fog attach="fog" args={['#9C3308', isDescentPhase ? 180 : 58, isDescentPhase ? 600 : 260]} />
          <ambientLight color="#FFE0B2" intensity={0.68} />
          <hemisphereLight args={['#FFE0B2', '#5D4037', 0.9]} />
          <directionalLight
            position={[95, 65, 45]}
            color="#FFE0B2"
            intensity={2.2}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-camera-left={-65}
            shadow-camera-right={65}
            shadow-camera-top={65}
            shadow-camera-bottom={-65}
            shadow-bias={-0.0005}
          />
          <directionalLight position={[-75, 40, -65]} color="#FFE0B2" intensity={0.65} />
          <group position={[110, 26, -95]}>
            <mesh>
              <sphereGeometry args={[5.5, 24, 24]} />
              <meshBasicMaterial color="#bfdbfe" />
            </mesh>
            <pointLight color="#FFE0B2" intensity={35} distance={160} />
          </group>
        </group>
      )}

      {/* ========================================================== */}
      {/* 2. SOLID TEXTURED PLANETARY TERRAIN & CRATER RIMS          */}
      {/* ========================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[280, 280, 64, 64]} />
        <primitive object={terrainMaterial} />
      </mesh>

      {[-35, 32, -22, 45, 12, -45].map((x, i) => (
        <group key={`crater-${i}`} position={[x, 0.15, (i % 2 === 0 ? 32 : -42) + i * 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <ringGeometry args={[4.8, 8.2, 24]} />
            <meshStandardMaterial color={isMoon ? '#78909C' : '#9C3308'} roughness={0.88} />
          </mesh>
          <mesh position={[0, -0.7, 0]} receiveShadow>
            <cylinderGeometry args={[4.6, 3.2, 1.4, 24]} />
            <meshStandardMaterial color={isMoon ? '#37474F' : '#7A2405'} roughness={0.92} />
          </mesh>
        </group>
      ))}

      {rocksData.map((rk, i) => (
        <mesh
          key={`rock-${i}`}
          position={rk.pos}
          scale={rk.scale}
          rotation={rk.rot}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.75, 0]} />
          <meshStandardMaterial
            color={
              isMoon
                ? i % 2 === 0
                  ? '#546E7A'
                  : '#37474F'
                : i % 2 === 0
                ? '#5C1D0E'
                : '#7A2613'
            }
            roughness={0.85}
            metalness={0.12}
          />
        </mesh>
      ))}

      {footprints.map((fp) => (
        <mesh
          key={`fp-${fp.id}`}
          position={[fp.x, 0.02, fp.z]}
          rotation={[-Math.PI / 2, 0, fp.rot]}
        >
          <planeGeometry args={[0.26, 0.44]} />
          <meshBasicMaterial
            color={isMoon ? '#37474F' : '#5D4037'}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ========================================================== */}
      {/* 3. SURFACE LAUNCHPAD, TOUCHDOWN SHOCKWAVE & DUST SPRAY     */}
      {/* ========================================================== */}
      <group position={[padPos.x, 0.05, padPos.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[9.0, 36]} />
          <meshStandardMaterial
            color={isMoon ? '#37474F' : '#9C3308'}
            roughness={0.75}
            metalness={0.3}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[8.2, 8.7, 36]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>

        {/* Expanding Touchdown Shockwave Ring on Landing Pad */}
        <mesh
          ref={shockwaveRingRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.12, 0]}
          visible={false}
        >
          <ringGeometry args={[0.85, 1.25, 48]} />
          <meshBasicMaterial
            color={isMoon ? '#e0f2fe' : '#fdba74'}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Surface Gantry Boarding Tower & Elevator Car at (-4.2, y, 0 relative to pad) */}
        <group position={[-4.2, 0, 0]}>
          <mesh position={[-0.9, 7.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 14.4, 1.4]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
          </mesh>
          <mesh position={[1.8, 12.6, 0]} castShadow>
            <boxGeometry args={[4.2, 0.25, 1.4]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
          </mesh>
          <group position={[0, elevatorPosY, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[1.8, 0.2, 1.8]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[1.7, 2.4, 1.7]} />
              <meshPhysicalMaterial
                color="#38bdf8"
                transparent
                opacity={0.32}
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>
            <mesh position={[0, 2.65, 0]}>
              <boxGeometry args={[1.8, 0.15, 1.8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <pointLight position={[0, 2.2, 0]} color="#38bdf8" intensity={6} distance={5} />
          </group>
        </group>
      </group>

      {/* Instanced Touchdown Dust Spray (White on Moon, Swirling Red Storm on Mars) */}
      <instancedMesh
        ref={descentDustRef}
        args={[undefined, undefined, DESCENT_DUST_COUNT]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.75, 1]} />
        <meshBasicMaterial
          color={isMoon ? '#f1f5f9' : '#ea580c'}
          transparent
          opacity={isMoon ? 0.55 : 0.62}
          depthWrite={false}
        />
      </instancedMesh>

      {/* DESCENDING / LANDED / RETURN-LAUNCHING SOL-7 ROCKET */}
      <group ref={returnRocketGroupRef} position={[padPos.x, padPos.y, padPos.z]}>
        {/* Rocket Fuselage */}
        <mesh position={[0, 7.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 0.95, 14, 24]} />
          <primitive object={habitatWhiteMaterial} />
        </mesh>
        {/* Black Interstage Ring */}
        <mesh position={[0, 11.2, 0]} castShadow>
          <cylinderGeometry args={[0.96, 0.96, 1.2, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Indian Tricolor Flag Decal & "SOL-7" on Landed Rocket Fuselage */}
        <mesh position={[0, 9.4, -0.96]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.15, 0.76]} />
          <meshStandardMaterial
            map={flagTexture}
            roughness={0.35}
            metalness={0.1}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <Text
          position={[0, 7.6, -0.96]}
          rotation={[0, Math.PI, 0]}
          fontSize={0.62}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          SOL-7
        </Text>
        <mesh position={[0, 9.4, 0.96]}>
          <planeGeometry args={[1.15, 0.76]} />
          <meshStandardMaterial
            map={flagTexture}
            roughness={0.35}
            metalness={0.1}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
        <Text
          position={[0, 7.6, 0.96]}
          fontSize={0.62}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          SOL-7
        </Text>

        {/* Nose Cone */}
        <mesh position={[0, 16.0, 0]} castShadow>
          <coneGeometry args={[0.95, 3.2, 24]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.25} />
        </mesh>
        {/* Upper Command Windows */}
        <mesh position={[0, 13.8, 0.88]}>
          <boxGeometry args={[0.7, 0.5, 0.2]} />
          <meshPhysicalMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* Mars Orange Atmospheric Entry Plasma Glow Shield (during upper entry descent) */}
        {!isMoon && isDescentPhase && descentProgress < 0.62 && (
          <group position={[0, 4.2, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <sphereGeometry args={[2.6, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshBasicMaterial
                color="#f97316"
                transparent
                opacity={(1.0 - descentProgress / 0.62) * 0.65}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <pointLight
              color="#fb923c"
              intensity={(1.0 - descentProgress / 0.62) * 55}
              distance={28}
            />
          </group>
        )}

        {/* 4 Deployable Hydraulic Landing Struts */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, i) => (
          <group key={`strut-${i}`} rotation={[0, ang, 0]}>
            <group position={[0.92, 1.8, 0]} rotation={[0, 0, -legDeployAngle]}>
              <mesh position={[0.6, -1.2, 0]} rotation={[0, 0, -0.45]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 2.8, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[1.4, -2.4, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.45, 0.12, 14]} />
                <meshStandardMaterial color="#475569" metalness={0.8} />
              </mesh>
            </group>
          </group>
        ))}

        {/* Engine Bell */}
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.7, 1.4, 16, 1, true]} />
          <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.35} />
        </mesh>

        {/* Retro Thruster Plumes (Blue-White on Moon, Fiery Supersonic Orange-Gold on Mars) */}
        {((isDescentPhase && descentProgress < 0.98) ||
          isReturnFlight ||
          (viewMode === 'COUNTDOWN' && countdownSeconds !== null && countdownSeconds <= 2)) && (
          <group ref={returnPlumeRef} position={[0, 0.1, 0]}>
            {/* Inner hot core — soft blue-white, NOT solid white */}
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.35, 4.5, 16]} />
              <meshBasicMaterial
                color={isMoon ? '#cce8ff' : '#ffe4b0'}
                transparent
                opacity={0.72}
                depthWrite={false}
              />
            </mesh>
            {/* Outer exhaust plume — coloured, transparent */}
            <mesh position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.95, 7.5, 16]} />
              <meshBasicMaterial
                color={isMoon ? '#38bdf8' : '#f97316'}
                transparent
                opacity={0.55}
                depthWrite={false}
              />
            </mesh>
            {/* Wide diffuse bloom — very faint */}
            <mesh position={[0, -2.5, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[1.6, 10.0, 12]} />
              <meshBasicMaterial
                color={isMoon ? '#7dd3fc' : '#fbbf24'}
                transparent
                opacity={0.18}
                depthWrite={false}
              />
            </mesh>
            {/* Capped engine glow — no blowout */}
            <pointLight
              color={isMoon ? '#38bdf8' : '#f97316'}
              intensity={28}
              distance={22}
              decay={2}
            />
          </group>
        )}

        {/* Egress Hatch & Extendable Ladder/Ramp */}
        {descentProgress >= 0.95 && !isReturnFlight && (
          <group position={[0, 1.6, -0.92]}>
            <mesh position={[0.75, 0, 0]} rotation={[0, -Math.PI * 0.45, 0]}>
              <boxGeometry args={[0.8, 1.6, 0.12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
            <group
              position={[0, -0.2, -0.4 * rampDeployProgress]}
              rotation={[-0.55 * rampDeployProgress, 0, 0]}
            >
              <mesh position={[0, -0.8 * rampDeployProgress, -1.2 * rampDeployProgress]}>
                <boxGeometry args={[1.2, 0.08, 3.2 * rampDeployProgress]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} />
              </mesh>
            </group>
          </group>
        )}

        {/* Interior Cockpit when player boards the rocket on the planetary surface */}
        {isCockpitOrFlight && (
          <group position={[0, -5.0, 0]}>
            <Cockpit
              onLaunch={onLaunchReturnRocket || (() => {})}
              isLaunching={isReturnFlight}
              isCountingDown={viewMode === 'COUNTDOWN'}
              countdownSeconds={countdownSeconds}
            />
          </group>
        )}
      </group>

      {/* ========================================================== */}
      {/* 4. DETAILED OUTPOST BASE, BIO-DOME & FLOODLIGHT TOWERS     */}
      {/* ========================================================== */}
      <group position={[0, 0, -18]}>
        <group name="MainOutpostBioDome">
          <mesh position={[0, 5.2, 0]} castShadow receiveShadow>
            <sphereGeometry args={[9.8, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial
              color={isMoon ? '#cbd5e1' : '#e2e8f0'}
              roughness={0.18}
              metalness={0.15}
              transmission={0.68}
              thickness={0.8}
              transparent
              opacity={0.76}
            />
          </mesh>

          {[0, 1.8, 3.6].map((ry, ri) => (
            <mesh key={`dome-ring-${ri}`} position={[0, 0.6 + ry, 0]} castShadow>
              <cylinderGeometry args={[9.85 - ry * 1.1, 9.85 - ry * 1.1, 0.28, 24, 1, true]} />
              <primitive object={isMoon ? mliGoldMaterial : habitatWhiteMaterial} />
            </mesh>
          ))}

          <group position={[0, 1.5, 0]}>
            <pointLight color="#fef08a" intensity={32} distance={26} />
            {[-3.4, 0, 3.4].map((hx, hi) => (
              <group key={`hydro-${hi}`} position={[hx, 1.5, hi % 2 === 0 ? -1.8 : 1.8]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.85, 0.85, 3.4, 12]} />
                  <meshStandardMaterial color="#15803d" roughness={0.65} />
                </mesh>
                <mesh position={[0, 1.9, 0]}>
                  <sphereGeometry args={[1.15, 12, 12]} />
                  <meshStandardMaterial
                    color="#22c55e"
                    emissive="#16a34a"
                    emissiveIntensity={0.35}
                    roughness={0.5}
                  />
                </mesh>
              </group>
            ))}
          </group>

          <mesh position={[-11.5, 2.6, 1]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[2.6, 2.6, 7.5, 20]} />
            <primitive object={habitatWhiteMaterial} />
          </mesh>
          <mesh position={[11.5, 2.6, 1]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[2.6, 2.6, 7.5, 20]} />
            <primitive object={habitatWhiteMaterial} />
          </mesh>

          {/* Primary Pressurized Airlock & Central Command Terminal */}
          <group position={[0, 1.6, 8.5]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.8, 1.8, 5.5, 18]} />
              <primitive object={habitatWhiteMaterial} />
            </mesh>
            <mesh position={[0, 0, 2.9]} castShadow>
              <boxGeometry args={[2.8, 3.2, 0.5]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 3.1]}>
              <boxGeometry args={[2.1, 2.7, 0.12]} />
              <meshStandardMaterial
                color={isAirlockOpen ? '#059669' : '#0284c7'}
                metalness={0.7}
                roughness={0.3}
              />
            </mesh>

            <group position={[0, -0.55, 3.45]}>
              <mesh position={[0, -0.4, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.4, 1.1, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.25, 0]} rotation={[-0.4, 0, 0]} castShadow>
                <boxGeometry args={[1.5, 0.88, 0.12]} />
                <meshStandardMaterial
                  color="#0f172a"
                  emissive={activeChapterId === 'CHAPTER_1_DONKI' ? '#dc2626' : '#0284c7'}
                  emissiveIntensity={0.75}
                  roughness={0.2}
                />
              </mesh>
              <Text
                position={[0, 0.28, 0.08]}
                rotation={[-0.4, 0, 0]}
                fontSize={0.11}
                color={activeChapterId === 'CHAPTER_1_DONKI' ? '#fca5a5' : '#38bdf8'}
                anchorX="center"
                anchorY="middle"
              >
                {activeChapterId === 'CHAPTER_1_DONKI'
                  ? '⚠ DONKI CME ALERT: 1.4 mSv/h'
                  : 'NASA DONKI / DSN TERMINAL'}
              </Text>
            </group>
          </group>
        </group>

        {/* 1. 4 Articulated Solar Arrays & Rover Charging Dock (Near Engineer Leo) */}
        <group ref={solarArraysRef} position={[-15, 0, 2]}>
          {[-6.0, -2.0, 2.0, 6.0].map((sx, i) => (
            <group key={`solar-panel-${i}`} position={[sx, 3.2, 0]} rotation={[0.38, 0, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[3.4, 6.8, 0.16]} />
                <primitive object={solarCellMaterial} />
              </mesh>
              <mesh position={[0, -2.8, 0]} rotation={[-0.38, 0, 0]} castShadow>
                <cylinderGeometry args={[0.14, 0.14, 4.8, 10]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Pressurized Surface Rover & Compressed-Gas Charging Dock near Leo */}
        <group position={[-16.5, 0, 5.8]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 0.9, 3.2]} />
            <primitive object={habitatWhiteMaterial} />
          </mesh>
          <mesh position={[0, 1.35, 0.7]} castShadow>
            <boxGeometry args={[1.8, 0.65, 1.4]} />
            <meshPhysicalMaterial color="#38bdf8" metalness={0.8} roughness={0.15} />
          </mesh>
          <mesh position={[1.2, 0.9, 0.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 1.6, 12]} />
            <primitive object={mliGoldMaterial} />
          </mesh>
          {[
            [-1.15, 0.42, 1.0],
            [1.15, 0.42, 1.0],
            [-1.15, 0.42, -1.0],
            [1.15, 0.42, -1.0],
          ].map(([wx, wy, wz], wi) => (
            <mesh key={`wheel-${wi}`} position={[wx, wy, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.35, 14]} />
              <meshStandardMaterial color="#1e293b" roughness={0.85} />
            </mesh>
          ))}
        </group>

        {/* 2. Oxygen / Water Synthesis Module & Subsurface Thermal Ice Drill (Near Dr. Sarah) */}
        <group position={[11.5, 0, 4.5]}>
          {[-1.2, 1.2].map((tx, ti) => (
            <mesh key={`synth-tank-${ti}`} position={[tx, 2.2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.95, 0.95, 4.2, 20]} />
              <primitive object={habitatWhiteMaterial} />
            </mesh>
          ))}
          <mesh position={[0, 3.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 3.2, 12]} />
            <primitive object={mliGoldMaterial} />
          </mesh>
          <mesh position={[-1.2, 4.45, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh position={[1.2, 4.45, 0]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>

          <group position={[2.8, 0, 1.8]}>
            <mesh position={[0, 1.8, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.22, 3.6, 12]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <coneGeometry args={[0.32, 1.8, 12]} />
              <primitive object={mliGoldMaterial} />
            </mesh>
          </group>
        </group>

        {/* 3. Giant Rotating Satellite Communication Dish */}
        <group position={[18, 0, -4]}>
          <mesh position={[0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.6, 1.0, 6.0, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          <group ref={dishRef} position={[0, 6.5, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <sphereGeometry args={[3.8, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
              <meshStandardMaterial
                color="#e2e8f0"
                metalness={0.7}
                roughness={0.3}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0, 2.0]}>
              <cylinderGeometry args={[0.08, 0.08, 3.8, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh ref={beaconRef} position={[0, 0, 4.0]}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshBasicMaterial color="#22d3ee" />
            </mesh>
          </group>
        </group>

        {/* 4. Base Floodlight Towers */}
        {[
          [-10, 0, 9],
          [10, 0, 9],
        ].map(([fx, fy, fz], fi) => (
          <group key={`floodlight-${fi}`} position={[fx, fy, fz]}>
            <mesh position={[0, 3.5, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.16, 7.0, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh position={[0, 7.1, 0]}>
              <boxGeometry args={[0.8, 0.4, 0.4]} />
              <meshBasicMaterial color="#fef08a" />
            </mesh>
            <mesh position={[0, 3.6, 1.2]} rotation={[0.32, 0, 0]}>
              <coneGeometry args={[3.2, 7.0, 16, 1, true]} />
              <meshBasicMaterial
                color="#fef08a"
                transparent
                opacity={0.09}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <pointLight position={[0, 6.8, 0.5]} color="#fef08a" intensity={18} distance={22} />
          </group>
        ))}

        {/* 5. Tall Titanium Flagpole with Waving Indian National Flag (Tiranga) & Golden Plaque */}
        <group position={[5.2, 0, 22]} name="IndianNationalFlagpole">
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.55, 0.75, 0.6, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.3} />
          </mesh>
          <mesh position={[0, 3.4, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 6.4, 14]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, 6.68, 0]} castShadow>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial color="#FFD700" metalness={0.92} roughness={0.12} />
          </mesh>
          <mesh position={[1.18, 5.75, 0]} castShadow>
            <planeGeometry ref={wavingFlagGeoRef} args={[2.3, 1.5, 20, 12]} />
            <meshStandardMaterial
              map={flagTexture}
              side={THREE.DoubleSide}
              roughness={0.4}
              metalness={0.08}
            />
          </mesh>
          <group position={[0, 0.72, 0.58]} rotation={[-0.32, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[2.25, 0.52, 0.08]} />
              <meshStandardMaterial color="#FFD700" metalness={0.88} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0, 0.042]}>
              <planeGeometry args={[2.12, 0.42]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} />
            </mesh>
            <Text
              position={[0, 0.06, 0.05]}
              fontSize={0.095}
              color="#FFD700"
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.04}
            >
              ISRO - NASA Joint Deep Space Outpost
            </Text>
            <Text
              position={[0, -0.09, 0.05]}
              fontSize={0.065}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
            >
              SOL-7 INTERPLANETARY EXPEDITION
            </Text>
          </group>
        </group>
      </group>

      {/* ========================================================== */}
      {/* 5. FLOATING ATMOSPHERIC DUST MOTES AROUND FLOODLIGHTS      */}
      {/* ========================================================== */}
      <instancedMesh
        ref={dustMotesRef}
        args={[undefined, undefined, MOTE_COUNT]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial
          color={isMoon ? '#e2e8f0' : '#fdba74'}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </instancedMesh>

      {/* ========================================================== */}
      {/* 6. FULL 4-ASTRONAUT CREW ROSTER (RAJ, LEO & DR. SARAH)     */}
      {/* ========================================================== */}
      <CrewMemberNPC
        crewVariant="RAJ"
        nameBadge="SYSTEMS ENGINEER RAJ"
        roleTitle="Telemetry & Space Weather (DONKI/DSN)"
        stripeColor="#EF4444"
        homePos={[1.4, 0, -8.2]}
        homeFacing={-0.25}
        followPlayer={isChapter5Launch}
        followOffset={[0.0, -2.2]}
        playerPos={astronautPos}
        isBoardingElevator={viewMode === 'ELEVATOR_RIDE'}
        elevatorPosY={elevatorPosY}
        isVisible={!isDescentPhase && !isCrewInsideRocket}
      />

      <CrewMemberNPC
        crewVariant="LEO"
        nameBadge="ENGINEER LEO"
        roleTitle="Power & Heavy Mechanics"
        stripeColor="#FF8F00"
        homePos={isChapter4Assemble ? [-1.8, 0, -8.0] : [-13, 0, -14]}
        homeFacing={isChapter4Assemble ? 0.35 : 0.45}
        followPlayer={isChapter5Launch}
        followOffset={[-1.8, -1.6]}
        playerPos={astronautPos}
        isBoardingElevator={viewMode === 'ELEVATOR_RIDE'}
        elevatorPosY={elevatorPosY}
        isVisible={!isDescentPhase && !isCrewInsideRocket}
      />

      <CrewMemberNPC
        crewVariant="SARAH"
        nameBadge="DR. SARAH"
        roleTitle="Life Support & Astrobiologist"
        stripeColor="#00E676"
        homePos={isChapter4Assemble ? [3.2, 0, -7.8] : [9, 0, -13]}
        homeFacing={isChapter4Assemble ? -0.4 : -0.45}
        followPlayer={isChapter5Launch}
        followOffset={[1.8, -1.6]}
        playerPos={astronautPos}
        isBoardingElevator={viewMode === 'ELEVATOR_RIDE'}
        elevatorPosY={elevatorPosY}
        isVisible={!isDescentPhase && !isCrewInsideRocket}
      />

      {/* ========================================================== */}
      {/* 7. KID-FRIENDLY 3D WAYPOINT BEAM & ANIMATED FLOATING ARROW */}
      {/* ========================================================== */}
      {!isDescentPhase && !isCockpitOrFlight && currentChapterConfig && (
        <group position={currentChapterConfig.targetPosition}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
            <ringGeometry args={[1.6, 2.1, 32]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.75}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          <mesh position={[0, 7.0, 0]}>
            <cylinderGeometry args={[0.35, 0.85, 14.0, 16, 1, true]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          <group ref={waypointArrowRef} position={[0, 4.6, 0]}>
            <mesh rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.45, 0.9, 6]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#06b6d4"
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>
            <Text
              position={[0, 0.85, 0]}
              fontSize={0.26}
              color="#fef08a"
              anchorX="center"
              anchorY="middle"
            >
              ▼ {currentChapterConfig.waypointLabel}
            </Text>
          </group>
        </group>
      )}
    </group>
  );
};
