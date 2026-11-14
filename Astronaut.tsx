import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { getSuitFabricTexture, getFlagTexture } from '../../utils/proceduralTextures';

/**
 * Mathematical terrain height evaluator matching Terrain.tsx
 * Ensures the ground is 100% solid everywhere the player walks.
 */
export function getTerrainHeightAt(x: number, z: number): number {
  // 1. Concrete launch pad: 30x30 units centered at (0, 0)
  if (Math.abs(x) <= 15.2 && Math.abs(z) <= 15.2) {
    // Pad is slightly elevated concrete slab at y = 0.21
    return 0.21;
  }

  // 2. Pad flat safety perimeter apron
  const distFromCenter = Math.hypot(x, z);
  if (distFromCenter < 18) {
    return 0.0;
  }

  // 3. Natural undulating hills outside the pad
  const blend = Math.min(1, (distFromCenter - 18) / 15);
  let height = (
    Math.sin(x * 0.06) * Math.cos(z * 0.05) * 1.8 +
    Math.sin(x * 0.02 + z * 0.03) * 2.2 +
    Math.cos(x * 0.1) * 0.4
  ) * blend;

  // 4. Slope down towards shoreline beach (+X side)
  if (x > 25) {
    const oceanSlope = Math.min(1, (x - 25) / 25);
    height = height * (1 - oceanSlope) - oceanSlope * 2.2;
  }

  return height;
}

interface AstronautProps {
  onPositionUpdate?: (pos: THREE.Vector3, yaw: number) => void;
  cameraYawRef?: React.RefObject<number>;
  cameraYaw?: number; // fallback camera yaw in radians
  isElevatorRide?: boolean;
  elevatorPosY?: number;
  isEntering?: boolean;
  isExiting?: boolean;
  isVisible?: boolean;
  isPlanetarySurface?: boolean;
  planetaryDestination?: 'MOON' | 'MARS' | null;
  isMovementLocked?: boolean;
  conversationTargetPos?: THREE.Vector3 | null;
  onEnterFinished?: () => void;
  onExitFinished?: () => void;
}

export const Astronaut: React.FC<AstronautProps> = ({
  onPositionUpdate,
  cameraYawRef,
  cameraYaw = 0,
  isElevatorRide = false,
  elevatorPosY = 0.21,
  isEntering = false,
  isExiting = false,
  isVisible = true,
  isPlanetarySurface = false,
  planetaryDestination = null,
  isMovementLocked = false,
  conversationTargetPos = null,
  onEnterFinished,
  onExitFinished,
}) => {
  const enterTimer = useRef(0);
  const exitTimer = useRef(0);
  const enterStartPos = useRef(new THREE.Vector3());
  const hasInitializedEnter = useRef(false);
  const hasInitializedExit = useRef(false);
  // Model joint references
  const rootGroupRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmPivotRef = useRef<THREE.Group>(null);
  const rightArmPivotRef = useRef<THREE.Group>(null);
  const leftLegPivotRef = useRef<THREE.Group>(null);
  const rightLegPivotRef = useRef<THREE.Group>(null);

  // Footstep dust puff particles
  const dustMeshRef = useRef<THREE.InstancedMesh>(null);
  const dustDummy = useMemo(() => new THREE.Object3D(), []);
  const DUST_COUNT = 16;
  const dustParticles = useMemo(() => {
    return Array.from({ length: DUST_COUNT }).map(() => ({
      x: 0,
      y: -100,
      z: 0,
      scale: 0.1,
      age: 1,
      life: 0.55,
    }));
  }, []);

  // Movement physics state
  // Initial position: 20 units away from rocket on concrete pad edge [14, 0.21, 14]
  const initialGround = getTerrainHeightAt(14, 14);
  const pos = useRef(new THREE.Vector3(14, initialGround, 14));
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const currentFacingAngle = useRef(Math.PI * 0.75);
  const targetFacingAngle = useRef(Math.PI * 0.75);
  const walkTime = useRef(0);
  const dustSpawnTimer = useRef(0);
  const hasInitializedSurfacePos = useRef(false);

  // Position astronaut at landing ramp foot on alien planetary surface facing outpost
  useEffect(() => {
    if (isPlanetarySurface && !hasInitializedSurfacePos.current) {
      hasInitializedSurfacePos.current = true;
      pos.current.set(0, 0.0, 14.2);
      currentFacingAngle.current = Math.PI; // Facing -Z towards research outpost
      targetFacingAngle.current = Math.PI;
    } else if (!isPlanetarySurface) {
      hasInitializedSurfacePos.current = false;
    }
  }, [isPlanetarySurface]);

  // Keyboard input state
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    run: false,
    jump: false,
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      // W: forward, S: back, A: left, D: right
      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') keys.current.forward = true;
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') keys.current.backward = true;
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') keys.current.left = true;
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') keys.current.right = true;
      if (e.shiftKey || code === 'ShiftLeft' || code === 'ShiftRight') keys.current.run = true;
      if (code === 'Space' || key === ' ') {
        keys.current.jump = true;
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (code === 'KeyW' || key === 'w' || code === 'ArrowUp') keys.current.forward = false;
      if (code === 'KeyS' || key === 's' || code === 'ArrowDown') keys.current.backward = false;
      if (code === 'KeyA' || key === 'a' || code === 'ArrowLeft') keys.current.left = false;
      if (code === 'KeyD' || key === 'd' || code === 'ArrowRight') keys.current.right = false;
      if (!e.shiftKey && (code === 'ShiftLeft' || code === 'ShiftRight')) keys.current.run = false;
      if (code === 'Space' || key === ' ') keys.current.jump = false;
    };

    const onBlur = () => {
      keys.current.forward = false;
      keys.current.backward = false;
      keys.current.left = false;
      keys.current.right = false;
      keys.current.run = false;
      keys.current.jump = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Shared Astronaut Materials: Mission Commander Deep Navy Blue (#1A237E) & White (#E0E0E0) armored panels
  const suitFabricTex = useMemo(() => getSuitFabricTexture(), []);
  const flagTexture = useMemo(() => getFlagTexture(), []);

  const commanderNavyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1A237E',
        map: suitFabricTex,
        bumpMap: suitFabricTex,
        bumpScale: 0.018,
        roughness: 0.42,
        metalness: 0.32,
      }),
    [suitFabricTex]
  );

  const suitWhiteMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        map: suitFabricTex,
        bumpMap: suitFabricTex,
        bumpScale: 0.018,
        roughness: 0.48,
        metalness: 0.18,
      }),
    [suitFabricTex]
  );

  const suitGreyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#37474F',
        roughness: 0.48,
        metalness: 0.52,
      }),
    []
  );

  // Gloves & Boots: Solid Charcoal Grey (#212121)
  const charcoalGloveBootMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#212121',
        roughness: 0.65,
        metalness: 0.32,
      }),
    []
  );

  // Reflective Mirrored Gold Visor (#FFD700) with realistic glass shine (metalness: 0.9, roughness: 0.1)
  const goldVisorMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFD700',
        emissive: '#B45309',
        emissiveIntensity: 0.18,
        roughness: 0.1,
        metalness: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
      }),
    []
  );

  const silverTankMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#E0E0E0',
        roughness: 0.28,
        metalness: 0.88,
      }),
    []
  );

  // Frame physics loop
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const padZ = isPlanetarySurface ? 18.0 : 0.0;
    const topBridgeY = isPlanetarySurface ? 12.8 : 18.9;
    const elevX = isPlanetarySurface ? -4.2 : -4.75;

    // 0A. Elevator Ride State: Astronaut rides inside cabin ascending/descending gantry
    if (isElevatorRide) {
      pos.current.set(elevX, elevatorPosY, padZ);
      currentFacingAngle.current = Math.PI / 2; // Facing +X towards rocket

      // Standing inside cabin with subtle idle breathing
      if (leftLegPivotRef.current && rightLegPivotRef.current) {
        leftLegPivotRef.current.rotation.x = 0;
        rightLegPivotRef.current.rotation.x = 0;
      }
      if (leftArmPivotRef.current && rightArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = 0.05;
        rightArmPivotRef.current.rotation.x = 0.05;
      }
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.45 + Math.sin(performance.now() * 0.003) * 0.015;
      }

      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
        rootGroupRef.current.rotation.y = currentFacingAngle.current;
      }

      if (onPositionUpdate) {
        onPositionUpdate(pos.current, currentFacingAngle.current);
      }
      return;
    }

    // 0B. Automatic Enter Rocket sequence: Walk across upper gantry walkway bridge into hatch
    if (isEntering) {
      if (!hasInitializedEnter.current) {
        hasInitializedEnter.current = true;
        enterStartPos.current.set(elevX, topBridgeY, padZ);
        pos.current.copy(enterStartPos.current);
        enterTimer.current = 0;
      }
      enterTimer.current += dt;
      const progress = Math.min(1.0, enterTimer.current / 2.2);

      // Face toward rocket door (+X direction)
      currentFacingAngle.current = Math.PI / 2;

      // Leg and arm walk cycle along walkway bridge
      walkTime.current += dt * 9.5;
      const legSwing = Math.sin(walkTime.current) * 0.6;
      if (leftLegPivotRef.current && rightLegPivotRef.current) {
        leftLegPivotRef.current.rotation.x = legSwing;
        rightLegPivotRef.current.rotation.x = -legSwing;
      }
      if (leftArmPivotRef.current && rightArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = -legSwing;
        rightArmPivotRef.current.rotation.x = legSwing;
      }
      if (torsoRef.current) {
        torsoRef.current.position.y = 1.45 + Math.abs(Math.sin(walkTime.current * 2)) * 0.07;
      }

      const bridgeStart = new THREE.Vector3(elevX, topBridgeY, padZ);
      const hatchThreshold = new THREE.Vector3(-1.01, topBridgeY, padZ);
      const insidePos = new THREE.Vector3(-0.15, topBridgeY, padZ);

      if (progress < 0.75) {
        const p1 = progress / 0.75;
        pos.current.lerpVectors(bridgeStart, hatchThreshold, p1);
      } else {
        const p2 = (progress - 0.75) / 0.25;
        pos.current.lerpVectors(hatchThreshold, insidePos, p2);
      }

      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
        rootGroupRef.current.rotation.y = currentFacingAngle.current;
      }

      if (onPositionUpdate) {
        onPositionUpdate(pos.current, currentFacingAngle.current);
      }

      if (progress >= 1.0) {
        hasInitializedEnter.current = false;
        onEnterFinished?.();
      }
      return;
    }

    // 0C. Automatic Exit Rocket sequence: Step out onto upper walkway bridge back to elevator
    if (isExiting) {
      if (!hasInitializedExit.current) {
        hasInitializedExit.current = true;
        exitTimer.current = 0;
        pos.current.set(-0.15, topBridgeY, padZ);
        currentFacingAngle.current = -Math.PI / 2; // Facing -X walking back across bridge
      }
      exitTimer.current += dt;
      const progress = Math.min(1.0, exitTimer.current / 2.2);

      walkTime.current += dt * 9.0;
      const legSwing = Math.sin(walkTime.current) * 0.55;
      if (leftLegPivotRef.current && rightLegPivotRef.current) {
        leftLegPivotRef.current.rotation.x = legSwing;
        rightLegPivotRef.current.rotation.x = -legSwing;
      }
      if (leftArmPivotRef.current && rightArmPivotRef.current) {
        leftArmPivotRef.current.rotation.x = -legSwing;
        rightArmPivotRef.current.rotation.x = legSwing;
      }

      pos.current.lerpVectors(
        new THREE.Vector3(-0.15, topBridgeY, padZ),
        new THREE.Vector3(elevX, topBridgeY, padZ),
        progress
      );

      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
        rootGroupRef.current.rotation.y = currentFacingAngle.current;
      }

      if (onPositionUpdate) {
        onPositionUpdate(pos.current, currentFacingAngle.current);
      }

      if (progress >= 1.0) {
        hasInitializedExit.current = false;
        onExitFinished?.();
      }
      return;
    }

    // 1. Calculate input movement in camera space (locked when in conversation):
    let inputForward = 0;
    let inputRight = 0;

    if (!isMovementLocked) {
      if (keys.current.forward) inputForward += 1;
      if (keys.current.backward) inputForward -= 1;
      if (keys.current.right) inputRight += 1;
      if (keys.current.left) inputRight -= 1;
    } else if (conversationTargetPos) {
      // Smoothly turn to face the crew member we are talking to
      const dx = conversationTargetPos.x - pos.current.x;
      const dz = conversationTargetPos.z - pos.current.z;
      targetFacingAngle.current = Math.atan2(dx, dz);
    }

    const isMoving = inputForward !== 0 || inputRight !== 0;
    const isRunning = keys.current.run && isMoving;
    const speed = isRunning ? 10.0 : 5.0; // 5 units/s walk, 10 units/s run

    if (isMoving) {
      // Normalize input
      const len = Math.hypot(inputForward, inputRight);
      const normFwd = inputForward / len;
      const normRight = inputRight / len;

      // Camera view vectors on the ground plane (X-Z):
      const activeYaw = cameraYawRef?.current ?? cameraYaw;
      const camFwdX = -Math.sin(activeYaw);
      const camFwdZ = -Math.cos(activeYaw);

      // Camera right vector (orthogonal to forward, 90 deg clockwise):
      const camRightX = Math.cos(activeYaw);
      const camRightZ = -Math.sin(activeYaw);

      // Composite world movement vector
      const worldMoveX = camFwdX * normFwd + camRightX * normRight;
      const worldMoveZ = camFwdZ * normFwd + camRightZ * normRight;

      // Proposed next coordinates
      const nextX = pos.current.x + worldMoveX * speed * dt;
      const nextZ = pos.current.z + worldMoveZ * speed * dt;

      // Solid Collision Boundaries:
      if (isPlanetarySurface) {
        // Planetary surface bounds (-110 to 110)
        const pX = Math.min(110, Math.max(-110, nextX));
        const pZ = Math.min(110, Math.max(-110, nextZ));

        // Landed Rocket Pad collision (x=0, z=18)
        const distRocket = Math.hypot(pX - 0, pZ - 18);
        // Main Outpost Hub collision (x=0, z=-18, radius 5.5)
        const distHabitat = Math.hypot(pX - 0, pZ - (-18));
        // Allow airlock corridor approach at x in [-1.5, 1.5], z in [-11, -5.5]
        const isAirlockApproach = Math.abs(pX) <= 1.5 && pZ >= -11.0 && pZ <= -5.5;

        if (distRocket < 1.6) {
          const pushAng = Math.atan2(pZ - 18, pX);
          pos.current.x = Math.cos(pushAng) * 1.6;
          pos.current.z = 18 + Math.sin(pushAng) * 1.6;
        } else if (distHabitat < 5.8 && !isAirlockApproach) {
          const pushAng = Math.atan2(pZ - (-18), pX);
          pos.current.x = Math.cos(pushAng) * 5.8;
          pos.current.z = -18 + Math.sin(pushAng) * 5.8;
        } else {
          pos.current.x = pX;
          pos.current.z = pZ;
        }
      } else {
        // Earth launchpad collision
        // A. Shoreline / Ocean boundary: keep away from deep water (+X > 33)
        const clampedX = Math.min(33, Math.max(-85, nextX));
        const clampedZ = Math.min(85, Math.max(-85, nextZ));

        // B. Rocket Launch Mount & Hold-down Base
        const distToCenter = Math.hypot(clampedX, clampedZ);
        const isNearDoorGangway = clampedX < -0.6 && Math.abs(clampedZ) < 1.8;
        const minRadius = isNearDoorGangway ? 1.25 : 2.5;

        if (distToCenter < minRadius) {
          const pushAngle = Math.atan2(clampedZ, clampedX);
          pos.current.x = Math.cos(pushAngle) * minRadius;
          pos.current.z = Math.sin(pushAngle) * minRadius;
        } else {
          // C. Launch Umbilical Tower (solid box around x=-6.2, z=0, footprint 3.2x3.2)
          const inTowerX = clampedX > -8.2 && clampedX < -4.2;
          const inTowerZ = clampedZ > -2.0 && clampedZ < 2.0;

          // D. Control Bunker (solid box around x=-24, z=18, footprint 10x8)
          const inBunkerX = clampedX > -29.2 && clampedX < -18.8;
          const inBunkerZ = clampedZ > 13.8 && clampedZ < 22.2;

          if (!inTowerX || !inTowerZ) {
            if (!inBunkerX || !inBunkerZ) {
              pos.current.x = clampedX;
              pos.current.z = clampedZ;
            }
          }
        }
      }

      // Smoothly rotate astronaut to face movement direction
      // Model front is +Z at rotation 0, so angle = atan2(worldMoveX, worldMoveZ)
      targetFacingAngle.current = Math.atan2(worldMoveX, worldMoveZ);
    }

    // Slerp / damp facing rotation angle towards target
    let diff = targetFacingAngle.current - currentFacingAngle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    currentFacingAngle.current += diff * Math.min(1.0, dt * 14);

    // 2. SOLID GROUND PHYSICS & JUMP
    const onGantryBridge =
      !isPlanetarySurface &&
      pos.current.y > 10.0 &&
      pos.current.x >= -6.8 &&
      pos.current.x <= -0.8 &&
      Math.abs(pos.current.z) <= 1.2;

    const groundLevel = isPlanetarySurface
      ? 0.0
      : onGantryBridge
      ? 18.9
      : getTerrainHeightAt(pos.current.x, pos.current.z);

    // Dynamic gravity: Lunar (1/6g), Martian (0.38g), Earth (1.0g)
    const GRAVITY = isPlanetarySurface
      ? planetaryDestination === 'MOON'
        ? 3.6
        : 7.2
      : 18.0;

    const JUMP_VELOCITY = isPlanetarySurface
      ? planetaryDestination === 'MOON'
        ? 9.2 // Floaty high lunar leaps
        : 9.8
      : 10.4;

    if (keys.current.jump && isGrounded.current) {
      velocityY.current = JUMP_VELOCITY;
      isGrounded.current = false;
    }

    if (!isGrounded.current) {
      velocityY.current -= GRAVITY * dt;
      pos.current.y += velocityY.current * dt;

      // Solid collision: never drop below ground level
      if (pos.current.y <= groundLevel) {
        pos.current.y = groundLevel;
        velocityY.current = 0;
        isGrounded.current = true;
      }
    } else {
      // Firmly grounded on solid surface: follow terrain slope smoothly
      pos.current.y = groundLevel;
    }

    // 3. Procedural Walk & Breathing Animation
    const animRate = isRunning ? 16.0 : 9.0;
    if (isMoving && isGrounded.current) {
      walkTime.current += dt * animRate;
    } else {
      walkTime.current += dt * 2.5; // Idle rate
    }

    const swingAmp = !isGrounded.current
      ? 0.35 // Tuck in mid-air
      : isMoving
      ? isRunning
        ? 0.95
        : 0.6
      : 0.0;

    const armSwing = Math.sin(walkTime.current) * swingAmp;
    const legSwing = Math.sin(walkTime.current) * swingAmp;

    // Hip pivots
    if (leftLegPivotRef.current && rightLegPivotRef.current) {
      if (!isGrounded.current) {
        // Jumping pose: legs tucked slightly forward
        leftLegPivotRef.current.rotation.x = -0.45;
        rightLegPivotRef.current.rotation.x = -0.25;
      } else {
        leftLegPivotRef.current.rotation.x = legSwing;
        rightLegPivotRef.current.rotation.x = -legSwing;
      }
    }

    // Shoulder pivots: arms swing opposite to legs
    if (leftArmPivotRef.current && rightArmPivotRef.current) {
      if (!isGrounded.current) {
        leftArmPivotRef.current.rotation.x = 0.5;
        rightArmPivotRef.current.rotation.x = 0.5;
      } else {
        leftArmPivotRef.current.rotation.x = -armSwing;
        rightArmPivotRef.current.rotation.x = armSwing;
      }
    }

    // Torso Bob & Idle breathing
    if (torsoRef.current) {
      if (isMoving && isGrounded.current) {
        // Vertical step bounce
        torsoRef.current.position.y = 1.45 + Math.abs(Math.sin(walkTime.current * 2)) * 0.08;
      } else {
        // Idle breathing expansion
        const breathe = 1 + Math.sin(walkTime.current) * 0.015;
        torsoRef.current.position.y = 1.45;
        torsoRef.current.scale.set(breathe, breathe, breathe);
      }
    }

    // Update root group transform
    if (rootGroupRef.current) {
      rootGroupRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
      rootGroupRef.current.rotation.y = currentFacingAngle.current;
    }

    // 4. Footstep Dust Particle Puffs
    if (isMoving && isGrounded.current) {
      dustSpawnTimer.current += dt;
      const interval = isRunning ? 0.09 : 0.18;
      if (dustSpawnTimer.current >= interval) {
        dustSpawnTimer.current = 0;
        const p = dustParticles.find((d) => d.age >= d.life);
        if (p) {
          p.age = 0;
          p.x = pos.current.x + (Math.random() - 0.5) * 0.3;
          p.y = pos.current.y + 0.08;
          p.z = pos.current.z + (Math.random() - 0.5) * 0.3;
        }
      }
    }

    // Update dust particle mesh instances
    if (dustMeshRef.current) {
      for (let i = 0; i < DUST_COUNT; i++) {
        const p = dustParticles[i];
        if (p.age < p.life) {
          p.age += dt;
          const prog = p.age / p.life;
          p.y += dt * 0.4;
          const currentScale = 0.08 + prog * 0.22;
          dustDummy.position.set(p.x, p.y, p.z);
          dustDummy.scale.set(currentScale, currentScale, currentScale);
          dustDummy.updateMatrix();
          dustMeshRef.current.setMatrixAt(i, dustDummy.matrix);
        } else {
          dustDummy.position.set(0, -100, 0);
          dustDummy.updateMatrix();
          dustMeshRef.current.setMatrixAt(i, dustDummy.matrix);
        }
      }
      dustMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Emit position to camera tracker
    if (onPositionUpdate) {
      onPositionUpdate(pos.current, currentFacingAngle.current);
    }
  });

  return (
    <>
      {/* ========================================================== */}
      {/* ASTRONAUT HIERARCHICAL MODEL GROUP (MISSION COMMANDER)     */}
      {/* Deep Navy Blue (#1A237E) & White (#E0E0E0) Armored Panels  */}
      {/* Base sits flush on ground at y = 0.00                      */}
      {/* ========================================================== */}
      <group ref={rootGroupRef} name="AstronautPlayer" visible={isVisible}>
        {/* ================= TORSO & CHEST ================= */}
        {/* Torso center at y = 1.45 */}
        <group ref={torsoRef} position={[0, 1.45, 0]}>
          {/* Torso Main Body: Deep Navy Blue (#1A237E) Armored Cuirass */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.5, 0.45, 1.4, 20]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>

          {/* White (#E0E0E0) Armored Rib & Waist Accent Panels */}
          <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.51, 0.505, 0.24, 20]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>
          <mesh position={[0, -0.34, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.48, 0.47, 0.22, 20]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>

          {/* Chest Control Panel & Indian Flag Badge Patch */}
          <group position={[0, 0.15, 0.49]}>
            {/* Chest Box Base */}
            <mesh castShadow>
              <boxGeometry args={[0.54, 0.46, 0.08]} />
              <primitive object={suitGreyMaterial} />
            </mesh>

            {/* Red, Green, Blue Status Buttons */}
            <mesh position={[-0.16, 0.14, 0.05]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
            <mesh position={[-0.05, 0.14, 0.05]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
            <mesh position={[0.06, 0.14, 0.05]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshBasicMaterial color="#3b82f6" />
            </mesh>

            {/* Indian National Flag (Tiranga) Chest Badge Patch */}
            <mesh position={[0.16, 0.13, 0.046]}>
              <planeGeometry args={[0.16, 0.1]} />
              <meshStandardMaterial map={flagTexture} roughness={0.35} metalness={0.1} />
            </mesh>

            {/* Name Patch with "CMDR" Text */}
            <group position={[0, -0.09, 0.045]}>
              <mesh>
                <planeGeometry args={[0.44, 0.15]} />
                <meshStandardMaterial color="#0f172a" roughness={0.4} />
              </mesh>
              <Text
                fontSize={0.075}
                color="#FFD700"
                anchorX="center"
                anchorY="middle"
                position={[0, 0, 0.01]}
                letterSpacing={0.15}
              >
                CMDR
              </Text>
            </group>
          </group>

          {/* ================= BACKPACK (PLSS) ================= */}
          {/* Box: 0.8 wide, 1.2 tall, 0.48 deep on the back (-Z) */}
          <group position={[0, 0.05, -0.48]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.8, 1.2, 0.48]} />
              <primitive object={suitWhiteMaterial} />
            </mesh>

            {/* Deep Navy Blue Armored Backplate Trim */}
            <mesh position={[0, 0.05, -0.245]} castShadow>
              <boxGeometry args={[0.7, 0.46, 0.03]} />
              <primitive object={commanderNavyMaterial} />
            </mesh>

            {/* Indian Flag Decal on Upper Backpack */}
            <mesh position={[0, 0.42, -0.25]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.32, 0.2]} />
              <meshStandardMaterial map={flagTexture} roughness={0.4} metalness={0.1} />
            </mesh>

            {/* 2 Vertical Silver Oxygen Tanks on the Backpack */}
            <mesh position={[-0.22, -0.05, -0.26]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.82, 14]} />
              <primitive object={silverTankMaterial} />
            </mesh>
            <mesh position={[0.22, -0.05, -0.26]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.82, 14]} />
              <primitive object={silverTankMaterial} />
            </mesh>
          </group>

          {/* ================= HEAD & HELMET ================= */}
          {/* Helmet: White (#E0E0E0) with Deep Navy Blue (#1A237E) Brow Crown & Mirrored Gold Visor (#FFD700) */}
          <group position={[0, 0.98, 0]}>
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.5, 24, 20]} />
              <primitive object={suitWhiteMaterial} />
            </mesh>

            {/* Deep Navy Blue Helmet Sun-Shield Visor Brow Trim */}
            <mesh position={[0, 0.25, 0.12]} rotation={[0.3, 0, 0]} castShadow receiveShadow>
              <torusGeometry args={[0.45, 0.05, 10, 24, Math.PI]} />
              <primitive object={commanderNavyMaterial} />
            </mesh>

            {/* Deep Navy Blue Helmet Collar Ring */}
            <mesh position={[0, -0.4, 0]} castShadow receiveShadow>
              <torusGeometry args={[0.42, 0.06, 8, 20]} />
              <primitive object={commanderNavyMaterial} />
            </mesh>

            {/* Visor: Reflective Mirrored Gold Visor (#FFD700) with realistic glass shine */}
            <mesh position={[0, 0.05, 0.22]} scale={[0.85, 0.72, 0.65]} castShadow>
              <sphereGeometry args={[0.45, 24, 20]} />
              <primitive object={goldVisorMaterial} />
            </mesh>

            {/* Helmet Side Lamps */}
            <mesh position={[-0.46, 0.08, 0.08]}>
              <cylinderGeometry args={[0.04, 0.04, 0.14, 8]} />
              <primitive object={suitGreyMaterial} />
            </mesh>
            <mesh position={[0.46, 0.08, 0.08]}>
              <cylinderGeometry args={[0.04, 0.04, 0.14, 8]} />
              <primitive object={suitGreyMaterial} />
            </mesh>

            {/* Helmet Antenna on top: Thin cylinder with tiny red sphere */}
            <group position={[0.28, 0.42, -0.15]}>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.44, 8]} />
                <primitive object={silverTankMaterial} />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>
          </group>
        </group>

        {/* ================= ARMS & SHOULDERS ================= */}
        {/* Left Arm: Deep Navy Blue Pauldron + White Sleeve + Indian Flag Shoulder Patch + Charcoal Grey Glove */}
        <group ref={leftArmPivotRef} position={[-0.68, 2.05, 0]}>
          {/* Deep Navy Blue Armored Shoulder Pauldron */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.27, 14, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Upper/Lower Arm Cylinder (White #E0E0E0) */}
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.24, 1.1, 14]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>
          {/* Indian National Flag Shoulder Patch on Left Arm */}
          <mesh position={[-0.235, -0.26, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.24, 0.16]} />
            <meshStandardMaterial map={flagTexture} roughness={0.35} metalness={0.1} />
          </mesh>
          {/* Deep Navy Blue Forearm Armor Band & Elbow Joint */}
          <mesh position={[0, -0.42, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.238, 0.238, 0.1, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          <mesh position={[0, -0.68, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.242, 0.242, 0.14, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Solid Charcoal Grey (#212121) Glove Sphere at end */}
          <mesh position={[0, -1.25, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.26, 14, 14]} />
            <primitive object={charcoalGloveBootMaterial} />
          </mesh>
        </group>

        {/* Right Arm: Deep Navy Blue Pauldron + White Sleeve + Charcoal Grey Glove */}
        <group ref={rightArmPivotRef} position={[0.68, 2.05, 0]}>
          {/* Deep Navy Blue Armored Shoulder Pauldron */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.27, 14, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Upper/Lower Arm Cylinder (White #E0E0E0) */}
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.24, 1.1, 14]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>
          {/* Deep Navy Blue Forearm Armor Band & Elbow Joint */}
          <mesh position={[0, -0.42, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.238, 0.238, 0.1, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          <mesh position={[0, -0.68, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.242, 0.242, 0.14, 14]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Solid Charcoal Grey (#212121) Glove Sphere at end */}
          <mesh position={[0, -1.25, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.26, 14, 14]} />
            <primitive object={charcoalGloveBootMaterial} />
          </mesh>
        </group>

        {/* ================= LEGS & BOOTS ================= */}
        {/* Hips at y = 1.45. Leg + boot bottoms touch down flush at y = 0.00 */}
        {/* Left Leg */}
        <group ref={leftLegPivotRef} position={[-0.28, 1.45, 0]}>
          {/* Hip joint */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.25, 10, 10]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Leg Cylinder (White #E0E0E0) */}
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.28, 1.2, 16]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>
          {/* Deep Navy Blue Armored Thigh & Knee Guard */}
          <mesh position={[0, -0.32, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.278, 0.278, 0.22, 16]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          <mesh position={[0, -0.64, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.286, 0.286, 0.16, 16]} />
            <primitive object={suitGreyMaterial} />
          </mesh>
          {/* Solid Charcoal Grey (#212121) Boot Box */}
          <mesh position={[0, -1.3, 0.08]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.3, 0.5]} />
            <primitive object={charcoalGloveBootMaterial} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegPivotRef} position={[0.28, 1.45, 0]}>
          {/* Hip joint */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.25, 10, 10]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          {/* Leg Cylinder (White #E0E0E0) */}
          <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.26, 0.28, 1.2, 16]} />
            <primitive object={suitWhiteMaterial} />
          </mesh>
          {/* Deep Navy Blue Armored Thigh & Knee Guard */}
          <mesh position={[0, -0.32, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.278, 0.278, 0.22, 16]} />
            <primitive object={commanderNavyMaterial} />
          </mesh>
          <mesh position={[0, -0.64, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.286, 0.286, 0.16, 16]} />
            <primitive object={suitGreyMaterial} />
          </mesh>
          {/* Solid Charcoal Grey (#212121) Boot Box */}
          <mesh position={[0, -1.3, 0.08]} castShadow receiveShadow>
            <boxGeometry args={[0.4, 0.3, 0.5]} />
            <primitive object={charcoalGloveBootMaterial} />
          </mesh>
        </group>
      </group>

      {/* ========================================================== */}
      {/* FOOTSTEP DUST PUFF PARTICLES                               */}
      {/* ========================================================== */}
      <instancedMesh
        ref={dustMeshRef}
        args={[undefined, undefined, DUST_COUNT]}
        frustumCulled={false}
      >
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial
          color="#a89f91"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
};
