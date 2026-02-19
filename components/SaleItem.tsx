import React from 'react';
import { DollarSign, Calendar, Hash, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { Sale } from '../types';

interface SaleItemProps {
  sale: Sale;
  expanded: boolean;
  onExpand: () => void;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}

export const SaleItem: React.FC<SaleItemProps> = ({ sale, expanded, onExpand, onEdit, onDelete }) => {
  const getStatusStyles = (status?: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'Refunded': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm transition-all overflow-hidden">
      <div 
        onClick={onExpand}
        className="p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-slate-800 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <DollarSign size={20}/>
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
              {sale.productName || 'Product'}
            </h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${getStatusStyles(sale.status)}`}>
                {sale.status || 'Paid'}
              </span>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold truncate max-w-[100px]">
                {sale.variantName ? `Variant: ${sale.variantName}` : 'Standard'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="font-black text-lg text-indigo-600 dark:text-indigo-400">${sale.amount.toFixed(2)}</p>
          <div className={`mt-1 text-gray-300 dark:text-slate-600 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-50 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
           <div className="grid grid-cols-2 gap-4 mb-5 mt-2">
              <div className="flex items-center space-x-2">
                 <Calendar size={12} className="text-indigo-400" />
                 <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-tighter">{sale.date}</span>
              </div>
              <div className="flex items-center space-x-2">
                 <Hash size={12} className="text-indigo-400" />
                 <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400">Qty: {sale.items}</span>
              </div>
              {sale.deliveryCharge && sale.deliveryCharge > 0 && (
                <div className="flex items-center space-x-2 col-span-2">
                   <DollarSign size={12} className="text-emerald-500" />
                   <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                     Delivery Charge: ${sale.deliveryCharge.toFixed(2)}
                   </span>
                </div>
              )}
           </div>

           <div className="flex space-x-3 mt-4">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(sale); }}
                className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Edit2 size={16} />
                <span className="text-xs">Edit</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(sale); }}
                className="flex-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 active:scale-95 transition-all"
              >
                <Trash2 size={16} />
                <span className="text-xs">Delete</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};