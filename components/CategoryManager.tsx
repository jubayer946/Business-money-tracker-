import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle, Save } from 'lucide-react';
import { useCategories } from '../contexts/CategoryContext';
import { CategoryConfig } from '../config/expenseCategories';

interface CategoryManagerProps {
  onClose?: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const { categories, addCategory, updateCategory, deleteCategory, resetToDefaults } = useCategories();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state for both new and edit
  const [formData, setFormData] = useState<Omit<CategoryConfig, 'id' | 'isDefault'>>({
    icon: '📌',
    label: '',
    color: 'bg-slate-50 dark:bg-slate-800',
    description: ''
  });

  // Start editing a category
  const handleStartEdit = (cat: CategoryConfig) => {
    setEditingId(cat.id);
    setFormData({
      icon: cat.icon,
      label: cat.label,
      color: cat.color,
      description: cat.description || ''
    });
    setShowAddNew(false);
  };

  // Save edited category
  const handleSaveEdit = () => {
    if (!formData.label.trim()) {
      alert('Please enter a category name');
      return;
    }
    if (editingId) {
      updateCategory(editingId, formData);
      setEditingId(null);
      resetForm();
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  // Handle delete click
  const handleDeleteClick = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    if (id === 'other') {
      alert('Cannot delete "Other" category - it\'s the default fallback');
      return;
    }
    if (category?.isDefault) {
      if (!window.confirm(`"${category.label}" is a system category. Are you sure you want to delete it?`)) {
        setDeleteConfirm(null);
        return;
      }
    }
    deleteCategory(id);
    setDeleteConfirm(null);
  };

  // Add new category
  const handleAddCategory = () => {
    if (!formData.label.trim()) {
      alert('Please enter a category name');
      return;
    }
    addCategory(formData);
    resetForm();
    setShowAddNew(false);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      icon: '📌',
      label: '',
      color: 'bg-slate-50 dark:bg-slate-800',
      description: ''
    });
  };

  const handleReset = () => {
    if (window.confirm('Reset all categories to default? This will remove custom categories.')) {
      resetToDefaults();
      setEditingId(null);
      setShowAddNew(false);
      resetForm();
    }
  };

  const colorOptions = [
    { value: 'bg-red-50 dark:bg-red-900/20', label: 'Red' },
    { value: 'bg-orange-50 dark:bg-orange-900/20', label: 'Orange' },
    { value: 'bg-amber-50 dark:bg-amber-900/20', label: 'Amber' },
    { value: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Yellow' },
    { value: 'bg-emerald-50 dark:bg-emerald-900/20', label: 'Green' },
    { value: 'bg-teal-50 dark:bg-teal-900/20', label: 'Teal' },
    { value: 'bg-cyan-50 dark:bg-cyan-900/20', label: 'Cyan' },
    { value: 'bg-blue-50 dark:bg-blue-900/20', label: 'Blue' },
    { value: 'bg-indigo-50 dark:bg-indigo-900/20', label: 'Indigo' },
    { value: 'bg-purple-50 dark:bg-purple-900/20', label: 'Purple' },
    { value: 'bg-pink-50 dark:bg-pink-900/20', label: 'Pink' },
    { value: 'bg-rose-50 dark:bg-rose-900/20', label: 'Rose' },
    { value: 'bg-slate-50 dark:bg-slate-800', label: 'Gray' },
  ];

  const iconOptions = [
    '📢', '🛠️', '📦', '🚚', '💻', '📋', '💰', '🎨', '📊', '🎯', 
    '⚡', '🌐', '📱', '💡', '🎁', '🏆', '📸', '🎬', '⭐', '🔧', 
    '📝', '🛒', '💳', '🏪', '📈', '🎪', '🎭', '🎮', '📡', '🔔'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Expense Categories
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            {categories.length} total categories
          </p>
        </div>
        <button
          onClick={handleReset}
          className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
        >
          Reset Defaults
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-2 max-h-80 overflow-y-auto hide-scrollbar">
        {categories.map(cat => {
          const isEditing = editingId === cat.id;
          if (isEditing) {
            return (
              <div key={cat.id} className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Editing Category
                  </span>
                  <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600">
                    <X size={16} />
                  </button>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Icon</label>
                  <div className="flex flex-wrap gap-1.5">
                    {iconOptions.slice(0, 15).map(icon => (
                      <button key={icon} onClick={() => setFormData({ ...formData, icon })} className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all ${formData.icon === icon ? 'bg-indigo-600 scale-110' : 'bg-white dark:bg-slate-800 hover:scale-105'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Name</label>
                  <input type="text" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} className="w-full bg-white dark:bg-slate-800 rounded-xl py-2 px-3 text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {colorOptions.slice(0, 10).map(color => (
                      <button key={color.value} onClick={() => setFormData({ ...formData, color: color.value })} className={`w-6 h-6 rounded-md ${color.value} border-2 transition-all ${formData.color === color.value ? 'border-indigo-600 scale-110' : 'border-transparent'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEdit} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-[10px] uppercase">Cancel</button>
                  <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2"><Save size={14} />Save</button>
                </div>
              </div>
            );
          }
          return (
            <div key={cat.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${deleteConfirm === cat.id ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-800 border-transparent shadow-sm'}`}>
              <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>{cat.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{cat.label}</p>
                  {cat.isDefault && <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 text-[8px] font-black uppercase rounded-md">Default</span>}
                </div>
                {cat.description && <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.description}</p>}
              </div>
              {deleteConfirm === cat.id ? (
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDeleteClick(cat.id)} className="p-2 bg-red-500 text-white rounded-xl"><Check size={14} /></button>
                  <button onClick={() => setDeleteConfirm(null)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-xl"><X size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleStartEdit(cat)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"><Edit2 size={14} className="text-slate-400" /></button>
                  <button onClick={() => setDeleteConfirm(cat.id)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl" disabled={cat.id === 'other'}><Trash2 size={14} className={cat.id === 'other' ? 'text-slate-200' : 'text-red-500'} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddNew ? (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400">New Category</h4>
            <button onClick={() => { setShowAddNew(false); resetForm(); }} className="text-slate-400"><X size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {iconOptions.slice(0, 12).map(icon => (
              <button key={icon} onClick={() => setFormData({ ...formData, icon })} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.icon === icon ? 'bg-indigo-600 scale-110' : 'bg-white dark:bg-slate-800 hover:scale-105'}`}>{icon}</button>
            ))}
          </div>
          <input type="text" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="Category Name" className="w-full bg-white dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500" />
          <div className="flex flex-wrap gap-2">
            {colorOptions.slice(0, 8).map(color => (
              <button key={color.value} onClick={() => setFormData({ ...formData, color: color.value })} className={`w-8 h-8 rounded-lg ${color.value} border-2 transition-all ${formData.color === color.value ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`} />
            ))}
          </div>
          <button onClick={handleAddCategory} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"><Check size={18} />Save Category</button>
        </div>
      ) : (
        <button onClick={() => setShowAddNew(true)} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 transition-all"><Plus size={18} />Add New Category</button>
      )}

      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-bold">Note:</span> Changes are saved locally. Deleting a category moves existing expenses to "Other".
        </p>
      </div>
    </div>
  );
};
