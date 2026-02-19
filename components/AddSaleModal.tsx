import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, ShoppingBag, Check, AlertCircle, Truck, X, Settings2 } from 'lucide-react';
import { Product, ProductVariant, Sale, SaleStatus } from '../types';
import { validateSale } from '../utils/validation';
import { FormField } from './FormField';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { SaveButton } from './SaveButton';
import { AccessibleModal } from './AccessibleModal';
import { useDeliveryPresets } from '../hooks/useDeliveryPresets';
import { DeliveryPresetsEditor } from './DeliveryPresetsEditor';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialData?: Sale | null;
  onSave: (saleData: any) => Promise<void>;
  onDelete?: () => void;
}

const INITIAL_STATE = {
  searchQuery: '',
  selectedProduct: null as Product | null,
  selectedVariant: null as ProductVariant | null,
  quantity: 1,
  price: '',
  status: 'Paid' as SaleStatus,
  date: new Date().toISOString().split('T')[0],
  errors: {} as Record<string, string>,
  // Delivery state
  includeDelivery: false,
  deliveryCharge: '',
};

export const AddSaleModal: React.FC<AddSaleModalProps> = ({ 
  isOpen, 
  onClose, 
  products, 
  initialData, 
  onSave, 
  onDelete 
}) => {
  const [searchQuery, setSearchQuery] = useState(INITIAL_STATE.searchQuery);
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_STATE.selectedProduct);
  const [selectedVariant, setSelectedVariant] = useState(INITIAL_STATE.selectedVariant);
  const [quantity, setQuantity] = useState(INITIAL_STATE.quantity);
  const [price, setPrice] = useState(INITIAL_STATE.price);
  const [status, setStatus] = useState(INITIAL_STATE.status);
  const [date, setDate] = useState(INITIAL_STATE.date);
  const [errors, setErrors] = useState(INITIAL_STATE.errors);
  
  // Delivery state
  const [includeDelivery, setIncludeDelivery] = useState(INITIAL_STATE.includeDelivery);
  const [deliveryCharge, setDeliveryCharge] = useState(INITIAL_STATE.deliveryCharge);
  const [isEditingPresets, setIsEditingPresets] = useState(false);

  const {
    presets: deliveryPresets,
    addPreset,
    removePreset,
    updatePreset,
    resetToDefaults,
    isDefault: isPresetsDefault,
  } = useDeliveryPresets();

  const { execute: performSave, isLoading: isSubmitting, error: saveError } = useAsyncAction(onSave, {
    onSuccess: onClose
  });

  // Check if current delivery charge matches a preset
  const activePreset = useMemo(() => {
    const num = parseFloat(deliveryCharge);
    return !isNaN(num) && deliveryPresets.includes(num) ? num : null;
  }, [deliveryCharge, deliveryPresets]);

  const resetForm = useCallback(() => {
    setSearchQuery(INITIAL_STATE.searchQuery);
    setSelectedProduct(INITIAL_STATE.selectedProduct);
    setSelectedVariant(INITIAL_STATE.selectedVariant);
    setQuantity(INITIAL_STATE.quantity);
    setPrice(INITIAL_STATE.price);
    setStatus(INITIAL_STATE.status);
    setDate(new Date().toISOString().split('T')[0]);
    setErrors(INITIAL_STATE.errors);
    setIncludeDelivery(INITIAL_STATE.includeDelivery);
    setDeliveryCharge(INITIAL_STATE.deliveryCharge);
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (!initialData) {
      resetForm();
      return;
    }

    const prod = initialData.productId 
      ? products.find(p => p.id === initialData.productId)
      : products.find(p => p.name === initialData.productName);

    if (!prod) {
      console.warn('Product not found for initial data:', initialData);
      return;
    }

    setSelectedProduct(prod);

    if (prod.variants) {
      const variant = initialData.variantId
        ? prod.variants.find(v => v.id === initialData.variantId)
        : initialData.variantName
        ? prod.variants.find(v => v.name === initialData.variantName)
        : null;
      
      setSelectedVariant(variant || null);
    }

    setQuantity(initialData.items);
    const unitPrice = initialData.items > 0 ? initialData.amount / initialData.items : 0;
    setPrice(unitPrice.toFixed(2));
    setStatus(initialData.status || 'Paid');
    setDate(initialData.date || new Date().toISOString().split('T')[0]);
    
    // Load delivery data if exists
    if (initialData.deliveryCharge && initialData.deliveryCharge > 0) {
      setIncludeDelivery(true);
      setDeliveryCharge(String(initialData.deliveryCharge));
    }
  }, [initialData, isOpen, products, resetForm]);

  const handlePriceChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setPrice(value);
      clearError('price');
    }
  }, [clearError]);

  const handleDeliveryChargeChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setDeliveryCharge(value);
      clearError('deliveryCharge');
    }
  }, [clearError]);

  const handlePresetClick = useCallback((preset: number) => {
    setDeliveryCharge(preset.toString());
    clearError('deliveryCharge');
  }, [clearError]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  const availableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    
    const baseStock = selectedProduct.hasVariants 
      ? (selectedVariant?.stock ?? 0) 
      : (selectedProduct.stock ?? 0);
    
    const isEditingSameProduct = initialData && (
      selectedProduct.id === initialData.productId || 
      selectedProduct.name === initialData.productName
    );
    
    return isEditingSameProduct ? baseStock + initialData.items : baseStock;
  }, [selectedProduct, selectedVariant, initialData]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setPrice(product.price.toFixed(2));
    clearError('product');
  }, [clearError]);

  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    setErrors({});
  }, []);

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity(q => Math.max(1, q + delta));
  }, []);

  // Calculate totals
  const subtotal = useMemo(() => {
    return quantity * (parseFloat(price) || 0);
  }, [quantity, price]);

  const deliveryAmount = useMemo(() => {
    if (!includeDelivery) return 0;
    return parseFloat(deliveryCharge) || 0;
  }, [includeDelivery, deliveryCharge]);

  const totalAmount = useMemo(() => {
    return (subtotal + deliveryAmount).toFixed(2);
  }, [subtotal, deliveryAmount]);

  const handleSave = async () => {
    if (!selectedProduct) {
      setErrors({ product: 'Please select a product' });
      return;
    }

    const numPrice = parseFloat(price) || 0;
    const validation = validateSale({ 
      productId: selectedProduct.id, 
      quantity, 
      availableStock,
      price: numPrice
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Validate delivery charge if delivery is enabled
    if (includeDelivery && deliveryCharge === '') {
      setErrors(prev => ({ ...prev, deliveryCharge: 'Enter delivery charge or select a preset' }));
      return;
    }

    try {
      await performSave({ 
        productId: selectedProduct.id, 
        variantId: selectedVariant?.id || null, 
        quantity, 
        price: numPrice, 
        productName: selectedProduct.name, 
        variantName: selectedVariant?.name || null, 
        status,
        date,
        // Include delivery data
        includeDelivery,
        deliveryCharge: deliveryAmount,
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
          <div 
            role="alert"
            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex items-center gap-2 animate-in fade-in"
          >
            <AlertCircle size={14} />
            {errors.global || saveError?.message || 'Sync failed'}
          </div>
        )}

        {!selectedProduct ? (
          <div className="space-y-4">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" 
                size={16} 
                aria-hidden="true"
              />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search products"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-10 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
            {errors.product && (
              <p className="text-[10px] font-bold text-red-500" role="alert">
                {errors.product}
              </p>
            )}
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  No products found
                </p>
              ) : (
                filteredProducts.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => handleProductSelect(p)}
                    aria-label={`Select ${p.name}, stock: ${p.hasVariants ? 'variants available' : p.stock}, price: $${p.price.toFixed(2)}`}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Stock: {p.hasVariants ? 'Variants' : p.stock}
                      </p>
                    </div>
                    <p className="font-black text-indigo-600">${p.price.toFixed(2)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Product Display */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600">
                  <Check size={18} aria-hidden="true" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedProduct.name}</p>
              </div>
              <button 
                onClick={() => { 
                  setSelectedProduct(null); 
                  setSelectedVariant(null); 
                }}
                aria-label="Change product selection"
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 focus:outline-none focus:underline"
              >
                Change
              </button>
            </div>

            {/* Variant Selection */}
            {selectedProduct.hasVariants && selectedProduct.variants && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400">Select Variant</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Product variants">
                  {selectedProduct.variants.map(v => (
                    <button 
                      key={v.id} 
                      onClick={() => handleVariantSelect(v)}
                      aria-pressed={selectedVariant?.id === v.id}
                      aria-label={`${v.name}, ${v.stock} in stock`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        selectedVariant?.id === v.id 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                          : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {v.name} ({v.stock})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Quantity" error={errors.quantity}>
                <div className={`flex items-center space-x-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl ${errors.quantity ? 'ring-2 ring-red-500' : ''}`}>
                  <button 
                    disabled={isSubmitting || quantity <= 1} 
                    onClick={() => handleQuantityChange(-1)}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-black text-xs dark:text-white" aria-live="polite">
                    {quantity}
                  </span>
                  <button 
                    disabled={isSubmitting} 
                    onClick={() => handleQuantityChange(1)}
                    aria-label="Increase quantity"
                    className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    +
                  </button>
                </div>
              </FormField>

              <FormField label="Status">
                <div className="flex p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl" role="group" aria-label="Payment status">
                  <button 
                    onClick={() => setStatus('Paid')}
                    aria-pressed={status === 'Paid'}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                      status === 'Paid' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Paid
                  </button>
                  <button 
                    onClick={() => setStatus('Pending')}
                    aria-pressed={status === 'Pending'}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 ${
                      status === 'Pending' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Wait
                  </button>
                </div>
              </FormField>
            </div>

            {/* Price Override */}
            <FormField label="Price Override ($)" error={errors.price}>
              <input 
                type="text" 
                inputMode="decimal"
                value={price}
                placeholder="0.00"
                onChange={e => handlePriceChange(e.target.value)}
                disabled={isSubmitting}
                aria-label="Unit price in dollars"
                aria-invalid={!!errors.price}
                className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 px-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                  errors.price ? 'ring-2 ring-red-500' : ''
                }`}
              />
            </FormField>

            {/* ==================== DELIVERY SECTION ==================== */}
            <div className="space-y-3">
              {/* Delivery Toggle Header */}
              <button
                onClick={() => {
                  setIncludeDelivery(prev => {
                    if (prev) {
                      setDeliveryCharge('');
                      setIsEditingPresets(false);
                    }
                    return !prev;
                  });
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  includeDelivery 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    includeDelivery 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    <Truck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Delivery
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {includeDelivery ? 'Tap to remove' : 'Tap to add delivery charge'}
                    </p>
                  </div>
                </div>
                
                {/* Toggle Indicator */}
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  includeDelivery ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    includeDelivery ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Delivery Charge Input & Presets */}
              {includeDelivery && (
                <>
                  {!isEditingPresets && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                      {/* Custom Input */}
                      <FormField label="Delivery Charge ($)" error={errors.deliveryCharge}>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                            $
                          </span>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={deliveryCharge}
                            placeholder="0.00"
                            onChange={e => handleDeliveryChargeChange(e.target.value)}
                            disabled={isSubmitting}
                            aria-label="Delivery charge in dollars"
                            aria-invalid={!!errors.deliveryCharge}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3 pl-8 pr-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 ${
                              errors.deliveryCharge ? 'ring-2 ring-red-500' : ''
                            }`}
                          />
                          {deliveryCharge && (
                            <button
                              onClick={() => setDeliveryCharge('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              aria-label="Clear delivery charge"
                            >
                              <X size={12} className="text-slate-500" />
                            </button>
                          )}
                        </div>
                      </FormField>

                      {/* Preset Chips */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase text-slate-400">
                            Quick Select
                          </p>
                          <button
                            onClick={() => setIsEditingPresets(true)}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                          >
                            <Settings2 size={12} />
                            Edit
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {deliveryPresets.map(preset => (
                            <button
                              key={preset}
                              onClick={() => handlePresetClick(preset)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                activePreset === preset
                                  ? 'bg-emerald-500 text-white shadow-md scale-105'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {preset === 0 ? 'Free' : `$${preset}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Amount Preview */}
                      {deliveryAmount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2">
                            <Check size={14} className="text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              Delivery charge added
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">
                            +${deliveryAmount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {isEditingPresets && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 animate-in slide-in-from-top-2 fade-in duration-200">
                      <DeliveryPresetsEditor
                        presets={deliveryPresets}
                        onAdd={addPreset}
                        onRemove={removePreset}
                        onUpdate={updatePreset}
                        onReset={resetToDefaults}
                        isDefault={isPresetsDefault}
                        onClose={() => setIsEditingPresets(false)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            {/* ==================== END DELIVERY SECTION ==================== */}

            {/* Total Bill */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-purple-700 rounded-3xl p-5 text-white shadow-xl">
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    Subtotal ({quantity} {quantity === 1 ? 'item' : 'items'})
                  </p>
                  <p className="text-sm font-bold">
                    ${subtotal.toFixed(2)}
                  </p>
                </div>

                {/* Delivery */}
                {includeDelivery && deliveryAmount > 0 && (
                  <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2">
                      <Truck size={12} className="opacity-60" />
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        Delivery
                      </p>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">
                      +${deliveryAmount.toFixed(2)}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/20" />

                {/* Total */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">
                    Total Amount
                  </p>
                  <h4 className="text-3xl font-black" aria-live="polite">
                    ${totalAmount}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <SaveButton 
          onClick={handleSave} 
          isLoading={isSubmitting} 
          disabled={!selectedProduct}
        >
          Confirm Transaction
        </SaveButton>
      </div>
    </AccessibleModal>
  );
};
