
import React, { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
  duration = 5000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-bottom-4">
      <div className="bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 min-w-[280px]">
        <span className="text-sm font-medium flex-1">{message}</span>
        <button
          onClick={onUndo}
          className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
        >
          <Undo2 size={14} />
          <span>Undo</span>
        </button>
        <button
          onClick={onDismiss}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-400 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
