
import React from 'react';
import { Megaphone, Calendar, FileText, Edit2, Trash2, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';
import { AdCost } from '../types';

interface AdCostItemProps {
  adCost: AdCost;
  expanded: boolean;
  onExpand: () => void;
  onEdit: (adCost: AdCost) => void;
  onDelete: (adCost: AdCost) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const AdCostItem: React.FC<AdCostItemProps> = ({ 
  adCost, 
  expanded, 
  onExpand, 
  onEdit, 
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection
}) => {
  const handleClick = () => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(adCost.id);
    } else {
      onExpand();
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[32px] border ${isSelected ? 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/10' : 'border-gray-100 dark:border-slate-800'} shadow-sm transition-all overflow-hidden transition-colors`}>
      <div 
        onClick={handleClick}
        className={`p-5 flex justify-between items-center ${isSelectionMode ? '' : 'active:bg-gray-50 dark:active:bg-slate-800'} transition-colors cursor-pointer`}
      >
        <div className="flex items-center space-x-4">
          {isSelectionMode && (
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-slate-700'}`}>
              {isSelected && <CheckCircle2 size={14} />}
            </div>
          )}
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Megaphone size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{adCost.platform}</h4>
            <div className="flex items-center space-x-1 mt-0.5">
               <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">{adCost.date}</p>
               {adCost.endDate && (
                 <>
                   <ArrowRight size={8} className="text-gray-300" />
                   <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">{adCost.endDate}</p>
                 </>
               )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="font-black text-lg text-red-500 dark:text-red-400">-${adCost.amount.toFixed(2)}</p>
          {!isSelectionMode && (
            <div className={`mt-1 text-gray-300 dark:text-slate-600 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} />
            </div>
          )}
        </div>
      </div>

      {expanded && !isSelectionMode && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-50 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
           <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-4 mb-5 mt-2 space-y-3">
              <div className="flex items-start space-x-2">
                 <Calendar size={14} className="text-indigo-400 mt-0.5" />
                 <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                       {adCost.endDate ? 'Period' : 'Transaction Date'}
                    </p>
                    <p className="text-xs font-bold text-gray-700 dark:text-slate-300">
                       {adCost.date} {adCost.endDate ? `to ${adCost.endDate}` : ''}
                    </p>
                 </div>
              </div>
              {adCost.notes && (
                <div className="flex items-start space-x-2">
                   <FileText size={14} className="text-indigo-400 mt-0.5" />
                   <div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Notes</p>
                      <p className="text-xs font-medium text-gray-600 dark:text-slate-400 italic">"{adCost.notes}"</p>
                   </div>
                </div>
              )}
           </div>

           <div className="flex space-x-3">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(adCost); }}
                className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Edit2 size={16} />
                <span className="text-sm">Edit</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(adCost); }}
                className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Trash2 size={16} />
                <span className="text-sm">Delete</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
