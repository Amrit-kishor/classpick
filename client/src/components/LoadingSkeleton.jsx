import React from 'react';

export const LoadingSkeleton = ({ count = 3, type = 'card' }) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 animate-pulse"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md mb-3" />
            <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 overflow-hidden p-4 space-y-3 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        {[...Array(count)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-navy-900 animate-pulse space-y-4"
        >
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          <div className="flex justify-between pt-2">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};
