
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
      aria-describedby={description ? "modal-description" : undefined}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <div 
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden outline-none animate-in slide-in-from-bottom-full duration-500 ease-out"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center space-x-4">
            {headerIcon && (
              <div className="shrink-0 scale-90">
                {headerIcon}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
