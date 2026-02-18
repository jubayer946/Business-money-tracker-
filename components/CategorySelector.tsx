import React from 'react';
import { useCategories } from '../contexts/CategoryContext';
import { ExpenseCategoryId } from '../config/expenseCategories';

interface CategorySelectorProps {
  value: string;
  onChange: (categoryId: string) => void;
  showDescription?: boolean;
  compact?: boolean;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  value, 
  onChange, 
  showDescription = false, 
  compact = false,
  disabled = false
}) => {
  const { categories } = useCategories();

  if (compact) {
    return (
      <div className="relative group">
        <select 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none border border-transparent focus:border-indigo-500 disabled:opacity-50 appearance-none transition-all"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const isActive = value === cat.id;
        return (
          <button 
            key={cat.id} 
            type="button" 
            disabled={disabled}
            onClick={() => onChange(cat.id)} 
            className={`p-4 rounded-[28px] border-2 transition-all text-left relative overflow-hidden group ${
              isActive 
                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col gap-2 relative z-10">
              <span className="text-3xl" role="img" aria-label={cat.label}>{cat.icon}</span>
              <div>
                <p className={`text-xs font-black uppercase tracking-tight truncate ${
                  isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {cat.label}
                </p>
                {showDescription && cat.description && (
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5 line-clamp-1 group-hover:line-clamp-none transition-all">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
            {isActive && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white scale-110 animate-in zoom-in-50">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
