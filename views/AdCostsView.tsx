import React from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { AdCost } from '../types';
import { Megaphone, Calendar } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface AdCostsViewProps {
  adCosts: AdCost[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
}

export const AdCostsView: React.FC<AdCostsViewProps> = ({ adCosts, searchQuery, setSearchQuery, isDemoMode, theme, setTheme }) => {
  const filteredAdCosts = adCosts.filter(ad => 
    ad.platform.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ad.notes && ad.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSpend = filteredAdCosts.reduce((acc, ad) => acc + ad.amount, 0);

  return (
    <div className="pb-32">
      <MobileHeader 
        title="Ad Costs" 
        showSearch 
        placeholder="Search platform or notes..." 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        isDemoMode={isDemoMode}
        theme={theme}
        setTheme={setTheme}
      />
      
      <div className="px-5 mt-4">
        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[32px] p-6 text-white mb-6 shadow-xl shadow-indigo-100 dark:shadow-none transition-colors">
          <p className="text-indigo-100 dark:text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Total Ad Investment</p>
          <h2 className="text-3xl font-black">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>

        <div className="space-y-4">
          {filteredAdCosts.map(ad => (
            <div key={ad.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{ad.platform}</h4>
                  <div className="flex items-center text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                    <Calendar size={10} className="mr-1" />
                    {ad.date}
                  </div>
                  {ad.notes && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1 italic">"{ad.notes}"</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-red-500 dark:text-red-400">-${ad.amount.toFixed(2)}</p>
              </div>
            </div>
          ))}
          
          {filteredAdCosts.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-slate-600">
                <Megaphone size={32} />
              </div>
              <p className="text-gray-400 dark:text-slate-500 font-medium">No ad costs recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};