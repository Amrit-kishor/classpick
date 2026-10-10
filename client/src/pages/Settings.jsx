import React from 'react';
import {
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  Monitor,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';

export const Settings = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { soundEnabled, toggleSound, volume, setVolume, playPreviewSound } = useSound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Visual & Audio Preferences */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Application Preferences
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize visual theme, sound effects, and lecture display options
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
          {/* Theme setting */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Interface Theme
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Current: <strong className="capitalize">{theme} Mode</strong>
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Toggle {isDark ? 'Light' : 'Dark'} Mode
            </button>
          </div>

          {/* Sound setting */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Selection Audio Experience
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Electronic startup tone, progressive suspense loop, and confirmation chime
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                id="settings-toggle-sound-btn"
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  soundEnabled
                    ? 'border-indigo-300 dark:border-indigo-800 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 bg-slate-50 dark:bg-slate-800'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {/* Volume Slider & Previews */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Master Sound Volume
                </span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {soundEnabled ? `${Math.round(volume * 100)}%` : 'Muted'}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                id="settings-volume-slider"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                disabled={!soundEnabled}
                aria-label="Master audio volume"
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-40"
              />

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={playPreviewSound}
                  disabled={!soundEnabled}
                  id="btn-preview-chime"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-white dark:hover:bg-navy-900 border border-brand-200 dark:border-brand-900/60 disabled:opacity-40 transition-colors"
                >
                  🔊 Test Confirmation Chime
                </button>
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Uses the HTML5 Web Audio API synthesizer. Audio is strictly synchronized with validated server draws and automatically terminates when the selection completes or if network errors occur.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Projector Guide */}
      <div className="bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Classroom Projector Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tips for projecting in large lecture halls
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <h5 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-brand-500" /> Fullscreen Shortcut
            </h5>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">F11</kbd> or click <strong>"Projector Mode"</strong> on the Random Picker page to expand to ultra-high legibility mode.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-slate-800">
            <h5 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-500" /> Unbiased Validation
            </h5>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Draws are cryptographically generated and logged on the backend to maintain academic integrity and equal opportunity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
