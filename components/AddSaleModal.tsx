import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Check, AlertCircle } from 'lucide-react';
import { Product, ProductVariant, Sale, SaleStatus } from '../types';
import { validateSale } from '../utils/validation';
import { FormField } from './FormField';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { SaveButton } from './SaveButton';
import { AccessibleModal } from './AccessibleModal';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialData?: Sale | null;
  onSave: (saleData: any) => Promise<void>;
  onDelete?: () => void;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, products, initialData, onSave, onDelete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<SaleStatus>('Paid');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { execute: performSave, isLoading: isSubmitting, error: saveError } = useAsyncAction(onSave, {
    onSuccess: onClose
  });

  const resetForm = () => {
    setSearchQuery(''); 
    setSelectedProduct(null); 
    setSelectedVariant(null); 
    setQuantity(1); 
    setPrice(''); 
    setStatus('Paid');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (initialData) {
      const prod = initialData.productId 
        ? products.find(p => p.id === initialData.productId)
        : products.find(p => p.name === initialData.productName);

      if (prod) {
        setSelectedProduct(prod);
        if (initialData.variantId && prod.variants) {
          const variant = prod.variants.find(v => v.id === initialData.variantId);
          if (variant) setSelectedVariant(variant);
        } else if (initialData.variantName && prod.variants) {
          const variant = prod.variants.find(v => v.name === initialData.variantName);
          if (variant) setSelectedVariant(variant);
        }
      }
      setQuantity(initialData.items);
      const unitPrice = initialData.items > 0 ? initialData.amount / initialData.items : 0;
      setPrice(String(unitPrice));
      setStatus(initialData.status || 'Paid');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
    } else {
      resetForm();
    }
  }, [initialData, isOpen, products]);

  const handlePriceChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setPrice(value);
      if (errors.price) {
        const n = { ...errors };
        delete n.price;
        setErrors(n);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const availableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    const base = selectedProduct.hasVariants ? (selectedVariant?.stock ?? 0) : (selectedProduct.stock ?? 0);
    return initialData && (selectedProduct.id === initialData.productId || selectedProduct.name === initialData.productName) 
      ? base + initialData.items 
      : base;
  }, [selectedProduct, selectedVariant, initialData]);

  const handleSave = async () => {
    const numPrice = parseFloat(price) || 0;
    const validation = validateSale({ 
      productId: selectedProduct?.id || '', 
      quantity, 
      availableStock,
      price: numPrice
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      await performSave({ 
        productId: selectedProduct!.id, 
        variantId: selectedVariant?.id || null, 
        quantity, 
        price: numPrice, 
        productName: selectedProduct!.name, 
        variantName: selectedVariant?.name || null, 
        status,
        date
      });
    } catch (e) {
      setErrors({ global: e instanceof Error ? e.message : 'Failed to save transaction' });
    }
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Transaction' : 'Record Sale'}
      headerIcon={
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ShoppingBag size={20} />
        </div>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar overscroll-contain">
        {(errors.global || saveError) && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={14} />
            {errors.global || saveError?.message || 'Sync failed'}
          </div>
        )}

        {!selectedProduct ? (
          <div className="space-y-4">
             <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-10 text-sm dark:text-white outline-none" />
             </div>
             {errors.product && <p className="text-[10px] font-bold text-red-500">{errors.product}</p>}
             <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
               {filteredProducts.map(p => (
                 <button key={p.id} onClick={() => { setSelectedProduct(p); setPrice(String(p.price)); if(errors.product) { const n={...errors}; delete n.product; setErrors(n); } }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors">
                   <div><p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p><p className="text-[10px] text-slate-400">Stock: {p.hasVariants ? 'Variants' : p.stock}</p></div>
                   <p className="font-black text-indigo-600">${p.price.toFixed(2)}</p>
                 </button>
               ))}
             </div>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600"><Check size={18}/></div><p className="text-sm font-bold text-slate-900 dark:text-white">{selectedProduct.name}</p></div>
                <button onClick={() => { setSelectedProduct(null); setSelectedVariant(null); }} className="text-[10px] font-black uppercase text-indigo-600">Change</button>
             </div>

             {selectedProduct.hasVariants && (
               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">Select Variant</p>
                  <div className="flex flex-wrap gap-2">
                     {selectedProduct.variants?.map(v => (
                       <button key={v.id} onClick={() => { setSelectedVariant(v); setErrors({}); }} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedVariant?.id === v.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'}`}>{v.name} ({v.stock})</button>
                     ))}
                  </div>
               </div>
             )}

             <div className="grid grid-cols-2 gap-4">
                <FormField label="Quantity" error={errors.quantity}>
                   <div className={`flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl ${errors.quantity ? 'ring-2 ring-red-500' : ''}`}>
                      <button disabled={isSubmitting} onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">-</button>
                      <span className="flex-1 text-center font-black text-xs dark:text-white">{quantity}</span>
                      <button disabled={isSubmitting} onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">+</button>
                   </div>
                </FormField>
                <FormField label="Status">
                   <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                      <button onClick={() => setStatus('Paid')} className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${status === 'Paid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}>Paid</button>
                      <button onClick={() => setStatus('Pending')} className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${status === 'Pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-400'}`}>Wait</button>
                   </div>
                </FormField>
             </div>

             <FormField label="Price Override ($)" error={errors.price}>
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={price}
                  placeholder="0.00"
                  onChange={e => handlePriceChange(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${errors.price ? 'ring-2 ring-red-500' : ''}`}
                />
             </FormField>

             <div className="bg-slate-900 dark:bg-indigo-600 rounded-3xl p-5 text-white shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Bill</p>
                <h4 className="text-2xl font-black">${(quantity * (parseFloat(price) || 0)).toFixed(2)}</h4>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <SaveButton onClick={handleSave} isLoading={isSubmitting} disabled={!selectedProduct}>
          Confirm Transaction
        </SaveButton>
      </div>
    </AccessibleModal>
  );
};