import React, { useState, useMemo } from 'react';
import { MobileHeader, type ThemeMode } from '../components/MobileHeader';
import { AdCampaign, Sale } from '../types';
import { 
  Megaphone, 
  Settings2, 
  Trash2, 
  BarChart3, 
  Activity, 
  Calendar,
  LucideIcon 
} from 'lucide-react';
import { getLocalDateString } from '../utils';

type DateRange = 'all' | 'today' | '7d' | '30d' | 'month';

const T = {
  title: 'Marketing & Ads',
  placeholder: 'Search campaigns...',
  platforms: 'Platforms',
  totalLabel: 'Marketing Investment',
  noAds: 'No active campaigns found.',
  tip: 'Performance',
  swipeTip: 'Track ROAS and engagement metrics per campaign',
  ranges: {
    all: 'All',
    today: 'Today',
    '7d': '7D',
    '30d': '30D',
    month: 'Month'
  }
};

interface AdsViewProps {
  ads: AdCampaign[];
  sales: Sale[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onDelete: (ad: AdCampaign) => void;
  onManagePlatforms: () => void;
}

export const AdsView: React.FC<AdsViewProps> = ({ 
  ads, 
  sales,
  searchQuery, 
  setSearchQuery, 
  theme, 
  setTheme,
  onDelete,
  onManagePlatforms
}) => {
  const [selectedRange, setSelectedRange] = useState<DateRange>('all');

  const filteredAds = useMemo(() => {
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

    return ads.filter((ad) => {
      // Date filter
      if (selectedRange !== 'all') {
        const adStart = ad.date;
        const adEnd = ad.endDate || ad.date;
        const isInRange = adStart <= periodEndStr && adEnd >= periodStartStr;
        if (!isInRange) return false;
      }

      // Text search filter
      if (!q) return true;
      return (
        ad.name.toLowerCase().includes(q) || 
        ad.platform.toLowerCase().includes(q)
      );
    });
  }, [ads, searchQuery, selectedRange]);

  const totalSpend = useMemo(() => 
    filteredAds.reduce((acc, ad) => acc + ad.amount, 0), 
  [filteredAds]);

  const totalRevenue = useMemo(() => 
    sales.reduce((acc, s) => acc + (s.status === 'Paid' ? s.amount : 0), 0),
  [sales]);

  const globalRoas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(1) : '0.0';

  return (
    <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <MobileHeader 
        title={T.title} 
        showSearch 
        placeholder={T.placeholder} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        theme={theme}
        setTheme={setTheme}
      />
      
      <div className="px-5 mt-4 space-y-4">
        {/* Ad Performance Summary */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard 
            label="Selected Period" 
            value={`$${totalSpend.toLocaleString()}`} 
            icon={BarChart3} 
            color="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30" 
          />
          <SummaryCard 
            label="Global ROAS" 
            value={`${globalRoas}x`} 
            icon={Activity} 
            color="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" 
          />
        </div>

        {/* Date Range Selector */}
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
          <button 
            onClick={onManagePlatforms}
            className="flex items-center space-x-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <Settings2 size={14} />
            <span>{T.platforms}</span>
          </button>
        </div>

        <div className="space-y-4">
          {filteredAds.map((ad) => {
            const dateRange = ad.endDate && ad.endDate !== ad.date
              ? `${ad.date} — ${ad.endDate}`
              : ad.date;

            const ctr = ad.impressions ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(1) : '0.0';

            return (
              <div key={ad.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Megaphone size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-50 leading-tight text-sm truncate pr-4">
                        {ad.name}
                      </h4>
                      <div className="flex items-center mt-0.5 space-x-2">
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tight">{ad.platform}</p>
                        <span className="text-[9px] text-slate-300">•</span>
                        <div className="flex items-center text-[9px] text-slate-400 font-bold">
                          <Calendar size={10} className="mr-1" />
                          {dateRange}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                       ad.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                     }`}>
                       {ad.status}
                     </span>
                     <div className="flex space-x-2 mt-2">
                       <button 
                        onClick={() => onDelete(ad)}
                        className="text-slate-300 hover:text-red-500 p-1 active:scale-90 transition-transform"
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                   <MetricCell label="Spent" value={`$${ad.amount.toFixed(2)}`} />
                   <MetricCell label="Clicks" value={String(ad.clicks || 0)} />
                   <MetricCell label="CTR" value={`${ctr}%`} highlight />
                </div>
              </div>
            );
          })}
          
          {filteredAds.length === 0 && (
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

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-900 rounded-[32px] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
    <div className="flex items-center space-x-2 mb-1">
      <div className={`p-1 rounded-lg ${color}`}>
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">
        {label}
      </span>
    </div>
    <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
  </div>
);

interface MetricCellProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const MetricCell: React.FC<MetricCellProps> = ({ label, value, highlight }) => (
  <div>
    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className={`text-xs font-bold tabular-nums ${
      highlight 
        ? 'text-indigo-600 dark:text-indigo-400' 
        : 'text-slate-900 dark:text-white'
    }`}>
      {value}
    </p>
  </div>
);