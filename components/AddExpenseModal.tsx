
import React, { useState, useEffect, useMemo } from 'react';
import { Package, ChevronDown, Check, Search, AlertCircle } from 'lucide-react';
import { Product, Expense, ExpenseCategory } from '../types';
import { getLocalDateString, cleanObject } from '../utils';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { SaveButton } from './SaveButton';
import { AccessibleModal } from './AccessibleModal';
import { DateRangePicker } from './DateRangePicker';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  platforms: { id: string; name: string }[];
  initialData?: Expense | null;
  onSave: (data: Omit<Expense, 'id'>) => Promise<void>;
}

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'advertising', label: 'Advertising', icon: '📢' },
  { value: 'marketing', label: 'Marketing', icon: '📈' },
  { value: 'supplies', label: 'Supplies', icon: '📦' },
  { value: 'shipping', label: 'Shipping', icon: '🚚' },
  { value: 'software', label: 'Software', icon: '💻' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  products,
  platforms,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [platform, setPlatform] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('advertising');
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { execute: performSave, isLoading: isSubmitting, error: saveError } = useAsyncAction(onSave, {
    onSuccess: onClose
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setAmount(initialData.amount);
        setPlatform(initialData.platform);
        setCategory(initialData.category || 'advertising');
        setStartDate(initialData.date);
        setEndDate(initialData.endDate || '');
        setIsDateRange(!!initialData.endDate);
        setSelectedProductIds(initialData.productIds || []);
        setNotes(initialData.notes || '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    setName('');
    setAmount(0);
    setPlatform('');
    setCategory('advertising');
    setStartDate(getLocalDateString());
    setEndDate('');
    setIsDateRange(false);
    setSelectedProductIds([]);
    setNotes('');
    setError(null);
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const selectedProductNames = useMemo(() => {
    return products
      .filter(p => selectedProductIds.includes(p.id))
      .map(p => p.name);
  }, [products, selectedProductIds]);

  const dailyAmount = useMemo(() => {
    if (!isDateRange || !endDate || startDate === endDate) return amount;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return amount / days;
  }, [amount, startDate, endDate, isDateRange]);

  const dayCount = useMemo(() => {
    if (!isDateRange || !endDate) return 1;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate, isDateRange]);

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSave = async () => {
    if (!name.trim() || amount <= 0) {
      setError('Please provide a name and amount');
      return;
    }
    
    const basePayload: any = {
      name: name.trim(),
      platform: platform || 'General',
      amount: Number(amount),
      date: startDate,
      category: category,
    };

    if (isDateRange && endDate && endDate.trim() && endDate !== startDate) {
      basePayload.endDate = endDate;
    }

    if (selectedProductIds.length > 0) {
      basePayload.productIds = selectedProductIds;
      basePayload.productNames = selectedProductNames;
    }

    if (notes.trim()) {
      basePayload.notes = notes.trim();
    }

    const sanitizedPayload = cleanObject(basePayload);

    try {
      await performSave(sanitizedPayload as Omit<Expense, 'id'>);
    } catch (error) {
      console.error('Save failed:', error);
      setError('Failed to save expense');
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Expense' : 'New Expense'}
    >
      <div className="px-6 py-8 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0">
        <p className="text-[10px] text-slate-400 text-center mb-2 uppercase tracking-[0.2em] font-black">
          Total Investment
        </p>
        <div className="flex items-center justify-center">
          <span className="text-3xl font-light text-slate-400 mr-1">$</span>
          <input 
            type="number" 
            value={amount || ''} 
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} 
            placeholder="0.00" 
            disabled={isSubmitting}
            aria-label="Investment Amount"
            className="text-5xl font-black text-center bg-transparent border-none outline-none w-48 text-slate-900 dark:text-white placeholder-slate-200" 
          />
        </div>
        {isDateRange && endDate && endDate !== startDate && (
          <p className="text-[10px] font-bold text-center text-slate-400 mt-2 uppercase tracking-widest">
            ${dailyAmount.toFixed(2)}/day • {dayCount} days
          </p>
        )}
      </div>

      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1" role="radiogroup" aria-label="Expense Category">
          {CATEGORIES.map(cat => (
            <button 
              key={cat.value} 
              onClick={() => setCategory(cat.value)} 
              disabled={isSubmitting}
              role="radio"
              type="button"
              aria-checked={category === cat.value}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                category === cat.value 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span aria-hidden="true">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="p-6 space-y-6">
          {(error || saveError) && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-900/40">
              <AlertCircle size={14} aria-hidden="true" />
              {error || saveError?.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="exp-name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Name</label>
              <input 
                id="exp-name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. FB Ad Set A" 
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-slate-900" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="exp-platform" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Platform</label>
              <select 
                id="exp-platform"
                value={platform} 
                onChange={(e) => setPlatform(e.target.value)} 
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3 px-4 text-sm font-bold dark:text-white outline-none appearance-none" 
              >
                <option value="">Select...</option>
                {platforms.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date & Timeline</label>
            <DateRangePicker 
              startDate={startDate} 
              endDate={isDateRange ? endDate : startDate}
              disabled={isSubmitting}
              onRangeChange={(start, end) => {
                setStartDate(start);
                if (start !== end) {
                  setEndDate(end);
                  setIsDateRange(true);
                } else {
                  setEndDate('');
                  setIsDateRange(false);
                }
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Link to Products</label>
            <button 
              onClick={() => setShowProductPicker(!showProductPicker)} 
              disabled={isSubmitting}
              type="button"
              aria-expanded={showProductPicker}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-4 flex items-center justify-between text-left border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Package size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
                {selectedProductIds.length > 0 ? (
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedProductNames.slice(0, 2).join(', ')}
                    {selectedProductNames.length > 2 && ` +${selectedProductNames.length - 2}`}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 font-bold uppercase tracking-widest">Select products...</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedProductIds.length > 0 && (
                  <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                    {selectedProductIds.length}
                  </span>
                )}
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${showProductPicker ? 'rotate-180' : ''}`} aria-hidden="true" />
              </div>
            </button>

            {showProductPicker && (
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95">
                <div className="p-3 border-b border-slate-50 dark:border-slate-700">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} disabled={isSubmitting} placeholder="Search inventory..." className="w-full bg-slate-50 dark:bg-slate-900 rounded-xl py-2 pl-9 pr-3 text-sm outline-none" />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto hide-scrollbar">
                  {filteredProducts.map(product => (
                    <button key={product.id} type="button" onClick={() => toggleProduct(product.id)} disabled={isSubmitting} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedProductIds.includes(product.id) ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'border-slate-200 dark:border-slate-600'
                      }`}>
                        {selectedProductIds.includes(product.id) && <Check size={12} className="text-white dark:text-slate-900" aria-hidden="true" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{product.name}</span>
                      <span className="text-[10px] text-slate-400 font-black ml-auto">${product.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="exp-notes" className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</label>
            <textarea id="exp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isSubmitting} placeholder="Additional context..." rows={2} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-3 px-4 text-sm font-bold outline-none resize-none dark:text-white" />
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <SaveButton onClick={handleSave} isLoading={isSubmitting} disabled={!name.trim() || amount <= 0}>
          Confirm Expense — ${amount.toFixed(2)}
        </SaveButton>
      </div>
    </AccessibleModal>
  );
};
