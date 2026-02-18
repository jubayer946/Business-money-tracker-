import React, { useMemo } from 'react';
import { Package, ChevronRight, Target } from 'lucide-react';
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
      <div className="px-7 py-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Target size={14} className="text-indigo-500" />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spending Efficiency</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {productStats.slice(0, 5).map(({ product, expenses, revenue, roi }) => (
          <button key={product.id} onClick={() => onProductClick?.(product.id)} className="w-full px-7 py-5 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-[18px] flex items-center justify-center text-slate-400 shadow-inner group-active:scale-95 transition-transform">
              <Package size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 dark:text-white truncate uppercase tracking-tight"> {product.name} </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-rose-500"> {formatCurrency(expenses)} spent </span>
                <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-emerald-500"> {formatCurrency(revenue)} return </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-xs font-black px-2.5 py-1 rounded-full ${roi > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mt-1">ROI</p>
            </div>
            <ChevronRight size={16} className="text-slate-200 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};