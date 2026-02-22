import React, { useState, useMemo } from 'react';
import { MobileHeader, type ThemeMode } from '../components/MobileHeader';
import { AdCost, Sale } from '../types';
import { AdCostItem } from '../components/AdCostItem';
import { 
  Megaphone, 
  Settings2, 
  Hash, 
  TrendingDown, 
  Download, 
  Check, 
  CheckCircle2,
  LucideIcon,
  ArrowUpDown 
} from 'lucide-react';
import { getLocalDateString, generateCSV, downloadCSV, generateFilename } from '../utils';

type DateRange = 'all' | 'today' | '7d' | '30d' | 'month';

const T = {
  title: 'Business Expenses',
  placeholder: 'Search platform, category or notes...',
  platforms: 'Platforms',
  totalLabel: 'Total Business Investment',
  noAds: 'No expenses recorded yet.',
  tip: 'Tip',
  swipeTip: 'Tap to expand • Swipe right to edit or delete',
  exportSuccess: 'Export successful!',
  ranges: {
    all: 'All',
    today: 'Today',
    '7d': '7D',
    '30d': '30D',
    month: 'Month'
  },
  actions: {
    export: 'Export CSV'
  }
};

interface AdCostsViewProps {
  adCosts: AdCost[];
  sales: Sale[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onEdit: (ad: AdCost) => void;
  onDelete: (ad: AdCost) => void;
  onManagePlatforms: () => void;
}

export const AdCostsView: React.FC<AdCostsViewProps> = ({ 
  adCosts, 
  sales,
  searchQuery, 
  setSearchQuery, 
  theme, 
  setTheme,
  onEdit,
  onDelete,
  onManagePlatforms
}) => {
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');
  const [showExportSuccess, setShowExportSuccess] = useState(false);

  const filteredAndSortedAdCosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayStr = getLocalDateString(now);

    let periodStartStr = '';
    let periodEndStr = todayStr;

    if (selectedRange === '7d') {
      const d = new Date();
      d.setDate(now.getDate() - 7);
      periodStartStr = getLocalDateString(d);
    } else if (selectedRange === '30d') {
      const d = new Date();
      d.setDate(now.getDate() - 30);
      periodStartStr = getLocalDateString(d);
    } else if (selectedRange === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      periodStartStr = getLocalDateString(d);
    } else if (selectedRange === 'today') {
      periodStartStr = todayStr;
    }

    return adCosts.filter((ad) => {
      // Date filter
      if (selectedRange !== 'all') {
        const adStart = ad.date;
        const adEnd = ad.endDate || ad.date;
        const isInRange = adStart <= periodEndStr && adEnd >= periodStartStr;
        if (!isInRange) return false;
      }

      // Text Search Filter
      if (!q) return true;
      return (
        ad.platform.toLowerCase().includes(q) ||
        (ad.notes || '').toLowerCase().includes(q)
      );
    });
  }, [adCosts, searchQuery, selectedRange]);

  const totalSpend = useMemo(() => 
    filteredAndSortedAdCosts.reduce((acc, ad) => acc + ad.amount, 0), 
  [filteredAndSortedAdCosts]);

  const handleExportCSV = () => {
    if (filteredAndSortedAdCosts.length === 0) return;

    try {
      const headers = [
        'Date', 
        'Platform', 
        'Amount ($)', 
        'Notes'
      ];
      
      const rows = filteredAndSortedAdCosts.map(ad => [
        ad.date,
        ad.platform,
        ad.amount.toFixed(2),
        ad.notes || 'N/A'
      ]);

      // Secure CSV generation
      const csvContent = generateCSV(headers, rows);
      
      // Download with cleanup
      const filename = generateFilename('bizmaster_expenses');
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
        title={T.title} 
        showSearch 
        placeholder={T.placeholder} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        theme={theme}
        setTheme={setTheme}
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
      
      <div className="px-5 mt-4 space-y-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100/60 dark:shadow-none transition-colors">
          <p className="text-indigo-100 dark:text-indigo-200 text-[11px] font-black uppercase tracking-[0.22em] mb-1">
            {T.totalLabel}
          </p>
          <h2 className="text-3xl font-black">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="flex p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
          {(['all', 'today', '7d', '30d', 'month'] as DateRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRange(r)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedRange === r
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {T.ranges[r]}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center text-[10px] text-slate-500 dark:text-slate-400">
            <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-black uppercase tracking-widest mr-2">
              {T.tip}
            </span>
            <span className="font-bold tracking-tight">{T.swipeTip}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleExportCSV}
              disabled={filteredAndSortedAdCosts.length === 0}
              className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm active:scale-95 disabled:opacity-40 transition-all"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            <button 
              onClick={onManagePlatforms}
              className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <Settings2 size={14} />
              <span>{T.platforms}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAndSortedAdCosts.map((ad) => (
            <AdCostItem 
              key={ad.id}
              adCost={ad}
              expanded={expandedAdId === ad.id}
              onExpand={() => setExpandedAdId(expandedAdId === ad.id ? null : ad.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              sales={sales}
              adCosts={adCosts}
            />
          ))}
          
          {filteredAndSortedAdCosts.length === 0 && (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3 animate-in fade-in">
              <Megaphone size={28} className="opacity-20" />
              <p className="text-sm font-medium">{T.noAds}</p>
            </div>
          )}
        </div>
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