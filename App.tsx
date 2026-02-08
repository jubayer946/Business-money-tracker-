import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Search,
  Plus,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  X,
  DollarSign,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  Wifi,
  WifiOff,
  ExternalLink,
  RefreshCw,
  Play,
  Database,
  Lock
} from 'lucide-react';
import { Product, Sale, Customer, ViewType } from './types';
import { db } from './firebase';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_CUSTOMERS } from './constants';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isEditStockOpen, setIsEditStockOpen] = useState(false);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [isProductActionsOpen, setIsProductActionsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form States
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Grocery',
    price: '',
    stock: ''
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newSale, setNewSale] = useState({
    customer: '',
    amount: '',
    items: '1',
    date: new Date().toISOString().split('T')[0]
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const enterDemoMode = useCallback(() => {
    setProducts(MOCK_PRODUCTS);
    setSales(MOCK_SALES);
    setCustomers(MOCK_CUSTOMERS);
    setSyncError(null);
    setIsLoading(false);
    setIsDemoMode(true);
    showToast("Operating in Local Demo Mode", "info");
  }, [showToast]);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (isDemoMode) return;

    // Fixed: Defensive error handler that NEVER passes the raw error object to state or logs
    // This prevents "Converting circular structure to JSON" errors triggered by some dev environments
    const onSyncError = (error: any) => {
      // Extract ONLY string primitives to avoid circular reference issues
      const code = error && typeof error.code === 'string' ? error.code : 'unknown';
      const message = error && typeof error.message === 'string' ? error.message : 'Database sync failed';
      
      console.warn(`Firestore Error [${code}]: ${message}`);

      if (code === 'permission-denied') {
        setSyncError("Cloud Restricted: API not enabled or Rules blocking access.");
      } else {
        setSyncError(`Sync Issue: ${message}`);
      }
      setIsLoading(false);
    };

    try {
      const qProducts = query(collection(db, 'products'), orderBy('name'));
      const unsubscribeProducts = onSnapshot(qProducts, {
        next: (snapshot) => {
          setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
          setIsLoading(false);
          setSyncError(null);
        },
        error: onSyncError
      });

      const qSales = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(50));
      const unsubscribeSales = onSnapshot(qSales, {
        next: (snapshot) => setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale))),
        error: onSyncError
      });

      const qCustomers = query(collection(db, 'customers'), orderBy('name'));
      const unsubscribeCustomers = onSnapshot(qCustomers, {
        next: (snapshot) => setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer))),
        error: onSyncError
      });

      return () => {
        unsubscribeProducts();
        unsubscribeSales();
        unsubscribeCustomers();
      };
    } catch (e: any) {
      onSyncError(e);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const stats = useMemo(() => {
    const revenue = sales.reduce((acc, s) => acc + s.amount, 0);
    const invValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    return {
      totalRevenue: revenue,
      totalOrders: sales.length,
      activeCustomers: customers.length,
      inventoryValue: invValue
    };
  }, [products, sales, customers]);

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stockVal = parseInt(newProduct.stock) || 0;
    const productData = {
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      stock: stockVal,
      status: stockVal > 10 ? 'In Stock' : (stockVal > 0 ? 'Low Stock' : 'Out of Stock')
    };

    if (isDemoMode) {
      setProducts(prev => [{ id: Date.now().toString(), ...productData } as Product, ...prev]);
      showToast('Saved locally');
    } else {
      try {
        await addDoc(collection(db, 'products'), productData);
        showToast('Synced to Cloud');
      } catch (err) {
        showToast('Cloud sync failed', 'error');
      }
    }
    setNewProduct({ name: '', category: 'Grocery', price: '', stock: '' });
    setIsAddStockOpen(false);
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (isDemoMode) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      showToast('Updated locally');
    } else {
      try {
        const { id, ...data } = editingProduct;
        await updateDoc(doc(db, 'products', id), data as any);
        showToast('Cloud updated');
      } catch (err) {
        showToast('Update failed', 'error');
      }
    }
    setEditingProduct(null);
    setIsEditStockOpen(false);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    if (isDemoMode) {
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      showToast('Removed locally');
    } else {
      try {
        await deleteDoc(doc(db, 'products', selectedProduct.id));
        showToast('Deleted from Cloud', 'info');
      } catch (err) {
        showToast('Delete failed', 'error');
      }
    }
    setIsProductActionsOpen(false);
    setSelectedProduct(null);
    setShowDeleteConfirm(false);
  };

  const handleAddSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saleData = {
      customer: newSale.customer,
      amount: parseFloat(newSale.amount) || 0,
      items: parseInt(newSale.items) || 1,
      date: newSale.date
    };

    if (isDemoMode) {
      setSales(prev => [{ id: Date.now().toString(), ...saleData } as Sale, ...prev]);
      showToast('Sale recorded locally');
    } else {
      try {
        await addDoc(collection(db, 'sales'), saleData);
        showToast('Sale synchronized!');
      } catch (err) {
        showToast('Sync failed', 'error');
      }
    }
    setNewSale({ customer: '', amount: '', items: '1', date: new Date().toISOString().split('T')[0] });
    setIsAddSaleOpen(false);
  };

  const handleProductTap = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(false);
    setIsProductActionsOpen(true);
  };

  const MobileHeader = ({ title, showSearch = false, placeholder = "Search..." }: { title: string, showSearch?: boolean, placeholder?: string }) => (
    <div className="sticky top-0 z-30 bg-[#FBFBFE]/80 backdrop-blur-md px-5 pt-4 pb-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <div className="flex items-center space-x-1 mt-0.5">
            {isDemoMode ? <WifiOff size={10} className="text-orange-500" /> : <Wifi size={10} className="text-green-500" />}
            <span className={`text-[9px] font-bold uppercase ${isDemoMode ? 'text-orange-500' : 'text-gray-400'}`}>
              {isDemoMode ? 'Local Mode' : 'Cloud Sync Active'}
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shadow-inner">
          BM
        </div>
      </div>
      {showSearch && (
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none"
          />
        </div>
      )}
    </div>
  );

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 min-w-[160px]">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 text-${color.split('-')[1]}-600 mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <h3 className="text-xl font-bold mt-0.5">{value}</h3>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FBFBFE] relative overflow-hidden">
      {/* Error / Loading State */}
      {(isLoading || syncError) && !isDemoMode && (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          {syncError ? (
            <div className="max-w-sm animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cloud Restricted</h2>
              <div className="text-gray-500 mb-8 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="mb-2 font-bold text-red-600">Action Required:</p>
                <p>Firestore API is not active for project <b>business-tracker-160ed</b>.</p>
                <ol className="mt-3 text-left list-decimal pl-4 space-y-1 text-xs">
                  <li>Open Firebase Console</li>
                  <li>Go to <b>Firestore Database</b></li>
                  <li>Click <b>Create Database</b></li>
                </ol>
              </div>
              
              <div className="space-y-3">
                <a 
                  href="https://console.firebase.google.com/project/business-tracker-160ed/firestore" 
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all"
                >
                  <ExternalLink size={20} />
                  <span>Go to Console</span>
                </a>
                
                <button 
                  onClick={enterDemoMode}
                  className="w-full flex items-center justify-center space-x-2 bg-white text-indigo-600 border-2 border-indigo-50 font-bold py-4 rounded-2xl active:bg-indigo-50 transition-all"
                >
                  <Play size={20} />
                  <span>Use Local Mode (Skip)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="mt-6 font-bold text-gray-900 animate-pulse">Establishing Cloud Sync...</p>
              <button onClick={enterDemoMode} className="mt-10 text-xs text-indigo-500 font-bold uppercase tracking-widest border-b border-indigo-200">Start Offline</button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[500] px-6 py-3 rounded-2xl bg-gray-900 text-white shadow-2xl flex items-center space-x-2 text-sm font-medium animate-in slide-in-from-top-full duration-300">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeView === 'dashboard' && (
          <div className="pb-32 animate-in fade-in duration-500">
            <MobileHeader title="Business Overview" />
            <div className="px-5 mt-4 flex overflow-x-auto space-x-4 hide-scrollbar">
              <StatCard label="Total Sales" value={`$${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-500" />
              <StatCard label="Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-emerald-500" />
              <StatCard label="Asset Value" value={`$${stats.inventoryValue.toLocaleString()}`} icon={Package} color="bg-orange-500" />
            </div>
            <div className="px-5 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Critical Stock Alerts</h3>
                <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Urgent</span>
              </div>
              <div className="space-y-3">
                {products.filter(p => p.status !== 'In Stock').slice(0, 4).map(p => (
                  <div key={p.id} onClick={() => handleProductTap(p)} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center justify-between active:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center"><AlertCircle size={20}/></div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{p.stock} units left</p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" size={18} />
                  </div>
                ))}
                {products.filter(p => p.status !== 'In Stock').length === 0 && !isLoading && (
                  <div className="py-10 text-center bg-green-50/20 border border-green-50 rounded-3xl">
                    <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2 opacity-30" />
                    <p className="text-xs text-green-600 font-bold">All stock levels are optimal</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeView === 'inventory' && (
          <div className="pb-32 animate-in slide-in-from-right-10 duration-500">
            <MobileHeader title="Inventory Hub" showSearch placeholder="Search items..." />
            <div className="px-5 mt-4 space-y-4">
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} onClick={() => handleProductTap(p)} className="bg-white p-4 rounded-[32px] border border-gray-100 flex items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${p.status === 'In Stock' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{p.name}</h4>
                    <p className="text-xs text-gray-400">{p.category} • ${p.price}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${p.status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.stock} Qty</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeView === 'sales' && (
          <div className="pb-32 animate-in slide-in-from-right-10 duration-500">
            <MobileHeader title="Sales Ledger" />
            <div className="px-5 mt-4 space-y-3">
              {sales.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-[28px] border border-gray-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><DollarSign size={20}/></div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{s.customer}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{s.date}</p>
                    </div>
                  </div>
                  <p className="font-black text-lg text-indigo-600">${s.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeView === 'customers' && (
          <div className="pb-32 animate-in slide-in-from-right-10 duration-500">
            <MobileHeader title="Customer Directory" />
            <div className="px-5 mt-4 space-y-4">
              {customers.map(c => (
                <div key={c.id} className="bg-white p-6 rounded-[36px] border border-gray-100 shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-lg">{c.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{c.name}</h4>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Lifetime Value</p>
                      <p className="text-base font-black text-indigo-600">${c.totalSpent.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-gray-300 font-mono">ID_{c.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Action Sheets and Forms */}
      {isProductActionsOpen && selectedProduct && (
        <div className="fixed inset-0 z-[450] bg-black/40 backdrop-blur-sm" onClick={() => setIsProductActionsOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] px-6 pt-2 pb-12 animate-slide-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-4"></div>
            {!showDeleteConfirm ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500">{selectedProduct.category} • {selectedProduct.stock} in stock</p>
                </div>
                <button onClick={() => { setEditingProduct(selectedProduct); setIsEditStockOpen(true); setIsProductActionsOpen(false); }} className="w-full flex items-center space-x-4 p-5 bg-indigo-50 rounded-[28px] text-indigo-700 font-bold active:bg-indigo-100">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center"><Edit2 size={20} /></div>
                  <span className="text-lg">Edit Details</span>
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center space-x-4 p-5 bg-red-50 rounded-[28px] text-red-600 font-bold active:bg-red-100">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center"><Trash2 size={20} /></div>
                  <span className="text-lg">Delete Permanently</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={32}/>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Are you sure?</h3>
                <p className="text-gray-500 mb-8 px-4">This will permanently remove this item from your database.</p>
                <div className="flex flex-col space-y-3 px-4">
                  <button onClick={confirmDeleteProduct} className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-xl shadow-lg">Yes, Delete Forever</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-5 bg-gray-100 text-gray-600 rounded-[24px] font-bold text-xl">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Forms */}
      {(isAddStockOpen || (isEditStockOpen && editingProduct)) && (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-2xl text-gray-900">{isEditStockOpen ? 'Update Item' : 'New Stock Item'}</h3>
            <button onClick={() => { setIsAddStockOpen(false); setIsEditStockOpen(false); }} className="p-3 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-transform"><X size={20}/></button>
          </div>
          <form 
            onSubmit={isEditStockOpen ? handleEditProductSubmit : handleAddProductSubmit} 
            className="flex-1 p-6 space-y-6 overflow-y-auto"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
              <input required type="text" 
                value={isEditStockOpen ? editingProduct?.name : newProduct.name} 
                onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[24px] py-5 px-6 outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price ($)</label>
                <input required type="number" step="0.01" 
                  value={isEditStockOpen ? editingProduct?.price : newProduct.price} 
                  onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, price: parseFloat(e.target.value)}) : setNewProduct({...newProduct, price: e.target.value})} 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[24px] py-5 px-6 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Stock</label>
                <input required type="number" 
                  value={isEditStockOpen ? editingProduct?.stock : newProduct.stock} 
                  onChange={e => isEditStockOpen ? setEditingProduct({...editingProduct!, stock: parseInt(e.target.value)}) : setNewProduct({...newProduct, stock: e.target.value})} 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[24px] py-5 px-6 outline-none transition-all" />
              </div>
            </div>
            <div className="pt-6">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xl shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                {isEditStockOpen ? 'Apply Changes' : 'Save to Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddSaleOpen && (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col h-full animate-slide-up">
          <div className="px-6 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-2xl">Record Sale</h3>
            <button onClick={() => setIsAddSaleOpen(false)} className="p-3 bg-gray-50 rounded-full text-gray-400"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddSaleSubmit} className="flex-1 p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</label>
              <input required type="text" placeholder="Full Name" value={newSale.customer} onChange={e => setNewSale({...newSale, customer: e.target.value})} className="w-full bg-gray-50 rounded-[24px] py-5 px-6 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount ($)</label>
              <input required type="number" step="0.01" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full bg-gray-50 rounded-[24px] py-5 px-6 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[28px] text-xl shadow-xl active:scale-95 transition-all">Process Payment</button>
          </form>
        </div>
      )}

      {/* Floating Plus Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[380] bg-black/30 backdrop-blur-[2px]" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute bottom-32 right-6 space-y-4 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5 duration-300">
            <button onClick={() => { setIsAddSaleOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white p-2.5 pr-5 rounded-[24px] shadow-2xl active:scale-90 transition-transform">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCart size={22} /></div>
              <span className="font-bold text-sm text-gray-900">New Sale</span>
            </button>
            <button onClick={() => { setIsAddStockOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white p-2.5 pr-5 rounded-[24px] shadow-2xl active:scale-90 transition-transform">
              <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Package size={22} /></div>
              <span className="font-bold text-sm text-gray-900">Add Stock</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Home" />
        <NavButton active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Package} label="Stock" />
        <div className="relative -top-10">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-18 h-18 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(79,70,229,0.3)] transition-all duration-300 transform ${isMenuOpen ? 'bg-red-500 rotate-45 scale-90' : 'bg-indigo-600 hover:scale-105'}`}>
            <Plus size={36} strokeWidth={2.5} />
          </button>
        </div>
        <NavButton active={activeView === 'sales'} onClick={() => setActiveView('sales')} icon={ShoppingCart} label="Sales" />
        <NavButton active={activeView === 'customers'} onClick={() => setActiveView('customers')} icon={Users} label="CRM" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1 group transition-all duration-300 ${active ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-indigo-400'}`}>
    <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-indigo-50' : 'group-hover:bg-gray-50'}`}>
      <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;