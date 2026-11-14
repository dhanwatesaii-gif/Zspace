import React, { useState, useEffect } from 'react';
import { CameraPreset } from '../3d/CameraController';
import { soundManager } from '../../utils/audio';
import {
  Volume2,
  VolumeX,
  Compass,
  Eye,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RotateCcw,
  Keyboard,
  X,
  LogIn,
  Rocket,
  Globe,
  Flame,
  AlertTriangle,
  Zap,
  MessageSquare,
  Navigation,
  BookOpen,
  Radio,
  Camera,
  Images,
  Trash2,
  Download,
  FileText,
  Presentation,
} from 'lucide-react';
import {
  downloadProjectDocumentationPDF,
  downloadPresentationDeckPDF,
} from '../../utils/pdfGenerator';
import { ViewMode } from '../3d/ThirdPersonCamera';
import {
  Destination,
  SolarBodyId,
  SOLAR_SYSTEM_BODIES,
  ORDERED_SOLAR_BODIES,
} from '../3d/SpaceOrbitNav';
import { CommandCenterUI } from './CommandCenterUI';
import {
  StoryChapterId,
  STORY_CHAPTERS,
  InteractableTargetId,
  DialogueChoiceOption,
  SCIENCE_GLOSSARY,
} from '../../data/storyMissionData';
import { DetroitDialogueWheel } from './DetroitDialogueWheel';
import {
  JuniorCommanderCertificate,
  DecisionRecord,
  MissionPhoto,
} from './JuniorCommanderCertificate';
import { AstronautProfile } from './MissionBriefingScreen';

interface OverlayProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onBeginMission?: () => void;
  viewMode?: ViewMode;
  showDoorPrompt?: boolean;
  showElevatorPrompt?: boolean;
  countdownSeconds?: number | null;
  altitudeKm?: number;
  velocityMs?: number;
  onStartCountdown?: () => void;
  onEnterRocket?: () => void;
  onRideElevator?: () => void;
  onSelectFlightView?: (mode: 'IN_FLIGHT_WINDOW' | 'IN_FLIGHT_CINEMATIC') => void;
  onResetMission?: () => void;
  onExitRocket?: () => void;

  // Interplanetary Navigation & Surface Base Story props
  selectedDestination: Destination | null;
  hoveredDestination: Destination | null;
  isWarping: boolean;
  warpProgress: number;
  isReentering: boolean;
  isNearAirlock?: boolean;
  descentProgress?: number;
  onSkipDescent?: () => void;
  onEnterAirlock?: () => void;
  onExitToSurface?: () => void;
  onSelectPlanet: (p: Destination) => void;
  onConfirmTrajectory: () => void;
  onEnterDeepSpaceOrbit: () => void;
  onReturnToOrbit: () => void;

  // Story & Detroit Dialogue System props
  isPlanetStoryActive?: boolean;
  activeChapterId?: StoryChapterId;
  nearTargetId?: InteractableTargetId | null;
  distanceToObjective?: number;
  outpostStats?: { power: number; oxygen: number; water: number; morale: number };
  detroitAlerts?: string[];
  decisions?: DecisionRecord[];
  onStartConversation?: () => void;
  onCloseConversation?: () => void;
  onStatChange?: (
    delta: { power?: number; oxygen?: number; water?: number; morale?: number },
    alertText: string
  ) => void;
  onResolveChapter?: (choice: DialogueChoiceOption) => void;
  onReplayOutpostStory?: () => void;
  onSwitchSurfaceWorld?: (dest: Destination) => void;
  astronautProfile?: AstronautProfile | null;

  // Camera & Photo Gallery props
  photos?: MissionPhoto[];
  onTakePhoto?: () => void;
  onDeletePhoto?: (id: string) => void;
}

export const Overlay: React.FC<OverlayProps> = ({
  currentPreset,
  onSelectPreset,
  onBeginMission,
  viewMode = 'WALK',
  showDoorPrompt = false,
  showElevatorPrompt = false,
  countdownSeconds = null,
  altitudeKm = 0,
  velocityMs = 0,
  onStartCountdown,
  onEnterRocket,
  onRideElevator,
  onSelectFlightView,
  onResetMission,
  onExitRocket,
  selectedDestination,
  hoveredDestination,
  isWarping,
  warpProgress,
  isNearAirlock = false,
  descentProgress = 0,
  onSkipDescent,
  onEnterAirlock,
  onExitToSurface,
  onSelectPlanet,
  onConfirmTrajectory,
  onReturnToOrbit,
  isPlanetStoryActive = false,
  activeChapterId = 'CHAPTER_1_DONKI',
  nearTargetId = null,
  distanceToObjective = 24,
  outpostStats = { power: 85, oxygen: 95, water: 90, morale: 90 },
  detroitAlerts = [],
  decisions = [],
  onStartConversation,
  onCloseConversation,
  onStatChange,
  onResolveChapter,
  onReplayOutpostStory,
  onSwitchSurfaceWorld,
  astronautProfile = null,
  photos = [],
  onTakePhoto,
  onDeletePhoto,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [isMissionActive, setIsMissionActive] = useState(false);
  const [showControlsGuide, setShowControlsGuide] = useState(false);
  const [showScienceGlossaryModal, setShowScienceGlossaryModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [isCameraFlashing, setIsCameraFlashing] = useState(false);

  // Trigger camera shutter flash + screenshot capture
  const triggerPhotoSnap = () => {
    setIsCameraFlashing(true);
    setTimeout(() => setIsCameraFlashing(false), 180);
    onTakePhoto?.();
  };

  // Track which solar system body is currently clicked/focused in SpaceOrbitNav
  const [focusedSolarBody, setFocusedSolarBody] = useState<SolarBodyId | null>(
    selectedDestination || null
  );

  useEffect(() => {
    if (selectedDestination) {
      setFocusedSolarBody(selectedDestination);
    }
  }, [selectedDestination]);

  useEffect(() => {
    const handlePlanetSelected = (e: Event) => {
      const custom = e as CustomEvent<SolarBodyId | null>;
      setFocusedSolarBody(custom.detail);
    };
    window.addEventListener('solar-planet-selected', handlePlanetSelected);
    return () => window.removeEventListener('solar-planet-selected', handlePlanetSelected);
  }, []);

  const handleSelectSolarBodyFromHUD = (bodyId: SolarBodyId | null) => {
    soundManager.playTelemetryChirp();
    setFocusedSolarBody(bodyId);
    window.dispatchEvent(new CustomEvent('solar-planet-focus-request', { detail: bodyId }));
    if (bodyId === 'MOON' || bodyId === 'MARS') {
      onSelectPlanet(bodyId);
    }
  };

  const handleTriggerBegin = () => {
    soundManager.startAmbiance();
    soundManager.playTelemetryChirp();
    setIsMissionActive(true);
    if (onBeginMission) onBeginMission();
  };

  const handleToggleMute = () => {
    soundManager.startAmbiance();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'enter') {
        if (!isMissionActive && viewMode === 'WALK' && !isPlanetStoryActive) {
          e.preventDefault();
          handleTriggerBegin();
        }
      } else if (key === 'h') {
        setIsDockCollapsed((prev) => !prev);
      } else if (key === 'm') {
        handleToggleMute();
      } else if (key === 'g') {
        setShowScienceGlossaryModal((prev) => !prev);
      } else if (key === 'p') {
        e.preventDefault();
        triggerPhotoSnap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMissionActive, viewMode, isPlanetStoryActive, onTakePhoto]);

  // 1. Return Junior Mission Commander Certificate when story is completed
  if (activeChapterId === 'MISSION_COMPLETE') {
    return (
      <JuniorCommanderCertificate
        destination={selectedDestination || 'MARS'}
        decisions={decisions}
        stats={outpostStats}
        photos={photos}
        commanderName={astronautProfile?.name}
        commanderBadge={astronautProfile?.badge}
        onReplayOutpost={onReplayOutpostStory || (() => {})}
        onResetFullGame={onResetMission || (() => {})}
      />
    );
  }

  // 2. Return Command Center UI if player entered the habitat airlock
  if (viewMode === 'COMMAND_CENTER') {
    return (
      <CommandCenterUI
        destination={selectedDestination || 'MARS'}
        onExitToSurface={onExitToSurface || (() => {})}
        onResetMission={onResetMission || (() => {})}
      />
    );
  }

  const currentChapterConfig = STORY_CHAPTERS[activeChapterId];

  // 3. Return Detroit: Become Human 4-Choice Dialogue Wheel during conversation
  if (viewMode === 'CONVERSATION' && currentChapterConfig && currentChapterConfig.questions.length > 0) {
    return (
      <DetroitDialogueWheel
        key={currentChapterConfig.id}
        chapter={currentChapterConfig}
        onStatChange={onStatChange || (() => {})}
        onResolveChapter={onResolveChapter || (() => {})}
        onClose={onCloseConversation || (() => {})}
      />
    );
  }

  const isFlightActive = viewMode === 'IN_FLIGHT_WINDOW' || viewMode === 'IN_FLIGHT_CINEMATIC';
  const isSpaceOrbit = viewMode === 'SPACE_ORBIT';
  const isSurface = viewMode === 'PLANET_SURFACE';
  const isDescent = viewMode === 'PLANET_DESCENT';

  const standardCameraButtons: Array<{ id: CameraPreset; label: string; icon: string }> = [
    { id: 'astronaut', label: 'Astronaut Follow', icon: '🧑‍🚀' },
    { id: 'cinematic', label: 'Launch Overview', icon: '🚀' },
  ];

  const activeSolarBodyId: SolarBodyId | null =
    focusedSolarBody || hoveredDestination || selectedDestination;
  const activeBodyInfo = activeSolarBodyId ? SOLAR_SYSTEM_BODIES[activeSolarBodyId] : null;

  // Live descent telemetry values
  const descentAltitudeMeters = Math.max(0, Math.round((1 - descentProgress) * 4800));
  const descentSpeedMs =
    descentProgress >= 0.98
      ? 0
      : Math.max(2, Math.round((1 - descentProgress) * 340 + Math.sin(descentProgress * 18) * 4));
  const descentThrustPct =
    descentProgress >= 0.96
      ? 0
      : descentProgress > 0.45
      ? Math.min(100, Math.round(78 + (1 - descentProgress) * 22))
      : Math.round(45 + descentProgress * 50);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ============================================================ */}
      {/* TOP HEADER BAR & PERSISTENT KID-FRIENDLY OBJECTIVE BANNER    */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          {/* Top Left: Title Badge & Controls / Glossary Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/92 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.18)] px-4 py-2.5 rounded-lg text-slate-100">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <div>
                <div className="font-orbitron font-extrabold text-sm md:text-base tracking-wider text-cyan-400">
                  {isSpaceOrbit
                    ? 'SOLAR SYSTEM ORBITAL NAVIGATION (8 PLANETS + MOON)'
                    : isWarping
                    ? isPlanetStoryActive
                      ? 'TRANS-EARTH INJECTION • RETURNING HOME'
                      : 'HYPERDRIVE WARP TRANSIT'
                    : isDescent
                    ? selectedDestination === 'MOON'
                      ? 'DESCENT & TOUCHDOWN • LUNAR CRATER FIELD'
                      : 'ATMOSPHERIC DESCENT • MARS ENTRY'
                    : isSurface || isPlanetStoryActive
                    ? selectedDestination === 'MOON'
                      ? 'ARTEMIS BASE ALPHA — LUNAR SOL 1 OF 7'
                      : 'OLYMPUS STATION — MARTIAN SOL 1 OF 7'
                    : 'SOL 7 — MISSION LAUNCHPAD'}
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono-scifi text-slate-400">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />{' '}
                    {isSpaceOrbit
                      ? 'CLICK ANY PLANET TO INSPECT • MOON & MARS LANDABLE'
                      : isWarping
                      ? 'RELATIVISTIC WARP ENGAGED'
                      : isDescent
                      ? 'TERMINAL GUIDANCE & RETRO-PROPULSION'
                      : isSurface || isPlanetStoryActive
                      ? currentChapterConfig
                        ? `${currentChapterConfig.title}`
                        : 'SURFACE OPERATIONS NOMINAL'
                      : 'SYSTEMS NOMINAL'}
                  </span>
                </div>
              </div>
            </div>

            {/* Commander Callsign Badge */}
            {astronautProfile && (
              <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/92 border border-amber-400/50 px-3.5 py-2 rounded-lg text-xs font-orbitron font-bold text-amber-300">
                <span className="text-base">{astronautProfile.badge}</span>
                <span>COMMANDER {astronautProfile.name.toUpperCase()}</span>
                <span className="text-[10px] font-mono-scifi px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
                  {astronautProfile.difficulty}
                </span>
              </div>
            )}

            {/* Guiding Keys Button */}
            <button
              onClick={() => setShowControlsGuide((prev) => !prev)}
              className={`pointer-events-auto cursor-pointer px-3 py-2.5 rounded-lg border font-mono-scifi text-xs flex items-center gap-1.5 transition-all ${
                showControlsGuide
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500 text-slate-300'
              }`}
              title="Toggle Key Guide (C)"
            >
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline font-rajdhani font-semibold">KEYS (C)</span>
            </button>

            {/* Kid-Friendly Science Glossary Button (Hints visible when difficulty !== 'COMMANDER') */}
            {(!astronautProfile || astronautProfile.difficulty !== 'COMMANDER') && (
              <button
                onClick={() => {
                  soundManager.playTelemetryChirp();
                  setShowScienceGlossaryModal((prev) => !prev);
                }}
                className={`pointer-events-auto cursor-pointer px-3 py-2.5 rounded-lg border font-mono-scifi text-xs flex items-center gap-1.5 transition-all ${
                  showScienceGlossaryModal
                    ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                    : 'bg-slate-900/90 border-indigo-500/50 hover:border-indigo-400 text-indigo-300'
                }`}
                title="Open NASA Kid-Friendly Science Glossary (G)"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span className="font-rajdhani font-bold">SCIENCE GUIDE (G)</span>
              </button>
            )}

            {/* Camera Snap Button */}
            <button
              onClick={triggerPhotoSnap}
              className="pointer-events-auto cursor-pointer px-3.5 py-2.5 rounded-lg border border-amber-400/70 bg-amber-500/20 hover:bg-amber-400 hover:text-slate-950 text-amber-200 font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] active:scale-95"
              title="Take Mission Photo (P)"
            >
              <Camera className="w-4 h-4" />
              <span>SNAP PHOTO (P)</span>
            </button>

            {/* Gallery Button */}
            <button
              onClick={() => {
                soundManager.playTelemetryChirp();
                setShowGalleryModal((prev) => !prev);
              }}
              className={`pointer-events-auto cursor-pointer px-3 py-2.5 rounded-lg border font-orbitron font-bold text-xs flex items-center gap-1.5 transition-all ${
                showGalleryModal
                  ? 'bg-cyan-500/30 border-cyan-300 text-cyan-100'
                  : 'bg-slate-900/92 border-cyan-500/50 hover:border-cyan-400 text-cyan-300'
              }`}
              title="Open Mission Photo Gallery"
            >
              <Images className="w-4 h-4 text-cyan-400" />
              <span>GALLERY ({photos.length})</span>
            </button>

            {/* Download Project Documentation PDF Button */}
            <button
              onClick={() => {
                soundManager.playTelemetryChirp();
                downloadProjectDocumentationPDF();
              }}
              className="pointer-events-auto cursor-pointer px-2.5 py-2.5 rounded-lg border border-emerald-500/50 bg-slate-900/92 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-orbitron font-bold text-xs flex items-center gap-1 transition-all"
              title="Download Project Documentation PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">DOCS PDF</span>
            </button>

            {/* Download Presentation Slides PDF Button */}
            <button
              onClick={() => {
                soundManager.playTelemetryChirp();
                downloadPresentationDeckPDF();
              }}
              className="pointer-events-auto cursor-pointer px-2.5 py-2.5 rounded-lg border border-amber-500/50 bg-slate-900/92 hover:bg-amber-400 hover:text-slate-950 text-amber-300 font-orbitron font-bold text-xs flex items-center gap-1 transition-all"
              title="Download 12-Slide Presentation Deck PDF"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PPT PDF</span>
            </button>
          </div>

          {/* Top Right: Live Outpost Survival Stats or Flight/Descent Telemetry */}
          <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/92 border border-cyan-500/40 px-4 py-2.5 rounded-lg">
            {isSurface ? (
              <div className="flex items-center gap-3.5 text-xs font-mono-scifi tabular-nums">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">POWER</span>
                  <span className="font-orbitron font-bold text-cyan-300 text-sm">
                    {outpostStats.power}%
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">OXYGEN</span>
                  <span className="font-orbitron font-bold text-emerald-400 text-sm">
                    {outpostStats.oxygen}%
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">WATER</span>
                  <span className="font-orbitron font-bold text-blue-300 text-sm">
                    {outpostStats.water}%
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">MORALE</span>
                  <span className="font-orbitron font-bold text-amber-300 text-sm">
                    {outpostStats.morale}%
                  </span>
                </div>
              </div>
            ) : isDescent ? (
              <div className="flex items-center gap-4 text-xs font-mono-scifi tabular-nums">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">ALTITUDE</span>
                  <span className="font-orbitron font-bold text-amber-300 text-sm">
                    {descentAltitudeMeters} M
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">DESCENT SPEED</span>
                  <span className="font-orbitron font-bold text-cyan-300 text-sm">
                    {descentSpeedMs} M/S
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px]">RETRO THRUST</span>
                  <span className="font-orbitron font-bold text-emerald-400 text-sm">
                    {descentThrustPct}%
                  </span>
                </div>
              </div>
            ) : isFlightActive ? (
              <div className="flex items-center gap-4 text-xs font-mono-scifi tabular-nums">
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-[10px]">ALTITUDE (ESCAPE 100 KM)</span>
                  <span className="font-orbitron font-bold text-amber-300 text-sm">
                    {altitudeKm >= 1
                      ? `${altitudeKm.toFixed(1)} KM`
                      : `${(altitudeKm * 1000).toFixed(0)} M`}
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-[10px]">VELOCITY</span>
                  <span className="font-orbitron font-bold text-cyan-300 text-sm">
                    {velocityMs.toFixed(0)} M/S
                  </span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-[10px]">VIEW (KEY C)</span>
                  <span className="font-orbitron font-bold text-emerald-400 text-sm">
                    {viewMode === 'IN_FLIGHT_WINDOW' ? 'VISOR VIEW' : 'CHASE CAM'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs font-mono-scifi">
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-[10px]">PROPULSION</span>
                  <span className="text-emerald-400 font-bold">ARMED GO</span>
                </div>
                <div className="h-6 w-px bg-cyan-900/60" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 text-[10px]">RANGE</span>
                  <span className="text-emerald-400 font-bold">GREEN GO</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* KID-FRIENDLY PERSISTENT TOP HUD OBJECTIVE BANNER (HINTS)   */}
        {/* ========================================================== */}
        {isSurface &&
          currentChapterConfig &&
          (!astronautProfile || astronautProfile.difficulty !== 'COMMANDER') && (
          <div className="pointer-events-auto mx-auto max-w-3xl w-full bg-slate-900/95 border-2 border-amber-400/90 rounded-2xl px-5 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-[10px] font-mono-scifi text-amber-300 font-bold tracking-widest uppercase">
                  {currentChapterConfig.id === 'CHAPTER_5_LAUNCH'
                    ? 'FINAL LAUNCH SEQUENCE • ALL CREW READY'
                    : `CURRENT MISSION • CHAPTER ${currentChapterConfig.chapterNumber} OF 4`}
                </div>
                <div className="font-orbitron font-bold text-xs md:text-sm text-white">
                  Objective: {currentChapterConfig.objectiveBanner}{' '}
                  <span className="text-cyan-300 font-mono-scifi">
                    [Marker: {distanceToObjective}m]
                  </span>
                </div>
              </div>
            </div>

            {currentChapterConfig.targetId !== 'RETURN_ELEVATOR' ? (
              <button
                onClick={onStartConversation}
                className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron font-black text-xs tracking-wide shrink-0 shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>TALK TO {currentChapterConfig.targetName.toUpperCase()} [E]</span>
              </button>
            ) : (
              <button
                onClick={onRideElevator}
                className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-orbitron font-black text-xs tracking-wide shrink-0 shadow-md transition-transform hover:scale-105 flex items-center gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>BOARD SOL-7 ROCKET [E]</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* DETROIT-STYLE RELATIONSHIP & TELEMETRY POP-UP ALERTS       */}
        {/* ========================================================== */}
        {detroitAlerts.length > 0 && (
          <div className="flex flex-col gap-1.5 items-start max-w-md">
            {detroitAlerts.map((alert, idx) => (
              <div
                key={`${alert}-${idx}`}
                className="bg-slate-900/95 border border-cyan-400/70 px-3.5 py-1.5 rounded-lg text-xs font-mono-scifi font-bold text-cyan-200 shadow-lg"
              >
                {alert}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* CAMERA SHUTTER WHITE FLASH OVERLAY                           */}
      {/* ============================================================ */}
      {isCameraFlashing && (
        <div className="fixed inset-0 z-50 bg-white/80 pointer-events-none transition-opacity duration-150" />
      )}

      {/* ============================================================ */}
      {/* IN-GAME MISSION PHOTO GALLERY & PROGRESS MODAL               */}
      {/* ============================================================ */}
      {showGalleryModal && (
        <div className="pointer-events-auto fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border-2 border-cyan-400 rounded-2xl p-5 text-slate-100 shadow-2xl max-h-[86vh] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center">
                  <Images className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="font-orbitron font-black text-sm md:text-base text-cyan-300 tracking-wider uppercase">
                    MISSION PHOTO GALLERY & PROGRESS LOG ({photos.length})
                  </div>
                  <div className="text-xs font-mono-scifi text-slate-400">
                    All photos saved here will be displayed alongside your final Mission Progress Report!
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerPhotoSnap}
                  className="cursor-pointer px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron font-black text-xs flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>SNAP NEW PHOTO</span>
                </button>
                <button
                  onClick={() => setShowGalleryModal(false)}
                  className="cursor-pointer p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {photos.length === 0 ? (
              <div className="my-auto py-12 text-center border border-dashed border-slate-700 rounded-2xl bg-slate-950/60 p-6">
                <Camera className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-80" />
                <div className="font-orbitron font-bold text-base text-slate-200">
                  NO MISSION PHOTOS CAPTURED YET
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Click the <span className="text-amber-300 font-bold">SNAP PHOTO (P)</span> button in the top HUD at any point during launch, orbit, descent, or surface exploration to document your mission progress!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="bg-slate-950 border border-slate-800 hover:border-cyan-400/70 rounded-xl overflow-hidden flex flex-col transition-all"
                  >
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      <img
                        src={photo.dataUrl}
                        alt={photo.phaseLabel}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-950/90 border border-cyan-400/60 px-2 py-0.5 rounded text-[10px] font-mono-scifi text-cyan-300 font-bold">
                        #{index + 1} • {photo.progressStep}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                      <div>
                        <div className="font-orbitron font-bold text-xs text-amber-300 truncate">
                          {photo.phaseLabel}
                        </div>
                        <div className="text-[11px] font-mono-scifi text-slate-400 flex items-center justify-between mt-0.5">
                          <span>{photo.locationLabel}</span>
                          <span>{photo.timestamp}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <a
                          href={photo.dataUrl}
                          download={`sol7-mission-photo-${index + 1}.jpg`}
                          className="text-[11px] font-mono-scifi text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>SAVE JPG</span>
                        </a>
                        {onDeletePhoto && (
                          <button
                            onClick={() => onDeletePhoto(photo.id)}
                            className="cursor-pointer text-[11px] font-mono-scifi text-red-400 hover:text-red-300 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>DELETE</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCIENCE GLOSSARY MODAL (KID-FRIENDLY NASA EXPLANATIONS)      */}
      {/* ============================================================ */}
      {showScienceGlossaryModal && (
        <div className="pointer-events-auto absolute top-28 right-4 md:right-6 z-30 w-96 max-w-[92vw] bg-indigo-950/95 border-2 border-indigo-400 rounded-2xl p-4 text-slate-100">
          <div className="flex items-center justify-between pb-2.5 border-b border-indigo-800 mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span className="font-orbitron text-xs font-bold text-amber-300 tracking-wider">
                NASA KID-FRIENDLY SCIENCE GLOSSARY
              </span>
            </div>
            <button
              onClick={() => setShowScienceGlossaryModal(false)}
              className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {Object.values(SCIENCE_GLOSSARY).map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/85 border border-indigo-500/40 rounded-xl p-2.5 text-xs"
              >
                <div className="font-orbitron font-bold text-cyan-300">{item.term}</div>
                <div className="font-semibold text-white mt-0.5">{item.shortDef}</div>
                <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                  {item.kidExplanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FLOATING GUIDING KEYS PANEL                                  */}
      {/* ============================================================ */}
      {showControlsGuide && (
        <div className="pointer-events-auto absolute top-28 left-4 md:left-6 z-30 w-80 bg-slate-900/95 border border-cyan-500/50 rounded-xl p-3.5 text-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2.5">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span className="font-orbitron text-xs font-bold text-cyan-300 tracking-wider">
                MISSION CONTROLS
              </span>
            </div>
            <button
              onClick={() => setShowControlsGuide(false)}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono-scifi">
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded">
              <span className="text-slate-300">Move Astronaut:</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-300 font-bold">W</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-300 font-bold">A</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-300 font-bold">S</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-300 font-bold">D</kbd>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded">
              <span className="text-slate-300">Run (2x speed):</span>
              <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-amber-300 font-bold">SHIFT</kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded">
              <span className="text-slate-300">Low-Gravity Jump:</span>
              <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-emerald-300 font-bold">SPACEBAR</kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded border border-cyan-500/40">
              <span className="text-cyan-300 font-bold">Talk to Crew / Board Lift:</span>
              <kbd className="px-2 py-0.5 bg-cyan-950 border border-cyan-500 rounded text-cyan-300 font-black">E</kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded border border-amber-500/40">
              <span className="text-amber-300 font-bold">Snap Mission Photo:</span>
              <kbd className="px-2 py-0.5 bg-amber-950 border border-amber-500 rounded text-amber-300 font-black">P</kbd>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded">
              <span className="text-slate-300">Dialogue Wheel:</span>
              <span className="text-amber-300 font-bold">▲ ◄ ► ▼ Arrows</span>
            </div>
            <div className="flex items-center justify-between bg-slate-800/60 px-2 py-1.5 rounded">
              <span className="text-slate-300">Toggle Flight Cam:</span>
              <kbd className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-cyan-300 font-bold">C</kbd>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CENTER HUD: Prompts, Solar System Info Card & Descent HUD    */}
      {/* ============================================================ */}
      <div className="flex flex-col items-center justify-center my-auto pointer-events-none w-full max-w-2xl mx-auto">
        {/* Chapter 5 Radio Broadcast Banner */}
        {isSurface && activeChapterId === 'CHAPTER_5_LAUNCH' && (
          <div className="pointer-events-auto mb-3 bg-emerald-950/92 border-2 border-emerald-400 px-6 py-3 rounded-2xl text-center max-w-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-mono-scifi text-emerald-300 font-bold">
              <Radio className="w-4 h-4" />
              <span>CAPCOM HOUSTON DSN BROADCAST • CLEARANCE GRANTED</span>
            </div>
            <p className="text-xs md:text-sm text-white font-semibold mt-1">
              “All systems nominal! You are GO for Earth Return flight! Lead Systems Engineer Raj, Engineer Leo, and Dr. Sarah to the Launchpad Elevator!”
            </p>
          </div>
        )}

        {/* Proximity Prompt to Talk to Crew Member */}
        {isSurface &&
          nearTargetId &&
          nearTargetId !== 'RETURN_ELEVATOR' &&
          currentChapterConfig && (
            <div className="pointer-events-auto flex flex-col items-center gap-2">
              <button
                onClick={onStartConversation}
                className="cursor-pointer group focus:outline-none transition-transform hover:scale-105 active:scale-95"
              >
                <div className="bg-slate-900/95 border-2 border-amber-400 px-7 py-3.5 rounded-xl flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  <span className="font-orbitron font-extrabold text-sm md:text-base tracking-wider text-amber-200">
                    Press 'E' to Talk to {currentChapterConfig.targetName}
                  </span>
                  <span className="text-[11px] font-mono-scifi bg-amber-950 text-amber-300 px-2.5 py-1 rounded border border-amber-500 font-bold ml-1">
                    [E]
                  </span>
                </div>
              </button>
            </div>
          )}

        {/* Surface Launchpad Elevator Prompt */}
        {isSurface && (showElevatorPrompt || nearTargetId === 'RETURN_ELEVATOR') && (
          <div className="pointer-events-auto flex flex-col items-center gap-2 mt-2">
            <button
              onClick={onRideElevator}
              className="cursor-pointer group focus:outline-none transition-transform hover:scale-105 active:scale-95"
            >
              <div className="bg-slate-900/95 border-2 border-emerald-400 px-7 py-3.5 rounded-xl flex items-center gap-3">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <span className="font-orbitron font-extrabold text-sm md:text-base tracking-wider text-emerald-200">
                  Press 'E' to Board SOL-7 Return Rocket Lift
                </span>
                <span className="text-[11px] font-mono-scifi bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded border border-emerald-500 font-bold ml-1">
                  [E]
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Airlock Command Center Prompt */}
        {isSurface && isNearAirlock && nearTargetId !== 'RAJ' && (
          <div className="pointer-events-auto flex flex-col items-center gap-2 mt-2">
            <button
              onClick={() => onEnterAirlock?.()}
              className="cursor-pointer bg-slate-900/90 hover:bg-slate-800 border border-cyan-400/70 px-5 py-2 rounded-xl flex items-center gap-2 text-xs font-orbitron font-bold text-cyan-200 shadow-lg"
            >
              <LogIn className="w-4 h-4 text-cyan-400" />
              <span>ENTER HABITAT COMMAND MODULE</span>
            </button>
          </div>
        )}

        {/* ========================================================== */}
        {/* SOLAR SYSTEM PLANET INFO CARD HUD (ALL 8 PLANETS + MOON)   */}
        {/* ========================================================== */}
        {isSpaceOrbit && activeBodyInfo && (
          <div className="pointer-events-auto w-full max-w-lg bg-slate-900/95 border-2 border-cyan-400/80 rounded-2xl p-5 mb-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-orbitron font-extrabold text-base md:text-lg text-slate-100 tracking-wider">
                    {activeBodyInfo.name}
                  </div>
                  <div className="text-[11px] font-mono-scifi text-cyan-300">
                    {activeBodyInfo.subtitle}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSelectSolarBodyFromHUD(null)}
                className="cursor-pointer text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono-scifi flex items-center gap-1"
                title="Zoom Out to Full Solar System"
              >
                <X className="w-3.5 h-3.5" />
                <span>OVERVIEW</span>
              </button>
            </div>

            {/* Telemetry Grid: Size, Moons, Temperature */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono-scifi mb-3">
              <div className="bg-slate-800/80 border border-slate-700/70 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase">SIZE (DIAMETER)</div>
                <div className="text-slate-100 font-bold mt-0.5">{activeBodyInfo.size}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/70 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase">MOONS</div>
                <div className="text-cyan-300 font-bold mt-0.5">{activeBodyInfo.moons}</div>
              </div>
              <div className="bg-slate-800/80 border border-slate-700/70 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase">TEMPERATURE</div>
                <div className="text-amber-300 font-bold mt-0.5">{activeBodyInfo.temperature}</div>
              </div>
            </div>

            {/* Landable Mission Telemetry (Distance & Hazards for Moon & Mars) */}
            {activeBodyInfo.isLandable && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-scifi mb-3">
                <div className="bg-slate-800/70 p-2 rounded-lg flex justify-between">
                  <span className="text-slate-400">DISTANCE:</span>
                  <span className="text-emerald-300 font-bold">
                    {activeBodyInfo.distanceFromEarth} ({activeBodyInfo.flightTime})
                  </span>
                </div>
                <div className="bg-amber-950/40 border border-amber-700/50 p-2 rounded-lg text-[11px] text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate" title={activeBodyInfo.hazards}>
                    {activeBodyInfo.hazards}
                  </span>
                </div>
              </div>
            )}

            {/* NASA Fun Fact Box */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 leading-relaxed mb-4">
              <span className="font-orbitron font-bold text-cyan-400 uppercase text-[10px] tracking-wider block mb-0.5">
                NASA PLANETARY SCIENCE FACT
              </span>
              {activeBodyInfo.funFact}
            </div>

            {/* Action Area: Green CONFIRM TRAJECTORY for Moon/Mars OR Red NOT LANDABLE Badge */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              {activeBodyInfo.isLandable && activeBodyInfo.destination ? (
                <>
                  <span className="text-xs font-mono-scifi text-emerald-400 font-semibold">
                    ✓ Outpost Landing Pad Available
                  </span>
                  <button
                    onClick={() => {
                      const dest = activeBodyInfo.destination!;
                      onSelectPlanet(dest);
                      onConfirmTrajectory();
                    }}
                    className="cursor-pointer px-5 py-2.5 rounded-xl font-orbitron font-extrabold text-xs md:text-sm tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>CONFIRM TRAJECTORY →</span>
                  </button>
                </>
              ) : (
                <div className="w-full py-2.5 px-4 rounded-xl bg-red-950/80 border border-red-500/80 text-red-200 font-orbitron font-bold text-xs md:text-sm tracking-wider text-center">
                  ✗ NOT LANDABLE — Observation Only
                </div>
              )}
            </div>
          </div>
        )}

        {/* WARP SPEED HYPERDRIVE HUD */}
        {isWarping && (
          <div className="pointer-events-auto bg-slate-950/95 border-2 border-indigo-500 px-8 py-5 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-mono-scifi text-indigo-400 tracking-widest uppercase">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>
                {isPlanetStoryActive
                  ? 'TRANS-EARTH INJECTION BURN • RETURNING HOME'
                  : 'HYPERDRIVE WARP TRANSIT IN PROGRESS'}
              </span>
            </div>
            <div className="font-orbitron font-black text-3xl md:text-4xl text-indigo-300 mt-1 tracking-wider">
              {isPlanetStoryActive ? 'DESTINATION: EARTH' : `DESTINATION: ${selectedDestination}`}
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden border border-indigo-500/40">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-fuchsia-400 h-full transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(10, warpProgress * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* PLANETARY DESCENT & TOUCHDOWN TELEMETRY HUD */}
        {isDescent && (
          <div className="pointer-events-auto bg-slate-950/92 border-2 border-cyan-400 px-6 py-4 rounded-2xl text-center max-w-md w-full mt-auto mb-2">
            <div className="flex items-center justify-center gap-2 text-xs font-mono-scifi text-cyan-400 tracking-widest uppercase">
              <Flame className="w-4 h-4 text-cyan-400" />
              <span>
                {selectedDestination === 'MOON'
                  ? 'LUNAR RETRO-ROCKET DESCENT (VACUUM)'
                  : 'MARS ATMOSPHERIC ENTRY & SUPERSONIC RETRO-BURN'}
              </span>
            </div>
            <div className="font-orbitron font-black text-xl md:text-2xl text-cyan-200 mt-1 tracking-wider">
              {descentProgress < 0.4
                ? selectedDestination === 'MOON'
                  ? 'CRATER FIELD APPROACH'
                  : 'PLASMA ENTRY INTERFACE'
                : descentProgress < 0.88
                ? 'LANDING LEGS DEPLOYED • RETRO BURN'
                : 'TOUCHDOWN CONFIRMED • DUST CLEARING'}
            </div>

            {/* Live Telemetry Readout Row inside Descent Card */}
            <div className="grid grid-cols-3 gap-2 my-3 font-mono-scifi text-xs tabular-nums">
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400">ALTITUDE</div>
                <div className="font-orbitron font-bold text-amber-300 text-sm">
                  {descentAltitudeMeters} m
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400">SPEED</div>
                <div className="font-orbitron font-bold text-cyan-300 text-sm">
                  {descentSpeedMs} m/s
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                <div className="text-[10px] text-slate-400">THRUST</div>
                <div className="font-orbitron font-bold text-emerald-400 text-sm">
                  {descentThrustPct}%
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-cyan-500/40">
              <div
                className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-300 h-full transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(5, descentProgress * 100))}%` }}
              />
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-center">
              <button
                onClick={onSkipDescent}
                className="cursor-pointer px-4 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 rounded-xl text-xs font-mono-scifi text-slate-300 hover:text-cyan-300 flex items-center gap-2"
              >
                <span>SKIP CINEMATIC</span>
                <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded text-[10px] text-cyan-400 font-bold">
                  SPACE / ESC
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Earth Gantry Tower Elevator Prompt */}
        {viewMode === 'WALK' && !isPlanetStoryActive && (showElevatorPrompt || showDoorPrompt) && (
          <div className="pointer-events-auto flex flex-col items-center gap-2">
            <button
              onClick={() => (onRideElevator ? onRideElevator() : onEnterRocket?.())}
              className="cursor-pointer group focus:outline-none transition-transform hover:scale-105 active:scale-95"
            >
              <div className="bg-slate-900/95 border-2 border-cyan-400 px-6 py-3 rounded-xl flex items-center gap-3">
                <LogIn className="w-5 h-5 text-cyan-400" />
                <span className="font-orbitron font-extrabold text-sm md:text-base tracking-wider text-cyan-200">
                  Press E to Ride Elevator
                </span>
                <span className="text-[11px] font-mono-scifi bg-cyan-950 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500 font-bold ml-1">
                  [E]
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Elevator in-transit status indicator */}
        {viewMode === 'ELEVATOR_RIDE' && (
          <div className="pointer-events-auto bg-slate-900/95 border border-cyan-400/80 px-6 py-3 rounded-xl flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="font-orbitron font-bold text-sm tracking-wider text-cyan-200">
              {isPlanetStoryActive
                ? 'BOARDING SOL-7 ROCKET WITH RAJ, LEO & SARAH • ASCENDING TOWER'
                : 'GANTRY TOWER ELEVATOR IN TRANSIT • CREW ACCESS WALKWAY'}
            </span>
          </div>
        )}

        {/* Cockpit Ignition Button */}
        {viewMode === 'COCKPIT' && (
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              onClick={() => onStartCountdown?.()}
              className="cursor-pointer transition-all transform hover:scale-105 active:scale-95 group focus:outline-none"
            >
              <div className="bg-slate-900/95 border-2 border-red-500 px-8 py-4 rounded-xl flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <span className="font-orbitron font-black text-base md:text-lg tracking-widest text-red-300">
                  {isPlanetStoryActive
                    ? 'INITIATE EARTH RETURN IGNITION'
                    : 'Press SPACE to Launch'}
                </span>
                <span className="text-xs font-mono-scifi bg-red-950/80 text-red-200 px-2.5 py-1 rounded border border-red-700/60 ml-1 font-bold">
                  ␣ SPACE
                </span>
              </div>
            </button>
            <button
              onClick={() => onExitRocket?.()}
              className="cursor-pointer bg-slate-900/85 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-300 px-4 py-1.5 rounded-lg text-xs font-mono-scifi flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <span>[E] Step Back Outside</span>
            </button>
          </div>
        )}

        {/* Countdown Display */}
        {viewMode === 'COUNTDOWN' && (
          <div className="pointer-events-auto flex flex-col items-center gap-2 bg-slate-900/95 border-2 border-amber-500 px-8 py-5 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-mono-scifi tracking-widest text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>
                {isPlanetStoryActive
                  ? 'EARTH RETURN IGNITION SEQUENCE'
                  : 'TERMINAL LAUNCH COUNTDOWN'}
              </span>
            </div>
            <div className="font-orbitron font-black text-5xl md:text-6xl text-amber-300 tracking-wider tabular-nums">
              {countdownSeconds !== null && countdownSeconds > 0
                ? `T - ${countdownSeconds}s`
                : 'LIFTOFF!'}
            </div>
            <div className="text-xs font-mono-scifi text-slate-300 flex items-center gap-2 mt-1">
              <span className="text-emerald-400 font-bold">TURBINES SPOOLING</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">ALL DIALS GREEN</span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* BOTTOM CONTROL DOCK                                          */}
      {/* ============================================================ */}
      <div className="pointer-events-auto flex flex-col items-center w-full max-w-5xl mx-auto z-10 transition-transform duration-300">
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="cursor-pointer bg-slate-900/90 border-t border-x border-cyan-500/40 text-cyan-400 hover:text-cyan-200 px-4 py-1 rounded-t-lg text-xs font-mono-scifi flex items-center gap-1.5"
          title="Toggle Controls (H)"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>SHOW CONTROLS</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>HIDE CONTROLS (H)</span>
            </>
          )}
        </button>

        {!isDockCollapsed && (
          <div className="w-full bg-slate-900/92 border border-cyan-500/40 rounded-2xl p-3 md:p-4 text-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
            {isSurface ? (
              <div className="flex items-center gap-2.5 flex-wrap justify-center w-full md:w-auto">
                <span className="text-xs font-mono-scifi text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" /> OUTPOST WORLD:
                </span>
                <button
                  onClick={() => onSwitchSurfaceWorld?.('MARS')}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    selectedDestination === 'MARS'
                      ? 'bg-orange-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🔴 MARS (OLYMPUS)
                </button>
                <button
                  onClick={() => onSwitchSurfaceWorld?.('MOON')}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-orbitron font-bold transition-all ${
                    selectedDestination === 'MOON'
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🌕 MOON (ARTEMIS)
                </button>
                <button
                  onClick={onReturnToOrbit}
                  className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-orbitron">SOLAR SYSTEM MAP</span>
                </button>
                <button
                  onClick={onResetMission}
                  className="cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-orbitron">EARTH PAD</span>
                </button>
              </div>
            ) : isSpaceOrbit ? (
              <div className="flex items-center gap-1.5 flex-wrap justify-center w-full md:w-auto">
                <span className="text-[11px] font-mono-scifi text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" /> SOLAR SYSTEM:
                </span>
                {ORDERED_SOLAR_BODIES.map((bodyId) => {
                  const info = SOLAR_SYSTEM_BODIES[bodyId];
                  const isSelected = activeSolarBodyId === bodyId;
                  return (
                    <button
                      key={bodyId}
                      onClick={() => handleSelectSolarBodyFromHUD(bodyId)}
                      className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-orbitron font-bold transition-all whitespace-nowrap ${
                        isSelected
                          ? info.isLandable
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                          : info.isLandable
                          ? 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900/80'
                          : 'bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {bodyId}
                      {info.isLandable ? ' ★' : ''}
                    </button>
                  );
                })}
              </div>
            ) : isFlightActive ? (
              <div className="flex items-center gap-3 flex-wrap justify-center w-full md:w-auto">
                <span className="text-[11px] font-mono-scifi text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" /> DUAL CAMERA [PRESS C]:
                </span>
                <button
                  onClick={() => {
                    onSelectFlightView?.('IN_FLIGHT_WINDOW');
                    soundManager.playTelemetryChirp();
                  }}
                  className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    viewMode === 'IN_FLIGHT_WINDOW'
                      ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span>🪟</span>
                  <span className="font-orbitron font-bold">COCKPIT VISOR VIEW [1]</span>
                </button>
                <button
                  onClick={() => {
                    onSelectFlightView?.('IN_FLIGHT_CINEMATIC');
                    soundManager.playTelemetryChirp();
                  }}
                  className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    viewMode === 'IN_FLIGHT_CINEMATIC'
                      ? 'bg-amber-500/30 border border-amber-400 text-amber-200'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span>🚀</span>
                  <span className="font-orbitron font-bold">EXTERIOR CHASE CAM [2]</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {standardCameraButtons.map((btn) => {
                  const isActive = currentPreset === btn.id;
                  return (
                    <button
                      key={btn.id}
                      onClick={() => {
                        onSelectPreset(btn.id);
                        soundManager.playTelemetryChirp();
                      }}
                      className={`cursor-pointer px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300'
                          : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <span>{btn.icon}</span>
                      <span className="hidden sm:inline font-rajdhani text-sm">{btn.label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => onSwitchSurfaceWorld?.('MARS')}
                  className="cursor-pointer ml-1 px-3 py-1.5 rounded-lg text-xs font-orbitron font-bold bg-amber-500/25 border border-amber-400 text-amber-200 hover:bg-amber-500/40"
                >
                  🚀 JUMP TO OUTPOST STORY
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  !isMuted
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                    : 'bg-slate-800/80 border border-slate-700/60 text-slate-500'
                }`}
                title="Toggle Audio (M)"
              >
                {!isMuted ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-rajdhani text-sm">AUDIO ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-rajdhani text-sm">MUTED</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
