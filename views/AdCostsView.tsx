
import React, { useState } from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { AdCost } from '../types';
import { AdCostItem } from '../components/AdCostItem';
import { Megaphone, Trash2, Settings2 } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

interface AdCostsViewProps {
  adCosts: AdCost[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDemoMode: boolean;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onEdit: (ad: AdCost) => void;
  onDelete: (ad: AdCost) => void;
  onBulkDelete: (ids: string[]) => void;
  onManagePlatforms: () => void;
}

export const AdCostsView: React.FC<AdCostsViewProps> = ({ 
  adCosts, 
  searchQuery, 
  setSearchQuery, 
  isDemoMode, 
  theme, 
  setTheme,
  onEdit,
  onDelete,
  onBulkDelete,
  onManagePlatforms
}) => {
  const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAdCosts = adCosts.filter(ad => 
    ad.platform.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ad.notes && ad.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalSpend = filteredAdCosts.reduce((acc, ad) => acc + ad.amount, 0);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-1">
             <button 
               onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isSelectionMode ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
             >
               View
             </button>
             <button 
               onClick={() => setIsSelectionMode(true)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSelectionMode ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
             >
               Select
             </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSelectionMode && selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 bg-red-500 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >
                <Trash2 size={14} />
                <span>Delete ({selectedIds.length})</span>
              </button>
            )}
            <button 
              onClick={onManagePlatforms}
              className="flex items-center space-x-2 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              <Settings2 size={14} />
              <span>Platforms</span>
            </button>
          </div>
        </div>

        <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[32px] p-6 text-white mb-6 shadow-xl shadow-indigo-100 dark:shadow-none transition-colors">
          <p className="text-indigo-100 dark:text-indigo-200 text-xs font-black uppercase tracking-widest mb-1">Total Ad Investment</p>
          <h2 className="text-3xl font-black">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
        </div>

        <div className="space-y-4">
          {filteredAdCosts.map(ad => (
            <AdCostItem 
              key={ad.id}
              adCost={ad}
              expanded={expandedAdId === ad.id}
              onExpand={() => setExpandedAdId(expandedAdId === ad.id ? null : ad.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.includes(ad.id)}
              onToggleSelection={toggleSelection}
            />
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
