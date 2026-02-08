import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 min-w-[160px] transition-colors">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 dark:bg-opacity-20 text-${color.split('-')[1]}-600 dark:text-${color.split('-')[1]}-400 mb-3`}>
      <Icon size={20} />
    </div>
    <p className="text-gray-400 dark:text-slate-500 text-xs font-medium uppercase tracking-wider">{label}</p>
    <h3 className="text-xl font-bold mt-0.5 dark:text-white">{value}</h3>
  </div>
);