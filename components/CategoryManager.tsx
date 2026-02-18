import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, AlertTriangle } from 'lucide-react';

export interface CategoryConfig {
  id: string;
  icon: string;
  label: string;
  color: string;
  description?: string;
}

// Default categories
const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'paid_ads',
    icon: '📢',
    label: 'Paid Advertising',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Facebook Ads, Google Ads, TikTok Ads'
  },
  {
    id: 'marketing_tools',
    icon: '🛠️',
    label: 'Marketing Tools',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Email marketing, social media tools'
  },
  {
    id: 'supplies',
    icon: '📦',
    label: 'Supplies & Materials',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Packaging, raw materials'
  },
  {
    id: 'shipping',
    icon: '🚚',
    label: 'Shipping & Delivery',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'Courier, postage, freight'
  },
  {
    id: 'software',
    icon: '💻',
    label: 'Software & Apps',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'Subscriptions, SaaS tools'
  },
  {
    id: 'other',
    icon: '📋',
    label: 'Other Expenses',
    color: 'bg-slate-50 dark:bg-slate-800',
    description: 'Miscellaneous expenses'
  }
];

interface CategoryManagerProps {
  onClose?: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New category form state
  const [newCategory, setNewCategory] = useState<CategoryConfig>({
    id: '',
    icon: '📌',
    label: '',
    color: 'bg-slate-50 dark:bg-slate-800',
    description: ''
  });

  // Load categories from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('expense_categories');
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem('expense_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
  }, []);

  // Save categories to localStorage
  const saveCategories = (newCategories: CategoryConfig[]) => {
    setCategories(newCategories);
    localStorage.setItem('expense_categories', JSON.stringify(newCategories));
    // Dispatch custom event for reactive updates in other components
    window.dispatchEvent(new Event('categoriesUpdated'));
  };

  // Delete category
  const handleDelete = (id: string) => {
    if (id === 'other') {
      alert('Cannot delete "Other" category - it\'s the default fallback');
      return;
    }
    const updated = categories.filter(cat => cat.id !== id);
    saveCategories(updated);
    setDeleteConfirm(null);
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategory.label.trim()) {
      alert('Please enter a category name');
      return;
    }

    const id = newCategory.label.toLowerCase().replace(/\s+/g, '_');
    
    // Check for duplicate
    if (categories.some(cat => cat.id === id)) {
      alert('A category with this name already exists');
      return;
    }

    const categoryToAdd: CategoryConfig = {
      ...newCategory,
      id: id
    };

    saveCategories([...categories, categoryToAdd]);
    setNewCategory({
      id: '',
      icon: '📌',
      label: '',
      color: 'bg-slate-50 dark:bg-slate-800',
      description: ''
    });
    setShowAddNew(false);
  };

  // Reset to default categories
  const handleResetToDefault = () => {
    if (window.confirm('Reset all categories to default? This will remove any custom categories.')) {
      saveCategories(DEFAULT_CATEGORIES);
    }
  };

  // Available colors
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
    { value: 'bg-slate-50 dark:bg-slate-800', label: 'Gray' },
  ];

  // Popular icons
  const iconOptions = ['📢', '🛠️', '📦', '🚚', '💻', '📋', '💰', '🎨', '📊', '🎯', '⚡', '🌐', '📱', '💡', '🎁', '🏆', '📸', '🎬', '⭐', '🔧', '📝', '🛒'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Expense Categories
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">
            {categories.length} categories
          </p>
        </div>
        <button 
          onClick={handleResetToDefault}
          className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
        >
          Reset to Default
        </button>
      </div>

      {/* Category List */}
      <div className="space-y-2 max-h-80 overflow-y-auto hide-scrollbar">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
              deleteConfirm === cat.id 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                : 'bg-slate-50 dark:bg-slate-800 border-transparent shadow-sm'
            }`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 ${cat.color} rounded-xl flex items-center justify-center text-xl`}>
              {cat.icon}
            </div>

            {/* Label & Description */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {cat.label}
              </p>
              {cat.description && (
                <p className="text-[10px] text-slate-500 truncate">
                  {cat.description}
                </p>
              )}
            </div>

            {/* Actions */}
            {deleteConfirm === cat.id ? (
              // Confirm Delete
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-red-600 uppercase">
                  Delete?
                </span>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              // Normal Actions
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingId(cat.id)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} className="text-slate-400" />
                </button>
                <button 
                  onClick={() => setDeleteConfirm(cat.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                  title="Delete"
                  disabled={cat.id === 'other'}
                >
                  <Trash2 size={14} className={cat.id === 'other' ? 'text-slate-200' : 'text-red-500'} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Category Section */}
      {showAddNew ? (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-800 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400">
              New Category
            </h4>
            <button onClick={() => setShowAddNew(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map(icon => (
                <button 
                  key={icon}
                  onClick={() => setNewCategory({ ...newCategory, icon })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    newCategory.icon === icon 
                      ? 'bg-indigo-600 scale-110 shadow-lg text-white' 
                      : 'bg-white dark:bg-slate-800 hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Category Name
            </label>
            <input 
              type="text" 
              value={newCategory.label}
              onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
              placeholder="e.g., Photography"
              className="w-full bg-white dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-500"
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Description (optional)
            </label>
            <input 
              type="text" 
              value={newCategory.description || ''}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              placeholder="e.g., Product photos, videos"
              className="w-full bg-white dark:bg-slate-800 rounded-xl py-3 px-4 text-sm font-medium outline-none border-2 border-transparent focus:border-indigo-500"
            />
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(color => (
                <button 
                  key={color.value}
                  onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                  className={`w-8 h-8 rounded-lg ${color.value} border-2 transition-all ${
                    newCategory.color === color.value 
                      ? 'border-indigo-600 scale-125 shadow-sm' 
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Preview
            </label>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl">
              <div className={`w-10 h-10 ${newCategory.color} rounded-xl flex items-center justify-center text-xl`}>
                {newCategory.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {newCategory.label || 'Category Name'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {newCategory.description || 'Description'}
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button 
            onClick={handleAddCategory}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none"
          >
            <Check size={18} />
            Save Category
          </button>
        </div>
      ) : (
        // Add Button
        <button 
          onClick={() => setShowAddNew(true)}
          className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={18} />
          Add New Category
        </button>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
          <span className="font-bold">Note:</span> Deleting a category won't delete expenses. They will move to "Other" category.
        </p>
      </div>
    </div>
  );
};

// Helper function to get category config
export const getCategoryConfig = (categoryId: string): CategoryConfig => {
  const saved = localStorage.getItem('expense_categories');
  const categories: CategoryConfig[] = saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  return categories.find(cat => cat.id === categoryId) || categories.find(cat => cat.id === 'other') || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
};

// Export all categories
export const getCategories = (): CategoryConfig[] => {
  const saved = localStorage.getItem('expense_categories');
  return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
};
