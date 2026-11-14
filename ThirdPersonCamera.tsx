import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';

export type ViewMode =
  | 'WALK'
  | 'CONVERSATION'
  | 'ELEVATOR_RIDE'
  | 'ENTERING'
  | 'COCKPIT'
  | 'COUNTDOWN'
  | 'IN_FLIGHT_WINDOW'
  | 'IN_FLIGHT_CINEMATIC'
  | 'SPACE_ORBIT'
  | 'WARP_DRIVE'
  | 'PLANET_DESCENT'
  | 'PLANET_SURFACE'
  | 'COMMAND_CENTER'
  | 'EXITING';

interface ThirdPersonCameraProps {
  targetPos: THREE.Vector3;
  rocketPosY?: number;
  rocketYRef?: React.MutableRefObject<number>;
  rocketXRef?: React.MutableRefObject<number>;
  elevatorPosY?: number;
  elevatorYRef?: React.MutableRefObject<number>;
  onYawChange?: (yaw: number) => void;
  active?: boolean;
  viewMode?: ViewMode;
  isPlanetarySurface?: boolean;
  conversationTargetPos?: THREE.Vector3 | null;
}

export const ThirdPersonCamera: React.FC<ThirdPersonCameraProps> = ({
  targetPos,
  rocketPosY = 0,
  rocketYRef,
  rocketXRef,
  elevatorPosY = 0.21,
  elevatorYRef,
  onYawChange,
  active = true,
  viewMode = 'WALK',
  isPlanetarySurface = false,
  conversationTargetPos = null,
}) => {
  const { camera, gl } = useThree();

  // Spherical camera orbit state around astronaut
  const distance = useRef(9.4);
  const yaw = useRef(Math.PI * 0.75);
  const pitch = useRef(0.48);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  // Damped targets
  const smoothedTarget = useRef(new THREE.Vector3(targetPos.x, targetPos.y + 1.35, targetPos.z));

  // Mouse drag & scroll wheel listeners
  useEffect(() => {
    if (!active) return;
    const domElement = gl.domElement;

    if (onYawChange) {
      onYawChange(yaw.current);
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - previousMouse.current.x;
      const dy = e.clientY - previousMouse.current.y;
      previousMouse.current = { x: e.clientX, y: e.clientY };

      yaw.current += dx * 0.006;
      pitch.current += dy * 0.005;

      pitch.current = Math.max(-1.1, Math.min(1.35, pitch.current));

      if (onYawChange) {
        onYawChange(yaw.current);
      }
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance.current = Math.max(4.0, Math.min(28.0, distance.current + e.deltaY * 0.012));
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
    };
  }, [active, gl.domElement, onYawChange]);

  useFrame(({ clock }, delta) => {
    if (!active) return;
    if (viewMode === 'SPACE_ORBIT' || viewMode === 'WARP_DRIVE') return;

    const t = clock.getElapsedTime();
    const dt = Math.min(delta, 0.033);
    const curRocketY = rocketYRef ? rocketYRef.current : rocketPosY;
    const curRocketX = rocketXRef ? rocketXRef.current : 0;
    const curElevatorY = elevatorYRef ? elevatorYRef.current : elevatorPosY;

    const padZ = isPlanetarySurface ? 18.0 : 0.0;
    const cockpitBaseY = isPlanetarySurface ? 13.66 : 18.66;
    const topBridgeY = isPlanetarySurface ? 13.8 : 20.2;

    // Subtle gentle sine-wave micro-vibration ONLY on lookAt / rotation
    const microVibeY = Math.sin(t * 28.0) * 0.007 + Math.sin(t * 41.0) * 0.004;
    const microVibeX = Math.cos(t * 24.0) * 0.006 + Math.cos(t * 39.0) * 0.004;

    // 0. DETROIT: BECOME HUMAN OVER-THE-SHOULDER CONVERSATION CAMERA
    if (viewMode === 'CONVERSATION' && conversationTargetPos) {
      const dx = conversationTargetPos.x - targetPos.x;
      const dz = conversationTargetPos.z - targetPos.z;
      const len = Math.max(0.1, Math.hypot(dx, dz));
      const dirX = dx / len;
      const dirZ = dz / len;
      // Right perpendicular vector for over-the-right-shoulder framing
      const rightX = -dirZ;
      const rightZ = dirX;

      const desiredEye = new THREE.Vector3(
        targetPos.x - dirX * 2.5 + rightX * 1.15,
        targetPos.y + 2.35,
        targetPos.z - dirZ * 2.5 + rightZ * 1.15
      );
      const desiredLook = new THREE.Vector3(
        conversationTargetPos.x,
        conversationTargetPos.y + 1.85,
        conversationTargetPos.z
      );

      camera.position.lerp(desiredEye, dt * 6.0);
      smoothedTarget.current.lerp(desiredLook, dt * 7.5);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 0A. ELEVATOR RIDE: Smoothly tracks elevator ascending the gantry tower
    if (viewMode === 'ELEVATOR_RIDE') {
      const elevEye = new THREE.Vector3(-10.2, curElevatorY + 2.8, padZ + 6.8);
      const elevLook = new THREE.Vector3(-4.5, curElevatorY + 1.2, padZ);

      camera.position.lerp(elevEye, dt * 4.5);
      smoothedTarget.current.lerp(elevLook, dt * 5.5);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 0B. PLANETARY DESCENT & TOUCHDOWN CINEMATIC CAMERA
    if (viewMode === 'PLANET_DESCENT') {
      const rocketWorldY = curRocketY;
      const desiredEye = new THREE.Vector3(18.0, Math.max(4.5, rocketWorldY + 9.0), 18.0 + 22.0);
      const desiredLook = new THREE.Vector3(0.5, Math.max(1.0, rocketWorldY + 1.5), 18.0);

      // Slow smooth lerp — no snapping, no flickering
      const lerpSpeed = Math.min(dt * 2.8, 0.06);
      camera.position.lerp(desiredEye, lerpSpeed);
      smoothedTarget.current.lerp(desiredLook, lerpSpeed * 1.4);
      camera.lookAt(smoothedTarget.current);
      const perspCam = camera as THREE.PerspectiveCamera;
      perspCam.near = 0.1;
      perspCam.far = 2000;
      perspCam.updateProjectionMatrix();
      return;
    }

    // 1. IN-FLIGHT VIEW 1: ASTRONAUT FIRST-PERSON COCKPIT VIEW
    if (viewMode === 'IN_FLIGHT_WINDOW') {
      const eyePos = new THREE.Vector3(curRocketX, curRocketY + cockpitBaseY + 0.08, padZ + 0.28);
      camera.position.copy(eyePos);

      const baseDirX = Math.sin(yaw.current) * Math.cos(pitch.current);
      const baseDirY = Math.sin(pitch.current);
      const baseDirZ = Math.cos(yaw.current) * Math.cos(pitch.current);

      const lookTarget = new THREE.Vector3(
        eyePos.x + (baseDirX + microVibeX) * 4.0,
        eyePos.y + (baseDirY + microVibeY) * 4.0,
        eyePos.z + baseDirZ * 4.0
      );

      smoothedTarget.current.lerp(lookTarget, dt * 14.0);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 2. IN-FLIGHT VIEW 2: CINEMATIC EXTERIOR CHASE CAM
    if (viewMode === 'IN_FLIGHT_CINEMATIC') {
      const targetCamX = curRocketX - 11.0;
      const targetCamY = Math.max(1.5, curRocketY - 4.0);
      const targetCamZ = padZ + 14.2;

      const desiredEye = new THREE.Vector3(targetCamX, targetCamY, targetCamZ);
      const targetLook = new THREE.Vector3(
        curRocketX + microVibeX * 2.0,
        curRocketY + 8.5 + microVibeY * 2.0,
        padZ
      );

      camera.position.lerp(desiredEye, 0.06);
      smoothedTarget.current.lerp(targetLook, 0.08);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 3. COCKPIT / COUNTDOWN INTERIOR VIEW
    if (viewMode === 'COCKPIT' || viewMode === 'COUNTDOWN') {
      const cockpitEye = new THREE.Vector3(curRocketX, curRocketY + cockpitBaseY, padZ + 0.42);
      const cockpitLook = new THREE.Vector3(
        curRocketX,
        curRocketY + cockpitBaseY - 0.14,
        padZ - 0.75
      );

      camera.position.lerp(cockpitEye, dt * 6.0);
      smoothedTarget.current.lerp(cockpitLook, dt * 7.0);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 4. ENTERING ROCKET CAMERA TRANSITION (Walkway bridge arm at top of tower)
    if (viewMode === 'ENTERING') {
      const enterEye = new THREE.Vector3(-6.5, topBridgeY, padZ + 4.2);
      const bridgeLook = new THREE.Vector3(-2.5, topBridgeY - 1.0, padZ);

      camera.position.lerp(enterEye, dt * 4.5);
      smoothedTarget.current.lerp(bridgeLook, dt * 6.0);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 5. EXITING ROCKET CAMERA TRANSITION
    if (viewMode === 'EXITING') {
      const exitEye = new THREE.Vector3(-6.5, topBridgeY, padZ + 4.2);
      const bridgeLook = new THREE.Vector3(-4.0, topBridgeY - 1.0, padZ);

      camera.position.lerp(exitEye, dt * 4.5);
      smoothedTarget.current.lerp(bridgeLook, dt * 6.0);
      camera.lookAt(smoothedTarget.current);
      return;
    }

    // 6. THIRD-PERSON ASTRONAUT FOLLOW CAMERA
    const lookTarget = new THREE.Vector3(targetPos.x, targetPos.y + 1.35, targetPos.z);
    smoothedTarget.current.lerp(lookTarget, dt * 8.5);

    const hDist = distance.current * Math.cos(pitch.current);
    const vDist = distance.current * Math.sin(pitch.current);

    const desiredX = smoothedTarget.current.x + Math.sin(yaw.current) * hDist;
    const desiredY = Math.max(0.5, smoothedTarget.current.y + vDist);
    const desiredZ = smoothedTarget.current.z + Math.cos(yaw.current) * hDist;

    const desiredPos = new THREE.Vector3(desiredX, desiredY, desiredZ);

    camera.position.lerp(desiredPos, dt * 7.5);
    camera.lookAt(smoothedTarget.current);
  });

  return null;
};
