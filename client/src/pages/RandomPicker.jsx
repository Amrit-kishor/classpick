import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dices,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Users,
  Sparkles,
  ChevronDown,
  Info,
  CheckCircle,
} from 'lucide-react';
import { selectionService } from '../services/selectionService';
import { classroomService } from '../services/classroomService';
import { PollAnimationStage } from '../components/PollAnimationStage';
import { useSound } from '../context/SoundContext';

export const RandomPicker = ({ initialClassroomId }) => {
  const {
    soundEnabled,
    toggleSound,
    volume,
    setVolume,
    startPollingAudio,
    stopPollingAudio,
    playSuccessChime,
    playErrorSound,
  } = useSound();

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState(initialClassroomId || '');
  const [classroomData, setClassroomData] = useState(null);
  const [students, setStudents] = useState([]);
  const [roundState, setRoundState] = useState(null);

  // Robust Selection Lifecycle: 'idle' | 'polling' | 'selected' | 'error' | 'cancelled'
  const [mode, setMode] = useState('random'); // 'random' | 'fair_round'
  const [selectionStatus, setSelectionStatus] = useState('idle');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isPolling = selectionStatus === 'polling';
  const currentRequestIdRef = useRef(0);
  const minSuspenseTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Guarantee clean shutdown of timers and audio on unmount
  useEffect(() => {
    return () => {
      currentRequestIdRef.current++;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (minSuspenseTimerRef.current) {
        clearTimeout(minSuspenseTimerRef.current);
      }
      stopPollingAudio();
    };
  }, [stopPollingAudio]);

  // Load classrooms on mount
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const res = await classroomService.getAll();
        setClassrooms(res.data);
        if (!selectedClassroomId && res.data.length > 0) {
          setSelectedClassroomId(res.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchClassrooms();
  }, []);

  // Update if initial prop changes
  useEffect(() => {
    if (initialClassroomId) {
      setSelectedClassroomId(initialClassroomId);
    }
  }, [initialClassroomId]);

  // Load selection status for active classroom
  const loadClassroomStatus = useCallback(async () => {
    if (!selectedClassroomId) return;
    try {
      const res = await selectionService.getStatus(selectedClassroomId);
      setClassroomData(res.classroom);
      setStudents(res.students);
      setRoundState(res.round);
      if (res.round?.lastSelectedStudent && !selectedStudent) {
        setSelectedStudent(res.round.lastSelectedStudent);
        setSelectionStatus('selected');
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [selectedClassroomId]);

  useEffect(() => {
    loadClassroomStatus();
  }, [loadClassroomStatus]);

  // Handle Pick a Student with robust lifecycle and exact audio synchronization
  const handleDraw = async () => {
    if (selectionStatus === 'polling') return; // Strict lock against rapid double-clicks
    if (students.length === 0) {
      setSelectionStatus('error');
      setError('Cannot pick: No active students in this classroom roster.');
      return;
    }

    if (mode === 'fair_round' && roundState?.isCompleted) {
      setSelectionStatus('error');
      setError('All students have been selected in this round! Please click "Reset Round" to start a fresh cycle.');
      return;
    }

    // Cancel previous pending timers or inflight abort controllers
    if (minSuspenseTimerRef.current) {
      clearTimeout(minSuspenseTimerRef.current);
      minSuspenseTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const requestId = ++currentRequestIdRef.current;
    setError(null);
    setSelectedStudent(null);
    setSelectionStatus('polling');

    // 1. Start electronic startup tone and suspense loop immediately
    startPollingAudio();

    try {
      // 2. Minimum visual suspense duration so user sees animation even on fast LAN/localhost
      const minSuspensePromise = new Promise((resolve) => {
        minSuspenseTimerRef.current = setTimeout(resolve, 1800);
      });

      // 3. Authoritative cryptographic backend selection call
      const apiPromise = selectionService.drawStudent(selectedClassroomId, mode, {
        signal: abortController.signal,
      });

      // 4. Await BOTH: does NOT assume API completed at a fixed timeout.
      // If network takes 3s, suspense audio continues playing until API finishes!
      const [_, res] = await Promise.all([minSuspensePromise, apiPromise]);

      // If user cancelled, classroom changed, or newer request fired, discard
      if (requestId !== currentRequestIdRef.current) return;

      if (!res || !res.selectedStudent) {
        throw new Error('Invalid selection response from server.');
      }

      // 5. Commit authoritative state
      setSelectedStudent(res.selectedStudent);
      if (res.roundInfo) {
        setRoundState((prev) => ({
          ...prev,
          ...res.roundInfo,
        }));
      }
      setSelectionStatus('selected');

      // 6. Stop suspense audio immediately and play confirmation chime exactly once
      stopPollingAudio();
      playSuccessChime();
    } catch (err) {
      if (requestId !== currentRequestIdRef.current) return;
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      stopPollingAudio();
      playErrorSound();
      setSelectionStatus('error');
      setError(err.message || 'Selection failed. Please try again.');
    }
  };

  // Handle Explicit Cancellation
  const handleCancel = () => {
    if (selectionStatus !== 'polling') return;
    currentRequestIdRef.current++;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (minSuspenseTimerRef.current) {
      clearTimeout(minSuspenseTimerRef.current);
      minSuspenseTimerRef.current = null;
    }
    stopPollingAudio();
    setSelectionStatus('cancelled');
    setError(null);
  };

  // Handle Classroom Change
  const handleClassroomChange = (newId) => {
    if (selectionStatus === 'polling') {
      handleCancel();
    }
    setSelectedClassroomId(newId);
    setSelectedStudent(null);
    setSelectionStatus('idle');
    setError(null);
  };

  // Handle Reset Round for Fair Round Mode
  const handleResetRound = async () => {
    handleCancel();
    stopPollingAudio();
    try {
      const res = await selectionService.resetRound(selectedClassroomId);
      setRoundState(res.round);
      setSelectedStudent(null);
      setSelectionStatus('idle');
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Keyboard shortcut listener for Fullscreen toggle and spacebar draw
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const activeCount = students.length;
  const currentClassroom = classrooms.find((c) => c._id === selectedClassroomId);

  return (
    <div
      className={`space-y-6 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-white p-6 sm:p-12 overflow-y-auto flex flex-col justify-between'
          : 'animate-in fade-in duration-300'
      }`}
    >
      {/* Control Header & Settings */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Classroom Selector */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-100 dark:border-brand-900/60">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Classroom Selection
              </label>
              <div className="relative mt-0.5">
                <select
                  value={selectedClassroomId}
                  onChange={(e) => handleClassroomChange(e.target.value)}
                  disabled={isPolling}
                  className="appearance-none pr-8 py-1 bg-transparent font-bold text-base text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {classrooms.map((c) => (
                    <option key={c._id} value={c._id} className="dark:bg-navy-900 dark:text-white">
                      {c.name} — {c.subject}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Mode Switcher & Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Toggle */}
            <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('random')}
                disabled={isPolling}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  mode === 'random'
                    ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Random Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('fair_round')}
                disabled={isPolling}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  mode === 'fair_round'
                    ? 'bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Fair Round Mode
              </button>
            </div>

            {/* Audio Controls: Mute/Unmute & Volume Slider */}
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-950">
              <button
                type="button"
                onClick={toggleSound}
                id="picker-sound-toggle-btn"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors ${
                  soundEnabled
                    ? 'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  id="picker-volume-slider"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  disabled={!soundEnabled}
                  aria-label="Selection sound volume"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                  className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-30"
                />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-7">
                  {soundEnabled ? `${Math.round(volume * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Projector Fullscreen Mode */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              id="btn-toggle-fullscreen"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Classroom Projector Fullscreen Mode"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Projector Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mode Information & Fair Round Progress */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <span>
              {mode === 'random'
                ? 'Random Mode: Independent uniform probability with replacement. Any active student may be picked repeatedly.'
                : 'Fair Round Mode: Without replacement. Guarantees every active student is selected once before round repeats.'}
            </span>
          </div>

          <div className="flex items-center gap-3 font-semibold text-slate-700 dark:text-slate-300">
            <span>Roster: {activeCount} active eligible</span>
          </div>
        </div>
      </div>

      {/* FAIR ROUND PROGRESS BAR (When in Fair Round Mode) */}
      {mode === 'fair_round' && roundState && (
        <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold uppercase tracking-wider border border-brand-500/20">
                Round #{roundState.roundNumber}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {roundState.selectedCount} of {roundState.totalEligible || activeCount} Selected
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {roundState.remainingCount} remaining
              </span>
              <button
                onClick={handleResetRound}
                disabled={isPolling}
                id="btn-reset-round"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Round</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${
                  roundState.totalEligible > 0
                    ? (roundState.selectedCount / roundState.totalEligible) * 100
                    : 0
                }%`,
              }}
            />
          </div>

          {roundState.isCompleted && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Round completed! All active students have been selected.
              </span>
              <button
                onClick={handleResetRound}
                className="underline font-bold hover:text-emerald-900"
              >
                Start Next Round
              </button>
            </div>
          )}
        </div>
      )}

      {/* CORE ANIMATION & SELECTION STAGE */}
      <PollAnimationStage
        status={selectionStatus}
        isPolling={isPolling}
        selectedStudent={selectedStudent}
        candidateStudents={students}
        error={error}
        onRetry={handleDraw}
        onCancel={handleCancel}
        classroomName={classroomData?.name || currentClassroom?.name}
      />

      {/* PRIMARY ACTION BUTTON */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={handleDraw}
          disabled={isPolling || activeCount === 0 || (mode === 'fair_round' && roundState?.isCompleted)}
          id="btn-pick-student"
          className={`w-full sm:w-auto min-w-[240px] px-8 py-4 rounded-2xl text-base font-extrabold text-white tracking-wide shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-3 ${
            isPolling
              ? 'bg-indigo-400 dark:bg-indigo-700 cursor-not-allowed opacity-90'
              : activeCount === 0 || (mode === 'fair_round' && roundState?.isCompleted)
              ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 shadow-brand-500/30 glow-brand hover:shadow-brand-500/50'
          }`}
        >
          <Dices className={`w-5 h-5 ${isPolling ? 'animate-spin' : ''}`} />
          <span>{isPolling ? 'Selecting Student...' : 'Pick a Student'}</span>
        </button>

        {isPolling && (
          <button
            onClick={handleCancel}
            id="btn-cancel-selection"
            type="button"
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all shadow-sm"
          >
            Cancel Selection
          </button>
        )}

        {mode === 'fair_round' && roundState?.isCompleted && (
          <button
            onClick={handleResetRound}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            Start Next Fresh Round
          </button>
        )}
      </div>
    </div>
  );
};
