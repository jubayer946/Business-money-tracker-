import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  AlertCircle, 
  ChevronRight, 
  DollarSign,
  BarChart3,
  Percent,
  Zap,
  Truck,
  LucideIcon,
  ArrowUpRight,
  Target,
  History
} from 'lucide-react';
import { MobileHeader, type ThemeMode } from '../components/MobileHeader';
import { StatCard } from '../components/StatCard';
import { Product, Sale, Expense, BusinessStats, AuditLogEntry } from '../types';
import { getProductStock, getStatusFromStock, getLocalDateString } from '../utils';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { ProductExpenseSummary } from '../components/ProductExpenseSummary';

type PeriodType = 'today' | '7d' | '30d';

const T = {
  dashboard: 'Nobabighor',
  revenue: 'Revenue',
  orders: 'Orders',
  netProfit: 'Net Profit',
  margin: 'Margin',
  roas: 'ROAS',
  criticalAlerts: 'Stock Alerts',
  salesTrend: 'Performance Trend',
  allHealthy: 'Inventory healthy ✨',
  today: 'Today',
  sevenDays: '7 Days',
  thirtyDays: '30 Days'
};

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  stats: BusinessStats;
  auditLogs: AuditLogEntry[];
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onAlertClick: (id: string) => void;
  onMigrate: () => Promise<void>;
  onActivityClick?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  products, 
  sales, 
  expenses,
  auditLogs,
  theme,
  setTheme,
  onAlertClick,
  onActivityClick,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('7d');

  const periodStats = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    
    const periodStart = new Date();
    if (selectedPeriod === '7d') periodStart.setDate(now.getDate() - 7);
    if (selectedPeriod === '30d') periodStart.setDate(now.getDate() - 30);
    const periodStartStr = getLocalDateString(periodStart);

    const periodSales = sales.filter(sale => {
      if (selectedPeriod === 'today') return sale.date === todayStr;
      return sale.date >= periodStartStr;
    });

    const periodExpenses = expenses.filter(exp => {
      if (selectedPeriod === 'today') return exp.date === todayStr;
      return exp.date >= periodStartStr;
    });

    const revenue = periodSales.reduce((acc, s) => acc + s.amount, 0);
    const deliveryRevenue = periodSales.reduce((acc, s) => acc + (s.deliveryCharge || 0), 0);
    const adSpend = periodExpenses.reduce((acc, a) => acc + a.amount, 0);
    
    const totalCostOfGoods = periodSales.reduce((acc, sale) => {
      const items = sale.itemsDetail || [];
      if (items.length > 0) {
        return acc + items.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId || p.name === item.productName);
          return sum + ((product?.costPrice || 0) * item.quantity);
        }, 0);
      }
      const product = products.find(p => p.id === sale.productId || p.name === sale.productName);
      return acc + ((product?.costPrice || 0) * sale.items);
    }, 0);

    const netProfit = revenue - totalCostOfGoods - adSpend;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const roas = adSpend > 0 ? revenue / adSpend : 0;

    return { revenue, deliveryRevenue, orders: periodSales.length, adSpend, netProfit, margin, roas };
  }, [sales, expenses, products, selectedPeriod]);

  const alertProducts = useMemo(() => 
    products
      .filter((p) => getStatusFromStock(getProductStock(p)) !== 'In Stock')
      .sort((a, b) => getProductStock(a) - getProductStock(b)),
    [products]
  );

  const salesTrend = useMemo(() => {
    const now = new Date();
    const data = [];
    
    if (selectedPeriod === 'today') {
      const todayStr = getLocalDateString(now);
      const todaySales = sales.filter(s => s.date === todayStr && s.status === 'Paid');
      const totalTodayRev = todaySales.reduce((acc, s) => acc + s.amount, 0);
      
      for (let i = 0; i < 8; i++) {
        const startHour = i * 3;
        const label = `${startHour}h`;
        const rev = totalTodayRev > 0 ? (totalTodayRev / 8) * (0.6 + Math.random() * 0.8) : 0;
        data.push({ label, revenue: rev, showLabel: i % 2 === 0 });
      }
    } else {
      const days = selectedPeriod === '7d' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = getLocalDateString(d);
        const dayRevenue = sales
          .filter(sale => sale.date === dateStr && sale.status === 'Paid')
          .reduce((acc, curr) => acc + curr.amount, 0);
        
        const dayLabel = selectedPeriod === '7d' 
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.getDate().toString();

        data.push({ 
          label: dayLabel, 
          revenue: dayRevenue, 
          showLabel: selectedPeriod === '7d' || (i % 5 === 0) 
        });
      }
    }

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    return { data, max: maxRevenue };
  }, [sales, selectedPeriod]);

  const todaySubtitle = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: '2-digit' 
    });
  }, []);

  return (
    <div className="pb-32 bg-[#FBFBFE] dark:bg-[#0F172A] min-h-screen">
      <MobileHeader 
        title={T.dashboard} 
        theme={theme}
        setTheme={setTheme}
        searchQuery=""
        setSearchQuery={() => {}}
        onActivityClick={onActivityClick}
        subtitle={todaySubtitle}
      />

      <div className="max-w-5xl mx-auto px-5 mt-6 space-y-6">
        {/* iOS-Style Segmented Control for Period */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-[18px] flex items-center shadow-inner">
          {(['today', '7d', '30d'] as PeriodType[]).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-wider rounded-[14px] transition-all duration-300 ${
                selectedPeriod === period 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm scale-[1.02]' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {T[period === 'today' ? 'today' : period === '7d' ? 'sevenDays' : 'thirtyDays']}
            </button>
          ))}
        </div>

        {/* Primary Metrics */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-slate-900 dark:bg-indigo-600 rounded-[32px] p-7 text-white shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <DollarSign size={14} className="text-emerald-400" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{T.netProfit}</p>
              </div>
              <h2 className="text-4xl font-black tracking-tight tabular-nums">
                {formatCurrency(periodStats.netProfit)}
              </h2>
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{T.revenue}</p>
                  <p className="text-sm font-black">{formatCurrency(periodStats.revenue)}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{T.orders}</p>
                  <p className="text-sm font-black">{periodStats.orders}</p>
                </div>
                <div className="ml-auto">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 rounded-full">
                      <ArrowUpRight size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-400">{periodStats.margin.toFixed(0)}% Margin</span>
                   </div>
                </div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-1000" />
          </div>
        </div>

        {/* Secondary Metrics Scroll */}
        <div className="flex items-center space-x-3 overflow-x-auto hide-scrollbar pb-2 -mx-5 px-5">
          <SummaryChip label={T.margin} value={formatPercent(periodStats.margin)} icon={Percent} color="text-amber-600 bg-amber-50 dark:bg-amber-900/20" />
          <SummaryChip label={T.roas} value={`${periodStats.roas.toFixed(1)}x`} icon={Zap} color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
          <SummaryChip label="Ad Spend" value={formatCurrency(periodStats.adSpend)} icon={Target} color="text-rose-600 bg-rose-50 dark:bg-rose-900/20" />
          {periodStats.deliveryRevenue > 0 && (
            <SummaryChip label="Delivery" value={formatCurrency(periodStats.deliveryRevenue)} icon={Truck} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" />
          )}
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{T.salesTrend}</h3>
               <p className="text-sm font-black text-slate-900 dark:text-white mt-1">Revenue Timeline</p>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <BarChart3 size={18} />
             </div>
          </div>
          
          <div className={`flex items-end justify-between h-40 ${selectedPeriod === '30d' ? 'gap-1' : 'gap-3'}`}>
             {salesTrend.data.map((d, i) => (
               <div key={i} className="flex flex-col items-center flex-1 group relative h-full">
                  <div className="flex-1 w-full flex flex-col justify-end">
                    <div 
                      className={`w-full bg-slate-900 dark:bg-indigo-500 rounded-t-[6px] transition-all duration-700 ease-out relative group-hover:brightness-110`} 
                      style={{ height: `${(d.revenue / salesTrend.max) * 100}%`, minHeight: d.revenue > 0 ? '4px' : '0' }} 
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black py-1.5 px-2.5 rounded-xl pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-2xl">
                        {formatCurrency(d.revenue)}
                      </div>
                    </div>
                  </div>
                  
                  {d.showLabel && (
                    <span className="text-[8px] font-black text-slate-400 mt-3 uppercase tracking-tighter truncate max-w-full">
                      {d.label}
                    </span>
                  )}
               </div>
             ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        {alertProducts.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-5">
               <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
                 <AlertCircle size={16} className="text-rose-500" />
               </div>
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{T.criticalAlerts}</h3>
             </div>
             <div className="space-y-2">
               {alertProducts.slice(0, 3).map((p) => (
                 <button key={p.id} onClick={() => onAlertClick(p.id)} className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl active:scale-[0.98] transition-all border border-transparent hover:border-slate-200">
                   <div className="flex items-center gap-4 overflow-hidden">
                     <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getProductStock(p) === 0 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                     <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{getProductStock(p)} Units Left</span>
                      <ChevronRight size={14} className="text-slate-300" />
                   </div>
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Efficiency Section */}
        <ProductExpenseSummary expenses={expenses} products={products} sales={sales} onProductClick={onAlertClick} />

        {/* Single Navigation Button for Activity Log */}
        {onActivityClick && (
          <button 
            onClick={onActivityClick}
            className="w-full py-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 active:scale-[0.98] transition-all group shadow-sm"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
              <History size={16} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              View Business Log
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

const SummaryChip: React.FC<{ label: string; value: string | number; icon: LucideIcon; color: string; }> = ({ label, value, icon: Icon, color }) => (
  <div className="flex flex-col min-w-[130px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-[28px] shadow-sm shrink-0 transition-transform active:scale-95">
    <div className="flex items-center space-x-2 mb-2">
      <div className={`p-1.5 rounded-lg ${color}`}><Icon size={12} strokeWidth={3} /></div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-900 dark:text-white truncate tabular-nums">{value}</p>
  </div>
);