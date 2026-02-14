import React from 'react';
import { Megaphone, Calendar, FileText, ChevronDown } from 'lucide-react';
import { AdCost, Sale } from '../types';
import { SwipeableCard } from './SwipeableCard';

interface AdCostItemProps {
  adCost: AdCost;
  sales: Sale[];
  adCosts: AdCost[];
  expanded: boolean;
  onExpand: () => void;
  onEdit: (adCost: AdCost) => void;
  onDelete: (adCost: AdCost) => void;
}

export const AdCostItem: React.FC<AdCostItemProps> = ({
  adCost,
  expanded,
  onExpand,
  onEdit,
  onDelete,
}) => {
  const dateDisplay = adCost.endDate && adCost.endDate !== adCost.date
    ? `${adCost.date} — ${adCost.endDate}`
    : adCost.date;

  return (
    <SwipeableCard 
      onEdit={() => onEdit(adCost)} 
      onDelete={() => onDelete(adCost)}
      className="mb-3"
    >
      {(isSwiping) => (
        <div
          onClick={() => !isSwiping && onExpand()}
          className="outline-none cursor-pointer"
        >
          <div className="p-5 flex justify-between items-center active:bg-slate-50 dark:active:bg-slate-800 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Megaphone size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-50 leading-tight text-sm">
                  {adCost.platform}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  {dateDisplay}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-lg text-red-500 dark:text-red-400">
                -${adCost.amount.toFixed(2)}
              </p>
              <div className={`mt-1 inline-block text-slate-300 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {expanded && (
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-end space-x-2 mb-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(adCost); }} 
                  className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-600 bg-indigo-50 active:bg-indigo-100"
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(adCost); }} 
                  className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-red-200 text-red-600 bg-red-50 active:bg-red-100"
                >
                  Delete
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-start space-x-2">
                  <Calendar size={14} className="text-indigo-400" />
                  <div className="flex-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Investment Period</p>
                     <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {adCost.date} {adCost.endDate && adCost.endDate !== adCost.date ? `to ${adCost.endDate}` : '(One-day)'}
                     </p>
                  </div>
                </div>
                {adCost.notes && (
                  <div className="flex items-start space-x-2">
                    <FileText size={14} className="text-indigo-400" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notes</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">"{adCost.notes}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </SwipeableCard>
  );
};