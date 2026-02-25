import React from 'react';
import { Package, ChevronDown, Layers } from 'lucide-react';
import { Product, Sale, AdCost } from '../types';
import { getProductStock, getStatusFromStock } from '../utils';
import { SwipeableCard } from './SwipeableCard';

interface SwipeableProductItemProps {
  product: Product;
  sales: Sale[];
  adCosts: AdCost[];              // this is your expenses array from App
  analysisPeriod: '7d' | '30d' | '90d'; // we won't use this for margin anymore
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  expanded: boolean;
  onExpand: (id: string | null) => void;
}

export const SwipeableProductItem: React.FC<SwipeableProductItemProps> = ({ 
  product, 
  sales,
  adCosts,
  onEdit, 
  onDelete, 
  expanded, 
  onExpand 
}) => {
  const stock = getProductStock(product);
  const status = getStatusFromStock(stock);

  const price = product.price ?? 0;
  const costPrice = product.costPrice ?? 0;

  // 1) Total ad spend for this product (all time, no period)
  const totalAdSpendForProduct = adCosts
    .filter(exp => Array.isArray(exp.productIds) && exp.productIds.includes(product.id))
    .reduce((sum, exp) => sum + (exp.amount ?? 0), 0);

  // 2) Total units sold for this product (all time)
  const totalUnitsSoldForProduct = sales
    .filter(sale => sale.productId === product.id)
    .reduce((sum, sale) => sum + (sale.items ?? 0), 0);

  // 3) Ad cost per unit (lifetime). If no sales yet, treat as 0.
  const adCostPerUnit =
    totalUnitsSoldForProduct > 0
      ? totalAdSpendForProduct / totalUnitsSoldForProduct
      : 0;

  // 4) Gross margin (without ads)
  const grossMarginPerUnit = price - costPrice;
  const grossMarginPct =
    price > 0 ? (grossMarginPerUnit / price) * 100 : 0;

  // 5) Net margin after ads (what you care about)
  const netMarginPerUnit = price - costPrice - adCostPerUnit;
  const netMarginPct =
    price > 0 ? (netMarginPerUnit / price) * 100 : 0;

  const inventoryValue = stock * price;
  const isOut = status === 'Out of Stock';
  const isLow = status === 'Low Stock';

  return (
    <SwipeableCard 
      onEdit={() => onEdit(product)} 
      onDelete={() => onDelete(product)}
      className="mb-2"
    >
      {(isSwiping) => (
        <div 
          onClick={() => !isSwiping && onExpand(expanded ? null : product.id)}
          className="px-3 py-3 flex flex-col cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/60 active:bg-slate-50 dark:active:bg-slate-800 transition-colors rounded-xl"
        >
          {/* Top row: name + key stats */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              {product.hasVariants ? <Layers size={16} /> : <Package size={16} />}
            </div>

            <div className="flex-1 min-w-0">
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

              <div className="mt-0.5 flex items-center justify-between text-[11px]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400">
                  <span>${price.toFixed(2)}</span>
                  <span>Gross: {grossMarginPct.toFixed(1)}%</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    After ads: {netMarginPct.toFixed(1)}%
                  </span>
                  <span>Value: ${inventoryValue.toFixed(2)}</span>
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
                    Cost price: ${costPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    Ad cost / unit: ${adCostPerUnit.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Gross margin: ${grossMarginPerUnit.toFixed(2)} ({grossMarginPct.toFixed(1)}%)
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Margin after ads: ${netMarginPerUnit.toFixed(2)} ({netMarginPct.toFixed(1)}%)
                  </span>
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
                      const isVariantLow = v.stock <= 5;
                      // For variants, we reuse netMarginPerUnit as per-unit margin after ads
                      const variantProfit =
                        netMarginPerUnit * v.stock;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700"
                        >
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {v.name}
                            </span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                              ${variantProfit.toFixed(2)} profit (after ads)
                            </span>
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
