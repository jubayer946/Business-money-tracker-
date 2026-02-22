import React from 'react';
import { Search, Sun, Moon, Monitor, History } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface MobileHeaderProps {
  title: string;
  showSearch?: boolean;
  placeholder?: string;
  // Optional search props (safe defaults inside)
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onActivityClick?: () => void;
  // Text shown next to the green dot (e.g. date on dashboard)
  subtitle?: string;
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
  subtitle,
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

  const safeQuery = searchQuery ?? '';
  const safeSetSearchQuery = setSearchQuery ?? (() => {});

  return (
    <div className="sticky top-0 z-[100] bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
      {/* Top Safe Area Spacing for notches/status bar */}
      <div style={{ height: 'var(--safe-top)' }} />

      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            {/* Page title (e.g. 'Nobabighor' on dashboard) */}
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>

            {/* Green dot + optional subtitle (e.g. date) */}
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {subtitle && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
            >
              <ThemeIcon size={18} />
            </button>

            {onActivityClick && (
              <button
                aria-label="View activity log"
                onClick={onActivityClick}
                className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-transform"
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
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-white transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder={placeholder}
              value={safeQuery}
              onChange={(e) => safeSetSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 dark:text-white outline-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
};
