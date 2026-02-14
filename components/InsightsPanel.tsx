
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, Sparkles } from 'lucide-react';
import { Insight } from '../hooks/useBusinessInsights';

interface InsightsPanelProps {
  insights: Insight[];
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  const icons = {
    warning: AlertTriangle,
    success: TrendingUp,
    info: Info,
    action: Sparkles,
  };

  const colors = {
    warning: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/40 dark:text-amber-300',
    success: 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/40 dark:text-emerald-300',
    info: 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-900/40 dark:text-indigo-300',
    action: 'bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-900/20 dark:border-purple-900/40 dark:text-purple-300',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Action Items
        </h3>
      </div>
      
      <div className="space-y-2.5">
        {insights.map((insight) => {
          const Icon = icons[insight.type];
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-[24px] border ${colors[insight.type]} flex items-start space-x-3 transition-all active:scale-[0.98] shadow-sm`}
            >
              <div className={`p-2 rounded-xl bg-white dark:bg-slate-900/50 shadow-sm shrink-0`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs uppercase tracking-tight">{insight.title}</p>
                <p className="text-[11px] font-medium opacity-80 mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
              {insight.metric && (
                <span className="text-xs font-black tracking-tighter opacity-60">{insight.metric}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
