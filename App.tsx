/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Scene } from './components/3d/Scene';
import { CameraPreset } from './components/3d/CameraController';
import { Overlay } from './components/ui/Overlay';
import { ViewMode } from './components/3d/ThirdPersonCamera';
import { soundManager } from './utils/audio';
import { Destination } from './components/3d/SpaceOrbitNav';
import {
  StoryChapterId,
  STORY_CHAPTERS,
  InteractableTargetId,
  DialogueChoiceOption,
} from './data/storyMissionData';
import { DecisionRecord, MissionPhoto } from './components/ui/JuniorCommanderCertificate';
import {
  MissionBriefingScreen,
  AstronautProfile,
} from './components/ui/MissionBriefingScreen';

export default function App() {
  const [profile, setProfile] = useState<AstronautProfile | null>(null);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('astronaut');
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  // Start the game on Earth at the Cape Launchpad
  const [viewMode, setViewMode] = useState<ViewMode>('WALK');
  const [isPlanetStoryActive, setIsPlanetStoryActive] = useState<boolean>(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [hoveredDestination, setHoveredDestination] = useState<Destination | null>(null);

  // Elevator & rocket boarding state
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [showDoorPrompt, setShowDoorPrompt] = useState(false);
  const [showElevatorPrompt, setShowElevatorPrompt] = useState(false);
  const [elevatorPosY, setElevatorPosY] = useState(0.21);
  const elevatorAnimRef = useRef<number | null>(null);
  const [isAstronautVisible, setIsAstronautVisible] = useState(true);

  // Launch Countdown State
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  // Flight Telemetry
  const [altitudeKm, setAltitudeKm] = useState(0);
  const [velocityMs, setVelocityMs] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);

  // Warp & Descent state
  const [isWarping, setIsWarping] = useState(false);
  const [warpProgress, setWarpProgress] = useState(0);
  const [isReentering, setIsReentering] = useState(false);
  const warpTimerRef = useRef<number | null>(null);
  const [descentProgress, setDescentProgress] = useState(0);
  const descentTimerRef = useRef<number | null>(null);
  const [isNearAirlock, setIsNearAirlock] = useState(false);
  const [isAirlockOpen, setIsAirlockOpen] = useState(false);

  // ============================================================
  // 4-PHASE STORY & DETROIT DIALOGUE STATE
  // ============================================================
  const [activeChapterId, setActiveChapterId] = useState<StoryChapterId>('CHAPTER_1_DONKI');
  const [nearTargetId, setNearTargetId] = useState<InteractableTargetId | null>(null);
  const [distanceToObjective, setDistanceToObjective] = useState<number>(28);
  const [outpostStats, setOutpostStats] = useState({
    power: 85,
    oxygen: 95,
    water: 90,
    morale: 85,
  });
  const [detroitAlerts, setDetroitAlerts] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [photos, setPhotos] = useState<MissionPhoto[]>([]);

  const pushDetroitAlert = useCallback((text: string) => {
    setDetroitAlerts((prev) => [...prev.slice(-3), text]);
    setTimeout(() => {
      setDetroitAlerts((prev) => prev.filter((item) => item !== text));
    }, 4500);
  }, []);

  // Capture live 3D WebGL screenshot with NASA mission progress watermark & save to Gallery
  const handleTakePhoto = useCallback(() => {
    soundManager.startAmbiance();
    soundManager.playCameraShutter();

    const glCanvas = document.querySelector('canvas');
    if (!glCanvas) return;

    const worldName =
      selectedDestination === 'MOON' ? 'Artemis Base Alpha (Moon)' : 'Olympus Station (Mars)';

    let phaseLabel = 'Cape Launchpad Prep';
    let locationLabel = 'Earth Launch Complex 39A';
    let progressStep = 'Launch Prep (15%)';

    if (viewMode === 'SPACE_ORBIT') {
      phaseLabel = 'Solar System Orbital Navigation';
      locationLabel = 'Deep Space Orbit';
      progressStep = 'Orbital Nav (30%)';
    } else if (viewMode === 'WARP_DRIVE') {
      phaseLabel = isPlanetStoryActive ? 'Trans-Earth Return Injection' : 'Interplanetary Warp Transit';
      locationLabel = isPlanetStoryActive ? 'Cislunar / Trans-Earth Corridor' : `En Route to ${selectedDestination || 'MARS'}`;
      progressStep = isPlanetStoryActive ? 'Earth Return (98%)' : 'Warp Transit (40%)';
    } else if (viewMode === 'PLANET_DESCENT') {
      phaseLabel = `${selectedDestination || 'MARS'} Atmospheric Entry & Touchdown`;
      locationLabel = worldName;
      progressStep = 'Planetary Descent (50%)';
    } else if (
      viewMode === 'IN_FLIGHT_CINEMATIC' ||
      viewMode === 'IN_FLIGHT_WINDOW' ||
      viewMode === 'COUNTDOWN' ||
      viewMode === 'COCKPIT'
    ) {
      phaseLabel = isPlanetStoryActive ? 'Earth Return Ascent' : 'SOL-7 Orbital Ascent';
      locationLabel = isPlanetStoryActive ? worldName : 'Earth Upper Atmosphere';
      progressStep = isPlanetStoryActive ? 'Return Launch (95%)' : 'Rocket Ascent (25%)';
    } else if (isPlanetStoryActive || viewMode === 'PLANET_SURFACE' || viewMode === 'CONVERSATION') {
      locationLabel = worldName;
      const chapterInfo =
        activeChapterId !== 'MISSION_COMPLETE' ? STORY_CHAPTERS[activeChapterId] : null;
      phaseLabel = chapterInfo ? chapterInfo.title : 'Surface EVA Exploration';
      if (activeChapterId === 'CHAPTER_1_DONKI') progressStep = 'Chapter 1/4 (60%)';
      else if (activeChapterId === 'CHAPTER_2_DUST') progressStep = 'Chapter 2/4 (72%)';
      else if (activeChapterId === 'CHAPTER_3_WATER') progressStep = 'Chapter 3/4 (84%)';
      else if (activeChapterId === 'CHAPTER_4_DELAY') progressStep = 'Chapter 4/4 (92%)';
      else progressStep = 'Final Launch Ready (96%)';
    }

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const offscreen = document.createElement('canvas');
    const targetW = Math.min(1280, glCanvas.width || 1280);
    const aspect = (glCanvas.height || 720) / (glCanvas.width || 1280);
    const targetH = Math.round(targetW * aspect);
    offscreen.width = targetW;
    offscreen.height = targetH;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(glCanvas, 0, 0, targetW, targetH);

    // Draw sleek NASA camera viewfinder corners & bottom telemetry strip
    const barH = Math.max(44, Math.round(targetH * 0.085));
    ctx.fillStyle = 'rgba(2, 6, 23, 0.84)';
    ctx.fillRect(0, targetH - barH, targetW, barH);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(0, targetH - barH, targetW, 2);

    const commanderCallsign = profile ? `CDR. ${profile.name.toUpperCase()} ${profile.badge}` : 'CDR. SOL-7';
    ctx.fillStyle = '#fde047';
    ctx.font = `bold ${Math.max(13, Math.round(barH * 0.34))}px Orbitron, sans-serif`;
    ctx.fillText(`NASA EVA CAM • ${commanderCallsign} • ${phaseLabel.toUpperCase()}`, 16, targetH - barH * 0.52);

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${Math.max(11, Math.round(barH * 0.27))}px monospace`;
    ctx.fillText(
      `LOC: ${locationLabel}   |   PROGRESS: ${progressStep}   |   TIME: ${timestamp}`,
      16,
      targetH - barH * 0.16
    );

    const dataUrl = offscreen.toDataURL('image/jpeg', 0.88);
    const newPhoto: MissionPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dataUrl,
      phaseLabel,
      locationLabel,
      progressStep,
      timestamp,
    };

    setPhotos((prev) => [...prev, newPhoto]);
    pushDetroitAlert(`📸 PHOTO SAVED TO GALLERY! [${progressStep} • ${phaseLabel}]`);
  }, [viewMode, isPlanetStoryActive, selectedDestination, activeChapterId, profile, pushDetroitAlert]);

  const handleDeletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Over-the-shoulder conversation target 3D coordinates
  const conversationTargetPos = useMemo(() => {
    if (activeChapterId === 'MISSION_COMPLETE') return null;
    const [tx, ty, tz] = STORY_CHAPTERS[activeChapterId].targetPosition;
    return new THREE.Vector3(tx, ty, tz);
  }, [activeChapterId]);

  const handleNearTargetChange = useCallback(
    (targetId: InteractableTargetId | null) => {
      setNearTargetId(targetId);
    },
    []
  );

  // Open Detroit-style 4-choice dialogue wheel with active crew member
  const handleStartConversation = useCallback(() => {
    if (activeChapterId === 'MISSION_COMPLETE' || activeChapterId === 'CHAPTER_5_LAUNCH') return;
    soundManager.startAmbiance();
    soundManager.playTelemetryChirp();
    setViewMode('CONVERSATION');
  }, [activeChapterId]);

  const handleCloseConversation = useCallback(() => {
    soundManager.playTelemetryChirp();
    setViewMode('PLANET_SURFACE');
  }, []);

  const handleStatChange = useCallback(
    (
      delta: { power?: number; oxygen?: number; water?: number; morale?: number },
      alertText: string
    ) => {
      setOutpostStats((prev) => ({
        power: Math.min(100, Math.max(10, prev.power + (delta.power || 0))),
        oxygen: Math.min(100, Math.max(10, prev.oxygen + (delta.oxygen || 0))),
        water: Math.min(100, Math.max(10, prev.water + (delta.water || 0))),
        morale: Math.min(100, Math.max(10, prev.morale + (delta.morale || 0))),
      }));
      if (alertText) {
        pushDetroitAlert(alertText);
      }
    },
    [pushDetroitAlert]
  );

  // Trigger elevator ride up to rocket walkway bridge (works on both Planetary Surface & Earth Pad)
  const triggerElevatorAscent = useCallback(
    (onPlanetSurface: boolean) => {
      setViewMode('ELEVATOR_RIDE');
      soundManager.startAmbiance();
      soundManager.playElevatorSound();

      const startY = onPlanetSurface ? 0.0 : 0.21;
      const targetY = onPlanetSurface ? 12.8 : 18.9;
      const startTime = performance.now();
      const duration = 3600;

      const animateAscent = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        const ease =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const curY = startY + (targetY - startY) * ease;
        setElevatorPosY(curY);

        if (progress < 1.0) {
          elevatorAnimRef.current = requestAnimationFrame(animateAscent);
        } else {
          setElevatorPosY(targetY);
          setIsDoorOpen(true);
          setViewMode('ENTERING');
        }
      };

      elevatorAnimRef.current = requestAnimationFrame(animateAscent);
    },
    []
  );

  const handleRideElevator = useCallback(() => {
    if (viewMode !== 'WALK' && viewMode !== 'PLANET_SURFACE') return;
    triggerElevatorAscent(isPlanetStoryActive);
  }, [viewMode, isPlanetStoryActive, triggerElevatorAscent]);

  // Resolve a story chapter dilemma and advance to the next chapter
  const handleResolveChapter = useCallback(
    (choice: DialogueChoiceOption) => {
      // Show Detroit relationship & resource badge alert
      if (choice.badgeText) {
        pushDetroitAlert(`★ ${choice.badgeText}`);
      }

      // Record decision for final Junior Commander Certificate flowchart
      setDecisions((prev) => [
        ...prev.filter((d) => d.chapterId !== activeChapterId),
        {
          chapterId: activeChapterId,
          direction: choice.direction,
          choiceTitle: choice.badgeText,
          summary: choice.flowchartSummary,
        },
      ]);

      // Advance chapter progression across the 4 scripted chapters
      if (activeChapterId === 'CHAPTER_1_DONKI') {
        setActiveChapterId('CHAPTER_2_DUST');
        setViewMode('PLANET_SURFACE');
      } else if (activeChapterId === 'CHAPTER_2_DUST') {
        setActiveChapterId('CHAPTER_3_WATER');
        setViewMode('PLANET_SURFACE');
      } else if (activeChapterId === 'CHAPTER_3_WATER') {
        setActiveChapterId('CHAPTER_4_DELAY');
        pushDetroitAlert('▲ ALL CREW ASSEMBLING AT COMMAND HUB FOR LAUNCH BRIEFING');
        setViewMode('PLANET_SURFACE');
      } else if (activeChapterId === 'CHAPTER_4_DELAY') {
        setActiveChapterId('CHAPTER_5_LAUNCH');
        pushDetroitAlert('★ CAPCOM HOUSTON DSN: GO FOR EARTH RETURN LAUNCH!');

        if (choice.triggersImmediateLaunch) {
          // [▼ BOLD / ACTION] transitions directly into the rocket elevator boarding sequence!
          triggerElevatorAscent(true);
        } else {
          setViewMode('PLANET_SURFACE');
        }
      } else {
        setViewMode('PLANET_SURFACE');
      }
    },
    [activeChapterId, pushDetroitAlert, triggerElevatorAscent]
  );

  // Switch between Mars and Moon surface outposts at any time
  const handleSwitchSurfaceWorld = useCallback(
    (dest: Destination) => {
      soundManager.playTelemetryChirp();
      setSelectedDestination(dest);
      setIsPlanetStoryActive(true);
      setDescentProgress(1.0);
      setViewMode('PLANET_SURFACE');
      setIsAstronautVisible(true);
      pushDetroitAlert(
        dest === 'MOON'
          ? '🌕 Switched to Artemis Lunar Base Alpha (1/6g)'
          : '🔴 Switched to Olympus Station Mars (0.38g)'
      );
    },
    [pushDetroitAlert]
  );

  // Replay Outpost Story from Chapter 1 to try different choices
  const handleReplayOutpostStory = useCallback(() => {
    soundManager.playTelemetryChirp();
    setActiveChapterId('CHAPTER_1_DONKI');
    setDecisions([]);
    setOutpostStats({ power: 85, oxygen: 95, water: 90, morale: 85 });
    setIsPlanetStoryActive(true);
    setDescentProgress(1.0);
    setElevatorPosY(0.0);
    setAltitudeKm(0);
    setVelocityMs(0);
    setIsAstronautVisible(true);
    setViewMode('PLANET_SURFACE');
    setResetSignal((prev) => prev + 1);
  }, []);

  const handleEnterRocket = useCallback(() => {
    handleRideElevator();
  }, [handleRideElevator]);

  const handleExitRocket = useCallback(() => {
    if (viewMode !== 'COCKPIT') return;
    setIsAstronautVisible(true);
    setViewMode('EXITING');
    soundManager.playTelemetryChirp();
  }, [viewMode]);

  // Start launch countdown (5 seconds for Earth Return Launch, 10 seconds from Earth Pad)
  const handleStartCountdown = useCallback(() => {
    if (viewMode !== 'COCKPIT' || countdown !== null) return;

    soundManager.startAmbiance();
    soundManager.playLaunchCountdownTone();
    setViewMode('COUNTDOWN');
    const initialSeconds = isPlanetStoryActive ? 5 : 10;
    setCountdown(initialSeconds);

    let current = initialSeconds;
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = window.setInterval(() => {
      current -= 1;
      setCountdown(current);

      if (current > 0) {
        soundManager.playLaunchCountdownTone();
      } else {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        soundManager.playLiftoffRoar();
        setViewMode('IN_FLIGHT_CINEMATIC');
        setCountdown(null);
      }
    }, 1000);
  }, [viewMode, countdown, isPlanetStoryActive]);

  // Trans-Earth Injection Warp Burn back to Earth (culminating in Junior Commander Certificate!)
  const startTransEarthReturnWarp = useCallback(() => {
    setViewMode('WARP_DRIVE');
    setIsWarping(true);
    setWarpProgress(0);
    soundManager.playIonBurn();
    soundManager.playWarpDrive();

    const startTime = performance.now();
    const duration = 3400;

    const animateReturnWarp = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setWarpProgress(progress);

      if (progress < 1.0) {
        warpTimerRef.current = requestAnimationFrame(animateReturnWarp);
      } else {
        setIsWarping(false);
        soundManager.playTelemetryChirp();
        setActiveChapterId('MISSION_COMPLETE');
      }
    };

    warpTimerRef.current = requestAnimationFrame(animateReturnWarp);
  }, []);

  const handleEnterDeepSpaceOrbit = useCallback(() => {
    soundManager.playTelemetryChirp();
    setIsPlanetStoryActive(false);
    setViewMode('SPACE_ORBIT');
  }, []);

  const handleEnterFinished = useCallback(() => {
    setIsAstronautVisible(false);
    setViewMode('COCKPIT');
  }, []);

  const handleExitFinished = useCallback(() => {
    setViewMode('ELEVATOR_RIDE');
    soundManager.playElevatorSound();

    const startY = isPlanetStoryActive ? 12.8 : 18.9;
    const targetY = isPlanetStoryActive ? 0.0 : 0.21;
    const startTime = performance.now();
    const duration = 3200;

    const animateDescend = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease =
        progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const curY = startY + (targetY - startY) * ease;
      setElevatorPosY(curY);

      if (progress < 1.0) {
        elevatorAnimRef.current = requestAnimationFrame(animateDescend);
      } else {
        setElevatorPosY(targetY);
        setIsDoorOpen(false);
        setViewMode(isPlanetStoryActive ? 'PLANET_SURFACE' : 'WALK');
        setIsAstronautVisible(true);
      }
    };

    elevatorAnimRef.current = requestAnimationFrame(animateDescend);
  }, [isPlanetStoryActive]);

  const handleSelectFlightView = useCallback(
    (mode: 'IN_FLIGHT_WINDOW' | 'IN_FLIGHT_CINEMATIC') => {
      setViewMode(mode);
    },
    []
  );

  const handleSelectPlanet = useCallback((planet: Destination) => {
    setSelectedDestination(planet);
    soundManager.playTelemetryChirp();
  }, []);

  const handleHoverPlanet = useCallback((planet: Destination | null) => {
    setHoveredDestination(planet);
  }, []);

  // Start planetary descent and touchdown cinematic sequence
  const startDescentCinematic = useCallback(() => {
    setIsPlanetStoryActive(true);
    setActiveChapterId('CHAPTER_1_DONKI');
    setViewMode('PLANET_DESCENT');
    setDescentProgress(0);
    setIsAstronautVisible(false);

    const startTime = performance.now();
    const duration = 5200;
    let hasPlayedHiss = false;

    const animateDescent = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setDescentProgress(progress);

      if (progress > 0.92 && !hasPlayedHiss) {
        hasPlayedHiss = true;
        soundManager.playLanding();
      }

      if (progress < 1.0) {
        descentTimerRef.current = requestAnimationFrame(animateDescent);
      } else {
        setTimeout(() => {
          setViewMode('PLANET_SURFACE');
          setIsAstronautVisible(true);
        }, 500);
      }
    };

    descentTimerRef.current = requestAnimationFrame(animateDescent);
  }, []);

  const handleSkipDescent = useCallback(() => {
    if (descentTimerRef.current) {
      cancelAnimationFrame(descentTimerRef.current);
      descentTimerRef.current = null;
    }
    setDescentProgress(1.0);
    soundManager.playLanding();
    setIsPlanetStoryActive(true);
    setViewMode('PLANET_SURFACE');
    setIsAstronautVisible(true);
  }, []);

  const handleEnterAirlock = useCallback(() => {
    soundManager.playAirlockCycle();
    setIsAirlockOpen(true);
    setViewMode('COMMAND_CENTER');
  }, []);

  const handleExitToSurface = useCallback(() => {
    soundManager.playAirlockCycle();
    setIsAirlockOpen(false);
    setViewMode('PLANET_SURFACE');
    setIsAstronautVisible(true);
  }, []);

  const handleConfirmTrajectory = useCallback(
    (destOverride?: Destination) => {
      const targetDest = destOverride || selectedDestination;
      if (!targetDest) return;
      if (destOverride && destOverride !== selectedDestination) {
        setSelectedDestination(destOverride);
      }

      setIsPlanetStoryActive(false);
      setViewMode('WARP_DRIVE');
      setIsWarping(true);
      setWarpProgress(0);
      setIsReentering(false);

      soundManager.playIonBurn();
      soundManager.playWarpDrive();

      const startTime = performance.now();
      const duration = 3600;

      const animateWarp = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(1.0, elapsed / duration);
        setWarpProgress(progress);

        if (progress > 0.68 && !isReentering && targetDest === 'MARS') {
          setIsReentering(true);
          soundManager.playReentry();
        }

        if (progress < 1.0) {
          warpTimerRef.current = requestAnimationFrame(animateWarp);
        } else {
          setIsWarping(false);
          setIsReentering(false);
          startDescentCinematic();
        }
      };

      warpTimerRef.current = requestAnimationFrame(animateWarp);
    },
    [selectedDestination, isReentering, startDescentCinematic]
  );

  const handleReturnToOrbit = useCallback(() => {
    soundManager.playTelemetryChirp();
    setIsPlanetStoryActive(false);
    setViewMode('SPACE_ORBIT');
  }, []);

  // Reset mission back to Earth Cape Launchpad
  const handleResetMission = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (warpTimerRef.current) {
      cancelAnimationFrame(warpTimerRef.current);
      warpTimerRef.current = null;
    }
    if (elevatorAnimRef.current) {
      cancelAnimationFrame(elevatorAnimRef.current);
      elevatorAnimRef.current = null;
    }
    if (descentTimerRef.current) {
      cancelAnimationFrame(descentTimerRef.current);
      descentTimerRef.current = null;
    }
    setIsPlanetStoryActive(false);
    setActiveChapterId('CHAPTER_1_DONKI');
    setElevatorPosY(0.21);
    setCountdown(null);
    setAltitudeKm(0);
    setVelocityMs(0);
    setIsDoorOpen(false);
    setIsAstronautVisible(true);
    setIsWarping(false);
    setIsReentering(false);
    setDescentProgress(0);
    setIsAirlockOpen(false);
    setIsNearAirlock(false);
    setViewMode('WALK');
    setCurrentPreset('astronaut');
    setResetSignal((prev) => prev + 1);
  }, []);

  // Telemetry update during flight
  const handleTelemetryUpdate = useCallback(
    (altKm: number, velMs: number) => {
      setAltitudeKm(altKm);
      setVelocityMs(velMs);

      if (altKm >= 100 && (viewMode === 'IN_FLIGHT_CINEMATIC' || viewMode === 'IN_FLIGHT_WINDOW')) {
        if (isPlanetStoryActive) {
          // Launching from Moon/Mars back to Earth -> Engage Trans-Earth Injection Warp Burn!
          startTransEarthReturnWarp();
        } else {
          // Launching from Earth -> Enter Low Earth Orbit Navigation
          setViewMode('SPACE_ORBIT');
        }
      }
    },
    [viewMode, isPlanetStoryActive, startTransEarthReturnWarp]
  );

  // Global key listener for 'E', 'Space', 'C', '1', '2'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'e') {
        if (viewMode === 'PLANET_SURFACE') {
          if (showElevatorPrompt || nearTargetId === 'RETURN_ELEVATOR') {
            e.preventDefault();
            handleRideElevator();
          } else if (nearTargetId) {
            e.preventDefault();
            handleStartConversation();
          } else if (isNearAirlock) {
            e.preventDefault();
            handleEnterAirlock();
          } else if (activeChapterId !== 'CHAPTER_5_LAUNCH') {
            // Allow convenient E shortcut to talk to active crew objective
            e.preventDefault();
            handleStartConversation();
          }
        } else if (viewMode === 'WALK' && (showElevatorPrompt || showDoorPrompt)) {
          e.preventDefault();
          handleRideElevator();
        } else if (viewMode === 'COCKPIT') {
          e.preventDefault();
          handleExitRocket();
        } else if (viewMode === 'COMMAND_CENTER') {
          e.preventDefault();
          handleExitToSurface();
        }
      }

      if (e.code === 'Space' || key === ' ') {
        if (viewMode === 'COCKPIT') {
          e.preventDefault();
          handleStartCountdown();
        } else if (viewMode === 'PLANET_DESCENT') {
          e.preventDefault();
          handleSkipDescent();
        }
      }

      if (key === 'escape' && viewMode === 'PLANET_DESCENT') {
        e.preventDefault();
        handleSkipDescent();
      }

      if (viewMode === 'IN_FLIGHT_WINDOW' || viewMode === 'IN_FLIGHT_CINEMATIC') {
        if (key === 'c') {
          e.preventDefault();
          handleSelectFlightView(
            viewMode === 'IN_FLIGHT_WINDOW' ? 'IN_FLIGHT_CINEMATIC' : 'IN_FLIGHT_WINDOW'
          );
        } else if (key === '1') {
          e.preventDefault();
          handleSelectFlightView('IN_FLIGHT_WINDOW');
        } else if (key === '2') {
          e.preventDefault();
          handleSelectFlightView('IN_FLIGHT_CINEMATIC');
        } else if (key === 'o') {
          e.preventDefault();
          if (isPlanetStoryActive) {
            startTransEarthReturnWarp();
          } else {
            handleEnterDeepSpaceOrbit();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    showElevatorPrompt,
    showDoorPrompt,
    nearTargetId,
    isNearAirlock,
    activeChapterId,
    isPlanetStoryActive,
    handleRideElevator,
    handleStartConversation,
    handleExitRocket,
    handleStartCountdown,
    handleSelectFlightView,
    handleEnterDeepSpaceOrbit,
    handleSkipDescent,
    handleEnterAirlock,
    handleExitToSurface,
    startTransEarthReturnWarp,
  ]);

  const handleSelectPreset = (preset: CameraPreset) => {
    setCurrentPreset(preset);
    setIsAutoRotating(false);
  };

  const handleToggleAutoRotate = () => {
    setIsAutoRotating((prev) => !prev);
  };

  const handleBeginMission = () => {
    setCurrentPreset('cinematic');
    setIsAutoRotating(true);
  };

  const handleCompleteBriefing = useCallback(
    (newProfile: AstronautProfile) => {
      setProfile(newProfile);
      setSelectedDestination(newProfile.destination);
      setCurrentPreset('astronaut');
      setIsAutoRotating(false);
      setViewMode('WALK');
      pushDetroitAlert(
        `★ WELCOME ABOARD, COMMANDER ${newProfile.name} ${newProfile.badge} • TARGET: ${newProfile.destination}`
      );
    },
    [pushDetroitAlert]
  );

  if (!profile) {
    return <MissionBriefingScreen onBeginMission={handleCompleteBriefing} />;
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-rajdhani select-none">
      {/* 3D WebGL Canvas Viewport */}
      <Scene
        currentPreset={currentPreset}
        isAutoRotating={isAutoRotating}
        viewMode={viewMode}
        countdownSeconds={countdown}
        isDoorOpen={isDoorOpen}
        showDoorPrompt={showDoorPrompt}
        showElevatorPrompt={showElevatorPrompt}
        elevatorPosY={elevatorPosY}
        isAstronautVisible={isAstronautVisible}
        onEnterFinished={handleEnterFinished}
        onExitFinished={handleExitFinished}
        onLaunchRocket={handleStartCountdown}
        onElevatorPromptChange={setShowElevatorPrompt}
        onTelemetryUpdate={handleTelemetryUpdate}
        resetSignal={resetSignal}
        selectedDestination={selectedDestination}
        hoveredDestination={hoveredDestination}
        isWarping={isWarping}
        warpProgress={warpProgress}
        isReentering={isReentering}
        isDescentPhase={viewMode === 'PLANET_DESCENT'}
        descentProgress={descentProgress}
        isAirlockOpen={isAirlockOpen}
        onNearAirlockChange={setIsNearAirlock}
        isPlanetStoryActive={isPlanetStoryActive}
        activeChapterId={activeChapterId}
        conversationTargetPos={conversationTargetPos}
        onNearTargetChange={handleNearTargetChange}
        onDistanceToObjectiveChange={setDistanceToObjective}
        onHoverPlanet={handleHoverPlanet}
        onSelectPlanet={handleSelectPlanet}
      />

      {/* Cybernetic HUD, Kid-Friendly Guidance, Detroit Dialogue Wheel & Certificate */}
      <Overlay
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        isAutoRotating={isAutoRotating}
        onToggleAutoRotate={handleToggleAutoRotate}
        onBeginMission={handleBeginMission}
        viewMode={viewMode}
        showDoorPrompt={showDoorPrompt}
        showElevatorPrompt={showElevatorPrompt}
        onRideElevator={handleRideElevator}
        countdownSeconds={countdown}
        altitudeKm={altitudeKm}
        velocityMs={velocityMs}
        onStartCountdown={handleStartCountdown}
        onEnterRocket={handleEnterRocket}
        onSelectFlightView={handleSelectFlightView}
        onResetMission={handleResetMission}
        onExitRocket={handleExitRocket}
        selectedDestination={selectedDestination}
        hoveredDestination={hoveredDestination}
        isWarping={isWarping}
        warpProgress={warpProgress}
        isReentering={isReentering}
        isNearAirlock={isNearAirlock}
        descentProgress={descentProgress}
        onSkipDescent={handleSkipDescent}
        onEnterAirlock={handleEnterAirlock}
        onExitToSurface={handleExitToSurface}
        onSelectPlanet={handleSelectPlanet}
        onConfirmTrajectory={handleConfirmTrajectory}
        onEnterDeepSpaceOrbit={handleEnterDeepSpaceOrbit}
        onReturnToOrbit={handleReturnToOrbit}
        isPlanetStoryActive={isPlanetStoryActive}
        activeChapterId={activeChapterId}
        nearTargetId={nearTargetId}
        distanceToObjective={distanceToObjective}
        outpostStats={outpostStats}
        detroitAlerts={detroitAlerts}
        decisions={decisions}
        onStartConversation={handleStartConversation}
        onCloseConversation={handleCloseConversation}
        onStatChange={handleStatChange}
        onResolveChapter={handleResolveChapter}
        onReplayOutpostStory={handleReplayOutpostStory}
        onSwitchSurfaceWorld={handleSwitchSurfaceWorld}
        astronautProfile={profile}
        photos={photos}
        onTakePhoto={handleTakePhoto}
        onDeletePhoto={handleDeletePhoto}
      />
    </main>
  );
}
