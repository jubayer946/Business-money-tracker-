import React from 'react';
import { Search, Wifi, WifiOff, Sun, Moon, Monitor } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  placeholder?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  title, 
  showSearch = false, 
  placeholder = "Search...", 
  searchQuery, 
  setSearchQuery, 
  isDemoMode,
  theme,
  setTheme
}) => {
  const toggleTheme = () => {
    const next: Record<ThemeMode, ThemeMode> = {
      'light': 'dark',
      'dark': 'auto',
      'auto': 'light'
    };
    setTheme(next[theme]);
  };

  const ThemeIcon = {
    'light': Sun,
    'dark': Moon,
    'auto': Monitor
  }[theme];

  return (
    <div className="sticky top-0 z-30 bg-[#FBFBFE]/80 dark:bg-[#0F172A]/80 backdrop-blur-md px-5 pt-4 pb-4 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">{title}</h1>
          <div className="flex items-center space-x-1 mt-0.5">
            {isDemoMode ? <WifiOff size={10} className="text-orange-500" /> : <Wifi size={10} className="text-green-500" />}
            <span className={`text-[9px] font-bold uppercase ${isDemoMode ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'}`}>
              {isDemoMode ? 'Local Mode' : 'Cloud Sync Active'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm active:scale-90 transition-transform"
          >
            <ThemeIcon size={18} />
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-inner">
            BM
          </div>
        </div>
      </div>
      {showSearch && (
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm outline-none transition-colors"
          />
        </div>
      )}
    </div>
  );
};