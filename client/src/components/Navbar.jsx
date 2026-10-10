import React, { useState, useRef, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Sparkles, Volume1, Sliders } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useSound } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ title, subtitle, onOpenMobileMenu }) => {
  const { soundEnabled, toggleSound, volume, setVolume, playPreviewSound } = useSound();
  const { faculty } = useAuth();
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const audioMenuRef = useRef(null);

  // Close audio popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (audioMenuRef.current && !audioMenuRef.current.contains(e.target)) {
        setAudioMenuOpen(false);
      }
    };
    if (audioMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [audioMenuOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audio Popover & Quick Controls */}
        <div className="relative" ref={audioMenuRef}>
          <button
            type="button"
            onClick={() => setAudioMenuOpen(!audioMenuOpen)}
            id="sound-toggle-btn"
            aria-label="Audio controls and volume"
            title={soundEnabled ? `Sound enabled (${Math.round(volume * 100)}%)` : 'Sound muted'}
            className={`p-2 rounded-xl border transition-all duration-150 flex items-center gap-1.5 ${
              soundEnabled
                ? 'border-indigo-200 dark:border-indigo-900/60 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/30 hover:bg-brand-100/50'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? (
              volume > 0.5 ? <Volume2 className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="text-[11px] font-bold hidden md:inline">
              {soundEnabled ? `${Math.round(volume * 100)}%` : 'Muted'}
            </span>
          </button>

          {/* Audio Dropdown Menu */}
          {audioMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Audio Experience
                </span>
                <button
                  type="button"
                  onClick={toggleSound}
                  id="popover-toggle-sound-btn"
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-colors ${
                    soundEnabled
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border-rose-200 dark:border-rose-900'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-900'
                  }`}
                >
                  {soundEnabled ? 'Mute' : 'Unmute'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>Volume</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  id="navbar-volume-slider"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  disabled={!soundEnabled}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600 disabled:opacity-40"
                />
              </div>

              {/* Quick Test Tone */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={playPreviewSound}
                  disabled={!soundEnabled}
                  className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 disabled:opacity-40 transition-colors"
                >
                  Test Confirmation Chime
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profile Avatar Pill */}
        <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {faculty?.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="text-left">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">
              {faculty?.name?.split(' ')[0] || 'Faculty'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Logged In</span>
          </div>
        </div>
      </div>
    </header>
  );
};
