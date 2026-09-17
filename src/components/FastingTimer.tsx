import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Clock,
  Flame,
  BatteryCharging,
  Trophy,
  Activity,
  Dna,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  Droplets,
  ShieldCheck,
  Microscope,
  ArrowRight,
  RotateCcw,
  Edit3,
  Calendar,
  X,
  AlertCircle,
} from 'lucide-react';
import { FastingProtocol, FastingStage, UserProfile } from '../types';
import { FASTING_PROTOCOLS, FASTING_STAGES } from '../constants';
import confetti from 'canvas-confetti';

interface FastingTimerProps {
  currentUser: UserProfile | null;
  onStartFast: (protocol: string, targetHours: number, customStartTime?: string) => Promise<void>;
  onEndFast: (
    notes?: string,
    mood?: string,
    customEndTime?: string,
    customStartTime?: string
  ) => Promise<void>;
  onUpdateFastStartTime?: (newStartTime: string) => Promise<void>;
  onOpenAdvisor: () => void;
  selectedProtocol: FastingProtocol;
  onSelectProtocol: (p: FastingProtocol) => void;
}

const toLocalDatetimeInput = (dateInput: string | Date = new Date()): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export const FastingTimer: React.FC<FastingTimerProps> = ({
  currentUser,
  onStartFast,
  onEndFast,
  onUpdateFastStartTime,
  onOpenAdvisor,
  selectedProtocol,
  onSelectProtocol,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [mood, setMood] = useState<string>('Energetic');
  const [notes, setNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Editing active fast start time
  const [isEditingActiveStart, setIsEditingActiveStart] = useState<boolean>(false);
  const [activeStartInput, setActiveStartInput] = useState<string>('');

  // Setting custom start time before starting
  const [isSettingCustomStart, setIsSettingCustomStart] = useState<boolean>(false);
  const [customStartInput, setCustomStartInput] = useState<string>('');

  // End fast modal start & end inputs
  const [finishStartInput, setFinishStartInput] = useState<string>('');
  const [finishEndInput, setFinishEndInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Inspected phase for the scientific explanation box
  const [inspectedStageIndex, setInspectedStageIndex] = useState<number | null>(null);

  const isFasting = Boolean(currentUser?.activeFastStartedAt);
  const startTime = currentUser?.activeFastStartedAt ? new Date(currentUser.activeFastStartedAt) : null;
  const targetHours = currentUser?.activeFastTargetHours || selectedProtocol.fastingHours;

  // Real-time ticking timer
  useEffect(() => {
    if (!isFasting || !startTime) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diffSecs = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isFasting, startTime]);

  const elapsedHours = elapsedSeconds / 3600;
  const progressPercent = Math.min(100, Math.round((elapsedHours / (targetHours || 16)) * 100));

  // Determine current physiological stage
  const currentStage: FastingStage = [...FASTING_STAGES]
    .reverse()
    .find((s) => elapsedHours >= s.hours) || FASTING_STAGES[0];

  const currentStageIndex = FASTING_STAGES.findIndex(
    (s) => s.phaseNumber === currentStage.phaseNumber
  );

  // Active stage displayed in the scientific box (inspected or currently active)
  const displayedStageIndex =
    inspectedStageIndex !== null ? inspectedStageIndex : Math.max(0, currentStageIndex);
  const displayedStage = FASTING_STAGES[displayedStageIndex] || currentStage;
  const isInspectingActiveStage =
    isFasting && displayedStage.phaseNumber === currentStage.phaseNumber;

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const customIso = isSettingCustomStart && customStartInput
        ? new Date(customStartInput).toISOString()
        : undefined;
      await onStartFast(selectedProtocol.name, targetHours, customIso);
      setInspectedStageIndex(null); // Snap back to live stage
      setIsSettingCustomStart(false);
      setCustomStartInput('');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEndFastModal = () => {
    if (startTime) {
      setFinishStartInput(toLocalDatetimeInput(startTime));
    } else {
      setFinishStartInput(toLocalDatetimeInput(new Date(Date.now() - 16 * 3600 * 1000)));
    }
    setFinishEndInput(toLocalDatetimeInput(new Date()));
    setModalError(null);
    setIsEnding(true);
  };

  // Calculations for End Fast Modal
  const modalStartMs = finishStartInput ? new Date(finishStartInput).getTime() : 0;
  const modalEndMs = finishEndInput ? new Date(finishEndInput).getTime() : 0;
  const modalDurationHours =
    modalStartMs && modalEndMs && modalEndMs > modalStartMs
      ? Number(((modalEndMs - modalStartMs) / (1000 * 3600)).toFixed(1))
      : 0;
  const modalHitGoal = modalDurationHours >= targetHours;

  const handleFinishConfirm = async () => {
    if (!finishStartInput || !finishEndInput) {
      setModalError('Please ensure start and end times are set.');
      return;
    }
    if (new Date(finishEndInput).getTime() <= new Date(finishStartInput).getTime()) {
      setModalError('End time must be after the start time.');
      return;
    }

    setActionLoading(true);
    setModalError(null);
    try {
      if (progressPercent >= 100 || modalHitGoal) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      const startIso = new Date(finishStartInput).toISOString();
      const endIso = new Date(finishEndInput).toISOString();
      await onEndFast(notes, mood, endIso, startIso);
      setIsEnding(false);
      setNotes('');
      setInspectedStageIndex(null);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save fast record.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditActiveStart = () => {
    if (startTime) {
      setActiveStartInput(toLocalDatetimeInput(startTime));
    }
    setIsEditingActiveStart(true);
  };

  const handleSaveActiveStart = async () => {
    if (!activeStartInput || !onUpdateFastStartTime) return;
    setActionLoading(true);
    try {
      await onUpdateFastStartTime(new Date(activeStartInput).toISOString());
      setIsEditingActiveStart(false);
    } finally {
      setActionLoading(false);
    }
  };

  // Circular ring geometry calculations
  // Max scale is either targetHours or 24 if target is smaller, so phases fit naturally
  const ringScaleHours = Math.max(targetHours, 16);
  const circumference = 2 * Math.PI * 42; // ~263.89

  return (
    <div className="space-y-6">
      {/* Main Timer Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Background soft glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Protocol selection row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 relative z-10">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fasting Protocol
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-bold text-white">
                {isFasting ? (currentUser?.protocol || selectedProtocol.name) : selectedProtocol.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20 font-medium">
                {targetHours}h Target
              </span>
            </div>
          </div>

          {!isFasting && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdvisor}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Advisor</span>
              </button>
              <select
                value={selectedProtocol.id}
                onChange={(e) => {
                  const found = FASTING_PROTOCOLS.find((p) => p.id === e.target.value);
                  if (found) onSelectProtocol(found);
                }}
                className="bg-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-emerald-500 transition"
              >
                {FASTING_PROTOCOLS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.fastingHours}h)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Circular Progress & Timer with Integrated Phase Ring Markers */}
        <div className="flex flex-col items-center justify-center my-4 relative z-10">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Outer background track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="#1e293b"
                strokeWidth="6"
              />

              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke={
                  progressPercent >= 100
                    ? '#10b981'
                    : isFasting
                    ? displayedStage.ringColor || '#06b6d4'
                    : '#334155'
                }
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (circumference * Math.min(100, progressPercent)) / 100}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />

              {/* Phase milestone markers on circumference */}
              {FASTING_STAGES.filter((s) => s.hours <= ringScaleHours).map((stage, idx) => {
                const fraction = stage.hours / ringScaleHours;
                const angleDeg = fraction * 360;
                const angleRad = (angleDeg * Math.PI) / 180;
                // Coordinates on radius 42
                const mx = 50 + 42 * Math.cos(angleRad);
                const my = 50 + 42 * Math.sin(angleRad);

                const isCompleted = isFasting && elapsedHours >= stage.hours;
                const isCurrent = isFasting && stage.phaseNumber === currentStage.phaseNumber;
                const isSelected = stage.phaseNumber === displayedStage.phaseNumber;

                return (
                  <g
                    key={stage.phaseNumber}
                    className="cursor-pointer"
                    onClick={() => setInspectedStageIndex(idx)}
                  >
                    {/* Pulsing ring for active current stage */}
                    {isCurrent && (
                      <circle
                        cx={mx}
                        cy={my}
                        r="3.8"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    )}
                    {/* Node marker */}
                    <circle
                      cx={mx}
                      cy={my}
                      r={isSelected || isCurrent ? 2.8 : 2}
                      fill={
                        isCompleted
                          ? '#10b981'
                          : isCurrent
                          ? '#38bdf8'
                          : isSelected
                          ? '#a855f7'
                          : '#475569'
                      }
                      stroke="#0f172a"
                      strokeWidth="0.8"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Center details inside circular timer */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
              {isFasting ? (
                <>
                  {/* Active phase badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold mb-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      Phase {currentStage.phaseNumber}: {currentStage.title}
                    </span>
                  </div>

                  {/* Digital Clock */}
                  <div className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white drop-shadow-sm my-0.5">
                    {formatTime(elapsedSeconds)}
                  </div>

                  {/* Progress info */}
                  <div className="text-xs text-slate-300 font-medium mt-0.5">
                    {progressPercent}% of {targetHours}h goal
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {elapsedHours >= targetHours ? (
                      <span className="text-emerald-400 font-bold">Goal achieved! Fasting bonus</span>
                    ) : (
                      <>
                        Remaining:{' '}
                        <strong className="text-slate-200">
                          {Math.max(0, targetHours - Math.floor(elapsedHours))}h{' '}
                          {Math.max(0, 59 - Math.floor((elapsedSeconds % 3600) / 60))}m
                        </strong>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-9 h-9 text-slate-500 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-white">Ready to Fast</div>
                  <div className="text-xs text-slate-400 mt-1 max-w-[150px]">
                    Target: {targetHours}h fasting ({selectedProtocol.eatingHours}h eating window)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Controls & Fast Edit Helpers */}
          <div className="relative z-10 mt-5 flex flex-col items-center w-full max-w-sm">
            {!isFasting ? (
              <div className="w-full space-y-2">
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="w-full px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>Start {targetHours}-Hour Fast</span>
                </button>

                {/* Optional: Started earlier helper */}
                {!isSettingCustomStart ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingCustomStart(true);
                        setCustomStartInput(toLocalDatetimeInput(new Date()));
                      }}
                      className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition inline-flex items-center gap-1.5 py-1"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Started earlier? Set custom start time</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-left w-full shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>When did you begin fasting?</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSettingCustomStart(false)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="datetime-local"
                      value={customStartInput}
                      onChange={(e) => setCustomStartInput(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />

                    {/* Quick shortcuts */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCustomStartInput(toLocalDatetimeInput(new Date(Date.now() - 30 * 60 * 1000)))
                        }
                        className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg shrink-0 transition"
                      >
                        -30m
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomStartInput(toLocalDatetimeInput(new Date(Date.now() - 60 * 60 * 1000)))
                        }
                        className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg shrink-0 transition"
                      >
                        -1h
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomStartInput(
                            toLocalDatetimeInput(new Date(Date.now() - 2 * 60 * 60 * 1000))
                          )
                        }
                        className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg shrink-0 transition"
                      >
                        -2h
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date();
                          y.setDate(y.getDate() - 1);
                          y.setHours(20, 0, 0, 0);
                          setCustomStartInput(toLocalDatetimeInput(y));
                        }}
                        className="text-[10px] px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg shrink-0 transition"
                      >
                        Yesterday 8 PM
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full space-y-2.5">
                <button
                  onClick={openEndFastModal}
                  className="w-full px-8 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-base rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition active:scale-95"
                >
                  <Square className="w-5 h-5 fill-rose-300" />
                  <span>End Fast & Record</span>
                </button>

                {/* Active Fast Start Info & Edit Button */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs">
                  <span className="text-slate-400">
                    Started:{' '}
                    <strong className="text-slate-200">
                      {startTime?.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      at {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={openEditActiveStart}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition"
                    title="Change start time for this active fast"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Start</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phases Tracker Ribbon / Stepper on the Timer */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Fasting Phases Timeline
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {isFasting
                ? `Currently in Phase ${currentStage.phaseNumber} (${elapsedHours.toFixed(1)}h elapsed)`
                : 'Click any phase to preview scientific details'}
            </span>
          </div>

          {/* Horizontal Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {FASTING_STAGES.map((stage, idx) => {
              const isCompleted = isFasting && elapsedHours >= (stage.endHours || stage.hours);
              const isCurrent = isFasting && stage.phaseNumber === currentStage.phaseNumber;
              const isSelected = idx === displayedStageIndex;

              return (
                <button
                  key={stage.phaseNumber}
                  type="button"
                  onClick={() => setInspectedStageIndex(idx)}
                  className={`p-2.5 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                      : isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : isCompleted
                      ? 'bg-slate-800/60 border-slate-700/80 text-slate-300'
                      : 'bg-slate-800/30 border-slate-800/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {/* Top indicators */}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950'
                          : isSelected
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      P{stage.phaseNumber}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      {stage.hours}h{stage.endHours ? `–${stage.endHours}h` : '+'}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="font-semibold text-xs text-white leading-tight truncate">
                    {stage.title}
                  </div>

                  {/* Status chip */}
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                    {isCurrent ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Active</span>
                      </span>
                    ) : isCompleted ? (
                      <span className="text-teal-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Passed</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Upcoming</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SCIENTIFIC EXPLANATION BOX: What Happens During This Phase */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle accent header line */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Microscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Scientific Phase Analysis</h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    isInspectingActiveStage
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : isFasting && displayedStage.hours <= elapsedHours
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {isInspectingActiveStage ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Currently Active Phase</span>
                    </>
                  ) : isFasting && displayedStage.hours <= elapsedHours ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-teal-400" />
                      <span>Phase Completed</span>
                    </>
                  ) : (
                    <span>Phase {displayedStage.phaseNumber} Preview</span>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Detailed cellular, hormonal, and metabolic breakdown of what occurs in your body.
              </p>
            </div>
          </div>

          {/* Phase Switcher Navigation */}
          <div className="flex items-center gap-2">
            {inspectedStageIndex !== null && inspectedStageIndex !== currentStageIndex && isFasting && (
              <button
                onClick={() => setInspectedStageIndex(null)}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Jump to Active (P{currentStage.phaseNumber})</span>
              </button>
            )}

            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
              <button
                disabled={displayedStageIndex === 0}
                onClick={() => setInspectedStageIndex(Math.max(0, displayedStageIndex - 1))}
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Previous phase"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-200 px-2">
                {displayedStageIndex + 1} / {FASTING_STAGES.length}
              </span>
              <button
                disabled={displayedStageIndex === FASTING_STAGES.length - 1}
                onClick={() =>
                  setInspectedStageIndex(
                    Math.min(FASTING_STAGES.length - 1, displayedStageIndex + 1)
                  )
                }
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Next phase"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Phase Header Card */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Phase {displayedStage.phaseNumber} • Hours {displayedStage.hours}
                  {displayedStage.endHours ? ` to ${displayedStage.endHours}` : '+'}
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mt-1">{displayedStage.title}</h4>
              <p className="text-xs font-mono text-cyan-300/90 mt-0.5">
                Physiological state: <em>{displayedStage.scientificName}</em>
              </p>
            </div>

            <div className="px-3 py-1.5 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Primary Benefit: {displayedStage.benefit}</span>
            </div>
          </div>

          {/* Deep Scientific Explanation Narrative */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Dna className="w-3.5 h-3.5 text-emerald-400" />
              <span>What Happens Inside Your Body (Scientific Mechanism)</span>
            </h5>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {displayedStage.scientificExplanation}
            </p>
          </div>
        </div>

        {/* Hormonal & Biomarker Telemetry Grid */}
        <div className="mb-5">
          <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Hormonal & Biomarker Dynamics</span>
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Insulin */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Insulin Level</span>
                <span className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-white">
                {displayedStage.hormoneEffects.insulin}
              </div>
            </div>

            {/* Glucagon */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Glucagon</span>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-white">
                {displayedStage.hormoneEffects.glucagon}
              </div>
            </div>

            {/* Ketones */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Ketones (BHB)</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-white">
                {displayedStage.hormoneEffects.ketones}
              </div>
            </div>

            {/* Growth Hormone */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Growth Hormone (HGH)</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-white">
                {displayedStage.hormoneEffects.growthHormone}
              </div>
            </div>

            {/* Autophagy */}
            <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>Autophagy Status</span>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
              </div>
              <div className="mt-1 text-xs font-bold text-white">
                {displayedStage.hormoneEffects.autophagy}
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Active Cellular Pathways + Doctor's Physiological Tip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Cellular Processes */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Cellular Pathways</span>
            </h5>
            <ul className="space-y-1.5">
              {displayedStage.cellularProcesses.map((proc, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{proc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Physiological Tip & Practical Guidance */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Physiological Guidance For This Phase</span>
              </h5>
              <p className="text-xs text-slate-200 leading-relaxed">
                {displayedStage.physiologicalTip}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hydration with minerals supports optimal cellular signaling.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End Fast Modal Confirmation with Editable Start & End Times */}
      {isEnding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setIsEnding(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Finish Your Fast</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Review and adjust your start and end times before recording your session.
            </p>

            {modalError && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* Start Date & Time input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={finishStartInput}
                  onChange={(e) => setFinishStartInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* End Date & Time input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={finishEndInput}
                  onChange={(e) => setFinishEndInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Recalculated duration & goal indicator */}
              <div className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Calculated Duration
                  </div>
                  <div className="text-lg font-mono font-bold text-white mt-0.5">
                    {modalDurationHours > 0 ? `${modalDurationHours.toFixed(1)} hours` : 'Invalid interval'}
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    modalHitGoal
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {modalHitGoal ? '🏆 Target Achieved' : `Target: ${targetHours}h`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  How did you feel during this fast?
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Energetic', 'Focused', 'Normal', 'Challenged'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`py-2 text-xs rounded-xl border font-medium transition ${
                        mood === m
                          ? 'border-emerald-500 bg-emerald-500/20 text-white font-bold'
                          : 'border-slate-800 bg-slate-800/50 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reflection Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Drank lots of green tea, felt sharp during morning meetings."
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEnding(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition"
                >
                  Keep Fasting
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleFinishConfirm}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Trophy className="w-4 h-4" />
                  <span>{actionLoading ? 'Saving...' : 'Save & Record'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Active Fast Start Time Modal */}
      {isEditingActiveStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Edit3 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-base text-white">Edit Fast Start Time</h4>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Adjust when your current fast actually started. The timer and physiological phases will update immediately.
            </p>

            <input
              type="datetime-local"
              value={activeStartInput}
              onChange={(e) => setActiveStartInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />

            {/* Quick offset presets */}
            <div className="grid grid-cols-4 gap-1.5 my-3">
              <button
                type="button"
                onClick={() =>
                  setActiveStartInput(toLocalDatetimeInput(new Date(Date.now() - 30 * 60 * 1000)))
                }
                className="text-[11px] py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-center transition"
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStartInput(toLocalDatetimeInput(new Date(Date.now() - 60 * 60 * 1000)))
                }
                className="text-[11px] py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-center transition"
              >
                -1h
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveStartInput(
                    toLocalDatetimeInput(new Date(Date.now() - 2 * 60 * 60 * 1000))
                  )
                }
                className="text-[11px] py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-center transition"
              >
                -2h
              </button>
              <button
                type="button"
                onClick={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  y.setHours(20, 0, 0, 0);
                  setActiveStartInput(toLocalDatetimeInput(y));
                }}
                className="text-[11px] py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-center transition"
              >
                Yest. 8pm
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end mt-4 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingActiveStart(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || !activeStartInput}
                onClick={handleSaveActiveStart}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl transition disabled:opacity-50"
              >
                {actionLoading ? 'Updating...' : 'Update Start Time'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
