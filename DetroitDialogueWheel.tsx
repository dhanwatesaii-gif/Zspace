import React, { useState, useEffect, useCallback } from 'react';
import {
  StoryChapterConfig,
  DialogueChoiceOption,
  SCIENCE_GLOSSARY,
  GlossaryTerm,
} from '../../data/storyMissionData';
import { soundManager } from '../../utils/audio';
import {
  BookOpen,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Radio,
  AlertTriangle,
  Rocket,
  X,
} from 'lucide-react';

interface DetroitDialogueWheelProps {
  chapter: StoryChapterConfig;
  onStatChange: (
    delta: { power?: number; oxygen?: number; water?: number; morale?: number },
    alertText: string
  ) => void;
  onResolveChapter: (choice: DialogueChoiceOption) => void;
  onClose: () => void;
}

export const DetroitDialogueWheel: React.FC<DetroitDialogueWheelProps> = ({
  chapter,
  onStatChange,
  onResolveChapter,
  onClose,
}) => {
  const [speakerText, setSpeakerText] = useState<string>(chapter.openingLine);
  const [askedDirections, setAskedDirections] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<DialogueChoiceOption | null>(null);
  const [activeGlossary, setActiveGlossary] = useState<GlossaryTerm | null>(
    chapter.glossaryTerms[0] ? SCIENCE_GLOSSARY[chapter.glossaryTerms[0]] : null
  );

  const handleSelectOption = useCallback(
    (q: DialogueChoiceOption) => {
      soundManager.playTelemetryChirp();
      setSelectedOption(q);
      setSpeakerText(q.speakerResponse);

      if (!askedDirections.includes(q.direction)) {
        setAskedDirections((prev) => [...prev, q.direction]);
        onStatChange(q.statDelta, q.relationshipAlert);
      }

      if (q.unlockedGlossary && q.unlockedGlossary.length > 0) {
        const term = SCIENCE_GLOSSARY[q.unlockedGlossary[0]];
        if (term) setActiveGlossary(term);
      }
    },
    [askedDirections, onStatChange]
  );

  const handleConfirmDecision = useCallback(() => {
    if (!selectedOption) return;
    soundManager.playTelemetryChirp();
    onResolveChapter(selectedOption);
  }, [selectedOption, onResolveChapter]);

  // Keyboard Arrow Keys for the 4-Choice Detroit Wheel + Enter/Space to Confirm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const q = chapter.questions.find((item) => item.direction === 'UP');
        if (q) handleSelectOption(q);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const q = chapter.questions.find((item) => item.direction === 'LEFT');
        if (q) handleSelectOption(q);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const q = chapter.questions.find((item) => item.direction === 'RIGHT');
        if (q) handleSelectOption(q);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const q = chapter.questions.find((item) => item.direction === 'DOWN');
        if (q) handleSelectOption(q);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (selectedOption) {
          e.preventDefault();
          handleConfirmDecision();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapter, selectedOption, handleSelectOption, handleConfirmDecision, onClose]);

  const upQ = chapter.questions.find((q) => q.direction === 'UP');
  const leftQ = chapter.questions.find((q) => q.direction === 'LEFT');
  const rightQ = chapter.questions.find((q) => q.direction === 'RIGHT');
  const downQ = chapter.questions.find((q) => q.direction === 'DOWN');

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex flex-col justify-between p-4 md:p-6 bg-radial from-transparent via-slate-950/45 to-slate-950/90 select-none overflow-y-auto">
      {/* ============================================================ */}
      {/* TOP BAR: CHAPTER HEADER, NASA SITUATION ALERT & GLOSSARY     */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-4 max-w-6xl w-full mx-auto">
        {/* Speaker & NASA Situation Alert Box */}
        <div className="bg-slate-900/95 border-l-4 border-cyan-400 border-y border-r border-slate-700/80 px-5 py-3.5 rounded-r-xl shadow-[0_0_25px_rgba(6,182,212,0.25)] max-w-2xl w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono-scifi text-cyan-400 uppercase tracking-widest">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {chapter.title} • {chapter.crisisSubtitle}
              </span>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono-scifi text-slate-300 flex items-center gap-1 shrink-0"
              title="Step Back (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span>STEP BACK</span>
            </button>
          </div>

          <div className="mt-1">
            <h2 className="font-orbitron font-black text-lg md:text-xl text-white tracking-wide">
              {chapter.targetName}
            </h2>
            <p className="text-xs font-mono-scifi text-slate-400">{chapter.targetRole}</p>
          </div>

          {/* Live NASA Telemetry Alert Banner */}
          <div className="mt-2.5 bg-red-950/60 border border-red-500/60 rounded-lg px-3 py-2 flex items-start gap-2.5 text-xs font-mono-scifi text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <span>{chapter.situationAlert}</span>
          </div>
        </div>

        {/* In-Context NASA Open Science Glossary Card */}
        {activeGlossary && (
          <div className="bg-indigo-950/95 border-2 border-indigo-400/70 shadow-[0_0_24px_rgba(99,102,241,0.3)] rounded-xl p-3.5 max-w-md w-full text-slate-100">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-indigo-800/80">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span className="font-orbitron font-bold text-xs text-amber-300 tracking-wider">
                  NASA OPEN DATA GUIDE
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {Object.values(SCIENCE_GLOSSARY).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      soundManager.playTelemetryChirp();
                      setActiveGlossary(g);
                    }}
                    className={`cursor-pointer px-1.5 py-0.5 rounded text-[10px] font-mono-scifi transition-colors ${
                      activeGlossary.id === g.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800'
                    }`}
                  >
                    {g.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-cyan-300 font-orbitron">
                {activeGlossary.term}:{' '}
                <span className="text-white font-sans font-semibold">{activeGlossary.shortDef}</span>
              </div>
              <p className="text-xs text-indigo-100/90 mt-1 leading-relaxed font-sans">
                {activeGlossary.kidExplanation}
              </p>
              <div className="mt-1.5 text-[11px] font-mono-scifi text-emerald-300 bg-indigo-900/60 px-2 py-1 rounded border border-indigo-700/60">
                ★ NASA FACT: {activeGlossary.nasaFact}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* CENTER DIALOGUE SUBTITLE BOX & OUTCOME ALERT                 */}
      {/* ============================================================ */}
      <div className="my-auto max-w-3xl w-full mx-auto flex flex-col items-center py-2">
        <div className="w-full bg-slate-900/95 border-2 border-cyan-500/70 shadow-[0_0_35px_rgba(6,182,212,0.3)] rounded-2xl p-5 md:p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono-scifi mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{chapter.targetName.toUpperCase()}</span>
          </div>
          <p className="text-base md:text-lg font-sans font-medium text-slate-100 leading-relaxed">
            “{speakerText}”
          </p>

          {selectedOption && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono-scifi text-emerald-300 bg-emerald-950/60 border border-emerald-500/50 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{selectedOption.relationshipAlert}</span>
              </div>

              <button
                onClick={handleConfirmDecision}
                className={`cursor-pointer px-5 py-2.5 rounded-xl font-orbitron font-black text-xs md:text-sm tracking-wider shadow-lg transition-transform hover:scale-105 flex items-center gap-2 shrink-0 ${
                  selectedOption.triggersImmediateLaunch
                    ? 'bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                }`}
              >
                {selectedOption.triggersImmediateLaunch ? (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>INITIATE LAUNCH & BOARD ROCKET [ENTER] →</span>
                  </>
                ) : (
                  <span>CONFIRM DECISION & CONTINUE [ENTER] →</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM: DETROIT: BECOME HUMAN 4-CHOICE DIALOGUE WHEEL        */}
      {/* ============================================================ */}
      <div className="max-w-4xl w-full mx-auto pb-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 w-full items-center">
          {/* TOP (UP) OPTION: [▲ SCIENCE] */}
          <div className="md:col-start-2">
            {upQ && (
              <button
                onClick={() => handleSelectOption(upQ)}
                className={`cursor-pointer w-full text-left p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] flex items-start gap-2.5 ${
                  selectedOption?.direction === 'UP'
                    ? 'bg-cyan-950/90 border-cyan-300 text-white shadow-[0_0_24px_rgba(34,211,238,0.45)]'
                    : 'bg-slate-900/95 border-cyan-500/70 hover:border-cyan-300 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                }`}
              >
                <kbd className="px-2 py-1 bg-cyan-950 border border-cyan-500 rounded text-cyan-300 font-bold text-xs shrink-0 flex items-center gap-0.5">
                  <ArrowUp className="w-3.5 h-3.5" />
                </kbd>
                <div>
                  <div className="text-[11px] font-mono-scifi font-bold text-cyan-400 tracking-wider">
                    {upQ.categoryLabel}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-snug mt-0.5">
                    “{upQ.promptText}”
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* LEFT OPTION: [◄ EMPATHY] */}
          <div className="md:col-start-1 md:row-start-2">
            {leftQ && (
              <button
                onClick={() => handleSelectOption(leftQ)}
                className={`cursor-pointer w-full text-left p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] flex items-start gap-2.5 ${
                  selectedOption?.direction === 'LEFT'
                    ? 'bg-emerald-950/90 border-emerald-300 text-white shadow-[0_0_24px_rgba(16,185,129,0.45)]'
                    : 'bg-slate-900/95 border-emerald-500/70 hover:border-emerald-300 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
              >
                <kbd className="px-2 py-1 bg-emerald-950 border border-emerald-500 rounded text-emerald-300 font-bold text-xs shrink-0 flex items-center gap-0.5">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </kbd>
                <div>
                  <div className="text-[11px] font-mono-scifi font-bold text-emerald-400 tracking-wider">
                    {leftQ.categoryLabel}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-snug mt-0.5">
                    “{leftQ.promptText}”
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* CENTER DETROIT WHEEL HUB */}
          <div className="md:col-start-2 md:row-start-2 flex flex-col items-center justify-center py-1 text-center">
            <div className="px-4 py-2 rounded-full bg-slate-900/95 border border-amber-400/60 text-amber-300 font-orbitron font-bold text-xs tracking-wider shadow-[0_0_18px_rgba(245,158,11,0.25)]">
              {selectedOption
                ? `SELECTED: ${selectedOption.badgeText}`
                : 'CHOOSE COMMAND RESPONSE [▲ ◄ ► ▼]'}
            </div>
            <span className="text-[11px] font-mono-scifi text-slate-400 mt-1">
              Click any option or press Arrow Keys • Press [ENTER] to commit
            </span>
          </div>

          {/* RIGHT OPTION: [► PROTOCOL] */}
          <div className="md:col-start-3 md:row-start-2">
            {rightQ && (
              <button
                onClick={() => handleSelectOption(rightQ)}
                className={`cursor-pointer w-full text-left p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] flex items-start gap-2.5 ${
                  selectedOption?.direction === 'RIGHT'
                    ? 'bg-amber-950/90 border-amber-300 text-white shadow-[0_0_24px_rgba(245,158,11,0.45)]'
                    : 'bg-slate-900/95 border-amber-500/70 hover:border-amber-300 text-slate-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                }`}
              >
                <kbd className="px-2 py-1 bg-amber-950 border border-amber-500 rounded text-amber-300 font-bold text-xs shrink-0 flex items-center gap-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </kbd>
                <div>
                  <div className="text-[11px] font-mono-scifi font-bold text-amber-400 tracking-wider">
                    {rightQ.categoryLabel}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-snug mt-0.5">
                    “{rightQ.promptText}”
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* BOTTOM (DOWN) OPTION: [▼ RISK / BOLD] */}
          <div className="md:col-start-2 md:row-start-3">
            {downQ && (
              <button
                onClick={() => handleSelectOption(downQ)}
                className={`cursor-pointer w-full text-left p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] flex items-start gap-2.5 ${
                  selectedOption?.direction === 'DOWN'
                    ? 'bg-purple-950/90 border-purple-300 text-white shadow-[0_0_24px_rgba(192,132,252,0.45)]'
                    : 'bg-slate-900/95 border-purple-500/70 hover:border-purple-300 text-slate-100 shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                }`}
              >
                <kbd className="px-2 py-1 bg-purple-950 border border-purple-500 rounded text-purple-300 font-bold text-xs shrink-0 flex items-center gap-0.5">
                  <ArrowDown className="w-3.5 h-3.5" />
                </kbd>
                <div>
                  <div className="text-[11px] font-mono-scifi font-bold text-purple-400 tracking-wider">
                    {downQ.categoryLabel}
                  </div>
                  <div className="text-xs md:text-sm font-semibold leading-snug mt-0.5">
                    “{downQ.promptText}”
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
