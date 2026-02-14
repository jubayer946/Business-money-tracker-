import React, { useMemo } from 'react';
import { Package, ChevronRight, TrendingDown, Target } from 'lucide-react';
import { Expense, Product, Sale } from '../types';
import { formatCurrency } from '../utils';

interface ProductExpenseSummaryProps {
  expenses: Expense[];
  products: Product[];
  sales: Sale[];
  onProductClick?: (productId: string) => void;
}

export const ProductExpenseSummary: React.FC<ProductExpenseSummaryProps> = ({
  expenses,
  products,
  sales,
  onProductClick,
}) => {
  const productStats = useMemo(() => {
    const stats: Record<string, { product: Product; expenses: number; revenue: number; roi: number; }> = {};
    
    products.forEach(product => {
      stats[product.id] = { product, expenses: 0, revenue: 0, roi: 0 };
    });

    expenses.forEach(expense => {
      if (expense.productIds && expense.productIds.length > 0) {
        const perProduct = expense.amount / expense.productIds.length;
        expense.productIds.forEach(pid => {
          if (stats[pid]) stats[pid].expenses += perProduct;
        });
      }
    });

    sales.forEach(sale => {
      const product = products.find(p => p.id === sale.productId || p.name === sale.productName);
      if (product && stats[product.id] && sale.status === 'Paid') {
        stats[product.id].revenue += sale.amount;
      }
    });

    Object.values(stats).forEach(stat => {
      if (stat.expenses > 0) {
        stat.roi = ((stat.revenue - stat.expenses) / stat.expenses) * 100;
      }
    });

    return Object.values(stats)
      .filter(s => s.expenses > 0)
      .sort((a, b) => b.expenses - a.expenses);
  }, [expenses, products, sales]);

  if (productStats.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
        <Target size={16} className="text-indigo-500" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"> Spending Efficiency </h3>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {productStats.slice(0, 5).map(({ product, expenses, revenue, roi }) => (
          <button key={product.id} onClick={() => onProductClick?.(product.id)} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-inner">
              <Package size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter"> {product.name} </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-red-500"> -{formatCurrency(expenses)} </span>
                <span className="text-slate-200 text-[10px]">→</span>
                <span className="text-[10px] font-bold text-emerald-500"> +{formatCurrency(revenue)} </span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs font-black ${roi > 0 ? 'text-emerald-500' : roi < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
              </p>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">ROI</p>
            </div>
            <ChevronRight size={14} className="text-slate-200" />
          </button>
        ))}
      </div>
    </div>
  );
};