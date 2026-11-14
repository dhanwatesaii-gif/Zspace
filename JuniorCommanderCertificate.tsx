import React, { useState } from 'react';
import { STORY_CHAPTERS, DialogueDirection } from '../../data/storyMissionData';
import { Destination } from '../3d/SpaceOrbitNav';
import {
  Award,
  CheckCircle2,
  GitBranch,
  RotateCcw,
  Rocket,
  Sparkles,
  ShieldCheck,
  Camera,
  Download,
  X,
  Maximize2,
} from 'lucide-react';

export interface DecisionRecord {
  chapterId: string;
  direction: DialogueDirection;
  choiceTitle: string;
  summary: string;
}

export interface MissionPhoto {
  id: string;
  dataUrl: string;
  phaseLabel: string;
  locationLabel: string;
  progressStep: string;
  timestamp: string;
}

interface JuniorCommanderCertificateProps {
  destination: Destination;
  commanderName?: string;
  commanderBadge?: string;
  decisions: DecisionRecord[];
  photos?: MissionPhoto[];
  stats: {
    power: number;
    oxygen: number;
    water: number;
    morale: number;
  };
  onReplayOutpost: () => void;
  onResetFullGame: () => void;
}

export const JuniorCommanderCertificate: React.FC<JuniorCommanderCertificateProps> = ({
  destination,
  commanderName,
  commanderBadge,
  decisions,
  photos = [],
  stats,
  onReplayOutpost,
  onResetFullGame,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<MissionPhoto | null>(null);

  const chapterList = [
    STORY_CHAPTERS.CHAPTER_1_DONKI,
    STORY_CHAPTERS.CHAPTER_2_DUST,
    STORY_CHAPTERS.CHAPTER_3_WATER,
    STORY_CHAPTERS.CHAPTER_4_DELAY,
  ];

  const completedChaptersCount = decisions.length;
  const overallProgressPct = Math.min(100, Math.max(25, Math.round((completedChaptersCount / 4) * 100)));

  return (
    <div className="pointer-events-auto fixed inset-0 z-40 bg-slate-950/94 flex items-center justify-center p-4 md:p-6 overflow-y-auto select-none">
      {/* Lightbox Modal when clicking a photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border-2 border-cyan-400 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <div>
                <div className="font-orbitron font-bold text-sm text-cyan-300">
                  {selectedPhoto.phaseLabel}
                </div>
                <div className="text-xs font-mono-scifi text-slate-400">
                  {selectedPhoto.locationLabel} • {selectedPhoto.progressStep} • {selectedPhoto.timestamp}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto.dataUrl}
                  download={`sol7-mission-photo-${selectedPhoto.id}.jpg`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-orbitron font-bold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="cursor-pointer p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <img
              src={selectedPhoto.dataUrl}
              alt={selectedPhoto.phaseLabel}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full bg-slate-900 border-2 border-amber-400 shadow-[0_0_60px_rgba(245,158,11,0.35)] rounded-3xl p-6 md:p-8 text-slate-100 my-auto">
        {/* TOP HEADER & GOLD BADGE */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-700/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)] shrink-0">
              <Award className="w-10 h-10 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono-scifi text-amber-300 tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ISRO - NASA JOINT EXPEDITION DEBRIEFING</span>
              </div>
              <h1 className="font-orbitron font-black text-2xl md:text-3xl text-white tracking-wide mt-0.5">
                {commanderName
                  ? `COMMANDER ${commanderName.toUpperCase()} ${commanderBadge || ''}`
                  : 'CERTIFIED MISSION COMMANDER'}
              </h1>
              <p className="text-xs md:text-sm text-cyan-300 font-mono-scifi">
                Returned Safely to Earth from{' '}
                {destination === 'MOON' ? 'Artemis Lunar Base Alpha' : 'Olympus Station (Mars)'}{' '}
                with Systems Engineer Raj, Engineer Leo & Dr. Sarah!
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-amber-400/50 px-4 py-2.5 rounded-xl text-center shrink-0">
            <div className="text-[10px] font-mono-scifi text-slate-400">
              MISSION PROGRESS ({overallProgressPct}% COMPLETE)
            </div>
            <div className="font-orbitron font-black text-lg text-amber-300 flex items-center justify-center gap-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>100% SAFE RETURN</span>
            </div>
          </div>
        </div>

        {/* FINAL SURVIVAL STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-800/80 border border-cyan-500/40 rounded-xl p-3 text-center">
            <div className="text-[10px] font-mono-scifi text-slate-400">STATION POWER</div>
            <div className="font-orbitron font-black text-xl text-cyan-300">{stats.power}%</div>
          </div>
          <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-3 text-center">
            <div className="text-[10px] font-mono-scifi text-slate-400">OXYGEN RESERVES</div>
            <div className="font-orbitron font-black text-xl text-emerald-300">{stats.oxygen}%</div>
          </div>
          <div className="bg-slate-800/80 border border-blue-500/40 rounded-xl p-3 text-center">
            <div className="text-[10px] font-mono-scifi text-slate-400">WATER RECYCLER</div>
            <div className="font-orbitron font-black text-xl text-blue-300">{stats.water}%</div>
          </div>
          <div className="bg-slate-800/80 border border-amber-500/40 rounded-xl p-3 text-center">
            <div className="text-[10px] font-mono-scifi text-slate-400">CREW MORALE</div>
            <div className="font-orbitron font-black text-xl text-amber-300">{stats.morale}%</div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* MISSION EXPEDITION PHOTO GALLERY & PROGRESS LOG            */}
        {/* ========================================================== */}
        <div className="bg-slate-950/90 border border-cyan-500/40 rounded-2xl p-4 md:p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 font-orbitron font-bold text-xs md:text-sm text-cyan-300 tracking-wider">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>EXPEDITION PHOTO GALLERY & MISSION PROGRESS LOG ({photos.length} CAPTURED)</span>
            </div>
            <span className="text-[11px] font-mono-scifi text-amber-300">
              Click any photo to enlarge or download
            </span>
          </div>

          {photos.length === 0 ? (
            <div className="bg-slate-900/75 border border-slate-800 rounded-xl p-5 text-center text-xs font-mono-scifi text-slate-400">
              No EVA mission photos were captured during this flight. On your next mission, click the{' '}
              <span className="text-cyan-300 font-bold">📸 SNAP PHOTO [P]</span> camera button in the HUD to document your progress!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="cursor-pointer group bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-xl overflow-hidden transition-all flex flex-col shadow-md"
                >
                  <div className="relative h-32 w-full bg-black overflow-hidden">
                    <img
                      src={photo.dataUrl}
                      alt={photo.phaseLabel}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/85 border border-cyan-500/50 text-[10px] font-mono-scifi font-bold text-cyan-300">
                      #{index + 1} • {photo.progressStep}
                    </span>
                    <div className="absolute bottom-2 right-2 p-1 rounded bg-slate-950/80 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-orbitron font-bold text-xs text-white truncate">
                        {photo.phaseLabel}
                      </div>
                      <div className="text-[10px] font-mono-scifi text-slate-400 truncate">
                        {photo.locationLabel} • {photo.timestamp}
                      </div>
                    </div>
                    <a
                      href={photo.dataUrl}
                      download={`sol7-mission-photo-${index + 1}.jpg`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-300 shrink-0 transition-colors"
                      title="Download Photo"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETROIT-STYLE 4-CHAPTER INTERACTIVE DECISION FLOWCHART */}
        <div className="bg-slate-950/90 border border-slate-700 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-orbitron font-bold text-xs md:text-sm text-cyan-300 tracking-wider">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>4-CHAPTER MISSION DECISION FLOWCHART (YOUR STORY PATH)</span>
            </div>
            <span className="text-[11px] font-mono-scifi text-slate-400">
              Highlighted = Branch Chosen • Dimmed = Alternate Paths
            </span>
          </div>

          <div className="space-y-3">
            {chapterList.map((chap) => {
              const record = decisions.find((d) => d.chapterId === chap.id);
              const chosenDir = record?.direction || 'UP';

              return (
                <div
                  key={chap.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                >
                  <div className="lg:w-1/4">
                    <div className="text-[10px] font-mono-scifi text-cyan-400 font-bold">
                      {chap.title}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">{chap.targetName}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full lg:w-3/4">
                    {chap.questions.map((q) => {
                      const isChosen = q.direction === chosenDir;
                      return (
                        <div
                          key={q.direction}
                          className={`p-2 rounded-lg border text-xs transition-all flex items-start gap-1.5 ${
                            isChosen
                              ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                              : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              isChosen ? 'text-emerald-400' : 'text-slate-700'
                            }`}
                          />
                          <div>
                            <div className="font-mono-scifi font-bold text-[10px]">
                              {q.categoryLabel}
                            </div>
                            <div className="font-orbitron font-bold text-[10px] mt-0.5">
                              {q.badgeText}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onReplayOutpost}
            className="cursor-pointer w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-orbitron font-black text-xs md:text-sm tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN & TRY OTHER CHOICES</span>
          </button>

          <button
            onClick={onResetFullGame}
            className="cursor-pointer w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-orbitron font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
          >
            <Rocket className="w-4 h-4 text-amber-400" />
            <span>EARTH LAUNCHPAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
