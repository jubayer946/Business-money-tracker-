import React from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { SwipeableProductItem } from '../components/SwipeableProductItem';
import { Product } from '../types';

type ThemeMode = 'light' | 'dark' | 'auto';

interface InventoryViewProps {
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  expandedProductId: string | null;
  setExpandedProductId: (id: string | null) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  products, 
  searchQuery, 
  setSearchQuery, 
  isDemoMode,
  theme,
  setTheme,
  expandedProductId, 
  setExpandedProductId,
  onEdit,
  onDelete
}) => {
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="pb-32">
      <MobileHeader 
        title="Stock Management" 
        showSearch 
        placeholder="Swipe item to Edit/Delete" 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        isDemoMode={isDemoMode}
        theme={theme}
        setTheme={setTheme}
      />
      <div className="px-5 mt-4">
        <div className="mb-4 text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-500 tracking-[0.2em] flex items-center">
          <span className="bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded mr-2">Tip</span>
          Tap to expand • Swipe right to manage
        </div>
        {filteredProducts.map(p => (
          <SwipeableProductItem 
            key={p.id} 
            product={p} 
            expanded={expandedProductId === p.id}
            onExpand={setExpandedProductId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {filteredProducts.length === 0 && (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500 font-medium">
            No items found in inventory.
          </div>
        )}
      </div>
    </div>
  );
};