import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon: Icon,
  color,
  trend 
}) => {
  return (
    <div className="min-w-[160px] bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex-shrink-0 active:scale-95 transition-all">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-11 h-11 rounded-[18px] ${color} flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${trend >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight tabular-nums">
          {value}
        </p>
      </div>
    </div>
  );
};