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
  Database
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

  // --- LOCAL FALLBACK ---
  const enterDemoMode = useCallback(() => {
    setProducts(MOCK_PRODUCTS);
    setSales(MOCK_SALES);
    setCustomers(MOCK_CUSTOMERS);
    setSyncError(null);
    setIsLoading(false);
    setIsDemoMode(true);
    showToast("Operating in Local-First Mode", "info");
  }, [showToast]);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (isDemoMode) return;

    // Fixed: Logging individual properties to avoid 'Circular structure to JSON' errors
    const handleError = (error: any) => {
      const errorCode = error?.code || 'unknown';
      const errorMessage = error?.message || 'Unknown error';
      
      console.warn("Firestore Sync Issue:", { code: errorCode, message: errorMessage });

      if (errorCode === 'permission-denied') {
        setSyncError("Cloud Access Denied: API is disabled or Security Rules are blocking access.");
      } else {
        setSyncError(`Connection failed: ${errorMessage}`);
      }
      setIsLoading(false);
    };

    try {
      const qProducts = query(collection(db, 'products'), orderBy('name'));
      const unsubscribeProducts = onSnapshot(qProducts, 
        (snapshot) => {
          setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
          setIsLoading(false);
          setSyncError(null);
        },
        handleError
      );

      const qSales = query(collection(db, 'sales'), orderBy('date', 'desc'), limit(50));
      const unsubscribeSales = onSnapshot(qSales, 
        (snapshot) => setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale))),
        handleError
      );

      const qCustomers = query(collection(db, 'customers'), orderBy('name'));
      const unsubscribeCustomers = onSnapshot(qCustomers, 
        (snapshot) => setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer))),
        handleError
      );

      return () => {
        unsubscribeProducts();
        unsubscribeSales();
        unsubscribeCustomers();
      };
    } catch (e: any) {
      handleError(e);
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
      showToast('Product saved locally');
    } else {
      try {
        await addDoc(collection(db, 'products'), productData);
        showToast('Product synced to cloud');
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
      showToast('Product updated locally');
    } else {
      try {
        await updateDoc(doc(db, 'products', editingProduct.id), { ...editingProduct });
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
      showToast('Product removed locally');
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
              {isDemoMode ? 'Local-Only Mode' : 'Cloud Connected'}
            </span>
          </div>
        </div>
        <img src="https://picsum.photos/40/40?grayscale" className="w-9 h-9 rounded-full border-2 border-indigo-100" alt="Avatar" />
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
      {/* Diagnostics / Sync Screen */}
      {(isLoading || syncError) && !isDemoMode && (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          {syncError ? (
            <div className="max-w-sm animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Database size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Firestore Access Issue</h2>
              <div className="text-gray-500 mb-8 text-sm space-y-4">
                <p>The Cloud Firestore API is either disabled or permissions are blocking this request for project: <br/><code className="bg-gray-100 px-1 rounded font-bold">business-tracker-160ed</code></p>
                <div className="bg-orange-50 p-4 rounded-xl text-orange-700 text-left">
                  <p className="font-bold flex items-center mb-1"><AlertTriangle size={14} className="mr-1"/> Critical Setup Needed:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Enable <b>Cloud Firestore</b> in the Firebase Console.</li>
                    <li>Ensure Security Rules allow read/write.</li>
                  </ol>
                </div>
              </div>
              
              <div className="space-y-3">
                <a 
                  href="https://console.firebase.google.com/project/business-tracker-160ed/firestore" 
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  <ExternalLink size={20} />
                  <span>Fix in Console</span>
                </a>
                
                <button 
                  onClick={enterDemoMode}
                  className="w-full flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 font-bold py-4 rounded-2xl active:bg-gray-100 transition-all border border-gray-100"
                >
                  <Play size={20} className="text-indigo-600" />
                  <span>Bypass (Offline Mode)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cloud className="text-indigo-600 animate-pulse" size={24} />
                </div>
              </div>
              <p className="mt-6 font-bold text-gray-900">Connecting to Cloud...</p>
              <button onClick={enterDemoMode} className="mt-8 text-xs text-indigo-600 font-bold uppercase underline">Skip to Offline Mode</button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[400] px-6 py-3 rounded-2xl bg-gray-900 text-white shadow-2xl flex items-center space-x-2 text-sm font-medium animate-in slide-in-from-top-full">
          <CheckCircle2 size={16} className="text-green-400" />
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto hide-scrollbar">
        {activeView === 'dashboard' && (
          <div className="pb-32">
            <MobileHeader title="Overview" />
            <div className="px-5 mt-4 flex overflow-x-auto space-x-4 hide-scrollbar">
              <StatCard label="Sales" value={`$${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-500" />
              <StatCard label="Orders" value={stats.totalOrders} icon={ShoppingCart} color="bg-emerald-500" />
              <StatCard label="Value" value={`$${stats.inventoryValue.toLocaleString()}`} icon={Package} color="bg-orange-500" />
            </div>
            <div className="px-5 mt-8">
              <h3 className="font-bold text-gray-900 mb-4">Stock Alerts</h3>
              <div className="space-y-3">
                {products.filter(p => p.status !== 'In Stock').slice(0, 5).map(p => (
                  <div key={p.id} onClick={() => handleProductTap(p)} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between active:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><AlertCircle size={20}/></div>
                      <div>
                        <p className="font-bold text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.stock} units remaining</p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" size={18} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeView === 'inventory' && (
          <div className="pb-32">
            <MobileHeader title="Inventory" showSearch placeholder="Search items..." />
            <div className="px-5 mt-4 space-y-4">
              {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                <div key={p.id} onClick={() => handleProductTap(p)} className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center shadow-sm active:scale-[0.98] transition-transform">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${p.status === 'In Stock' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Package size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-900">{p.name}</h4>
                    <p className="text-xs text-gray-400">{p.category} • ${p.price}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.status === 'In Stock' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock} units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeView === 'sales' && (
          <div className="pb-32">
            <MobileHeader title="Recent Sales" />
            <div className="px-5 mt-4 space-y-3">
              {sales.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-3xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm">{s.customer}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{s.date}</p>
                  </div>
                  <p className="font-black text-indigo-600">${s.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeView === 'customers' && (
          <div className="pb-32">
            <MobileHeader title="CRM" />
            <div className="px-5 mt-4 space-y-4">
              {customers.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-3xl border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">{c.name.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-sm">{c.name}</h4>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-gray-50 pt-3">
                    <p className="text-xs font-bold text-indigo-600">Total Spent: ${c.totalSpent.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">ID: {c.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Product Actions Modal */}
      {isProductActionsOpen && selectedProduct && (
        <div className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm" onClick={() => setIsProductActionsOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] px-6 pt-2 pb-12 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-4"></div>
            {!showDeleteConfirm ? (
              <div className="space-y-3">
                <button onClick={() => { setEditingProduct(selectedProduct); setIsEditStockOpen(true); setIsProductActionsOpen(false); }} className="w-full flex items-center space-x-4 p-5 bg-indigo-50 rounded-[28px] text-indigo-700 font-bold">
                  <Edit2 size={20} /> <span>Edit Item Details</span>
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center space-x-4 p-5 bg-red-50 rounded-[28px] text-red-600 font-bold">
                  <Trash2 size={20} /> <span>Delete Permanently</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete <b>{selectedProduct.name}</b>?</p>
                <div className="flex flex-col space-y-3">
                  <button onClick={confirmDeleteProduct} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold">Yes, Delete</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forms Modal */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-[500] bg-white flex flex-col h-full animate-slide-up">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg">New Inventory Item</h3>
            <button onClick={() => setIsAddStockOpen(false)} className="p-2 text-gray-400"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddProductSubmit} className="flex-1 p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Product Name</label>
              <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-indigo-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Price ($)</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Qty</label>
                <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg">Save Item</button>
          </form>
        </div>
      )}

      {isEditStockOpen && editingProduct && (
        <div className="fixed inset-0 z-[500] bg-white flex flex-col h-full animate-slide-up">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg">Edit Item</h3>
            <button onClick={() => setIsEditStockOpen(false)} className="p-2 text-gray-400"><X size={20}/></button>
          </div>
          <form onSubmit={handleEditProductSubmit} className="flex-1 p-6 space-y-6">
            <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
              <input required type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl">Update Item</button>
          </form>
        </div>
      )}

      {isAddSaleOpen && (
        <div className="fixed inset-0 z-[500] bg-white flex flex-col h-full animate-slide-up">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-lg">Record a Sale</h3>
            <button onClick={() => setIsAddSaleOpen(false)} className="p-2 text-gray-400"><X size={20}/></button>
          </div>
          <form onSubmit={handleAddSaleSubmit} className="flex-1 p-6 space-y-6">
            <input required type="text" placeholder="Customer Name" value={newSale.customer} onChange={e => setNewSale({...newSale, customer: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
            <input required type="number" step="0.01" placeholder="Amount ($)" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full bg-gray-50 rounded-2xl py-4 px-5 outline-none" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl">Confirm Transaction</button>
          </form>
        </div>
      )}

      {/* Plus Menu Floating UI */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[350] bg-black/30" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute bottom-32 right-6 space-y-4 flex flex-col items-end animate-in fade-in slide-in-from-bottom-5">
            <button onClick={() => { setIsAddSaleOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white p-2 pr-4 rounded-2xl shadow-xl">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><ShoppingCart size={20} /></div>
              <span className="font-bold text-sm text-gray-900">New Sale</span>
            </button>
            <button onClick={() => { setIsAddStockOpen(true); setIsMenuOpen(false); }} className="flex items-center space-x-3 bg-white p-2 pr-4 rounded-2xl shadow-xl">
              <div className="w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center"><Package size={20} /></div>
              <span className="font-bold text-sm text-gray-900">Add Stock</span>
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[400] bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center rounded-t-[32px] shadow-2xl">
        <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Home" />
        <NavButton active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Package} label="Stock" />
        <div className="relative -top-8">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl ${isMenuOpen ? 'bg-red-500 rotate-45' : 'bg-indigo-600'} transition-all duration-300`}>
            <Plus size={32} />
          </button>
        </div>
        <NavButton active={activeView === 'sales'} onClick={() => setActiveView('sales')} icon={ShoppingCart} label="Sales" />
        <NavButton active={activeView === 'customers'} onClick={() => setActiveView('customers')} icon={Users} label="CRM" />
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all ${active ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}>
    <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

export default App;