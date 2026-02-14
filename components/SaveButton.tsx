import React from 'react';
import { Loader2 } from 'lucide-react';

interface SaveButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ 
  onClick, 
  isLoading, 
  disabled, 
  children,
  className = "" 
}) => (
  <button
    onClick={onClick}
    disabled={isLoading || disabled}
    className={`w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all ${className}`}
  >
    {isLoading ? (
      <>
        <Loader2 size={18} className="animate-spin" />
        <span className="opacity-80">Saving...</span>
      </>
    ) : (
      children
    )}
  </button>
);
