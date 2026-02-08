
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Megaphone, 
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Tag,
  Calendar,
  ChevronDown,
  Settings2,
  Trash2
} from 'lucide-react';
import { Product, Sale, AdCost, AdPlatform, ViewType, ProductVariant, Customer } from './types';
import { db } from './firebase';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_AD_COSTS, DEFAULT_PLATFORMS } from './constants';
import { getProductStock, getStatusFromStock } from './utils';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  writeBatch
} from 'firebase/firestore';

// Sub-views
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { SalesView } from './views/SalesView';
import { AdCostsView } from './views/AdCostsView';
import { CustomersView } from './views/CustomersView';

type ThemeMode = 'light' | 'dark' | 'auto';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [adCosts, setAdCosts] = useState<AdCost[]>([]);
  const [platforms, setPlatforms] = useState<AdPlatform[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme-preference') as ThemeMode) || 'auto';
  });

  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isEditStockOpen, setIsEditStockOpen] = useState(false);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isEditSaleOpen, setIsEditSaleOpen] = useState(false);
  const [isAddAdCostOpen, setIsAddAdCostOpen] = useState(false);
  const [isEditAdCostOpen, setIsEditAdCostOpen] = useState(false);
  const [isManagePlatformsOpen, setIsManagePlatformsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSaleConfirm, setShowDeleteSaleConfirm] = useState(false);
  const [showDeleteAdConfirm, setShowDeleteAdConfirm] = useState(false);
  const [showBulkDeleteAdConfirm, setShowBulkDeleteAdConfirm] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  
  // Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form States
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    costPrice: '',
    stock: '',
    hasVariants: false,
    variants: [] as ProductVariant[]
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [newSale, setNewSale] = useState({
    productId: '',
    productName: '',
    customer: '',
    amount: '',
    items: '1',
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  
  // Ad Cost Form State
  const [adEntryMode, setAdEntryMode] = useState<'single' | 'range'>('single');
  const [newAdCost, setNewAdCost] = useState({
    platform: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [selectedAdCost, setSelectedAdCost] = useState<AdCost | null>(null);
  const [editingAdCost, setEditingAdCost] = useState<AdCost | null>(null);
  const [bulkSelectedAdIds, setBulkSelectedAdIds] = useState<string[]>([]);
  const [newPlatformName, setNewPlatformName] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  // Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = 
        theme === 'dark' || 
        (theme === 'auto' && mediaQuery.matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('theme-preference', theme);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const enterDemoMode = useCallback(() => {
    setProducts(MOCK_PRODUCTS);
    setSales(MOCK_SALES);
    setAdCosts(MOCK_AD_COSTS);
    setPlatforms(DEFAULT_PLATFORMS);
    setCustomers([]);
    setSyncError(null);
    setIsLoading(false);
    setIsDemoMode(true);
    showToast("Operating in Local Demo Mode", "info");
  }, [showToast]);

  useEffect(() => {
    if (isDemoMode) return;
    const onSyncError = (error: any) => {
      setSyncError(error?.message || 'Database sync failed');
      setIsLoading(false);
    };
    try {
      const unsubP = onSnapshot(query(collection(db, 'products'), orderBy('name')), 
        (snap) => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))); setIsLoading(false); }, onSyncError);
      const unsubS = onSnapshot(query(collection(db, 'sales'), orderBy('date', 'desc'), limit(50)), 
        (snap) => setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale))), onSyncError);
      const unsubA = onSnapshot(query(collection(db, 'adCosts'), orderBy('date', 'desc')), 
        (snap) => setAdCosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as AdCost))), onSyncError);
      const unsubPlatforms = onSnapshot(query(collection(db, 'adPlatforms'), orderBy('name')), 
        (snap) => {
          // Strictly use DB records when in cloud sync mode
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AdPlatform));
          setPlatforms(list);
        }, onSyncError);

      return () => { unsubP(); unsubS(); unsubA(); unsubPlatforms(); };
    } catch (e: any) { onSyncError(e); }
  }, [isDemoMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Derived platforms for UI selection
  const platformOptions = useMemo(() => {
    if (platforms.length > 0) return platforms;
    return DEFAULT_PLATFORMS;
  }, [platforms]);

  // Handle platform defaults for forms
  useEffect(() => {
    if (platformOptions.length > 0 && !newAdCost.platform) {
      setNewAdCost(prev => ({ ...prev, platform: platformOptions[0].name }));
    }
  }, [platformOptions, newAdCost.platform]);

  const stats = useMemo(() => ({
    totalRevenue: sales.reduce((acc, s) => acc + s.amount, 0),
    totalOrders: sales.length,
    totalAdSpend: adCosts.reduce((acc, a) => acc + a.amount, 0),
    inventoryValue: products.reduce((acc, p) => acc + (p.price * getProductStock(p)), 0)
  }), [products, sales, adCosts]);

  // Handlers
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = newProduct.hasVariants ? newProduct.variants.reduce((acc, v) => acc + v.stock, 0) : (parseInt(newProduct.stock) || 0);
    const data = { ...newProduct, stock: stockVal, price: parseFloat(newProduct.price) || 0, costPrice: parseFloat(newProduct.costPrice) || 0, status: getStatusFromStock(stockVal) };
    if (isDemoMode) setProducts(prev => [{ id: Date.now().toString(), ...data } as Product, ...prev]);
    else await addDoc(collection(db, 'products'), data);
    setNewProduct({ name: '', price: '', costPrice: '', stock: '', hasVariants: false, variants: [] });
    setIsAddStockOpen(false);
    showToast('Inventory saved');
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const stockVal = getProductStock(editingProduct);
    const updated = { ...editingProduct, stock: stockVal, status: getStatusFromStock(stockVal) };
    if (isDemoMode) setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
    else await updateDoc(doc(db, 'products', editingProduct.id), updated as any);
    setEditingProduct(null);
    setIsEditStockOpen(false);
    showToast('Item updated');
  };

  const confirmDeleteProduct = async (product: Product) => {
    if (isDemoMode) setProducts(prev => prev.filter(p => p.id !== product.id));
    else await deleteDoc(doc(db, 'products', product.id));
    setShowDeleteConfirm(false);
    showToast('Item removed');
  };

  const handleAddSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      ...newSale, 
      amount: parseFloat(newSale.amount) || 0, 
      items: parseInt(newSale.items) || 1,
      productName: newSale.productName || 'Unspecified Product'
    };
    if (isDemoMode) setSales(prev => [{ id: Date.now().toString(), ...data } as Sale, ...prev]);
    else await addDoc(collection(db, 'sales'), data);
    setNewSale({ productId: '', productName: '', customer: '', amount: '', items: '1', date: new Date().toISOString().split('T')[0] });
    setIsAddSaleOpen(false);
    showToast('Sale recorded');
  };

  const handleEditSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    if (isDemoMode) setSales(prev => prev.map(s => s.id === editingSale.id ? editingSale : s));
    else await updateDoc(doc(db, 'sales', editingSale.id), editingSale as any);
    setEditingSale(null);
    setIsEditSaleOpen(false);
    showToast('Sale updated');
  };

  const confirmDeleteSale = async (sale: Sale) => {
    if (isDemoMode) setSales(prev => prev.filter(s => s.id !== sale.id));
    else await deleteDoc(doc(db, 'sales', sale.id));
    setShowDeleteSaleConfirm(false);
    showToast('Sale record deleted');
  };

  const handleAddAdCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newAdCost.amount) || 0;
    
    const data: any = { 
      platform: newAdCost.platform || (platformOptions.length > 0 ? platformOptions[0].name : 'Other'), 
      amount, 
      date: adEntryMode === 'range' ? newAdCost.startDate : newAdCost.date, 
      notes: newAdCost.notes 
    };
    
    if (adEntryMode === 'range') {
      data.endDate = newAdCost.endDate;
    }

    if (isDemoMode) {
      setAdCosts(prev => [{ id: Date.now().toString(), ...data } as AdCost, ...prev]);
    } else {
      await addDoc(collection(db, 'adCosts'), data);
    }

    setNewAdCost({ platform: platformOptions.length > 0 ? platformOptions[0].name : '', amount: '', date: new Date().toISOString().split('T')[0], startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], notes: '' });
    setIsAddAdCostOpen(false);
    showToast('Ad expense saved');
  };

  const handleEditAdCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdCost) return;
    if (isDemoMode) setAdCosts(prev => prev.map(ad => ad.id === editingAdCost.id ? editingAdCost : ad));
    else await updateDoc(doc(db, 'adCosts', editingAdCost.id), editingAdCost as any);
    setEditingAdCost(null);
    setIsEditAdCostOpen(false);
    showToast('Ad expense updated');
  };

  const confirmDeleteAd = async (ad: AdCost) => {
    if (isDemoMode) setAdCosts(prev => prev.filter(a => a.id !== ad.id));
    else await deleteDoc(doc(db, 'adCosts', ad.id));
    setShowDeleteAdConfirm(false);
    showToast('Ad record deleted');
  };

  const handleBulkDeleteAds = async (ids: string[]) => {
    setBulkSelectedAdIds(ids);
    setShowBulkDeleteAdConfirm(true);
  };

  const confirmBulkDeleteAds = async () => {
    if (isDemoMode) {
      setAdCosts(prev => prev.filter(a => !bulkSelectedAdIds.includes(a.id)));
    } else {
      const batch = writeBatch(db);
      bulkSelectedAdIds.forEach(id => {
        batch.delete(doc(db, 'adCosts', id));
      });
      await batch.commit();
    }
    setShowBulkDeleteAdConfirm(false);
    setBulkSelectedAdIds([]);
    showToast(`${bulkSelectedAdIds.length} records removed`);
  };

  const handleAddPlatform = async () => {
    if (!newPlatformName.trim()) return;
    const data = { name: newPlatformName.trim() };
    if (isDemoMode) {
      setPlatforms(prev => [...prev, { id: Date.now().toString(), ...data }]);
    } else {
      await addDoc(collection(db, 'adPlatforms'), data);
    }
    setNewPlatformName('');
    showToast('Platform added');
  };

  const handleDeletePlatform = async (id: string) => {
    // If we're in cloud mode but trying to delete a mock ID, ignore it to prevent errors
    if (!isDemoMode && id.startsWith('p')) {
        showToast('Cannot remove default platforms', 'error');
        return;
    }

    if (isDemoMode) {
      setPlatforms(prev => prev.filter(p => p.id !== id));
    } else {
      await deleteDoc(doc(db, 'adPlatforms', id));
    }
    showToast('Platform removed');
  };

  return (
    <div className="h-screen flex flex-col bg-[#FBFBFE] dark:bg-[#0F172A] text-gray-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      {(isLoading || syncError) && !isDemoMode && (
        <div className="fixed inset-0 z-[400] bg-white dark:bg-[#0F172A] flex flex-col items-center justify-center p-8 text-center">
          {syncError ? (
            <div className="max-w-sm">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={40} /></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Cloud Restricted</h2>
              <div className="text-gray-500 dark:text-gray-400 mb-8 bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700"><p>{syncError}</p></div>
              <button onClick={enterDemoMode} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center space-x-2"><Play size={20} /><span>Start Locally</span></button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-100 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-6 font-bold text-gray-900 dark:text-white animate-pulse">Establishing Cloud Sync...</p>
              <button onClick={enterDemoMode} className="mt-10 text-xs text-indigo-500 font-bold uppercase border-b border-indigo-200 dark:border-indigo-800">Start Offline</button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded-2xl bg-gray-900 dark:bg-indigo-600 text-white shadow-2xl flex items-center space-x-2 text-sm font-medium animate-in slide-in-from-top-full duration-300">
          <CheckCircle2 size={16} className="text-green-400" /><span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeView === 'dashboard' && <DashboardView products={products} sales={sales} stats={stats} isDemoMode={isDemoMode} theme={theme} setTheme={setTheme} onAlertClick={(id) => { setActiveView('inventory'); setExpandedProductId(id); }} />}
        {activeView === 'inventory' && <InventoryView products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isDemoMode={isDemoMode} theme={theme} setTheme={setTheme} expandedProductId={expandedProductId} setExpandedProductId={setExpandedProductId} onEdit={(p) => { setEditingProduct(p); setIsEditStockOpen(true); }} onDelete={(p) => { setSelectedProduct(p); setShowDeleteConfirm(true); }} />}
        {activeView === 'sales' && <SalesView sales={sales} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isDemoMode={isDemoMode} theme={theme} setTheme={setTheme} onEdit={(s) => { setEditingSale(s); setIsEditSaleOpen(true); }} onDelete={(s) => { setSelectedSale(s); setShowDeleteSaleConfirm(true); }} />}
        {activeView === 'adCosts' && <AdCostsView adCosts={adCosts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isDemoMode={isDemoMode} theme={theme} setTheme={setTheme} onEdit={(ad) => { setEditingAdCost(ad); setAdEntryMode(ad.endDate ? 'range' : 'single'); setIsEditAdCostOpen(true); }} onDelete={(ad) => { setSelectedAdCost(ad); setShowDeleteAdConfirm(true); }} onBulkDelete={handleBulkDeleteAds} onManagePlatforms={() => setIsManagePlatformsOpen(true)} />}
        {activeView === 'customers' && <CustomersView customers={customers} searchQuery={searchQuery} setSearchQuery={setSearchQuery} isDemoMode={isDemoMode} theme={theme} setTheme={setTheme} />}
      </main>

      {/* Modals and Confirmations */}
      {showDeleteConfirm && selectedProduct && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={36}/></div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Item?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 px-4">Permanently remove <span className="font-bold">"{selectedProduct.name}"</span>?</p>
            <div className="space-y-3">
              <button onClick={() => confirmDeleteProduct(selectedProduct)} className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-lg shadow-lg">Yes, Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold text-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSaleConfirm && selectedSale && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteSaleConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={36}/></div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Sale?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 px-4">Delete transaction from <span className="font-bold">"{selectedSale.customer}"</span>?</p>
            <div className="space-y-3">
              <button onClick={() => confirmDeleteSale(selectedSale)} className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-lg shadow-lg">Delete Record</button>
              <button onClick={() => setShowDeleteSaleConfirm(false)} className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold text-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAdConfirm && selectedAdCost && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowDeleteAdConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={36}/></div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Ad Record?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 px-4">Delete <span className="font-bold">"{selectedAdCost.platform}"</span> expense on {selectedAdCost.date}?</p>
            <div className="space-y-3">
              <button onClick={() => confirmDeleteAd(selectedAdCost)} className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-lg shadow-lg">Delete Record</button>
              <button onClick={() => setShowDeleteAdConfirm(false)} className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold text-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteAdConfirm && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowBulkDeleteAdConfirm(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm p-8 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={36}/></div>
            <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Bulk Delete?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 px-4">Permanently remove <span className="font-bold">{bulkSelectedAdIds.length}</span> selected ad records?</p>
            <div className="space-y-3">
              <button onClick={confirmBulkDeleteAds} className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-lg shadow-lg">Delete {bulkSelectedAdIds.length} Records</button>
              <button onClick={() => setShowBulkDeleteAdConfirm(false)} className="w-full py-5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-[24px] font-bold text-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Management Modal */}
      {isManagePlatformsOpen && (
        <div className="fixed inset-0 z-[800] bg-white dark:bg-[#0F172A] flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
             <div>
                <h3 className="font-bold text-2xl dark:text-white">Ad Platforms</h3>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Manage where you advertise</p>
             </div>
             <button onClick={() => setIsManagePlatformsOpen(false)} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400"><X size={20}/></button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {platforms.map(platform => (
              <div key={platform.id} className="bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-[24px] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center"><Tag size={18}/></div>
                  <span className="font-bold text-gray-900 dark:text-white">{platform.name}</span>
                </div>
                <button onClick={() => handleDeletePlatform(platform.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><Trash2 size={18}/></button>
              </div>
            ))}
            {platforms.length === 0 && (
              <div className="py-12 text-center">
                 <p className="text-gray-400 font-medium mb-1">No custom platforms added.</p>
                 <p className="text-[10px] text-gray-300 dark:text-slate-600 uppercase font-black">Showing defaults in forms until you add your own</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-white dark:bg-[#0F172A] border-t border-gray-100 dark:border-slate-800 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
             <div className="flex items-center space-x-3">
                <input 
                  type="text" 
                  placeholder="New platform name..." 
                  value={newPlatformName}
                  onChange={e => setNewPlatformName(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-slate-800 border-none rounded-[20px] py-4 px-6 font-medium text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                />
                <button 
                  onClick={handleAddPlatform}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-[20px] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  <Plus size={24} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Forms Modal Handling */}
      {(isAddStockOpen || (isEditStockOpen && editingProduct)) && (
        <div className="fixed inset-0 z-[600] bg-white dark:bg-[#0F172A] flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-2xl dark:text-white">{isEditStockOpen ? 'Update Item' : 'New Stock'}</h3>
            <button onClick={() => { setIsAddStockOpen(false); setIsEditStockOpen(false); }} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400 dark:text-slate-500"><X size={20}/></button>
          </div>
          <form onSubmit={isEditStockOpen ? handleEditProductSubmit : handleAddProductSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto pb-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <input required type="text" value={isEditStockOpen ? editingProduct?.name : newProduct.name} onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none focus:ring-2 focus:ring-indigo-600 font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                <input required type="number" step="0.01" value={isEditStockOpen ? editingProduct?.price : newProduct.price} onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, price: parseFloat(e.target.value)}) : setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cost ($)</label>
                <input type="number" step="0.01" value={isEditStockOpen ? editingProduct?.costPrice : newProduct.costPrice} onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, costPrice: parseFloat(e.target.value)}) : setNewProduct({...newProduct, costPrice: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
              </div>
            </div>
            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-6 rounded-[32px] space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">Inventory Variants</h4>
                <button type="button" onClick={() => { 
                  const v = { id: Date.now().toString(), name: '', stock: 0 };
                  if (isEditStockOpen) setEditingProduct({...editingProduct!, hasVariants: true, variants: [...(editingProduct!.variants || []), v]});
                  else setNewProduct({...newProduct, hasVariants: true, variants: [...newProduct.variants, v]});
                }} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Plus size={18} /></button>
              </div>
              {((isEditStockOpen ? editingProduct?.variants : newProduct.variants) || []).length > 0 ? (
                <div className="space-y-3">
                  {((isEditStockOpen ? editingProduct?.variants : newProduct.variants) || []).map((v, idx) => (
                    <div key={v.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex items-center space-x-3">
                      <Tag size={16} className="text-indigo-400" />
                      <input placeholder="Name" value={v.name} onChange={(e) => {
                        const upd = isEditStockOpen ? [...(editingProduct!.variants || [])] : [...newProduct.variants];
                        upd[idx] = { ...upd[idx], name: e.target.value };
                        if (isEditStockOpen) setEditingProduct({...editingProduct!, variants: upd}); else setNewProduct({...newProduct, variants: upd, hasVariants: true});
                      }} className="flex-1 text-sm font-bold outline-none bg-transparent dark:text-white" />
                      <input type="number" placeholder="Qty" value={v.stock} onChange={(e) => {
                        const upd = isEditStockOpen ? [...(editingProduct!.variants || [])] : [...newProduct.variants];
                        upd[idx] = { ...upd[idx], stock: parseInt(e.target.value) || 0 };
                        if (isEditStockOpen) setEditingProduct({...editingProduct!, variants: upd}); else setNewProduct({...newProduct, variants: upd, hasVariants: true});
                      }} className="w-16 text-right text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none bg-transparent" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Stock</label>
                   <input type="number" value={isEditStockOpen ? editingProduct?.stock : newProduct.stock} onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, stock: parseInt(e.target.value) || 0}) : setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-white dark:bg-slate-900 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xl shadow-xl shadow-indigo-100 dark:shadow-none active:scale-95 transition-all">
              {isEditStockOpen ? 'Update Item' : 'Save Inventory'}
            </button>
          </form>
        </div>
      )}

      {/* Sale Form Modal */}
      {(isAddSaleOpen || (isEditSaleOpen && editingSale)) && (
        <div className="fixed inset-0 z-[600] bg-white dark:bg-[#0F172A] flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-2xl dark:text-white">{isEditSaleOpen ? 'Edit Sale' : 'Record Sale'}</h3>
            <button onClick={() => { setIsAddSaleOpen(false); setIsEditSaleOpen(false); }} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400"><X size={20}/></button>
          </div>
          <form onSubmit={isEditSaleOpen ? handleEditSaleSubmit : handleAddSaleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto pb-12">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</label>
              <div className="relative">
                <select required value={isEditSaleOpen ? products.find(p => p.name === editingSale?.productName)?.id || "" : newSale.productId} onChange={e => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      if (isEditSaleOpen) setEditingSale({...editingSale!, productName: prod.name, amount: prod.price});
                      else setNewSale({...newSale, productId: prod.id, productName: prod.name, amount: prod.price.toString()});
                    }
                  }} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 pl-6 pr-12 outline-none appearance-none font-medium"
                >
                  <option value="">Choose a product...</option>
                  {products.map(p => (<option key={p.id} value={p.id}>{p.name} (${p.price})</option>))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Name</label>
              <input required type="text" value={isEditSaleOpen ? editingSale?.customer : newSale.customer} onChange={e => isEditSaleOpen ? setEditingSale({...editingSale!, customer: e.target.value}) : setNewSale({...newSale, customer: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price ($)</label>
                <input required type="number" step="0.01" value={isEditSaleOpen ? editingSale?.amount : newSale.amount} onChange={e => isEditSaleOpen ? setEditingSale({...editingSale!, amount: parseFloat(e.target.value)}) : setNewSale({...newSale, amount: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</label>
                <input required type="number" value={isEditSaleOpen ? editingSale?.items : newSale.items} onChange={e => isEditSaleOpen ? setEditingSale({...editingSale!, items: parseInt(e.target.value) || 1}) : setNewSale({...newSale, items: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
              <div className="relative">
                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input required type="date" value={isEditSaleOpen ? editingSale?.date : newSale.date} onChange={e => isEditSaleOpen ? setEditingSale({...editingSale!, date: e.target.value}) : setNewSale({...newSale, date: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 pl-14 pr-6 outline-none font-medium" />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xl shadow-xl active:scale-95 transition-all">{isEditSaleOpen ? 'Update Transaction' : 'Record Transaction'}</button>
          </form>
        </div>
      )}

      {/* Ad Cost Form Modal (Add / Edit) */}
      {(isAddAdCostOpen || (isEditAdCostOpen && editingAdCost)) && (
        <div className="fixed inset-0 z-[600] bg-white dark:bg-[#0F172A] flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-2xl dark:text-white">{isEditAdCostOpen ? 'Edit Ad Expense' : 'Ad Expense'}</h3>
            <button onClick={() => { setIsAddAdCostOpen(false); setIsEditAdCostOpen(false); }} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-full text-gray-400"><X size={20}/></button>
          </div>
          
          <div className="px-6 mt-4">
            <div className="flex bg-gray-50 dark:bg-slate-800 p-1.5 rounded-[20px] mb-6">
              <button onClick={() => setAdEntryMode('single')} className={`flex-1 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${adEntryMode === 'single' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}>Single Date</button>
              <button onClick={() => setAdEntryMode('range')} className={`flex-1 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all ${adEntryMode === 'range' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}>Date Range</button>
            </div>
          </div>

          <form onSubmit={isEditAdCostOpen ? handleEditAdCostSubmit : handleAddAdCostSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto pb-12">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</label>
                <button type="button" onClick={() => setIsManagePlatformsOpen(true)} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Manage</button>
              </div>
              <div className="relative">
                <select 
                  value={isEditAdCostOpen ? editingAdCost?.platform : newAdCost.platform} 
                  onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, platform: e.target.value}) : setNewAdCost({...newAdCost, platform: e.target.value})} 
                  className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 pl-6 pr-12 outline-none appearance-none font-medium"
                >
                  {platformOptions.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
            
            {adEntryMode === 'single' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input required type="date" value={isEditAdCostOpen ? editingAdCost?.date : newAdCost.date} onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, date: e.target.value}) : setNewAdCost({...newAdCost, date: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 pl-14 pr-6 outline-none font-medium" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
                  <input required type="date" value={isEditAdCostOpen ? editingAdCost?.date : newAdCost.startDate} onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, date: e.target.value}) : setNewAdCost({...newAdCost, startDate: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Date</label>
                  <input required type="date" value={isEditAdCostOpen ? editingAdCost?.endDate : newAdCost.endDate} onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, endDate: e.target.value}) : setNewAdCost({...newAdCost, endDate: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none text-sm font-medium" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount ($)</label>
              <input required type="number" step="0.01" value={isEditAdCostOpen ? editingAdCost?.amount : newAdCost.amount} onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, amount: parseFloat(e.target.value)}) : setNewAdCost({...newAdCost, amount: e.target.value})} className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
              <input type="text" value={isEditAdCostOpen ? editingAdCost?.notes : newAdCost.notes} onChange={e => isEditAdCostOpen ? setEditingAdCost({...editingAdCost!, notes: e.target.value}) : setNewAdCost({...newAdCost, notes: e.target.value})} placeholder="e.g. Total campaign spend" className="w-full bg-gray-50 dark:bg-slate-800 dark:text-white rounded-[24px] py-5 px-6 outline-none font-medium" />
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xl shadow-xl active:scale-95 transition-all">{isEditAdCostOpen ? 'Update Expense' : 'Save Expense'}</button>
          </form>
        </div>
      )}

      {/* Main Navigation and Menus */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[380] bg-black/30 backdrop-blur-[2px]" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute bottom-32 right-6 space-y-4 flex flex-col items-end">
            <button onClick={() => { setIsAddAdCostOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2.5 pr-5 rounded-[24px] shadow-2xl active:scale-90 transition-transform">
              <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Megaphone size={22} /></div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">Ad Expense</span>
            </button>
            <button onClick={() => { setIsAddSaleOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2.5 pr-5 rounded-[24px] shadow-2xl active:scale-90 transition-transform">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart size={22} /></div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">Record Sale</span>
            </button>
            <button onClick={() => { setIsAddStockOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white dark:bg-slate-900 p-2.5 pr-5 rounded-[24px] shadow-2xl active:scale-90 transition-transform">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Package size={22} /></div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">Stock In</span>
            </button>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-[400] bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-colors duration-300">
        <NavButton active={activeView === 'dashboard'} onClick={() => { setActiveView('dashboard'); setSearchQuery(''); }} icon={LayoutDashboard} label="Home" />
        <NavButton active={activeView === 'inventory'} onClick={() => { setActiveView('inventory'); setSearchQuery(''); }} icon={Package} label="Stock" />
        <div className="relative -top-10">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-18 h-18 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] transition-all duration-300 transform ${isMenuOpen ? 'bg-red-500 rotate-45' : 'bg-indigo-600'}`}>
            <Plus size={36} strokeWidth={2.5} />
          </button>
        </div>
        <NavButton active={activeView === 'sales'} onClick={() => { setActiveView('sales'); setSearchQuery(''); }} icon={ShoppingCart} label="Sales" />
        <NavButton active={activeView === 'adCosts'} onClick={() => { setActiveView('adCosts'); setSearchQuery(''); }} icon={Megaphone} label="Ads" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all duration-300 ${active ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-gray-400 dark:text-slate-500'}`}>
    <div className={`p-1.5 rounded-xl ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''}`}><Icon size={24} strokeWidth={active ? 2.5 : 2} /></div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;
