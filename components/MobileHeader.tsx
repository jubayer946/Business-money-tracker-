import React from 'react';
import { Search, Sun, Moon, Monitor, History } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  placeholder?: string;
  // Optional search props
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
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
    setTheme(next[theme]);
  };

  const ThemeIcon = ({ light: Sun, dark: Moon, auto: Monitor } as const)[theme];

  const safeQuery = searchQuery ?? '';
  const safeSetSearchQuery = setSearchQuery ?? (() => {});

  // Date shown on every page, e.g. "22 Feb 26"
  const todayStr = React.useMemo(() => {
    const d = new Date();
    return d
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
      })
      .replace(',', '');
  }, []);

  return (
    <div className="sticky top-0 z-[100] pt-[var(--safe-top)] pb-2 bg-transparent">
      <div className="px-4">
        <div className="w-full rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
          {/* Top row: title + actions */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {title}
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {todayStr}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-3">
              {onActivityClick && (
                <button
                  aria-label="View activity log"
                  onClick={onActivityClick}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                >
                  <History size={16} />
                </button>
              )}

              <button
                aria-label="Toggle theme"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
              >
                <ThemeIcon size={16} />
              </button>

              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-[11px] shadow-inner">
                NB
              </div>
            </div>
          </div>

          {/* Search inside pill (optional) */}
          {showSearch && (
            <div className="relative mt-3 group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder={placeholder}
                value={safeQuery}
                onChange={(e) => safeSetSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 dark:text-white outline-none transition-all"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
