import React, { useState } from 'react';
import { Destination } from '../3d/SpaceOrbitNav';
import { soundManager } from '../../utils/audio';
import {
  ShieldCheck,
  Zap,
  Activity,
  BatteryCharging,
  Globe,
  Radio,
  Sprout,
  Compass,
  ArrowRight,
  LogOut,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface CommandCenterUIProps {
  destination: Destination;
  onExitToSurface: () => void;
  onResetMission: () => void;
}

interface OutpostStats {
  sol: number;
  oxygen: number;
  power: number;
  water: number;
  hull: number;
  samples: number;
}

export const CommandCenterUI: React.FC<CommandCenterUIProps> = ({
  destination,
  onExitToSurface,
  onResetMission,
}) => {
  const isMoon = destination === 'MOON';

  // Turn-based survival outpost state
  const [stats, setStats] = useState<OutpostStats>({
    sol: 1,
    oxygen: 98,
    power: 95,
    water: 92,
    hull: 100,
    samples: 1,
  });

  const [logs, setLogs] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' }>>([
    {
      time: '08:00',
      text: isMoon
        ? 'Artemis Base Alpha pressurized habitat online. Regolith shielding nominal.'
        : 'Olympus Station Bio-dome environmental seals locked. Hydroponics operational.',
      type: 'success',
    },
    {
      time: '08:14',
      text: isMoon
        ? 'Earthrise telemetry link established via Lunar Gateway relay.'
        : 'Direct-to-Earth telemetry uplink synchronized (22-minute speed-of-light delay).',
      type: 'info',
    },
  ]);

  const addLog = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const time = `${String(Math.floor(Math.random() * 6) + 10).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
    setLogs((prev) => [{ time, text, type }, ...prev.slice(0, 7)]);
  };

  // Operation 1: Deploy Rover for Geological Survey
  const handleDeployRover = () => {
    if (stats.power < 12) {
      soundManager.playTelemetryChirp();
      addLog('INSUFFICIENT BATTERY: Solar array recharge required before rover dispatch.', 'warn');
      return;
    }
    soundManager.playTelemetryChirp();
    setStats((prev) => ({
      ...prev,
      power: Math.max(5, prev.power - 12),
      samples: prev.samples + 1,
    }));
    addLog(
      isMoon
        ? 'ROVER DISPATCH: Extracted rare Ilmenite & Anorthosite regolith sample from Shackleton rim.'
        : 'ROVER DISPATCH: Traversed basalt flows near Olympus Mons cliff; harvested volcanic silicate sample.',
      'success'
    );
  };

  // Operation 2: Run Core Drill
  const handleRunDrill = () => {
    if (stats.power < 15) {
      soundManager.playTelemetryChirp();
      addLog('INSUFFICIENT POWER: Deep drill requires 15% grid reserves.', 'warn');
      return;
    }
    soundManager.playTelemetryChirp();
    setStats((prev) => ({
      ...prev,
      power: Math.max(5, prev.power - 15),
      water: Math.min(100, prev.water + 10),
    }));
    addLog(
      isMoon
        ? 'CORE DRILL: Drilled 2.4m below permanently shadowed crater floor. Water-ice volatiles detected (+10% H2O).'
        : 'CORE DRILL: Drilled beneath Martian duricrust layer. Extracted sub-surface permafrost brine (+10% H2O).',
      'success'
    );
  };

  // Operation 3: Harvest Hydroponic Bio-Crops
  const handleHarvestCrops = () => {
    soundManager.playTelemetryChirp();
    setStats((prev) => ({
      ...prev,
      oxygen: Math.min(100, prev.oxygen + 8),
      water: Math.max(10, prev.water - 5),
    }));
    addLog('HYDROPONICS: Harvested microgreens & cyanobacteria batch. Oxygen scrubber efficiency restored (+8% O2).', 'success');
  };

  // Operation 4: Uplink Telemetry to Houston
  const handleUplink = () => {
    soundManager.playTelemetryChirp();
    setStats((prev) => ({
      ...prev,
      power: Math.max(5, prev.power - 6),
    }));
    addLog(
      isMoon
        ? 'GATEWAY UPLINK: Transmitted 48 Gb geological survey package to NASA Houston. Signal strength 99.4%.'
        : 'DEEP SPACE NETWORK: 34m Goldstone dish received Martian atmospheric pressure data packet.',
      'info'
    );
  };

  // Advance Sol Turn (Turn-based progression Sol 1 of 7)
  const handleAdvanceSol = () => {
    soundManager.playTelemetryChirp();
    const nextSol = Math.min(7, stats.sol + 1);

    // Daily consumption & solar recharge
    const solarBoost = isMoon ? 18 : 14;
    const oxygenDrain = 10;
    const waterDrain = 8;

    const newOxygen = Math.max(15, stats.oxygen - oxygenDrain);
    const newPower = Math.min(100, Math.max(20, stats.power + solarBoost - 10));
    const newWater = Math.max(15, stats.water - waterDrain);

    setStats((prev) => ({
      ...prev,
      sol: nextSol,
      oxygen: newOxygen,
      power: newPower,
      water: newWater,
    }));

    addLog(
      `SOL ${nextSol} COMMENCED: Rest cycle concluded. Solar arrays realigned to morning terminator.`,
      'info'
    );

    if (nextSol === 7) {
      addLog('MISSION MILESTONE: Sol 7 reached! Expedition primary objectives 100% completed!', 'success');
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-auto flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md z-30 font-rajdhani select-none animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-slate-900/95 border-2 border-cyan-400 shadow-[0_0_45px_rgba(6,182,212,0.45)] rounded-2xl p-5 md:p-6 flex flex-col justify-between max-h-[92vh] overflow-y-auto">
        {/* ============================================================ */}
        {/* TOP BAR: Header & Sol Badge                                  */}
        {/* ============================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-cyan-900/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isMoon ? 'bg-cyan-500/20 border-cyan-400' : 'bg-orange-500/20 border-orange-400'}`}>
              <Globe className={`w-6 h-6 ${isMoon ? 'text-cyan-400' : 'text-orange-400'}`} />
            </div>
            <div>
              <div className="font-orbitron font-extrabold text-lg sm:text-xl text-slate-100 tracking-wider">
                {isMoon ? 'ARTEMIS BASE ALPHA' : 'OLYMPUS STATION'}
              </div>
              <div className="text-xs font-mono-scifi text-slate-400 flex items-center gap-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> PRESSURIZED COMMAND MODULE
                </span>
                <span>•</span>
                <span>{isMoon ? 'LUNAR SOUTH POLE (0.166 G)' : 'THARSIS VOLCANIC PLATEAU (0.38 G)'}</span>
              </div>
            </div>
          </div>

          {/* Sol Badge */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-cyan-500/40 px-4 py-2 rounded-xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono-scifi text-slate-400">EXPEDITION CYCLE</span>
              <span className="font-orbitron font-black text-amber-300 text-lg">
                SOL {stats.sol} OF 7
              </span>
            </div>
            <button
              onClick={handleAdvanceSol}
              disabled={stats.sol >= 7}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 ${
                stats.sol >= 7
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
              }`}
              title="Advance Sol / Rest Cycle"
            >
              <span>ADVANCE SOL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* VITAL LIFE SUPPORT & POWER METRICS GAUGES                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {/* Oxygen */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-mono-scifi text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-cyan-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> OXYGEN (O₂)
              </span>
              <span className="font-bold text-slate-200">{stats.oxygen}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${stats.oxygen > 30 ? 'bg-cyan-400' : 'bg-red-500 animate-pulse'}`}
                style={{ width: `${stats.oxygen}%` }}
              />
            </div>
          </div>

          {/* Power Grid */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-mono-scifi text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-amber-300">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> POWER GRID
              </span>
              <span className="font-bold text-slate-200">{stats.power}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${stats.power > 25 ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`}
                style={{ width: `${stats.power}%` }}
              />
            </div>
          </div>

          {/* Water Recycling */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-mono-scifi text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-blue-300">
                <BatteryCharging className="w-3.5 h-3.5 text-blue-400" /> WATER H₂O
              </span>
              <span className="font-bold text-slate-200">{stats.water}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-400 h-full transition-all duration-300"
                style={{ width: `${stats.water}%` }}
              />
            </div>
          </div>

          {/* Science Samples */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs font-mono-scifi text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> SAMPLES
              </span>
              <span className="font-bold text-emerald-300">{stats.samples} CANISTERS</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, stats.samples * 20)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* OUTPOST OPERATIONS COMMANDS (TURN-BASED ACTIONS)             */}
        {/* ============================================================ */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-mono-scifi text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> OUTPOST OPERATIONS & RESEARCH DIRECTIVES:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Action 1: Rover Dispatch */}
            <button
              onClick={handleDeployRover}
              className="cursor-pointer bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 p-3 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-xs text-slate-200 group-hover:text-cyan-300">
                    Deploy Exploration Rover
                  </div>
                  <div className="text-[10px] font-mono-scifi text-slate-400">
                    Harvest surface mineral regolith (+1 Sample, -12% Battery)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono-scifi bg-slate-800 px-2 py-1 rounded text-cyan-300">EXEC</span>
            </button>

            {/* Action 2: Deep Core Drill */}
            <button
              onClick={handleRunDrill}
              className="cursor-pointer bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 p-3 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 group-hover:scale-105 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-xs text-slate-200 group-hover:text-blue-300">
                    Run Sub-Surface Core Drill
                  </div>
                  <div className="text-[10px] font-mono-scifi text-slate-400">
                    Extract sub-surface permafrost ice (+10% Water, -15% Power)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono-scifi bg-slate-800 px-2 py-1 rounded text-blue-300">EXEC</span>
            </button>

            {/* Action 3: Harvest Hydroponics */}
            <button
              onClick={handleHarvestCrops}
              className="cursor-pointer bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 p-3 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-xs text-slate-200 group-hover:text-emerald-300">
                    Harvest Hydroponic Bio-Crops
                  </div>
                  <div className="text-[10px] font-mono-scifi text-slate-400">
                    Replenish nutrient scrubbers (+8% O2, -5% Water)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono-scifi bg-slate-800 px-2 py-1 rounded text-emerald-300">EXEC</span>
            </button>

            {/* Action 4: Uplink Telemetry */}
            <button
              onClick={handleUplink}
              className="cursor-pointer bg-slate-950/80 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-400 p-3 rounded-xl flex items-center justify-between text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400 group-hover:scale-105 transition-transform">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-orbitron font-bold text-xs text-slate-200 group-hover:text-indigo-300">
                    Satellite Telemetry Uplink
                  </div>
                  <div className="text-[10px] font-mono-scifi text-slate-400">
                    Transmit research telemetry to Houston / JPL (-6% Power)
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono-scifi bg-slate-800 px-2 py-1 rounded text-indigo-300">EXEC</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MISSION TELEMETRY LOG TERMINAL FEED                          */}
        {/* ============================================================ */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 mb-4">
          <div className="text-[11px] font-mono-scifi text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            TELEMETRY FEED & MISSION LOG:
          </div>
          <div className="space-y-1.5 text-xs font-mono-scifi max-h-24 overflow-y-auto">
            {logs.map((lg, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500">[{lg.time}]</span>
                <span
                  className={
                    lg.type === 'success'
                      ? 'text-emerald-300 font-semibold'
                      : lg.type === 'warn'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }
                >
                  {lg.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM NAVIGATION ACTIONS                                    */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onExitToSurface}
            className="cursor-pointer px-5 py-2.5 rounded-xl font-orbitron font-extrabold text-xs md:text-sm tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>EXIT AIRLOCK TO SURFACE EXPLORATION [E]</span>
          </button>

          <button
            onClick={onResetMission}
            className="cursor-pointer px-4 py-2 rounded-xl font-mono-scifi text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RETURN TO EARTH LAUNCHPAD</span>
          </button>
        </div>
      </div>
    </div>
  );
};
