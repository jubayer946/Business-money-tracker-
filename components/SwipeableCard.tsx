import React from 'react';
import { useSwipeAction } from '../hooks/useSwipeAction';
import { Edit2, Trash2 } from 'lucide-react';

interface SwipeableCardProps {
  children: (isSwiping: boolean) => React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

/**
 * SwipeableCard provides a wrapper with built-in Edit and Delete actions 
 * revealed via a right-swipe gesture.
 */
export const SwipeableCard: React.FC<SwipeableCardProps> = ({ 
  children, 
  onEdit, 
  onDelete,
  className = ""
}) => {
  const { offset, handlers, close, isSwiping } = useSwipeAction({
    threshold: 70,
    maxOffset: 140,
    direction: 'right'
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    setTimeout(onEdit, 50);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    close();
    setTimeout(onDelete, 50);
  };

  return (
    <div className={`relative overflow-hidden rounded-[28px] shadow-sm select-none touch-pan-y ${className}`}>
      {/* Action buttons revealed on swipe */}
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 bg-slate-100 dark:bg-slate-800 space-x-2 w-full">
        <button 
          onClick={handleEdit}
          className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
          aria-label="Edit item"
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={handleDelete}
          className="w-11 h-11 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
          aria-label="Delete item"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main card content */}
      <div 
        {...handlers}
        style={{ 
          transform: `translateX(${offset}px)`, 
          transition: offset === 0 || offset === 140 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 z-10"
      >
        {children(isSwiping)}
      </div>
    </div>
  );
};