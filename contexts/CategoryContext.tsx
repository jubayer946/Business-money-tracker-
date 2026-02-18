import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CategoryConfig, DEFAULT_CATEGORIES } from '../config/expenseCategories';

interface CategoryContextType {
  categories: CategoryConfig[];
  addCategory: (category: Omit<CategoryConfig, 'id' | 'isDefault'>) => void;
  updateCategory: (id: string, updates: Partial<CategoryConfig>) => void;
  deleteCategory: (id: string) => void;
  getCategory: (id: string) => CategoryConfig;
  resetToDefaults: () => void;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryConfig[]>(() => {
    const stored = localStorage.getItem('expense_categories');
    if (!stored) return DEFAULT_CATEGORIES;
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CATEGORIES;
    }
  });

  useEffect(() => {
    localStorage.setItem('expense_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = useCallback((category: Omit<CategoryConfig, 'id' | 'isDefault'>) => {
    const id = category.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (categories.some(cat => cat.id === id)) {
      alert('A category with this name already exists');
      return;
    }
    const newCategory: CategoryConfig = {
      ...category,
      id,
      isDefault: false
    };
    setCategories(prev => [...prev, newCategory]);
  }, [categories]);

  const updateCategory = useCallback((id: string, updates: Partial<CategoryConfig>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    if (id === 'other') return;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const getCategory = useCallback((id: string) => {
    return categories.find(cat => cat.id === id) || categories.find(cat => cat.id === 'other') || DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
  }, [categories]);

  const resetToDefaults = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategory, resetToDefaults }}>
      {children}
    </CategoryContext.Provider>
  );
};
