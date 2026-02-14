import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AccessibleModal } from './AccessibleModal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  itemType: 'product' | 'sale' | 'campaign' | 'expense';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, 
  itemName, 
  itemType, 
  onConfirm, 
  onCancel,
  isLoading = false 
}) => {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onCancel}
      title={`Delete ${itemType}?`}
      headerIcon={
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
      }
    >
      <div className="relative bg-white dark:bg-slate-900 p-6 flex flex-col items-center text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Are you sure you want to delete <strong className="text-slate-700 dark:text-slate-200">"{itemName}"</strong>? This action cannot be undone.
        </p>
        
        <div className="flex space-x-3 w-full">
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <>
                <Trash2 size={16} aria-hidden="true" />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
};