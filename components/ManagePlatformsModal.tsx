import React, { useState } from 'react';
import { Plus, Trash2, Settings2, GripVertical } from 'lucide-react';
import { AdPlatform } from '../types';
import { AccessibleModal } from './AccessibleModal';

interface ManagePlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: AdPlatform[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ManagePlatformsModal: React.FC<ManagePlatformsModalProps> = ({ isOpen, onClose, platforms, onAdd, onDelete }) => {
  const [newPlatformName, setNewPlatformName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newPlatformName.trim()) return;
    setIsAdding(true);
    try {
      await onAdd(newPlatformName.trim());
      setNewPlatformName('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this category? Existing expenses with this name will remain, but you won\'t be able to select it for new ones easily.')) return;
    try {
      await onDelete(id);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Expense Categories"
      description="Manage the list of available platforms for recording business expenses."
      headerIcon={
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Settings2 size={20} />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="e.g. Facebook Ads" 
            value={newPlatformName}
            onChange={(e) => setNewPlatformName(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="New category name"
          />
          <button 
            onClick={handleAdd}
            disabled={isAdding || !newPlatformName.trim()}
            className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 disabled:opacity-40 transition-all"
            aria-label="Add category"
          >
            <Plus size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2 mt-4" role="list">
          {platforms.map((p) => (
            <div key={p.id} role="listitem" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
              <div className="flex items-center space-x-3">
                <GripVertical size={16} className="text-slate-300 dark:text-slate-600" aria-hidden="true" />
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{p.name}</span>
              </div>
              <button 
                onClick={() => handleDelete(p.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          ))}
          
          {platforms.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-bold">No custom categories yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
          Changes are saved instantly to the cloud
        </p>
      </div>
    </AccessibleModal>
  );
};