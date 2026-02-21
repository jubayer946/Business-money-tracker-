
import React, { useMemo, useState } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { SwipeableProductItem } from '../components/SwipeableProductItem';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock, generateCSV, downloadCSV, generateFilename } from '../utils';
import { Hash, Package, AlertTriangle, AlertCircle, DollarSign, Download, CheckCircle2, LucideIcon } from 'lucide-react';
import { VirtualProductList } from '../components/VirtualProductList';

type ThemeMode = 'light' | 'dark' | 'auto';

const T = {
  inventory: 'Stock Management',
  placeholder: 'Search name or variants...',
  tip: 'Tip',
  stockTip: 'Tap to expand • Swipe right to manage',
  noItems: 'No items found in inventory.',
  exportSuccess: 'Export successful!',
  summary: {
    skus: 'Total SKUs',
    units: 'Total Units',
    low: 'Low Stock',
    out: 'Out of Stock',
    value: 'Stock Value',
    export: 'Export CSV'
  }
};

interface InventoryViewProps {
  products: Product[];
  sales: Sale[];
  adCosts: AdCost[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  expandedProductId: string | null;
  setExpandedProductId: (id: string | null) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onActivityClick?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ 
  products, 
  sales,
  adCosts,
  searchQuery, 
  setSearchQuery, 
  theme,
  setTheme,
  expandedProductId, 
  setExpandedProductId,
  onEdit,
  onDelete,
  onActivityClick
}) => {
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const inName = p.name.toLowerCase().includes(normalizedQuery);
      const inVariants = p.hasVariants && p.variants
        ? p.variants.some((v) => v.name.toLowerCase().includes(normalizedQuery))
        : false;
      return !normalizedQuery || inName || inVariants;
    });
  }, [products, searchQuery]);

  const metrics = useMemo(() => {
    let totalUnits = 0;
    let lowCount = 0;
    let outCount = 0;
    let totalValue = 0;

    filteredProducts.forEach(p => {
      const stock = getProductStock(p);
      const status = getStatusFromStock(stock);
      totalUnits += stock;
      totalValue += (stock * p.price);
      if (status === 'Low Stock') lowCount++;
      if (status === 'Out of Stock') outCount++;
    });

    return {
      skus: filteredProducts.length,
      units: totalUnits,
      low: lowCount,
      out: outCount,
      value: totalValue
    };
  }, [filteredProducts]);

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;

    try {
      const headers = [
        'Product Name', 
        'Price ($)', 
        'Cost Price ($)', 
        'Total Stock', 
        'Status', 
        'Variants'
      ];
      
      const rows = filteredProducts.map(p => {
        const stock = getProductStock(p);
        const variantsStr = p.hasVariants && p.variants 
          ? p.variants.map(v => `${v.name}: ${v.stock}`).join(' | ')
          : 'N/A';
        
        return [
          p.name,
          p.price.toFixed(2),
          (p.costPrice ?? 0).toFixed(2),
          stock,
          getStatusFromStock(stock),
          variantsStr
        ];
      });

      // Secure CSV generation
      const csvContent = generateCSV(headers, rows);
      
      // Download with cleanup
      const filename = generateFilename('bizmaster_inventory');
      downloadCSV(filename, csvContent);
      
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <MobileHeader 
        title={T.inventory} 
        showSearch 
        placeholder={T.placeholder} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        theme={theme}
        setTheme={setTheme}
        onActivityClick={onActivityClick}
      />
      
      {/* Export Success Toast */}
      {showExportSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
            <CheckCircle2 size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">{T.exportSuccess}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-5 mt-4 space-y-5">
        <div className="flex items-center space-x-3 hide-scrollbar px-1 overflow-x-auto pb-1">
          <SummaryChip 
            label={T.summary.skus} 
            value={metrics.skus} 
            icon={Hash} 
            color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
          />
          <SummaryChip 
            label={T.summary.units} 
            value={metrics.units} 
            icon={Package} 
            color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
          />
          <SummaryChip 
            label={T.summary.low} 
            value={metrics.low} 
            icon={AlertTriangle} 
            color="text-amber-600 bg-amber-50 dark:bg-amber-900/20" 
          />
          <SummaryChip 
            label={T.summary.out} 
            value={metrics.out} 
            icon={AlertCircle} 
            color="text-red-600 bg-red-50 dark:bg-red-900/20" 
          />
          <SummaryChip 
            label={T.summary.value} 
            value={`$${metrics.value.toLocaleString()}`} 
            icon={DollarSign} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" 
          />
          
          <button
            onClick={handleExportCSV}
            disabled={filteredProducts.length === 0}
            className="flex flex-col min-w-[110px] bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/30 p-3 rounded-2xl shadow-sm transition-all active:scale-95 disabled:opacity-40 group shrink-0"
          >
            <div className="flex items-center space-x-1.5 mb-1.5">
              <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 group-active:scale-90 transition-transform">
                <Download size={12} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-black uppercase text-indigo-400 dark:text-indigo-500 tracking-wider">
                Action
              </span>
            </div>
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate">
              {T.summary.export}
            </p>
          </button>
        </div>

        <div className="mb-4 text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-500 tracking-[0.2em] flex items-center px-1">
          <span className="bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded mr-2">{T.tip}</span>
          {T.stockTip}
        </div>
        
        {filteredProducts.length > 0 ? (
          <VirtualProductList 
            products={filteredProducts}
            renderProduct={(p) => (
              <SwipeableProductItem 
                key={p.id} 
                product={p} 
                sales={sales}
                adCosts={adCosts}
                analysisPeriod="30d"
                expanded={expandedProductId === p.id}
                onExpand={setExpandedProductId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
            itemHeight={90}
          />
        ) : (
          <div className="py-16 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm mb-4">
              <Package size={28} />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">{T.noItems}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
              No products match these filters. Try changing your selection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SummaryChipProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

const SummaryChip: React.FC<SummaryChipProps> = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col min-w-[110px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-2xl shadow-sm transition-colors shrink-0">
    <div className="flex items-center space-x-1.5 mb-1.5">
      <div className={`p-1 rounded-lg ${color}`}>
        <Icon size={12} strokeWidth={2.5} />
      </div>
      <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
        {label}
      </span>
    </div>
    <p className="text-xs font-black text-slate-900 dark:text-slate-5 truncate">
      {value}
    </p>
  </div>
);
