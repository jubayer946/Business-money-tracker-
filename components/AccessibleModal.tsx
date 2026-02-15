
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  headerIcon?: React.ReactNode;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  children,
  headerIcon 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEscape);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements?.length) return;
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title" 
      className="fixed inset-0 z-[200] flex items-end justify-center p-0"
    >
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div 
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-2xl bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden outline-none ios-sheet-enter"
      >
        {/* iOS Grabber Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {headerIcon && <div className="scale-90 opacity-80">{headerIcon}</div>}
            <div>
              <h2 id="modal-title" className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar overscroll-contain px-6 pb-12">
          <div className="bg-white dark:bg-[#2C2C2E] rounded-3xl p-1 shadow-sm border border-slate-100 dark:border-slate-800/50">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
