import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkyAtmosphere } from './SkyAtmosphere';
import { Terrain } from './Terrain';
import { Ocean } from './Ocean';
import { LaunchPadDetails } from './LaunchPadDetails';
import { Rocket } from './Rocket';
import { VaporSteam } from './VaporSteam';
import { CameraController, CameraPreset } from './CameraController';
import { Astronaut } from './Astronaut';
import { ThirdPersonCamera, ViewMode } from './ThirdPersonCamera';
import { Cockpit } from './Cockpit';
import { SpaceOrbitNav, Destination } from './SpaceOrbitNav';
import { PlanetarySurface } from './PlanetarySurface';
import { StoryChapterId, STORY_CHAPTERS, InteractableTargetId } from '../../data/storyMissionData';

interface SceneProps {
  currentPreset: CameraPreset;
  isAutoRotating: boolean;
  viewMode: ViewMode;
  countdownSeconds: number | null;
  isDoorOpen: boolean;
  showDoorPrompt: boolean;
  showElevatorPrompt: boolean;
  elevatorPosY: number;
  isAstronautVisible: boolean;
  onEnterFinished: () => void;
  onExitFinished: () => void;
  onLaunchRocket: () => void;
  onElevatorPromptChange: (show: boolean) => void;
  onTelemetryUpdate?: (altKm: number, velMs: number) => void;
  resetSignal?: number;

  // Interplanetary & Story Mission props
  selectedDestination: Destination | null;
  hoveredDestination: Destination | null;
  isWarping: boolean;
  warpProgress: number;
  isReentering: boolean;
  isDescentPhase?: boolean;
  descentProgress?: number;
  isAirlockOpen?: boolean;
  onNearAirlockChange?: (isNear: boolean) => void;
  isPlanetStoryActive?: boolean;
  activeChapterId?: StoryChapterId;
  conversationTargetPos?: THREE.Vector3 | null;
  onNearTargetChange?: (targetId: InteractableTargetId | null, distance: number) => void;
  onDistanceToObjectiveChange?: (distanceMeters: number) => void;
  onHoverPlanet: (p: Destination | null) => void;
  onSelectPlanet: (p: Destination) => void;
}

/**
 * Handles liftoff physics for the Return Rocket launching from the Moon/Mars back to Earth
 */
const ReturnRocketPhysics: React.FC<{
  viewMode: ViewMode;
  returnRocketYRef: React.MutableRefObject<number>;
  onTelemetryUpdate?: (altKm: number, velMs: number) => void;
  resetSignal?: number;
}> = ({ viewMode, returnRocketYRef, onTelemetryUpdate, resetSignal }) => {
  const velocityRef = useRef(0);
  const telemetryClock = useRef(0);
  const isFlight = viewMode === 'IN_FLIGHT_WINDOW' || viewMode === 'IN_FLIGHT_CINEMATIC';

  useEffect(() => {
    returnRocketYRef.current = 0;
    velocityRef.current = 0;
  }, [resetSignal, returnRocketYRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);
    if (isFlight) {
      velocityRef.current += 18.0 * dt;
      returnRocketYRef.current += velocityRef.current * dt;

      telemetryClock.current += dt;
      if (telemetryClock.current > 0.1 && onTelemetryUpdate) {
        telemetryClock.current = 0;
        const altKm = Math.min(125, returnRocketYRef.current * 0.48);
        const velMs = Math.min(11200, velocityRef.current * 45.0);
        onTelemetryUpdate(altKm, velMs);
      }
    } else if (viewMode === 'PLANET_SURFACE' || viewMode === 'PLANET_DESCENT') {
      returnRocketYRef.current = 0;
      velocityRef.current = 0;
    }
  });

  return null;
};

// Earth Rocket System: updates position in useFrame without causing React re-renders
const RocketSystem: React.FC<{
  viewMode: ViewMode;
  isDoorOpen: boolean;
  showDoorPrompt: boolean;
  countdownSeconds: number | null;
  onLaunchRocket: () => void;
  rocketYRef: React.MutableRefObject<number>;
  rocketXRef: React.MutableRefObject<number>;
  onTelemetryUpdate?: (altKm: number, velMs: number) => void;
  resetSignal?: number;
}> = ({
  viewMode,
  isDoorOpen,
  showDoorPrompt,
  countdownSeconds,
  onLaunchRocket,
  rocketYRef,
  rocketXRef,
  onTelemetryUpdate,
  resetSignal,
}) => {
  const rocketGroupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const telemetryClock = useRef(0);

  const isFlight = viewMode === 'IN_FLIGHT_WINDOW' || viewMode === 'IN_FLIGHT_CINEMATIC';

  useEffect(() => {
    rocketYRef.current = 0;
    rocketXRef.current = 0;
    velocityRef.current = 0;
    if (rocketGroupRef.current) {
      rocketGroupRef.current.position.set(0, 0, 0);
      rocketGroupRef.current.rotation.set(0, 0, 0);
    }
  }, [resetSignal, rocketYRef, rocketXRef]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.033);

    if (isFlight) {
      velocityRef.current += 16.0 * dt;
      rocketYRef.current += velocityRef.current * dt;

      let currentTilt = 0;
      if (rocketYRef.current > 5.0) {
        const tiltFactor = Math.min(1.0, (rocketYRef.current - 5.0) / 45.0);
        const maxTiltRad = (10.0 * Math.PI) / 180.0;
        currentTilt = -tiltFactor * maxTiltRad;
        rocketXRef.current += Math.sin(-currentTilt) * velocityRef.current * dt * 0.45;
      }

      if (rocketGroupRef.current) {
        rocketGroupRef.current.position.y = rocketYRef.current;
        rocketGroupRef.current.position.x = rocketXRef.current;
        rocketGroupRef.current.rotation.z = currentTilt;
      }

      telemetryClock.current += dt;
      if (telemetryClock.current > 0.1 && onTelemetryUpdate) {
        telemetryClock.current = 0;
        const altKm = Math.min(125, rocketYRef.current * 0.42);
        const velMs = Math.min(7850, velocityRef.current * 42.0);
        onTelemetryUpdate(altKm, velMs);
      }
    }
  });

  const smokeColumns = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const angle = (i / 14) * Math.PI * 2;
      return {
        x: Math.cos(angle) * 2.2,
        z: Math.sin(angle) * 2.2,
        scale: 1.3 + (i % 3) * 0.5,
      };
    });
  }, []);

  return (
    <group ref={rocketGroupRef}>
      <Rocket
        isDoorOpen={isDoorOpen}
        showDoorPrompt={showDoorPrompt}
      />

      {(isFlight || (viewMode === 'COUNTDOWN' && countdownSeconds !== null && countdownSeconds <= 3)) && (
        <group position={[0, 0.3, 0]}>
          {smokeColumns.map((col, idx) => (
            <group key={idx} position={[col.x, 0, col.z]}>
              <mesh position={[0, -0.4, 0]} scale={[col.scale * 1.4, col.scale * 0.9, col.scale * 1.4]}>
                <dodecahedronGeometry args={[1.2, 1]} />
                <meshBasicMaterial color="#e2e8f0" transparent opacity={0.55} depthWrite={false} />
              </mesh>
              <mesh position={[col.x * 0.35, -1.6, col.z * 0.35]} scale={[col.scale * 1.8, col.scale * 1.1, col.scale * 1.8]}>
                <dodecahedronGeometry args={[1.4, 1]} />
                <meshBasicMaterial color="#cbd5e1" transparent opacity={0.35} depthWrite={false} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {(viewMode === 'COCKPIT' ||
        viewMode === 'COUNTDOWN' ||
        viewMode === 'IN_FLIGHT_WINDOW' ||
        viewMode === 'IN_FLIGHT_CINEMATIC') && (
        <Cockpit
          onLaunch={onLaunchRocket}
          isLaunching={isFlight}
          isCountingDown={viewMode === 'COUNTDOWN'}
          countdownSeconds={countdownSeconds}
        />
      )}
    </group>
  );
};

export const Scene: React.FC<SceneProps> = ({
  currentPreset,
  isAutoRotating,
  viewMode,
  countdownSeconds,
  isDoorOpen,
  showDoorPrompt,
  elevatorPosY,
  isAstronautVisible,
  onEnterFinished,
  onExitFinished,
  onLaunchRocket,
  onElevatorPromptChange,
  onTelemetryUpdate,
  resetSignal,
  selectedDestination,
  hoveredDestination,
  isWarping,
  warpProgress,
  isReentering,
  descentProgress = 1.0,
  isAirlockOpen = false,
  onNearAirlockChange,
  isPlanetStoryActive = false,
  activeChapterId = 'CHAPTER_1_DONKI',
  conversationTargetPos = null,
  onNearTargetChange,
  onDistanceToObjectiveChange,
  onHoverPlanet,
  onSelectPlanet,
}) => {
  const astronautPos = useRef(new THREE.Vector3(14, 0.21, 14)).current;
  const cameraYawRef = useRef(Math.PI * 0.75);
  const rocketYRef = useRef(0);
  const rocketXRef = useRef(0);
  const returnRocketYRef = useRef(0);
  const elevatorYRef = useRef(elevatorPosY);
  elevatorYRef.current = elevatorPosY;
  const distUpdateClock = useRef(0);

  const handleAstronautUpdate = useCallback(
    (pos: THREE.Vector3) => {
      astronautPos.copy(pos);

      if (isPlanetStoryActive) {
        // Surface Launchpad Elevator is at (-4.2, 0, 18.0)
        const distSurfaceElev = Math.hypot(astronautPos.x - -4.2, astronautPos.z - 18.0);
        const isNearSurfaceElev = distSurfaceElev <= 4.2 && Math.abs(astronautPos.y) < 2.5;
        onElevatorPromptChange(isNearSurfaceElev);

        // Throttled distance to active story objective
        const now = performance.now();
        if (now - distUpdateClock.current > 180 && onDistanceToObjectiveChange) {
          distUpdateClock.current = now;
          if (activeChapterId !== 'MISSION_COMPLETE') {
            const [tx, , tz] = STORY_CHAPTERS[activeChapterId].targetPosition;
            const d = Math.round(Math.hypot(astronautPos.x - tx, astronautPos.z - tz));
            onDistanceToObjectiveChange(d);
          }
        }
      } else {
        // Earth elevator base station at (-4.75, 0)
        const distElevator = Math.hypot(astronautPos.x - -4.75, astronautPos.z - 0);
        const isNearElevator = distElevator <= 3.5 && Math.abs(astronautPos.y - 0.21) < 2.5;
        onElevatorPromptChange(isNearElevator);
      }
    },
    [astronautPos, isPlanetStoryActive, activeChapterId, onElevatorPromptChange, onDistanceToObjectiveChange]
  );

  const handleCameraYawChange = useCallback((yaw: number) => {
    cameraYawRef.current = yaw;
  }, []);

  const isThirdPersonActive =
    currentPreset === 'astronaut' ||
    viewMode === 'CONVERSATION' ||
    viewMode === 'ELEVATOR_RIDE' ||
    viewMode === 'ENTERING' ||
    viewMode === 'EXITING' ||
    viewMode === 'COCKPIT' ||
    viewMode === 'COUNTDOWN' ||
    viewMode === 'IN_FLIGHT_WINDOW' ||
    viewMode === 'IN_FLIGHT_CINEMATIC' ||
    viewMode === 'PLANET_DESCENT' ||
    viewMode === 'PLANET_SURFACE';

  const isSpaceOrbitMode = viewMode === 'SPACE_ORBIT' || viewMode === 'WARP_DRIVE';
  const isPlanetSurfaceMode =
    !isSpaceOrbitMode &&
    (isPlanetStoryActive ||
      viewMode === 'PLANET_DESCENT' ||
      viewMode === 'PLANET_SURFACE' ||
      viewMode === 'CONVERSATION' ||
      viewMode === 'COMMAND_CENTER');
  const isEarthMode = !isSpaceOrbitMode && !isPlanetSurfaceMode;

  return (
    <div className="w-full h-full absolute inset-0 bg-slate-950">
      <Canvas
        camera={{
          position: [20, 5, 20],
          fov: 45,
          near: 0.1,
          far: 2000,
        }}
        shadows="soft"
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
      >
        {/* ========================================================== */}
        {/* MODE A: DEEP SPACE LOW EARTH ORBIT & PLANET NAVIGATION    */}
        {/* ========================================================== */}
        {isSpaceOrbitMode && (
          <SpaceOrbitNav
            onHoverPlanet={onHoverPlanet}
            onSelectPlanet={onSelectPlanet}
            selectedDestination={selectedDestination}
            hoveredDestination={hoveredDestination}
            isWarping={isWarping}
            warpProgress={warpProgress}
            isReentering={isReentering}
          />
        )}

        {/* ========================================================== */}
        {/* MODE B: PLANETARY ARRIVAL, OUTPOST STORY & RETURN LAUNCH   */}
        {/* ========================================================== */}
        {isPlanetSurfaceMode && (
          <>
            <ReturnRocketPhysics
              viewMode={viewMode}
              returnRocketYRef={returnRocketYRef}
              onTelemetryUpdate={onTelemetryUpdate}
              resetSignal={resetSignal}
            />
            <PlanetarySurface
              destination={selectedDestination || 'MARS'}
              viewMode={viewMode}
              isDescentPhase={viewMode === 'PLANET_DESCENT'}
              descentProgress={descentProgress}
              isAirlockOpen={isAirlockOpen}
              onNearAirlockChange={onNearAirlockChange}
              astronautPos={astronautPos}
              activeChapterId={activeChapterId}
              elevatorPosY={elevatorPosY}
              returnRocketYRef={returnRocketYRef}
              countdownSeconds={countdownSeconds}
              onLaunchReturnRocket={onLaunchRocket}
              onNearTargetChange={onNearTargetChange}
            />
            <Astronaut
              onPositionUpdate={handleAstronautUpdate}
              cameraYawRef={cameraYawRef}
              isElevatorRide={viewMode === 'ELEVATOR_RIDE'}
              elevatorPosY={elevatorPosY}
              isEntering={viewMode === 'ENTERING'}
              isExiting={viewMode === 'EXITING'}
              isVisible={viewMode !== 'PLANET_DESCENT' && isAstronautVisible}
              isPlanetarySurface={true}
              planetaryDestination={selectedDestination || 'MARS'}
              isMovementLocked={viewMode === 'CONVERSATION'}
              conversationTargetPos={conversationTargetPos}
              onEnterFinished={onEnterFinished}
              onExitFinished={onExitFinished}
            />
            <ThirdPersonCamera
              targetPos={astronautPos}
              onYawChange={handleCameraYawChange}
              active={true}
              viewMode={viewMode}
              isPlanetarySurface={true}
              conversationTargetPos={conversationTargetPos}
              rocketPosY={
                viewMode === 'PLANET_DESCENT'
                  ? (1.0 - (descentProgress ?? 1.0)) * 38.0
                  : returnRocketYRef.current
              }
              rocketYRef={viewMode === 'PLANET_DESCENT' ? undefined : returnRocketYRef}
              elevatorPosY={elevatorPosY}
              elevatorYRef={elevatorYRef}
            />
          </>
        )}

        {/* ========================================================== */}
        {/* MODE C: EARTH LAUNCH COMPLEX SCENE                         */}
        {/* ========================================================== */}
        {isEarthMode && (
          <>
            <fog attach="fog" args={['#334155', 55, 340]} />

            <ambientLight color="#FFE0B2" intensity={0.68} />
            <hemisphereLight args={['#FFE0B2', '#5D4037', 0.9]} />
            <directionalLight
              position={[120, 42, -55]}
              color="#fed7aa"
              intensity={2.4}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-near={0.5}
              shadow-camera-far={500}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-25}
              shadow-bias={-0.0005}
              shadow-normalBias={0.03}
            />
            <directionalLight position={[-70, 35, 70]} color="#FFE0B2" intensity={0.65} />
            <pointLight position={[0, 3.2, 0]} color="#fed7aa" intensity={12} distance={18} decay={2} />

            <SkyAtmosphere />
            <Terrain />
            <Ocean />
            <LaunchPadDetails elevatorPosY={elevatorPosY} />

            <RocketSystem
              viewMode={viewMode}
              isDoorOpen={isDoorOpen}
              showDoorPrompt={showDoorPrompt}
              countdownSeconds={countdownSeconds}
              onLaunchRocket={onLaunchRocket}
              rocketYRef={rocketYRef}
              rocketXRef={rocketXRef}
              onTelemetryUpdate={onTelemetryUpdate}
              resetSignal={resetSignal}
            />

            <VaporSteam />

            <Astronaut
              onPositionUpdate={handleAstronautUpdate}
              cameraYawRef={cameraYawRef}
              isElevatorRide={viewMode === 'ELEVATOR_RIDE'}
              elevatorPosY={elevatorPosY}
              isEntering={viewMode === 'ENTERING'}
              isExiting={viewMode === 'EXITING'}
              isVisible={isAstronautVisible}
              onEnterFinished={onEnterFinished}
              onExitFinished={onExitFinished}
            />

            <ThirdPersonCamera
              targetPos={astronautPos}
              onYawChange={handleCameraYawChange}
              active={isThirdPersonActive}
              viewMode={viewMode}
              rocketYRef={rocketYRef}
              rocketXRef={rocketXRef}
              elevatorPosY={elevatorPosY}
              elevatorYRef={elevatorYRef}
            />
            <CameraController
              currentPreset={currentPreset}
              isAutoRotating={isAutoRotating && !isThirdPersonActive}
            />
          </>
        )}
      </Canvas>
    </div>
  );
};
