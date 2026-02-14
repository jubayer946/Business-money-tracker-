import React from 'react';

export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 2 }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
        {lines > 1 && <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />}
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);