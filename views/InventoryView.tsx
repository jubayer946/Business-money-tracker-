
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { MobileHeader, type ThemeMode } from '../components/MobileHeader';
import { SwipeableProductItem } from '../components/SwipeableProductItem';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock, generateCSV, downloadCSV, generateFilename } from '../utils';
import { Hash, Package, AlertTriangle, AlertCircle, DollarSign, Download, CheckCircle2, LucideIcon, TrendingUp, Percent } from 'lucide-react';
import { VirtualProductList } from '../components/VirtualProductList';
import Fuse from 'fuse.js';

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
  },
  empty: {
    noProductsTitle: 'No products yet',
    noProductsDescription:
      'Add your first product to start tracking your inventory and performance.',
    noMatchTitle: 'No matching products',
    noMatchDescription:
      'No products match your search or filters. Try clearing them.',
    clearFilters: 'Clear filters'
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

  const hasProducts = products.length > 0;

  const handleClearFilters = () => {
    setSearchQuery('');
    setStockFilter('all');
    setSortOption('name-asc');
  };

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

      <div className="max-w-5xl mx-auto px-5 mt-4 space-y-4">
        {/* NEW: dashboard-style stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DashboardStatCard
            label="Inventory value"
            value={`$${metrics.value.toLocaleString()}`}
            description="At selling price"
          />
          <DashboardStatCard
            label="Total units"
            value={metrics.units.toLocaleString()}
            description={`${metrics.skus} SKUs`}
          />
          <DashboardStatCard
            label="Low stock"
            value={metrics.low.toString()}
            description="Items needing restock"
          />
          <DashboardStatCard
            label="Out of stock"
            value={metrics.out.toString()}
            description="Items unavailable"
          />
        </div>

        {/* Export button row */}
        <div className="flex justify-end">
          <button
            onClick={handleExportCSV}
            disabled={sortedProducts.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-transform"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

      {/* Filter + Sort toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Stock filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'in',  label: 'In Stock' },
              { key: 'low', label: 'Low Stock' },
              { key: 'out', label: 'Out of Stock' },
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setStockFilter(option.key as StockFilter)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors
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
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-[0.15em]">
              Sort
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="stock-desc">Stock (High → Low)</option>
              <option value="stock-asc">Stock (Low → High)</option>
              <option value="value-desc">Value (High → Low)</option>
              <option value="value-asc">Value (Low → High)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Tip line inside the toolbar */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[9px] font-semibold uppercase text-indigo-500 dark:text-indigo-300 tracking-[0.15em]">
              {T.tip}
            </span>
            <span>{T.stockTip}</span>
          </div>

          {/* Analysis period selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-[0.1em]">
              Period
            </span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
              {(['7d', '30d', '90d'] as AnalysisPeriod[]).map(period => (
                <button
                  key={period}
                  onClick={() => setAnalysisPeriod(period)}
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all
                    ${
                      analysisPeriod === period
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
        
        {hasProducts ? (
          // Case 2: Products exist, but filters/search show none
          sortedProducts.length > 0 ? (
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
              <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {T.empty.noMatchTitle}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
                {T.empty.noMatchDescription}
              </p>
              {searchQuery && (
                <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 max-w-[220px] truncate">
                  Search: “{searchQuery}”
                </p>
              )}
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow-sm active:scale-95 transition-transform"
              >
                {T.empty.clearFilters}
              </button>
            </div>
          )
        ) : (
          // Case 1: No products at all
          <div className="py-16 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm mb-4">
              <Package size={28} />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {T.empty.noProductsTitle}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] leading-relaxed">
              {T.empty.noProductsDescription}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardStatCardProps {
  label: string;
  value: string;
  description?: string;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  value,
  description,
}) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3.5 py-3 flex flex-col justify-between">
    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
      {label}
    </span>
    <span className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
      {value}
    </span>
    {description && (
      <span className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
        {description}
      </span>
    )}
  </div>
);
