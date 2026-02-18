import React, { createContext, useContext, useState, useEffect } from 'react';
import { CategoryConfig, EXPENSE_CATEGORIES } from '../config/expenseCategories';

interface CategoryContextType {
  categories: CategoryConfig[];
  addCategory: (category: Omit<CategoryConfig, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<CategoryConfig>) => void;
  deleteCategory: (id: string) => void;
  getCategory: (id: string) => CategoryConfig;
}

const CategoryContext = createContext<CategoryContextType | null>(null);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryConfig[]>(() => {
    const stored = localStorage.getItem('custom_expense_categories');
    return stored ? JSON.parse(stored) : EXPENSE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('custom_expense_categories', JSON.stringify(categories));
  }, [categories]);

  const addCategory = (category: Omit<CategoryConfig, 'id'>) => {
    const newCategory = {
      ...category,
      id: `custom_${Date.now()}`
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updates: Partial<CategoryConfig>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id: string) => {
    if (EXPENSE_CATEGORIES.some(cat => cat.id === id)) {
      // Don't delete system defaults in this simple implementation, or handle specially
      return;
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const getCategory = (id: string) => {
    return categories.find(cat => cat.id === id) || EXPENSE_CATEGORIES.find(cat => cat.id === 'other')!;
  };

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, deleteCategory, getCategory }}>
      {children}
    </CategoryContext.Provider>
  );
};
