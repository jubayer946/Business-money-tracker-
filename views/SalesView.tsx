import React, { useState, useMemo } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { SaleItem } from '../components/SaleItem';
import { Sale, SaleStatus } from '../types';
import { getLocalDateString, generateCSV, downloadCSV, generateFilename } from '../utils';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Download, 
  Check, 
  LucideIcon
} from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';
type DateRange = 'all' | 'today' | '7d' | '30d';

const T = {
  title: 'Sales History',
  placeholder: 'Search products, variants or dates...',
  noSales: 'No sales matching your search.',
  edit: 'Edit',
  delete: 'Delete',
  tip: 'Tip',
  swipeTip: 'Tap to expand • Swipe right to manage',
  exportSuccess: 'Export successful!',
  summary: {
    revenue: 'Revenue',
    orders: 'Orders',
    avg: 'Avg. Value',
    units: 'Units'
  },
  ranges: {
    all: 'All',
    today: 'Today',
    '7d': '7D',
    '30d': '30D'
  },
  actions: {
    export: 'Export CSV'
  }
};

interface SalesViewProps {
  sales: Sale[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  onActivityClick?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ 
  sales, 
  searchQuery, 
  setSearchQuery, 
  theme, 
  setTheme,
  onEdit,
  onDelete,
  onActivityClick
}) => {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');
  const [selectedStatus, setSelectedStatus] = useState<SaleStatus | 'All'>('All');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const q = searchQuery.trim().toLowerCase();

  const filteredAndSortedSales = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);

    const sevenDaysAgoStr = getLocalDateString(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoStr = getLocalDateString(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));

    return sales.filter((s) => {
      if (selectedRange === 'today' && s.date !== todayStr) return false;
      if (selectedRange === '7d' && s.date < sevenDaysAgoStr) return false;
      if (selectedRange === '30d' && s.date < thirtyDaysAgoStr) return false;

      if (selectedStatus !== 'All' && s.status !== selectedStatus) return false;

      if (!q) return true;

      const inProduct = s.productName?.toLowerCase().includes(q) ?? false;
      const inVariant = s.variantName?.toLowerCase().includes(q) ?? false;
      const inDate = s.date.toLowerCase().includes(q);

      const inItemsDetail =
        s.itemsDetail?.some((item) => {
          const inItemProduct = item.productName.toLowerCase().includes(q);
          const inItemVariant = item.variantName
            ? item.variantName.toLowerCase().includes(q)
            : false;
          return inItemProduct || inItemVariant;
        }) ?? false;

      return inProduct || inVariant || inDate || inItemsDetail;
    });
  }, [sales, q, selectedRange, selectedStatus]);

  const metrics = useMemo(() => {
    const totalRevenue = filteredAndSortedSales.reduce((sum, s) => sum + s.amount, 0);
    const totalOrders = filteredAndSortedSales.length;
    const totalItems = filteredAndSortedSales.reduce((sum, s) => sum + s.items, 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    return { totalRevenue, totalOrders, totalItems, avgOrderValue };
  }, [filteredAndSortedSales]);

  const handleExportCSV = () => {
    if (filteredAndSortedSales.length === 0) return;

    try {
      const headers = ['Date', 'Product', 'Variant', 'Units', 'Price/Unit ($)', 'Delivery ($)', 'Total Amount ($)', 'Status'];
      const rows = filteredAndSortedSales.map(s => [
        s.date,
        s.productName,
        s.variantName || 'N/A',
        s.items,
        (s.items > 0 ? (s.amount - (s.deliveryCharge || 0)) / s.items : 0).toFixed(2),
        (s.deliveryCharge || 0).toFixed(2),
        s.amount.toFixed(2),
        s.status || 'Paid'
      ]);

      const csvContent = generateCSV(headers, rows);
      const filename = generateFilename('nobabigor_sales');
      downloadCSV(filename, csvContent);
      
      setShowExportSuccess(true);
      setTimeout(() => setShowExportSuccess(false), 3000);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  const statusOptions: (SaleStatus | 'All')[] = ['All', 'Paid', 'Pending', 'Refunded'];
  const rangeOptions: DateRange[] = ['all', 'today', '7d', '30d'];

  return (
    <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <MobileHeader 
        title={T.title} 
        showSearch 
        placeholder={T.placeholder} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        theme={theme}
        setTheme={setTheme}
        onActivityClick={onActivityClick}
      />

      {showExportSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2">
            <Check size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">{T.exportSuccess}</span>
          </div>
        </div>
      )}

      <div className="px-5 mt-4 space-y-5">
        <div className="space-y-4">
          {/* Animated Indicator Date Range Filter */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex relative">
              <div 
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-out" 
                style={{ 
                  width: '25%', 
                  left: `${rangeOptions.indexOf(selectedRange) * 25}%`,
                }} 
              />
              {rangeOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRange(r)}
                  className={`flex-1 py-3 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                    selectedRange === r
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {T.ranges[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Animated Indicator Status Filter */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
            <div className="flex relative">
              <div 
                className="absolute bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-300 ease-out" 
                style={{ 
                  width: '25%', 
                  left: `${statusOptions.indexOf(selectedStatus) * 25}%`,
                }} 
              />
              {statusOptions.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-tighter transition-all duration-200 ${
                    selectedStatus === st
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 hide-scrollbar px-1 overflow-x-auto pb-1">
          <SummaryChip 
            label={T.summary.revenue} 
            value={`$${metrics.totalRevenue.toLocaleString()}`} 
            icon={TrendingUp} 
            color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" 
          />
          <SummaryChip 
            label={T.summary.orders} 
            value={metrics.totalOrders} 
            icon={ShoppingCart} 
            color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" 
          />
          <SummaryChip 
            label={T.summary.avg} 
            value={`$${metrics.avgOrderValue.toFixed(0)}`} 
            icon={DollarSign} 
            color="text-amber-600 bg-amber-50 dark:bg-amber-900/20" 
          />
          <button
            onClick={handleExportCSV}
            disabled={filteredAndSortedSales.length === 0}
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
              {T.actions.export}
            </p>
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest mr-2">
              {T.tip}
            </span>
            <span className="font-bold tracking-tight">{T.swipeTip}</span>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedSales.map(s => (
            <SaleItem 
              key={s.id}
              sale={s}
              expanded={expandedSaleId === s.id}
              onExpand={() => setExpandedSaleId(expandedSaleId === s.id ? null : s.id)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
        
        {filteredAndSortedSales.length === 0 && (
          <div className="pt-16 pb-12 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 shadow-sm mb-4">
              <DollarSign size={28} />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white mb-1">{T.noSales}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
              Try adjusting your filters to see more records.
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