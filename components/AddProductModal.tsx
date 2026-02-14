import React, { useState, useEffect } from 'react';
import { Package, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { validateProduct } from '../utils/validation';
import { FormField } from './FormField';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { SaveButton } from './SaveButton';
import { AccessibleModal } from './AccessibleModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product | null;
  onSave: (data: any) => Promise<void>;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState(0);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: performSave, isLoading: isSubmitting, error: saveError } = useAsyncAction(onSave, {
    onSuccess: onClose
  });

  const resetForm = () => {
    setName('');
    setPrice('');
    setCostPrice('');
    setStock(0);
    setHasVariants(false);
    setVariants([]);
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (initialData) {
      setName(initialData.name);
      setPrice(String(initialData.price));
      setCostPrice(initialData.costPrice != null ? String(initialData.costPrice) : '');
      setStock(initialData.stock);
      setHasVariants(initialData.hasVariants || false);
      setVariants(initialData.variants || []);
    } else {
      resetForm();
    }
  }, [isOpen, initialData]);

  const isValidPrice = (value: string): boolean => {
    if (value === '') return true;
    return /^\d*\.?\d{0,2}$/.test(value);
  };

  const handlePriceChange = (value: string, setter: (v: string) => void, field: string) => {
    if (isValidPrice(value)) {
      setter(value);
      if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
    }
  };

  const handleSave = async () => {
    const numPrice = parseFloat(price) || 0;
    const numCost = parseFloat(costPrice) || 0;
    const totalStock = hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : stock;

    const validation = validateProduct({ 
      name, 
      price: numPrice, 
      costPrice: numCost, 
      stock: totalStock 
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    
    try {
      await performSave({ 
        name: name.trim(), 
        price: numPrice, 
        costPrice: numCost, 
        stock: totalStock, 
        hasVariants, 
        variants: hasVariants ? variants : [] 
      });
    } catch (e) {
      setErrors({ global: e instanceof Error ? e.message : 'Failed to save product' });
    }
  };

  const toggleVariantMode = (useVariants: boolean) => {
    if (useVariants === hasVariants) return;
    if (useVariants) {
      if (stock > 0 && variants.length === 0) {
        setVariants([{ id: `v-${Date.now()}`, name: 'Default', stock: stock }]);
      }
    } else {
      const totalFromVariants = variants.reduce((sum, v) => sum + v.stock, 0);
      if (totalFromVariants > 0) setStock(totalFromVariants);
    }
    setHasVariants(useVariants);
  };

  const addVariant = () => {
    const id = `v-${Date.now()}`;
    setVariants([...variants, { id, name: '', stock: 0 }]);
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Product' : 'New Product'}
      headerIcon={
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Package size={20} />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain hide-scrollbar">
        {(errors.global || saveError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-4 flex items-start space-x-3 animate-in fade-in">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-red-700 dark:text-red-300">
              {errors.global || saveError?.message || 'A sync error occurred'}
            </p>
          </div>
        )}

        <FormField label="Product Name *" error={errors.name}>
          <input 
            type="text" 
            placeholder="e.g. Premium Sushi Platter"
            value={name} 
            onChange={e => { setName(e.target.value); if(errors.name) { const n={...errors}; delete n.name; setErrors(n); } }} 
            disabled={isSubmitting}
            className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${errors.name ? 'ring-2 ring-red-500' : ''}`} 
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price ($) *" error={errors.price}>
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00"
              value={price} 
              onChange={e => handlePriceChange(e.target.value, setPrice, 'price')} 
              disabled={isSubmitting}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${errors.price ? 'ring-2 ring-red-500' : ''}`} 
            />
          </FormField>
          <FormField label="Cost ($)" error={errors.costPrice}>
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0.00"
              value={costPrice} 
              onChange={e => handlePriceChange(e.target.value, setCostPrice, 'costPrice')} 
              disabled={isSubmitting}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${errors.costPrice ? 'ring-2 ring-red-500' : ''}`} 
            />
          </FormField>
        </div>

        <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center">
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => toggleVariantMode(false)} 
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              !hasVariants ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'
            }`}
          >
            Standard
          </button>
          <button 
            type="button"
            disabled={isSubmitting}
            onClick={() => toggleVariantMode(true)} 
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              hasVariants ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'
            }`}
          >
            Variants
          </button>
        </div>

        {hasVariants ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-400">Product Versions</h3>
              <button disabled={isSubmitting} onClick={addVariant} className="text-indigo-600 text-[10px] font-black uppercase flex items-center gap-1">
                <Plus size={14}/> Add Variant
              </button>
            </div>
            <div className="space-y-2">
              {variants.map(v => (
                <div key={v.id} className="flex items-center gap-2 animate-in slide-in-from-right-4">
                  <input 
                    type="text" 
                    placeholder="Size/Color" 
                    value={v.name} 
                    disabled={isSubmitting}
                    onChange={e => updateVariant(v.id, 'name', e.target.value)} 
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs dark:text-white outline-none" 
                  />
                  <input 
                    type="number" 
                    inputMode="numeric"
                    min="0"
                    placeholder="Qty" 
                    value={v.stock} 
                    disabled={isSubmitting}
                    onChange={e => updateVariant(v.id, 'stock', Math.max(0, parseInt(e.target.value) || 0))} 
                    className="w-16 bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-xs font-black dark:text-white outline-none" 
                  />
                  <button disabled={isSubmitting} onClick={() => setVariants(variants.filter(x => x.id !== v.id))} className="text-red-400 p-1 hover:text-red-600">
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FormField label="Total Stock" error={errors.stock}>
            <div className={`flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl ${errors.stock ? 'ring-2 ring-red-500' : ''}`}>
              <button disabled={isSubmitting} onClick={() => setStock(s => Math.max(0, s - 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm font-bold text-slate-600 dark:text-slate-300">-</button>
              <span className="flex-1 text-center font-black text-sm dark:text-white">{stock}</span>
              <button disabled={isSubmitting} onClick={() => setStock(s => s + 1)} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm font-bold text-slate-600 dark:text-slate-300">+</button>
            </div>
          </FormField>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <SaveButton onClick={handleSave} isLoading={isSubmitting}>
          Save Product
        </SaveButton>
      </div>
    </AccessibleModal>
  );
};