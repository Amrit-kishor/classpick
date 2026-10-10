import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, UserCheck, RefreshCw, AlertCircle, XCircle } from 'lucide-react';

export const PollAnimationStage = ({
  status = 'idle', // 'idle' | 'polling' | 'selected' | 'error' | 'cancelled'
  isPolling = status === 'polling',
  selectedStudent,
  candidateStudents = [],
  error,
  onRetry,
  onCancel,
  classroomName,
}) => {
  const [cyclingStudent, setCyclingStudent] = useState(null);
  const timerRef = useRef(null);
  const hasConfettiedRef = useRef(false);

  // Derive active visual phase
  const effectivePhase = error
    ? 'error'
    : status === 'cancelled'
    ? 'cancelled'
    : isPolling || status === 'polling'
    ? 'shuffling'
    : selectedStudent || status === 'selected'
    ? 'revealed'
    : 'idle';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Visual shuffling cycle during polling phase
  useEffect(() => {
    if (effectivePhase === 'shuffling') {
      hasConfettiedRef.current = false;
      if (candidateStudents.length === 0) return;

      let delay = 60; // Fast initial tick
      let currentIndex = 0;

      const runCycle = () => {
        currentIndex = (currentIndex + 1) % candidateStudents.length;
        setCyclingStudent(candidateStudents[currentIndex]);

        // Gradual deceleration to simulate mechanical reel landing
        if (delay < 180) {
          delay += 10;
        }

        timerRef.current = setTimeout(runCycle, delay);
      };

      timerRef.current = setTimeout(runCycle, delay);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else if (effectivePhase === 'revealed' && selectedStudent) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!hasConfettiedRef.current) {
        hasConfettiedRef.current = true;
        triggerTastefulConfetti();
      }
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [effectivePhase, candidateStudents, selectedStudent]);

  const triggerTastefulConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 65,
        origin: { y: 0.62 },
        colors: ['#6366f1', '#818cf8', '#38bdf8', '#c7d2fe'],
        disableForReducedMotion: true,
      });
    } catch (e) {
      // Ignore if confetti is blocked
    }
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="relative w-full min-h-[380px] sm:min-h-[420px] rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50 to-indigo-50/30 dark:from-navy-900 dark:via-navy-900/90 dark:to-navy-950 flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden shadow-xl transition-all">
      {/* Background Animated Atmosphere Glow */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          effectivePhase === 'shuffling'
            ? 'opacity-100 bg-radial from-brand-500/20 via-transparent to-transparent'
            : effectivePhase === 'revealed'
            ? 'opacity-80 bg-radial from-emerald-500/15 via-transparent to-transparent'
            : 'opacity-0'
        }`}
      />

      {/* Decorative Rotating Ring during Shuffle */}
      {effectivePhase === 'shuffling' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="w-72 h-72 sm:w-88 sm:h-88 rounded-full border border-dashed border-brand-400/30 dark:border-brand-500/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-brand-300/20 dark:border-brand-400/20"
          />
        </div>
      )}

      {/* ERROR STATE */}
      {effectivePhase === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 max-w-md p-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Selection Interrupted
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">
            {error || 'Unable to connect to the selection service. Please verify active students and try again.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Selection</span>
            </button>
          )}
        </motion.div>
      )}

      {/* CANCELLED STATE */}
      {effectivePhase === 'cancelled' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center z-10 max-w-md p-6"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Selection Cancelled
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">
            The student selection was cancelled. Click below to start a new draw.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Start Selection</span>
            </button>
          )}
        </motion.div>
      )}

      {/* IDLE STATE */}
      {effectivePhase === 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10"
        >
          <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-800 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-5 shadow-sm">
            <UserCheck className="w-10 h-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to Pick a Student
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 font-medium">
            Click <strong className="text-brand-600 dark:text-brand-400 font-semibold">"Pick a Student"</strong> to run an unbiased draw across all active classroom members.
          </p>
        </motion.div>
      )}

      {/* SHUFFLING PHASE */}
      {effectivePhase === 'shuffling' && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-sm">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            Selecting Student...
          </span>

          <AnimatePresence mode="popLayout">
            <motion.div
              key={cyclingStudent?.rollNumber || 'cycling'}
              initial={{ opacity: 0.3, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0.2, y: -15, scale: 0.95 }}
              transition={{ duration: 0.08 }}
              className="w-full bg-white dark:bg-navy-850 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-extrabold text-lg mx-auto flex items-center justify-center shadow-md mb-3">
                {getInitials(cyclingStudent?.fullName)}
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                {cyclingStudent?.fullName || 'Scanning roster...'}
              </h4>
              <p className="text-xs sm:text-sm font-mono font-semibold text-brand-600 dark:text-brand-400 mt-1">
                {cyclingStudent?.rollNumber || '••••••••'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* FINAL REVEALED PHASE */}
      {effectivePhase === 'revealed' && selectedStudent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-navy-850 border-2 border-brand-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center glow-brand"
        >
          {/* Terminology: "Selected Student" */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Selected Student</span>
          </div>

          <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-xl mb-4 border-4 border-white dark:border-navy-900">
            {selectedStudent.profileImage ? (
              <img
                src={selectedStudent.profileImage}
                alt={selectedStudent.fullName}
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              getInitials(selectedStudent.fullName)
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {selectedStudent.fullName}
          </h3>

          <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-mono text-sm sm:text-base font-bold">
            {selectedStudent.rollNumber}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
            Classroom: <strong className="text-slate-700 dark:text-slate-300">{classroomName || selectedStudent.classroomName}</strong>
          </p>
        </motion.div>
      )}
    </div>
  );
};
