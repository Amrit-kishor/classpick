import React from 'react';

export const StatsCard = ({ label, value, icon: Icon, color = 'brand', subtext }) => {
  const colorMap = {
    brand: {
      bg: 'bg-brand-500/10 dark:bg-brand-500/15',
      text: 'text-brand-600 dark:text-brand-400',
      border: 'hover:border-brand-500/40',
      glow: 'group-hover:shadow-brand-500/10',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/40',
      glow: 'group-hover:shadow-amber-500/10',
    },
    violet: {
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'hover:border-violet-500/40',
      glow: 'group-hover:shadow-violet-500/10',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div
      className={`group relative p-5 bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl ${scheme.border} ${scheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
            {value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {subtext}
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-2xl ${scheme.bg} ${scheme.text} transition-transform duration-200 group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
