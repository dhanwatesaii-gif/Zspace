import React, { useState, useEffect } from 'react';
import { soundManager } from '../../utils/audio';
import {
  downloadProjectDocumentationPDF,
  downloadPresentationDeckPDF,
} from '../../utils/pdfGenerator';
import {
  Rocket,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  UserCheck,
  Compass,
  Award,
  CheckCircle2,
  Terminal,
  FileText,
  Presentation,
  Download,
} from 'lucide-react';

export interface AstronautProfile {
  name: string;
  age: number;
  avatarId: string;
  difficulty: 'CADET' | 'ASTRONAUT' | 'COMMANDER';
  destination: 'MARS' | 'MOON';
  badge: string;
}

interface MissionBriefingScreenProps {
  onBeginMission: (profile: AstronautProfile) => void;
}

interface AvatarOption {
  id: string;
  title: string;
  role: string;
  helmetBg: string;
  visorBg: string;
  suitBg: string;
  chestBg: string;
  glowClass: string;
  borderSelected: string;
}

const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'commander',
    title: 'Commander',
    role: 'Navy / Gold',
    helmetBg: 'bg-indigo-950 border-amber-400',
    visorBg: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
    suitBg: 'bg-indigo-950 border-indigo-700',
    chestBg: 'bg-amber-400',
    glowClass: 'shadow-[0_0_22px_rgba(251,191,36,0.45)]',
    borderSelected: 'border-amber-400 bg-indigo-950/60',
  },
  {
    id: 'explorer',
    title: 'Explorer',
    role: 'White / Blue',
    helmetBg: 'bg-slate-100 border-sky-400',
    visorBg: 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]',
    suitBg: 'bg-slate-100 border-slate-300',
    chestBg: 'bg-sky-500',
    glowClass: 'shadow-[0_0_22px_rgba(56,189,248,0.45)]',
    borderSelected: 'border-sky-400 bg-sky-950/50',
  },
  {
    id: 'engineer',
    title: 'Engineer',
    role: 'Orange / Amber',
    helmetBg: 'bg-orange-700 border-amber-300',
    visorBg: 'bg-amber-300 shadow-[0_0_8px_#fcd34d]',
    suitBg: 'bg-orange-700 border-orange-500',
    chestBg: 'bg-amber-300',
    glowClass: 'shadow-[0_0_22px_rgba(249,115,22,0.5)]',
    borderSelected: 'border-orange-400 bg-orange-950/50',
  },
  {
    id: 'scientist',
    title: 'Scientist',
    role: 'Teal / Green',
    helmetBg: 'bg-cyan-800 border-emerald-400',
    visorBg: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
    suitBg: 'bg-cyan-800 border-cyan-600',
    chestBg: 'bg-emerald-400',
    glowClass: 'shadow-[0_0_22px_rgba(16,185,129,0.45)]',
    borderSelected: 'border-emerald-400 bg-emerald-950/50',
  },
  {
    id: 'pilot',
    title: 'Pilot',
    role: 'Black / Red',
    helmetBg: 'bg-slate-900 border-red-500',
    visorBg: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
    suitBg: 'bg-slate-900 border-red-600',
    chestBg: 'bg-red-500',
    glowClass: 'shadow-[0_0_22px_rgba(239,68,68,0.45)]',
    borderSelected: 'border-red-500 bg-red-950/50',
  },
  {
    id: 'medic',
    title: 'Medic',
    role: 'White / Cyan',
    helmetBg: 'bg-slate-200 border-cyan-400',
    visorBg: 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]',
    suitBg: 'bg-slate-200 border-cyan-400',
    chestBg: 'bg-cyan-500',
    glowClass: 'shadow-[0_0_22px_rgba(34,211,238,0.45)]',
    borderSelected: 'border-cyan-400 bg-cyan-950/50',
  },
];

const BADGE_OPTIONS = ['🌟', '⚡', '🛸', '🔥', '🌌'];

const DIFFICULTY_OPTIONS: Array<{
  id: 'CADET' | 'ASTRONAUT' | 'COMMANDER';
  label: string;
  dot: string;
  desc: string;
  borderActive: string;
}> = [
  {
    id: 'CADET',
    label: '🟢 CADET',
    dot: 'bg-emerald-400',
    desc: 'Full navigation markers, crew waypoint beams & NASA science hints ON',
    borderActive:
      'border-emerald-400 bg-emerald-950/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.35)]',
  },
  {
    id: 'ASTRONAUT',
    label: '🟡 ASTRONAUT',
    dot: 'bg-amber-400',
    desc: 'Standard NASA mission parameters with tactical HUD guidance (Default)',
    borderActive:
      'border-amber-400 bg-amber-950/50 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]',
  },
  {
    id: 'COMMANDER',
    label: '🔴 COMMANDER',
    dot: 'bg-red-500',
    desc: 'Hardcore simulation — no HUD hints or objective shortcut buttons',
    borderActive:
      'border-red-500 bg-red-950/50 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.35)]',
  },
];

const STAR_POSITIONS = Array.from({ length: 56 }).map((_, i) => ({
  id: i,
  top: `${(i * 19 + 7) % 98}%`,
  left: `${(i * 37 + 13) % 99}%`,
  size: i % 4 === 0 ? 'w-1 h-1' : 'w-0.5 h-0.5',
  delay: `${(i % 7) * 0.4}s`,
  opacity: i % 3 === 0 ? 'opacity-80' : 'opacity-40',
}));

export function getAgeRankBadge(age: number): { label: string; colorClass: string } {
  if (!age || isNaN(age) || age <= 0) {
    return {
      label: 'AWAITING AGE TELEMETRY',
      colorClass: 'text-slate-400 border-slate-700 bg-slate-900',
    };
  }
  if (age < 10) {
    return {
      label: '⭐ Junior Cadet (<10)',
      colorClass: 'text-amber-300 border-amber-400/60 bg-amber-950/60',
    };
  }
  if (age <= 15) {
    return {
      label: '🚀 Space Explorer (10-15)',
      colorClass: 'text-cyan-300 border-cyan-400/60 bg-cyan-950/60',
    };
  }
  if (age <= 18) {
    return {
      label: '🛸 Orbital Specialist (16-18)',
      colorClass: 'text-purple-300 border-purple-400/60 bg-purple-950/60',
    };
  }
  return {
    label: '👨‍✈️ Senior Commander (18+)',
    colorClass: 'text-emerald-300 border-emerald-400/60 bg-emerald-950/60',
  };
}

/**
 * Pure HTML/CSS 2D Astronaut Avatar Graphic (Circle Helmet + Visor + Rounded Rect Suit Body)
 */
const CssAstronautAvatar: React.FC<{ avatar: AvatarOption; size?: 'sm' | 'md' }> = ({
  avatar,
  size = 'md',
}) => {
  const isSmall = size === 'sm';
  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Circle Helmet */}
      <div
        className={`relative rounded-full border-2 flex items-center justify-center ${
          isSmall ? 'w-8 h-8' : 'w-11 h-11'
        } ${avatar.helmetBg}`}
      >
        {/* Reflective Visor Pill */}
        <div
          className={`rounded-full ${isSmall ? 'w-5 h-3' : 'w-7 h-4'} ${avatar.visorBg}`}
        />
      </div>
      {/* Rounded Rect Suit Torso */}
      <div
        className={`-mt-1 rounded-t-xl rounded-b-md border-2 flex flex-col items-center justify-center ${
          isSmall ? 'w-10 h-7' : 'w-14 h-10'
        } ${avatar.suitBg}`}
      >
        {/* Chest Telemetry Unit */}
        <div
          className={`rounded-sm ${isSmall ? 'w-4 h-2' : 'w-6 h-3'} ${avatar.chestBg}`}
        />
      </div>
    </div>
  );
};

export const MissionBriefingScreen: React.FC<MissionBriefingScreenProps> = ({
  onBeginMission,
}) => {
  const [name, setName] = useState<string>('');
  const [ageInput, setAgeInput] = useState<string>('12');
  const [avatarId, setAvatarId] = useState<string>('commander');
  const [difficulty, setDifficulty] = useState<'CADET' | 'ASTRONAUT' | 'COMMANDER'>('ASTRONAUT');
  const [destination, setDestination] = useState<'MARS' | 'MOON'>('MARS');
  const [badge, setBadge] = useState<string>('🚀');

  // Initialize default badge to first of the 5 emoji patches
  useEffect(() => {
    setBadge(BADGE_OPTIONS[0]);
  }, []);

  // Launch sequence countdown state (null = editing form, 3..1 = T-countdown, 0 = LAUNCH!)
  const [launchCountdown, setLaunchCountdown] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const parsedAge = parseInt(ageInput, 10);
  const isNameValid = name.trim().length >= 3;
  const isAgeValid = !isNaN(parsedAge) && parsedAge >= 4 && parsedAge <= 110;
  const isFormComplete =
    isNameValid &&
    isAgeValid &&
    Boolean(avatarId) &&
    Boolean(difficulty) &&
    Boolean(destination) &&
    Boolean(badge);

  const ageBadge = getAgeRankBadge(parsedAge);
  const selectedAvatar =
    AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const handleTriggerLaunchSequence = () => {
    if (!isFormComplete || launchCountdown !== null) return;
    soundManager.startAmbiance();
    soundManager.playLaunchCountdownTone();
    setLaunchCountdown(3);
  };

  useEffect(() => {
    if (launchCountdown === null) return;

    if (launchCountdown > 0) {
      const timer = window.setTimeout(() => {
        if (launchCountdown - 1 > 0) {
          soundManager.playLaunchCountdownTone();
        } else {
          soundManager.playLiftoffRoar();
        }
        setLaunchCountdown(launchCountdown - 1);
      }, 900);
      return () => clearTimeout(timer);
    }

    if (launchCountdown === 0) {
      const fadeTimer = window.setTimeout(() => {
        setIsFadingOut(true);
      }, 350);

      const completeTimer = window.setTimeout(() => {
        onBeginMission({
          name: name.trim().toUpperCase(),
          age: parsedAge,
          avatarId,
          difficulty,
          destination,
          badge,
        });
      }, 950);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [launchCountdown, name, parsedAge, avatarId, difficulty, destination, badge, onBeginMission]);

  return (
    <div
      className={`relative w-screen h-screen bg-slate-950 text-slate-100 font-rajdhani overflow-y-auto overflow-x-hidden select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Self-contained Keyframes for Scanline Sweep, Star Twinkle & Bottom Ticker Marquee */}
      <style>{`
        @keyframes briefing-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes briefing-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes briefing-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.9); }
          50% { opacity: 0.95; transform: scale(1.25); }
        }
        .animate-scanline {
          animation: briefing-scanline 7s linear infinite;
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: briefing-marquee 34s linear infinite;
        }
        .animate-star {
          animation: briefing-twinkle 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Animated CSS Starfield Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {STAR_POSITIONS.map((st) => (
          <div
            key={st.id}
            style={{ top: st.top, left: st.left, animationDelay: st.delay }}
            className={`absolute rounded-full bg-cyan-100 animate-star ${st.size} ${st.opacity}`}
          />
        ))}
        {/* Subtle Radial Nebula Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        {/* Scanning Line Sweep */}
        <div className="w-full h-16 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-scanline" />
      </div>

      {/* Full-Screen 3-Second Launch Countdown Overlay */}
      {launchCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-xs md:text-sm font-mono-scifi text-cyan-400 tracking-[0.25em] uppercase mb-3">
            ISRO-NASA SOL-7 INTERPLANETARY TELEMETRY LOCK
          </div>
          <div className="font-orbitron font-black text-6xl sm:text-8xl text-amber-400 tracking-wider drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
            {launchCountdown > 0 ? `T - ${launchCountdown}` : 'LAUNCH!'}
          </div>
          <div className="mt-4 font-orbitron font-bold text-lg sm:text-2xl text-cyan-300 tracking-wide">
            COMMANDER {name.trim().toUpperCase()} • DESTINATION: {destination}
          </div>
          <div className="mt-6 w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-cyan-500/50">
            <div className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-red-500 w-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-20 flex flex-col gap-4">
        {/* Top NASA Terminal Header Bar */}
        <header className="bg-slate-900/90 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.18)] rounded-2xl px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-mono-scifi text-cyan-300 tracking-widest uppercase">
                  ISRO • NASA ARTEMIS / OLYMPUS TERMINAL • SOL-7 EXPEDITION
                </span>
              </div>
              <h1 className="font-orbitron font-black text-lg sm:text-2xl tracking-wider text-white">
                ASTRONAUT REGISTRATION & MISSION BRIEFING
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundManager.playTelemetryChirp();
                downloadProjectDocumentationPDF();
              }}
              className="cursor-pointer flex items-center gap-1.5 text-xs font-orbitron font-bold bg-cyan-950/90 hover:bg-cyan-500 border border-cyan-400/70 px-3 py-2 rounded-xl text-cyan-200 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              title="Download Full Project Documentation PDF"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>DOCS PDF</span>
              <Download className="w-3 h-3 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playTelemetryChirp();
                downloadPresentationDeckPDF();
              }}
              className="cursor-pointer flex items-center gap-1.5 text-xs font-orbitron font-bold bg-amber-950/90 hover:bg-amber-400 border border-amber-400/70 px-3 py-2 rounded-xl text-amber-200 hover:text-slate-950 transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)]"
              title="Download 12-Slide Presentation Deck PDF"
            >
              <Presentation className="w-3.5 h-3.5 shrink-0" />
              <span>PPT SLIDES PDF</span>
              <Download className="w-3 h-3 shrink-0" />
            </button>

            <div className="hidden xl:flex items-center gap-2 text-xs font-mono-scifi bg-slate-950/90 border border-amber-500/40 px-3 py-2 rounded-xl text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>CLEARANCE: DEEP SPACE</span>
            </div>
          </div>
        </header>

        {/* Two-Column Registration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN (7 cols): Identity, Age, Difficulty, Destination */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 1 & 2: Commander Name + Age Card */}
            <div className="bg-slate-900/90 border border-cyan-500/35 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <span className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-wider uppercase flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  1. COMMANDER CREDENTIALS
                </span>
                {isNameValid ? (
                  <span className="text-xs font-mono-scifi font-bold px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                    IDENTITY CONFIRMED ✓
                  </span>
                ) : (
                  <span className="text-xs font-mono-scifi text-amber-300/90">
                    ENTER MIN 3 CHARACTERS
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Commander Name Input */}
                <div className="sm:col-span-7 flex flex-col gap-1.5">
                  <label
                    htmlFor="commander-name-input"
                    className="text-xs font-mono-scifi text-slate-300 uppercase"
                  >
                    Commander Callsign / Name
                  </label>
                  <input
                    id="commander-name-input"
                    type="text"
                    maxLength={22}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. ARJUN VIKRAM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 focus:shadow-[0_0_18px_rgba(34,211,238,0.45)] focus:outline-none font-orbitron font-bold text-sm text-white placeholder:text-slate-600 transition-all"
                  />
                </div>

                {/* Age Input */}
                <div className="sm:col-span-5 flex flex-col gap-1.5">
                  <label
                    htmlFor="commander-age-input"
                    className="text-xs font-mono-scifi text-slate-300 uppercase"
                  >
                    Astronaut Age (Years)
                  </label>
                  <input
                    id="commander-age-input"
                    type="number"
                    min={4}
                    max={99}
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 focus:shadow-[0_0_18px_rgba(34,211,238,0.45)] focus:outline-none font-orbitron font-bold text-sm text-amber-300 transition-all"
                  />
                </div>
              </div>

              {/* Dynamic Age Rank Badge */}
              <div className="mt-3 flex items-center justify-between bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl">
                <span className="text-xs font-mono-scifi text-slate-400">
                  ASSIGNED FLIGHT RANK:
                </span>
                <span
                  className={`text-xs font-orbitron font-bold px-3 py-1 rounded-lg border ${ageBadge.colorClass}`}
                >
                  {ageBadge.label}
                </span>
              </div>
            </div>

            {/* 3. Mission Difficulty Selector */}
            <div className="bg-slate-900/90 border border-cyan-500/35 rounded-2xl p-4 sm:p-5">
              <div className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-wider uppercase mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                2. SIMULATION DIFFICULTY & TELEMETRY ASSISTANCE
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const isSelected = difficulty === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        soundManager.playTelemetryChirp();
                        setDifficulty(opt.id);
                      }}
                      className={`cursor-pointer text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? opt.borderActive
                          : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="font-orbitron font-extrabold text-xs sm:text-sm">
                        {opt.label}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Primary Planetary Destination Selector */}
            <div className="bg-slate-900/90 border border-cyan-500/35 rounded-2xl p-4 sm:p-5">
              <div className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-wider uppercase mb-3 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                3. TARGET PLANETARY OUTPOST DESTINATION
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MOON CARD */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTelemetryChirp();
                    setDestination('MOON');
                  }}
                  className={`cursor-pointer text-left p-4 rounded-2xl border-2 transition-all ${
                    destination === 'MOON'
                      ? 'border-cyan-400 bg-cyan-950/55 shadow-[0_0_28px_rgba(34,211,238,0.45)] scale-[1.01]'
                      : 'border-slate-800 bg-slate-950/80 hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-black text-base sm:text-lg text-cyan-300">
                      🌕 THE MOON
                    </span>
                    <span className="text-[10px] font-mono-scifi px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/60 text-cyan-200 font-bold">
                      384,400 KM • 1/6G
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">
                    Artemis Base Alpha (Lunar South Pole)
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Vacuum retro-descent over rugged titanium craters, electrostatic lunar regolith dust & subsurface water-ice mining.
                  </p>
                </button>

                {/* MARS CARD */}
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playTelemetryChirp();
                    setDestination('MARS');
                  }}
                  className={`cursor-pointer text-left p-4 rounded-2xl border-2 transition-all ${
                    destination === 'MARS'
                      ? 'border-orange-500 bg-orange-950/55 shadow-[0_0_28px_rgba(249,115,22,0.5)] scale-[1.01]'
                      : 'border-slate-800 bg-slate-950/80 hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-black text-base sm:text-lg text-orange-400">
                      🔴 MARS
                    </span>
                    <span className="text-[10px] font-mono-scifi px-2 py-0.5 rounded bg-orange-950 border border-orange-500/60 text-orange-200 font-bold">
                      225M KM • 0.38G
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">
                    Olympus Mons Outpost (Red Planet)
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Fiery supersonic atmospheric entry, swirling red iron-oxide dust squalls, DONKI solar storms & 22-min Earth comms lag.
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 cols): 2x3 Pure CSS Avatar Grid + 5 Mission Badges */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Avatar Selector (2x3 Grid) */}
            <div className="bg-slate-900/90 border border-cyan-500/35 rounded-2xl p-4 sm:p-5 flex-1">
              <div className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-wider uppercase mb-3 flex items-center justify-between">
                <span>4. SELECT EVA SPACESUIT AVATAR</span>
                <span className="text-[11px] font-mono-scifi text-amber-300">2×3 ROSTER</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVATAR_OPTIONS.map((av) => {
                  const isSelected = avatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playTelemetryChirp();
                        setAvatarId(av.id);
                      }}
                      className={`cursor-pointer relative p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 hover:scale-110 ${
                        isSelected
                          ? `${av.borderSelected} ${av.glowClass}`
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-600'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] font-mono-scifi font-extrabold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                          ✓ SELECTED
                        </span>
                      )}
                      <div className="my-1.5">
                        <CssAstronautAvatar avatar={av} />
                      </div>
                      <div className="font-orbitron font-bold text-xs text-white mt-1">
                        {av.title}
                      </div>
                      <div className="text-[10px] font-mono-scifi text-slate-400">
                        {av.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mission Patch Emoji Selector */}
            <div className="bg-slate-900/90 border border-cyan-500/35 rounded-2xl p-4 sm:p-5">
              <div className="font-orbitron font-bold text-xs sm:text-sm text-cyan-300 tracking-wider uppercase mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                5. MISSION INSIGNIA PATCH
              </div>
              <div className="flex items-center justify-between gap-2">
                {BADGE_OPTIONS.map((emoji) => {
                  const isSelected = badge === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        soundManager.playTelemetryChirp();
                        setBadge(emoji);
                      }}
                      className={`cursor-pointer w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                        isSelected
                          ? 'bg-cyan-950 border-2 border-cyan-400 ring-4 ring-cyan-400/35 shadow-[0_0_20px_rgba(34,211,238,0.65)] scale-110'
                          : 'bg-slate-950 border border-slate-800 hover:border-slate-600 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE DOSSIER PREVIEW & LAUNCH SEQUENCE BUTTON */}
        <div className="bg-slate-900/95 border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Dossier Left Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 shrink-0">
              <CssAstronautAvatar avatar={selectedAvatar} size="sm" />
              <div className="text-2xl">{badge}</div>
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono-scifi text-cyan-400 uppercase tracking-wider">
                  LIVE FLIGHT DOSSIER:
                </span>
                {isFormComplete ? (
                  <span className="text-xs font-mono-scifi font-extrabold px-2.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400 text-emerald-300 animate-pulse flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    READY FOR LAUNCH ✓
                  </span>
                ) : (
                  <span className="text-xs font-mono-scifi font-extrabold px-2.5 py-0.5 rounded bg-red-500/20 border border-red-500 text-red-300 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    INCOMPLETE — ENTER COMMANDER NAME (3+ CHARS)
                  </span>
                )}
              </div>

              <div className="font-orbitron font-black text-base sm:text-lg text-white tracking-wide">
                COMMANDER {isNameValid ? name.trim().toUpperCase() : '— [UNREGISTERED] —'}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono-scifi text-slate-300">
                <span>{ageBadge.label}</span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">Suit: {selectedAvatar.title}</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">Mode: {difficulty}</span>
                <span>•</span>
                <span
                  className={
                    destination === 'MOON'
                      ? 'text-cyan-300 font-bold'
                      : 'text-orange-400 font-bold'
                  }
                >
                  Target: {destination === 'MOON' ? '🌕 MOON (ARTEMIS)' : '🔴 MARS (OLYMPUS)'}
                </span>
              </div>
            </div>
          </div>

          {/* Launch Sequence CTA Button */}
          <button
            type="button"
            disabled={!isFormComplete || launchCountdown !== null}
            onClick={handleTriggerLaunchSequence}
            className={`px-6 py-4 rounded-2xl font-orbitron font-black text-sm sm:text-base tracking-wider flex items-center justify-center gap-3 transition-all shrink-0 ${
              isFormComplete
                ? 'cursor-pointer bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:to-amber-500 text-white border-2 border-red-300 shadow-[0_0_35px_rgba(239,68,68,0.75)] hover:scale-[1.02] active:scale-95'
                : 'cursor-not-allowed bg-slate-800 border-2 border-slate-700 text-slate-500'
            }`}
          >
            <Rocket className="w-5 h-5" />
            <span>🚀 INITIATE MISSION LAUNCH SEQUENCE</span>
          </button>
        </div>
      </div>

      {/* Bottom Scrolling CSS Marquee Ticker */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-slate-950/95 border-t border-cyan-500/40 py-2 overflow-hidden">
        <div className="animate-marquee font-mono-scifi text-xs text-cyan-300 gap-12 items-center">
          <span className="mx-6">
            🛰️ NASA DONKI TELEMETRY: Coronal Mass Ejections (CMEs) travel up to 2,000 km/s — shelter inside the Bio-Dome when radiation spikes!
          </span>
          <span className="mx-6 text-amber-300">
            🎮 GAMEPLAY TIP: Use WASD to walk, SHIFT to sprint, SPACE to jump in low gravity, and press E near crew members or the Gantry Elevator!
          </span>
          <span className="mx-6">
            🌕 ARTEMIS SCIENCE: Lunar South Pole craters stay at -230°C and preserve ancient water-ice for rocket propellant & oxygen (ISRU).
          </span>
          <span className="mx-6 text-emerald-300">
            📡 DEEP SPACE NETWORK (DSN): Radio signals between Mars and Earth take up to 22 minutes one-way at the speed of light!
          </span>
          <span className="mx-6">
            🛰️ NASA DONKI TELEMETRY: Coronal Mass Ejections (CMEs) travel up to 2,000 km/s — shelter inside the Bio-Dome when radiation spikes!
          </span>
          <span className="mx-6 text-amber-300">
            🎮 GAMEPLAY TIP: Use WASD to walk, SHIFT to sprint, SPACE to jump in low gravity, and press E near crew members or the Gantry Elevator!
          </span>
        </div>
      </div>
    </div>
  );
};
