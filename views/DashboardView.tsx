import React from 'react';
import { TrendingUp, ShoppingCart, Package, AlertCircle, ChevronRight, Megaphone } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { StatCard } from '../components/StatCard';
import { Product, Sale } from '../types';
import { getProductStock, getStatusFromStock } from '../utils';

type ThemeMode = 'light' | 'dark' | 'auto';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  stats: any;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onAlertClick: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  products, 
  stats, 
  isDemoMode, 
  theme,
  setTheme,
  onAlertClick 
}) => {
  return (
    <div className="pb-32">
      <MobileHeader 
        title="Overview" 
        searchQuery="" 
        setSearchQuery={() => {}} 
        isDemoMode={isDemoMode}
        theme={theme}
        setTheme={setTheme}
      />
      <div className="px-5 mt-4 flex overflow-x-auto space-x-4 hide-scrollbar">
        <StatCard label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard label="Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-emerald-500" />
        <StatCard label="Ad Spend" value={`$${stats.totalAdSpend.toLocaleString()}`} icon={Megaphone} color="bg-red-500" />
        <StatCard label="Stock Value" value={`$${stats.inventoryValue.toLocaleString()}`} icon={Package} color="bg-orange-500" />
      </div>
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Critical Alerts</h3>
        </div>
        <div className="space-y-3">
          {products.filter(p => getStatusFromStock(getProductStock(p)) !== 'In Stock').slice(0, 4).map(p => (
            <div key={p.id} onClick={() => onAlertClick(p.id)} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 flex items-center justify-between active:bg-gray-50 dark:active:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center"><AlertCircle size={20}/></div>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">{getProductStock(p)} left</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300 dark:text-slate-600" size={18} />
            </div>
          ))}
          {products.filter(p => getStatusFromStock(getProductStock(p)) !== 'In Stock').length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-slate-500 font-medium bg-gray-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
              All stock levels healthy ✨
            </div>
          )}
        </div>
      </div>
    </div>
  );
};