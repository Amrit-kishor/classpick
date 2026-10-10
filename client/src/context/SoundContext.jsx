import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  playStartupSound,
  suspenseEngine,
  playConfirmationChime,
  playErrorTone,
  playTestTone,
  setMasterVolume,
} from '../utils/soundEffects';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  // Sound enabled / muted state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('classpick_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Volume state (0.0 to 1.0, default 0.7)
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('classpick_volume');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
    }
    return 0.7;
  });

  // Keep localStorage and masterGain in sync
  useEffect(() => {
    localStorage.setItem('classpick_sound', String(soundEnabled));
    setMasterVolume(volume, !soundEnabled);
  }, [soundEnabled, volume]);

  useEffect(() => {
    localStorage.setItem('classpick_volume', String(volume));
  }, [volume]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      setMasterVolume(volume, !next);
      return next;
    });
  }, [volume]);

  const setVolume = useCallback((newVol) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolumeState(clamped);
    setMasterVolume(clamped, !soundEnabled);
  }, [soundEnabled]);

  // Audio lifecycle triggers
  const startPollingAudio = useCallback(() => {
    if (!soundEnabled) return;
    playStartupSound(volume, false);
    suspenseEngine.start(volume, false);
  }, [soundEnabled, volume]);

  const stopPollingAudio = useCallback(() => {
    suspenseEngine.stop();
  }, []);

  const playSuccessChime = useCallback(() => {
    suspenseEngine.stop(); // Guaranteed immediate stop of suspense
    if (!soundEnabled) return;
    playConfirmationChime(volume, false);
  }, [soundEnabled, volume]);

  const playErrorSound = useCallback(() => {
    suspenseEngine.stop();
    if (!soundEnabled) return;
    playErrorTone(volume, false);
  }, [soundEnabled, volume]);

  const playPreviewSound = useCallback(() => {
    if (!soundEnabled) return;
    playTestTone(volume, false);
  }, [soundEnabled, volume]);

  // Stop all sounds on window blur / unmount
  useEffect(() => {
    return () => {
      suspenseEngine.stop();
    };
  }, []);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        volume,
        setVolume,
        startPollingAudio,
        stopPollingAudio,
        playSuccessChime,
        playErrorSound,
        playPreviewSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider');
  return context;
};
