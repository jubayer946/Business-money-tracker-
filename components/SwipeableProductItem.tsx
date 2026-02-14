import React from 'react';
import { Package, ChevronDown, Layers } from 'lucide-react';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock } from '../utils';
import { SwipeableCard } from './SwipeableCard';

interface SwipeableProductItemProps {
  product: Product;
  sales: Sale[];
  adCosts: AdCost[];
  analysisPeriod: '1d' | '7d' | '30d';
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  expanded: boolean;
  onExpand: (id: string | null) => void;
}

export const SwipeableProductItem: React.FC<SwipeableProductItemProps> = ({ 
  product, 
  onEdit, 
  onDelete, 
  expanded, 
  onExpand 
}) => {
  const stock = getProductStock(product);
  const status = getStatusFromStock(stock);

  return (
    <SwipeableCard 
      onEdit={() => onEdit(product)} 
      onDelete={() => onDelete(product)}
      className="mb-4"
    >
      {(isSwiping) => (
        <div 
          onClick={() => !isSwiping && onExpand(expanded ? null : product.id)}
          className="p-5 flex flex-col cursor-pointer active:bg-slate-50 dark:active:bg-slate-800 transition-colors"
        >
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${status === 'In Stock' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {product.hasVariants ? <Layers size={24} /> : <Package size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">{product.name}</h4>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black">${product.price.toFixed(2)}</p>
                {product.hasVariants && (
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Variants</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{stock} Qty</span>
              <div className={`mt-1 text-gray-300 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}><ChevronDown size={14} /></div>
            </div>
          </div>

          {expanded && (
            <div className="border-t border-gray-50 dark:border-slate-800 pt-4 mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cost Price: ${product.costPrice?.toFixed(2) ?? '0.00'}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(product); }} 
                    className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Variant Breakdown</p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{v.name}</span>
                        <span className={`text-[10px] font-black ${v.stock <= 5 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{v.stock}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </SwipeableCard>
  );
};