import React from 'react';
import { AlertCircle, TrendingUp, Info, CheckCircle2, LucideIcon } from 'lucide-react';
import { Insight } from '../hooks/useBusinessInsights';

interface InsightCardProps {
  insight: Insight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const configs = {
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      icon: AlertCircle,
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      icon: TrendingUp,
    },
    info: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-100 dark:border-indigo-900/40',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      icon: Info,
    },
    action: {
      bg: 'bg-slate-50 dark:bg-slate-800/50',
      border: 'border-slate-100 dark:border-slate-700',
      iconColor: 'text-slate-600 dark:text-slate-400',
      icon: CheckCircle2,
    },
  };

  const config = configs[insight.type];
  const Icon = config.icon;

  return (
    <div className={`min-w-[260px] max-w-[280px] p-5 rounded-[32px] border ${config.bg} ${config.border} shadow-sm transition-all active:scale-[0.98] shrink-0 flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className={`w-8 h-8 rounded-xl ${config.bg} ${config.iconColor} flex items-center justify-center border border-white dark:border-slate-800`}>
            <Icon size={16} />
          </div>
          {insight.metric && (
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${config.bg} ${config.iconColor}`}>
              {insight.metric}
            </span>
          )}
        </div>
        <h4 className={`text-sm font-black tracking-tight mb-1 ${insight.type === 'warning' ? 'text-amber-900 dark:text-amber-100' : insight.type === 'success' ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-900 dark:text-white'}`}>
          {insight.title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {insight.description}
        </p>
      </div>
    </div>
  );
};