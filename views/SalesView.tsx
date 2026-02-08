import React, { useState } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { SaleItem } from '../components/SaleItem';
import { Sale } from '../types';

type ThemeMode = 'light' | 'dark' | 'auto';

interface SalesViewProps {
  sales: Sale[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ 
  sales, 
  searchQuery, 
  setSearchQuery, 
  isDemoMode, 
  theme, 
  setTheme,
  onEdit,
  onDelete
}) => {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const filteredSales = sales.filter(s => 
    s.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.productName && s.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="pb-32">
      <MobileHeader 
        title="Sales" 
        showSearch 
        placeholder="Search customers or products..." 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        isDemoMode={isDemoMode}
        theme={theme}
        setTheme={setTheme}
      />
      <div className="px-5 mt-4 space-y-4">
        {filteredSales.map(s => (
          <SaleItem 
            key={s.id}
            sale={s}
            expanded={expandedSaleId === s.id}
            onExpand={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        
        {filteredSales.length === 0 && (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500 font-medium">
            No sales matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
