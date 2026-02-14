import { useMemo } from 'react';
import { Product, Sale, Expense } from '../types';
import { getLocalDateString, getDaysAgo } from '../utils';

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'action';
  title: string;
  description: string;
  metric?: string;
  action?: () => void;
}

export const useBusinessInsights = (
  products: Product[],
  sales: Sale[],
  expenses: Expense[]
): Insight[] => {
  return useMemo(() => {
    const insights: Insight[] = [];
    const today = getLocalDateString();
    const sevenDaysAgo = getDaysAgo(7);
    const fourteenDaysAgo = getDaysAgo(14);

    // Recent sales analysis
    const recentSales = sales.filter(s => s.date >= sevenDaysAgo && s.status === 'Paid');
    const previousSales = sales.filter(s => s.date >= fourteenDaysAgo && s.date < sevenDaysAgo && s.status === 'Paid');
    
    const recentRevenue = recentSales.reduce((acc, s) => acc + s.amount, 0);
    const previousRevenue = previousSales.reduce((acc, s) => acc + s.amount, 0);
    
    if (previousRevenue > 0) {
      const growthRate = ((recentRevenue - previousRevenue) / previousRevenue) * 100;
      
      if (growthRate > 20) {
        insights.push({
          id: 'revenue-growth',
          type: 'success',
          title: 'Revenue is up! 📈',
          description: `Sales increased ${growthRate.toFixed(0)}% compared to last week`,
          metric: `+${growthRate.toFixed(0)}%`,
        });
      } else if (growthRate < -20) {
        insights.push({
          id: 'revenue-decline',
          type: 'warning',
          title: 'Revenue dropped',
          description: `Sales decreased ${Math.abs(growthRate).toFixed(0)}% compared to last week`,
          metric: `${growthRate.toFixed(0)}%`,
        });
      }
    }

    // Low stock alerts
    const lowStockProducts = products.filter(p => {
      const stock = p.hasVariants && p.variants 
        ? p.variants.reduce((acc, v) => acc + v.stock, 0)
        : p.stock;
      return stock > 0 && stock <= 5;
    });

    if (lowStockProducts.length > 0) {
      insights.push({
        id: 'low-stock',
        type: 'warning',
        title: `${lowStockProducts.length} items running low`,
        description: lowStockProducts.slice(0, 2).map(p => p.name).join(', ') + (lowStockProducts.length > 2 ? '...' : ''),
        metric: lowStockProducts.length.toString(),
      });
    }

    // Best seller insight
    const productSales: Record<string, number> = {};
    recentSales.forEach(sale => {
      productSales[sale.productName] = (productSales[sale.productName] || 0) + sale.items;
    });
    
    const topProduct = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topProduct) {
      insights.push({
        id: 'top-seller',
        type: 'info',
        title: 'Top seller this week',
        description: `${topProduct[0]} with ${topProduct[1]} units sold`,
        metric: `${topProduct[1]} units`,
      });
    }

    // Expense / Ad performance
    const recentExpenses = expenses.filter(e => e.date >= sevenDaysAgo);
    const totalAdSpend = recentExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    if (totalAdSpend > 0 && recentRevenue > 0) {
      const roas = recentRevenue / totalAdSpend;
      
      if (roas < 1.5) {
        insights.push({
          id: 'low-roas',
          type: 'warning',
          title: 'Efficiency Alert',
          description: `ROI is low (${roas.toFixed(1)}x). Check your marketing spend.`,
          metric: `${roas.toFixed(1)}x`,
        });
      } else if (roas > 4) {
        insights.push({
          id: 'high-roas',
          type: 'success',
          title: 'Great Marketing ROI!',
          description: `Return on spend is ${roas.toFixed(1)}x. Keep it up!`,
          metric: `${roas.toFixed(1)}x`,
        });
      }
    }

    // No sales today
    const todaySales = sales.filter(s => s.date === today && s.status === 'Paid');
    if (todaySales.length === 0 && new Date().getHours() >= 12) {
      insights.push({
        id: 'no-sales-today',
        type: 'info',
        title: 'Slow start today?',
        description: 'No sales recorded yet. Ready to close some deals?',
      });
    }

    return insights;
  }, [products, sales, expenses]);
};