
import React from 'react';
import { Search, Sun, Moon, Monitor, History } from 'lucide-react';

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
    <div className="sticky top-0 z-[100] ios-blur bg-white/70 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      {/* Top Safe Area Spacing */}
      <div style={{ height: 'var(--safe-top)' }} />
      
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
                Secure Cloud
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
            >
              <ThemeIcon size={18} />
            </button>

            {onActivityClick && (
              <button
                aria-label="View activity log"
                onClick={onActivityClick}
                className="w-10 h-10 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
              >
                <History size={18} />
              </button>
            )}

            <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xs shadow-inner">
              NB
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="relative mt-4 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors" size={16} />
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 dark:text-white outline-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
};
