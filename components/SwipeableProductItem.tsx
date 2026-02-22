import React from 'react';
import { Package, ChevronDown, Layers } from 'lucide-react';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock } from '../utils';
import { SwipeableCard } from './SwipeableCard';

interface SwipeableProductItemProps {
  product: Product;
  sales: Sale[];
  adCosts: AdCost[];
  analysisPeriod: '7d' | '30d' | '90d';
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

  const price = product.price ?? 0;
  const costPrice = product.costPrice ?? null;

  const marginPerUnit =
    costPrice != null ? price - costPrice : null;

  const marginPct =
    marginPerUnit != null && price > 0
      ? (marginPerUnit / price) * 100
      : null;

  const inventoryValue = stock * price;
  const isOut = status === 'Out of Stock';
  const isLow = status === 'Low Stock';

  return (
    <SwipeableCard 
      onEdit={() => onEdit(product)} 
      onDelete={() => onDelete(product)}
      className="mb-1"
    >
      {(isSwiping) => (
        <div
          onClick={() => !isSwiping && onExpand(expanded ? null : product.id)}
          className="px-3 py-2.5 flex flex-col cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 active:bg-slate-50 dark:active:bg-slate-800 transition-colors rounded-xl"
        >
          {/* Collapsed analytical row */}
          <div className="flex items-start gap-3">
            {/* Small icon */}
            <div className="mt-0.5 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              {product.hasVariants ? <Layers size={16} /> : <Package size={16} />}
            </div>

            <div className="flex-1 min-w-0">
              {/* First line: Name + Stock + Chevron */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate mr-2">
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {stock} units
                  </span>
                  <div
                    className={`text-gray-300 transition-transform duration-300 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                  >
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Second line: Price, Margin, Value, Status */}
              <div className="mt-0.5 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                  <span>
                    ${price.toFixed(2)}
                  </span>
                  {marginPct != null && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {marginPct.toFixed(1)}% margin
                    </span>
                  )}
                  <span>
                    Value: ${inventoryValue.toFixed(2)}
                  </span>
                  {product.hasVariants && (
                    <span className="uppercase tracking-wide text-[10px]">
                      Variants
                    </span>
                  )}
                </div>
                <span
                  className={`ml-3 shrink-0 text-[10px] font-semibold ${
                    isOut
                      ? 'text-red-500'
                      : isLow
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    Cost: ${costPrice != null ? costPrice.toFixed(2) : '0.00'}
                  </span>
                  {marginPerUnit != null && marginPct != null && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Margin per unit: ${marginPerUnit.toFixed(2)} ({marginPct.toFixed(1)}%)
                    </span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(product); }} 
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase"
                >
                  Edit
                </button>
              </div>

              {product.hasVariants && product.variants && product.variants.length > 0 && (
                <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 space-y-2">
                  <p className="text-[9px] font-semibold uppercase text-slate-400 tracking-wide">
                    Variant breakdown
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {product.variants.map((v) => {
                      const variantProfit =
                        marginPerUnit != null ? marginPerUnit * v.stock : null;
                      const isVariantLow = v.stock <= 5;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {v.name}
                            </span>
                            {variantProfit != null && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                ${variantProfit.toFixed(2)} profit
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-semibold ${
                              isVariantLow
                                ? 'text-red-500'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {v.stock}
                          </span>
                        </div>
                      );
                    })}
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
