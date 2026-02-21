
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { SwipeableProductItem } from '../components/SwipeableProductItem';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock, generateCSV, downloadCSV, generateFilename } from '../utils';
import { Hash, Package, AlertTriangle, AlertCircle, DollarSign, Download, CheckCircle2, LucideIcon, TrendingUp, Percent } from 'lucide-react';
import { VirtualProductList } from '../components/VirtualProductList';
import Fuse from 'fuse.js';

type ThemeMode = 'light' | 'dark' | 'auto';
type StockFilter = 'all' | 'in' | 'low' | 'out';

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'stock-asc'
  | 'stock-desc'
  | 'value-asc'
  | 'value-desc';

type AnalysisPeriod = '7d' | '30d' | '90d';

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
    cost: 'Stock Cost',
    profit: 'Potential Profit',
    margin: 'Avg Margin %',
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
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [analysisPeriod, setAnalysisPeriod] = useState<AnalysisPeriod>('30d');
  const exportToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exportToastTimeoutRef.current) {
        clearTimeout(exportToastTimeoutRef.current);
      }
    };
  }, []);

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ['name', 'variants.name'],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) return products;

    const results = fuse.search(normalizedQuery);
    return results.map(result => result.item);
  }, [products, searchQuery, fuse]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.filter(p => {
      const stock = getProductStock(p);
      const status = getStatusFromStock(stock);

      switch (stockFilter) {
        case 'low':
          return status === 'Low Stock';
        case 'out':
          return status === 'Out of Stock';
        case 'in':
          return stock > 0 && status !== 'Low Stock';
        case 'all':
        default:
          return true;
      }
    });
  }, [filteredProducts, stockFilter]);

  const sortedProducts = useMemo(() => {
    const productsToSort = [...visibleProducts];

    productsToSort.sort((a, b) => {
      const stockA = getProductStock(a);
      const stockB = getProductStock(b);
      const valueA = stockA * a.price;
      const valueB = stockB * b.price;

      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stock-asc':
          return stockA - stockB;
        case 'stock-desc':
          return stockB - stockA;
        case 'value-asc':
          return valueA - valueB;
        case 'value-desc':
          return valueB - valueA;
        default:
          return 0;
      }
    });

    return productsToSort;
  }, [visibleProducts, sortOption]);

  const metrics = useMemo(() => {
    let totalUnits = 0;
    let lowCount = 0;
    let outCount = 0;
    let totalValue = 0;
    let totalCost = 0;

    let marginSum = 0;
    let marginCount = 0;

    visibleProducts.forEach(p => {
      const stock = getProductStock(p);
      const status = getStatusFromStock(stock);
      const price = p.price ?? 0;
      const costPrice = p.costPrice ?? 0;

      totalUnits += stock;
      totalValue += stock * price;
      totalCost += stock * costPrice;

      if (status === 'Low Stock') lowCount++;
      if (status === 'Out of Stock') outCount++;

      if (price > 0 && p.costPrice != null) {
        const marginRatio = (price - costPrice) / price;
        marginSum += marginRatio;
        marginCount++;
      }
    });

    const totalProfit = totalValue - totalCost;
    const avgMarginPct = marginCount ? (marginSum / marginCount) * 100 : 0;

    return {
      skus: visibleProducts.length,
      units: totalUnits,
      low: lowCount,
      out: outCount,
      value: totalValue,
      cost: totalCost,
      profit: totalProfit,
      marginPct: avgMarginPct
    };
  }, [visibleProducts]);

  const handleExportCSV = () => {
    if (sortedProducts.length === 0) return;

    try {
      const headers = [
        'Product Name', 
        'Price ($)', 
        'Cost Price ($)', 
        'Total Stock', 
        'Status', 
        'Variants'
      ];
      
      const rows = sortedProducts.map(p => {
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
      
      if (exportToastTimeoutRef.current) {
        clearTimeout(exportToastTimeoutRef.current);
      }

      exportToastTimeoutRef.current = setTimeout(() => {
        setShowExportSuccess(false);
        exportToastTimeoutRef.current = null;
      }, 3000);
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
          <SummaryChip 
            label={T.summary.cost} 
            value={`$${metrics.cost.toLocaleString()}`} 
            icon={DollarSign} 
            color="text-sky-600 bg-sky-50 dark:bg-sky-900/20" 
          />
          <SummaryChip 
            label={T.summary.profit} 
            value={`$${metrics.profit.toLocaleString()}`} 
            icon={TrendingUp} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" 
          />
          <SummaryChip 
            label={T.summary.margin} 
            value={`${metrics.marginPct.toFixed(1)}%`} 
            icon={Percent} 
            color="text-violet-600 bg-violet-50 dark:bg-violet-900/20" 
          />
          
          <button
            onClick={handleExportCSV}
            disabled={sortedProducts.length === 0}
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

        {/* Stock filter buttons */}
        <div className="flex space-x-2 hide-scrollbar px-1 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'in',  label: 'In Stock' },
            { key: 'low', label: 'Low Stock' },
            { key: 'out', label: 'Out of Stock' },
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setStockFilter(option.key as StockFilter)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap
                ${
                  stockFilter === option.key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort control */}
        <div className="flex items-center justify-between px-1 mt-2">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
            Sort
          </span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="stock-desc">Stock (High → Low)</option>
            <option value="stock-asc">Stock (Low → High)</option>
            <option value="value-desc">Value (High → Low)</option>
            <option value="value-asc">Value (Low → High)</option>
          </select>
        </div>

        {/* Analysis period selector */}
        <div className="flex items-center justify-between px-1 mt-2">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em]">
            Period
          </span>
          <div className="flex space-x-1">
            {(['7d', '30d', '90d'] as AnalysisPeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setAnalysisPeriod(period)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors
                  ${
                    analysisPeriod === period
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
              >
                {period.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-500 tracking-[0.2em] flex items-center px-1">
          <span className="bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded mr-2">{T.tip}</span>
          {T.stockTip}
        </div>
        
        {sortedProducts.length > 0 ? (
          <VirtualProductList 
            products={sortedProducts}
            renderProduct={(p) => (
              <SwipeableProductItem 
                key={p.id} 
                product={p} 
                sales={sales}
                adCosts={adCosts}
                analysisPeriod={analysisPeriod}
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
    <p className="text-xs font-black text-slate-900 dark:text-slate-50 truncate">
      {value}
    </p>
  </div>
);
