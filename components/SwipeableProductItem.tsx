import React, { useState, useRef } from 'react';
import { Package, Layers, ChevronDown, Tag, Edit2, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { getProductStock, getStatusFromStock } from '../utils';

interface SwipeableProductItemProps {
  product: Product;
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
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 140));
    } else if (swipeOffset > 0) {
      setSwipeOffset(Math.max(0, swipeOffset + diff));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 70) {
      setSwipeOffset(140);
    } else {
      setSwipeOffset(0);
    }
  };

  const stock = getProductStock(product);
  const status = getStatusFromStock(stock);

  return (
    <div className="relative mb-4 overflow-hidden rounded-[32px]">
      <div className="absolute inset-0 flex items-center pl-4 bg-gray-50 dark:bg-slate-800 space-x-2">
        <button 
          onClick={() => { onEdit(product); setSwipeOffset(0); }}
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={() => { onDelete(product); setSwipeOffset(0); }}
          className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onExpand(expanded ? null : product.id)}
        className="relative bg-white dark:bg-slate-900 p-4 flex flex-col border border-gray-100 dark:border-slate-800 shadow-sm transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${status === 'In Stock' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
            <Package size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{product.name}</h4>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400 dark:text-slate-500">${product.price}</p>
              {product.hasVariants && <Layers size={10} className="text-indigo-400 dark:text-indigo-500" />}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${status === 'In Stock' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'}`}>
              {stock} Qty
            </span>
            <div className={`mt-1 text-gray-300 dark:text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>

        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-gray-50 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-widest px-2">
              <span>Cost: ${product.costPrice || 'N/A'}</span>
            </div>
            
            {product.hasVariants && product.variants && product.variants.length > 0 ? (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-3 space-y-2">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1">Stock Breakdown</p>
                {product.variants.map(v => (
                  <div key={v.id} className="bg-white dark:bg-slate-800 rounded-xl p-3 flex justify-between items-center border border-indigo-100/50 dark:border-indigo-900/20">
                    <div className="flex items-center space-x-2">
                      <Tag size={12} className="text-indigo-400 dark:text-indigo-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{v.name}</span>
                    </div>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-1 rounded-md">{v.stock}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">No variants defined for this product.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};