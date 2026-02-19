import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw, Check, X } from 'lucide-react';

interface DeliveryPresetsEditorProps {
  presets: number[];
  onAdd: (value: number) => void;
  onRemove: (value: number) => void;
  onUpdate: (oldValue: number, newValue: number) => void;
  onReset: () => void;
  isDefault: boolean;
  onClose: () => void;
}

export const DeliveryPresetsEditor: React.FC<DeliveryPresetsEditorProps> = ({
  presets,
  onAdd,
  onRemove,
  onUpdate,
  onReset,
  isDefault,
  onClose,
}) => {
  const [newValue, setNewValue] = useState('');
  const [editingValue, setEditingValue] = useState<{ old: number; current: string } | null>(null);

  const handleAdd = () => {
    const num = parseFloat(newValue);
    if (!isNaN(num) && num >= 0) {
      onAdd(num);
      setNewValue('');
    }
  };

  const handleUpdate = () => {
    if (!editingValue) return;
    const num = parseFloat(editingValue.current);
    if (!isNaN(num) && num >= 0) {
      onUpdate(editingValue.old, num);
      setEditingValue(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
          Manage Presets
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2">
        {presets.map(preset => (
          <div key={preset} className="flex items-center gap-2">
            {editingValue?.old === preset ? (
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editingValue.current}
                  onChange={e => setEditingValue({ ...editingValue, current: e.target.value })}
                  className="flex-1 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-900/50 rounded-lg px-3 py-1.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={handleUpdate}
                  className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => setEditingValue(null)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div 
                  onClick={() => setEditingValue({ old: preset, current: preset.toString() })}
                  className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold dark:text-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  ${preset.toFixed(2)}
                </div>
                <button
                  onClick={() => onRemove(preset)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                  aria-label={`Remove ${preset} preset`}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">$</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Add new..."
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg pl-6 pr-3 py-1.5 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newValue}
          className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 active:scale-95 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {!isDefault && (
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <RotateCcw size={12} />
          Reset to Defaults
        </button>
      )}
    </div>
  );
};
