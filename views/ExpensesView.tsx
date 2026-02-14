
import React, { useState, useMemo } from 'react';
import { Receipt, Filter, Plus, TrendingDown, Package, Edit2, Trash2, ChevronDown, Calendar, Search } from 'lucide-react';
import { MobileHeader } from '../components/MobileHeader';
import { Expense, Product } from '../types';
import { formatCurrency, getDaysAgo, getLocalDateString } from '../utils';

type ThemeMode = 'light' | 'dark' | 'auto';
type DateFilter = 'all' | 'today' | '7d' | '30d';

interface ExpensesViewProps {
  expenses: Expense[];
  products: Product[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onActivityClick?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  products,
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onAdd,
  onEdit,
  onDelete,
  onActivityClick
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    const today = getLocalDateString();
    return expenses.filter(expense => {
      if (dateFilter === 'today' && expense.date !== today) return false;
      if (dateFilter === '7d' && expense.date < getDaysAgo(7)) return false;
      if (dateFilter === '30d' && expense.date < getDaysAgo(30)) return false;
      if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
      if (productFilter !== 'all' && !expense.productIds?.includes(productFilter)) return false;
      
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName = expense.name.toLowerCase().includes(q);
        const matchPlatform = expense.platform.toLowerCase().includes(q);
        const matchProducts = expense.productNames?.some(p => p.toLowerCase().includes(q));
        if (!matchName && !matchPlatform && !matchProducts) return false;
      }
      return true;
    });
  }, [expenses, dateFilter, categoryFilter, productFilter, searchQuery]);

  const total = useMemo(() => 
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0), 
  [filteredExpenses]);

  const categories = useMemo(() => 
    Array.from(new Set(expenses.map(e => e.category))),
  [expenses]);

  const productsWithExpenses = useMemo(() => {
    const ids = new Set<string>();
    expenses.forEach(e => e.productIds?.forEach(id => ids.add(id)));
    return products.filter(p => ids.has(p.id));
  }, [expenses, products]);

  return (
    <div className="pb-32 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <MobileHeader 
        title="Business Expenses" 
        showSearch 
        placeholder="Search name, platform..." 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        theme={theme} 
        setTheme={setTheme} 
        onActivityClick={onActivityClick}
      />
      
      <div className="px-5 space-y-5 mt-4">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                {dateFilter === 'all' ? 'Total Spent' : `Spent Last ${dateFilter.toUpperCase()}`}
              </p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {formatCurrency(total)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                {filteredExpenses.length} Records Detected
              </p>
            </div>
            <button onClick={onAdd} className="w-12 h-12 bg-slate-900 dark:bg-white rounded-[20px] flex items-center justify-center shadow-xl active:scale-90 transition-all">
              <Plus size={24} className="text-white dark:text-slate-900" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-indigo-500 to-emerald-500 opacity-20" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto hide-scrollbar pb-1">
            {(['all', 'today', '7d', '30d'] as DateFilter[]).map(filter => (
              <button key={filter} onClick={() => setDateFilter(filter)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                dateFilter === filter ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-400'
              }`}>
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-2xl transition-all ${showFilters ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}>
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Advanced View</span>
              <button onClick={() => { setCategoryFilter('all'); setProductFilter('all'); }} className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Reset</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2 px-3 text-[10px] font-bold outline-none border-none">
                  <option value="all">All</option>
                  {categories.map(cat => ( <option key={cat} value={cat}>{cat.toUpperCase()}</option> ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Linked Product</label>
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2 px-3 text-[10px] font-bold outline-none border-none">
                  <option value="all">All</option>
                  {productsWithExpenses.map(p => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredExpenses.map(expense => (
            <ExpenseCard key={expense.id} expense={expense} isExpanded={expandedId === expense.id} onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)} onEdit={() => onEdit(expense)} onDelete={() => onDelete(expense)} />
          ))}
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-16 opacity-30 flex flex-col items-center gap-3">
              <Receipt size={48} />
              <p className="text-xs font-black uppercase tracking-[0.2em]">No expenses in view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExpenseCard: React.FC<{ expense: Expense; isExpanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; }> = ({ expense, isExpanded, onToggle, onEdit, onDelete }) => {
  const categoryIcons: Record<string, string> = { advertising: '📢', marketing: '📈', supplies: '📦', shipping: '🚚', software: '💻', other: '📋' };
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm transition-all">
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-4 text-left">
        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-[18px] flex items-center justify-center text-xl shadow-inner">
          {categoryIcons[expense.category] || '📋'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-white truncate"> {expense.name} </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase"> {formatDate(expense.date)} {expense.endDate && `→ ${formatDate(expense.endDate)}`} </span>
            {expense.productNames && expense.productNames.length > 0 && (
              <>
                <span className="text-slate-200">•</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase truncate"> {expense.productNames.length === 1 ? expense.productNames[0] : `${expense.productNames.length} products`} </span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-sm text-red-500"> -{formatCurrency(expense.amount)} </p>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter"> {expense.platform} </p>
        </div>
        <ChevronDown size={16} className={`text-slate-200 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-50 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
          {expense.productNames && expense.productNames.length > 0 && (
            <div className="py-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Linked Inventory</p>
              <div className="flex flex-wrap gap-2">
                {expense.productNames.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <Package size={10} /> {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {expense.notes && (
            <div className="py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Context</p>
              <p className="text-xs font-medium text-slate-500 italic leading-relaxed">"{expense.notes}"</p>
            </div>
          )}
          <div className="flex gap-2 pt-3">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 active:scale-95 transition-all"> Edit </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-600 active:scale-95 transition-all"> Delete </button>
          </div>
        </div>
      )}
    </div>
  );
};
