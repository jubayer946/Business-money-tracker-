
import React from 'react';
import { Search, Sun, Moon, Monitor, Cloud, History } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  placeholder?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onActivityClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showSearch = false,
  placeholder = 'Search...',
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onActivityClick,
}) => {
  const toggleTheme = () => {
    const next: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    };
    const newTheme = next[theme];
    setTheme(newTheme);
  };

  const ThemeIcon = ({ light: Sun, dark: Moon, auto: Monitor } as const)[theme];

  return (
    <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl px-5 pt-6 pb-4 transition-colors duration-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <Cloud size={10} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
              Realtime Sync
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm active:scale-90 transition-transform"
          >
            <ThemeIcon size={18} />
          </button>

          {onActivityClick && (
            <button
              aria-label="View activity log"
              onClick={onActivityClick}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-sm active:scale-90 transition-transform"
            >
              <History size={18} />
            </button>
          )}

          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-[11px] shadow-lg shadow-indigo-100 dark:shadow-none">
            BM
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="relative mt-4 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 dark:text-white shadow-sm outline-none transition-all"
          />
        </div>
      )}
    </div>
  );
};
