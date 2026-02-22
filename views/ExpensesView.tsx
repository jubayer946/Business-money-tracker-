import React, { useState, useMemo } from 'react';
import { Receipt, Filter, Plus, Upload, ChevronDown, Package, Settings } from 'lucide-react';
import { MobileHeader, type ThemeMode } from '../components/MobileHeader';
import { CSVImport } from '../components/CSVImport';
import { CategorySelector } from '../components/CategorySelector';
import { CategoryManager } from '../components/CategoryManager';
import { useCategories } from '../contexts/CategoryContext';
import { Expense, Product, AdPlatform } from '../types';
import { formatCurrency, getDaysAgo, getLocalDateString } from '../utils';
import Fuse from 'fuse.js';

type DateFilter = 'all' | 'today' | '7d' | '30d';

interface ExpensesViewProps {
  expenses: Expense[];
  products: Product[];
  platforms: AdPlatform[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onBatchImport?: (expenses: Omit<Expense, 'id'>[]) => Promise<void>;
  onActivityClick?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  products,
  platforms,
  searchQuery,
  setSearchQuery,
  theme,
  setTheme,
  onAdd,
  onEdit,
  onDelete,
  onBatchImport,
  onActivityClick
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { getCategory } = useCategories();

  const handleCSVImport = async (newExpenses: Omit<Expense, 'id'>[]) => {
    if (onBatchImport) {
      await onBatchImport(newExpenses);
      setShowCSVImport(false);
    }
  };

  const fuse = useMemo(() => {
    return new Fuse(expenses, {
      keys: ['name', 'platform', 'productNames'],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
    });
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const today = getLocalDateString();
    let baseExpenses = expenses.filter(expense => {
      if (dateFilter === 'today' && expense.date !== today) return false;
      if (dateFilter === '7d' && expense.date < getDaysAgo(7)) return false;
      if (dateFilter === '30d' && expense.date < getDaysAgo(30)) return false;
      if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
      if (productFilter !== 'all' && !expense.productIds?.includes(productFilter)) return false;
      return true;
    });

    const q = searchQuery.trim();
    if (!q) return baseExpenses;

    // If we have a query, we search within the already filtered baseExpenses
    const searchFuse = new Fuse(baseExpenses, {
      keys: ['name', 'platform', 'productNames'],
      threshold: 0.3,
      distance: 100,
      minMatchCharLength: 1,
    });

    return searchFuse.search(q).map(result => result.item);
  }, [expenses, dateFilter, categoryFilter, productFilter, searchQuery]);

  const total = useMemo(() => 
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0), 
  [filteredExpenses]);

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
            <div className="flex gap-2">
              <button 
                onClick={() => setShowCSVImport(true)}
                className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center shadow-xl active:scale-90 transition-all"
                title="Import CSV"
              >
                <Upload size={20} className="text-white" />
              </button>
              <button 
                onClick={onAdd} 
                className="w-12 h-12 bg-slate-900 dark:bg-white rounded-[20px] flex items-center justify-center shadow-xl active:scale-90 transition-all"
                title="New Expense"
              >
                <Plus size={24} className="text-white dark:text-slate-900" />
              </button>
            </div>
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

          <button 
            onClick={() => setShowCategoryManager(true)} 
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800 transition-all hover:text-purple-600 active:scale-90" 
            title="Manage Categories"
          >
            <Settings size={18} />
          </button>

          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`p-2.5 rounded-2xl transition-all active:scale-90 ${showFilters ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
          >
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
                <CategorySelector value={categoryFilter} onChange={setCategoryFilter} compact={true} />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 mb-1.5 block uppercase tracking-widest">Linked Product</label>
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl py-2 px-3 text-[10px] font-bold outline-none border-none">
                  <option value="all">All Products</option>
                  {productsWithExpenses.map(p => ( <option key={p.id} value={p.id}>{p.name}</option> ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredExpenses.map(expense => (
            <ExpenseCard key={expense.id} expense={expense} isExpanded={expandedId === expense.id} onToggle={() => setExpandedId(expandedId === expense.id ? null : expense.id)} onEdit={() => onEdit(expense)} onDelete={() => onDelete(expense)} getCategory={getCategory} />
          ))}
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-16 opacity-30 flex flex-col items-center gap-3">
              <Receipt size={48} />
              <p className="text-xs font-black uppercase tracking-[0.2em]">No expenses in view</p>
            </div>
          )}
        </div>
      </div>

      {showCSVImport && onBatchImport && (
        <CSVImport
          onImport={handleCSVImport}
          onClose={() => setShowCSVImport(false)}
          products={products}
          platforms={platforms}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Manage Categories
                </h2>
                <button 
                  onClick={() => setShowCategoryManager(false)} 
                  className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
              <CategoryManager onClose={() => setShowCategoryManager(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ExpenseCard: React.FC<{ expense: Expense; isExpanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; getCategory: (id: string) => any; }> = ({ expense, isExpanded, onToggle, onEdit, onDelete, getCategory }) => {
  const config = getCategory(expense.category);
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-[28px] border transition-all ${isExpanded ? 'border-indigo-500 shadow-md' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-4 text-left">
        <div className={`w-12 h-12 ${config.color} rounded-[18px] flex items-center justify-center text-xl shadow-inner`}>
          {config.icon}
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
          {/* Category Badge */}
          <div className="mb-3 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${config.color} rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm`}>
              {config.icon} {config.label}
            </span>
          </div>

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
