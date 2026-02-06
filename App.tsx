import React, { useState, useMemo, useEffect } from 'react';
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
  Filter,
  Bell,
  X,
  DollarSign,
  Save,
  Tag,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Product, Sale, Customer, BusinessStats, ViewType } from './types';
import { MOCK_PRODUCTS, MOCK_SALES, MOCK_CUSTOMERS, MOCK_STATS } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [stats, setStats] = useState<BusinessStats>(MOCK_STATS);
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

  // Effect to hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Derived Stats
  const inventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  }, [products]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price) || 0,
      stock: parseInt(newProduct.stock) || 0,
      status: parseInt(newProduct.stock) > 10 ? 'In Stock' : (parseInt(newProduct.stock) > 0 ? 'Low Stock' : 'Out of Stock')
    };

    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', category: 'Grocery', price: '', stock: '' });
    setIsAddStockOpen(false);
    showToast('Product added successfully');
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setProducts(prev => prev.map(p => {
      if (p.id === editingProduct.id) {
        return {
          ...editingProduct,
          status: editingProduct.stock > 10 ? 'In Stock' : (editingProduct.stock > 0 ? 'Low Stock' : 'Out of Stock') as any
        };
      }
      return p;
    }));

    setEditingProduct(null);
    setIsEditStockOpen(false);
    showToast('Product updated');
  };

  const confirmDeleteProduct = () => {
    if (!selectedProduct) return;
    const productId = selectedProduct.id;
    setProducts(prev => prev.filter(p => p.id !== productId));
    setIsProductActionsOpen(false);
    setSelectedProduct(null);
    setShowDeleteConfirm(false);
    showToast('Product removed', 'info');
  };

  const handleAddSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sale: Sale = {
      id: (sales.length + 1001).toString(),
      customer: newSale.customer,
      amount: parseFloat(newSale.amount) || 0,
      items: parseInt(newSale.items) || 1,
      date: newSale.date
    };

    setSales(prev => [sale, ...prev]);
    setStats(prev => ({
      ...prev,
      totalRevenue: prev.totalRevenue + sale.amount,
      totalOrders: prev.totalOrders + 1
    }));
    setNewSale({ customer: '', amount: '', items: '1', date: new Date().toISOString().split('T')[0] });
    setIsAddSaleOpen(false);
    showToast('Sale recorded!');
  };

  const handleProductTap = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(false);
    setIsProductActionsOpen(true);
  };

  const MobileHeader = ({ title, showSearch = false, placeholder = "Search..." }: { title: string, showSearch?: boolean, placeholder?: string }) => (
    <div className="sticky top-0 z-30 bg-[#FBFBFE]/80 backdrop-blur-md px-5 pt-4 pb-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <div className="flex items-center space-x-3">
          <button className="p-2 bg-white rounded-full shadow-sm border border-gray-100 relative">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <img src="https://picsum.photos/40/40?grayscale" className="w-9 h-9 rounded-full border-2 border-indigo-100" alt="Avatar" />
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

  const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 min-w-[160px]">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 text-${color.split('-')[1]}-600 mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline space-x-2">
        <h3 className="text-xl font-bold mt-0.5">{value}</h3>
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="pb-32 animate-in fade-in duration-300">
      <MobileHeader title="Overview" />
      <div className="px-5 mt-4">
        <div className="flex overflow-x-auto space-x-4 hide-scrollbar pb-2">
          <StatCard label="Revenue" value={`$${(stats.totalRevenue/1000).toFixed(1)}k`} trend={12} icon={TrendingUp} color="bg-indigo-500" />
          <StatCard label="Orders" value={stats.totalOrders} trend={5} icon={ShoppingCart} color="bg-emerald-500" />
          <StatCard label="Clients" value={stats.activeCustomers} trend={-2} icon={Users} color="bg-blue-500" />
          <StatCard label="Stock" value={`$${(inventoryValue/1000).toFixed(1)}k`} icon={Package} color="bg-orange-500" />
        </div>
      </div>
      <div className="px-5 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Urgent Attention</h3>
          <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Action Needed</span>
        </div>
        <div className="space-y-3">
          {products.filter(p => p.status !== 'In Stock').slice(0, 3).map(product => (
            <div key={product.id} onClick={() => handleProductTap(product)} className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><AlertCircle size={20} /></div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{product.name}</h4>
                  <p className="text-xs text-gray-500">{product.stock} left • {product.category}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-300" size={18} />
            </div>
          ))}
          {products.filter(p => p.status !== 'In Stock').length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">All stock levels are optimal.</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="pb-32 animate-in slide-in-from-right-4 duration-300">
      <MobileHeader title="Inventory" showSearch placeholder="Search products..." />
      <div className="px-5 mt-4 space-y-4">
        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
          <div 
            key={product.id} 
            onClick={() => handleProductTap(product)}
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center group active:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${
              product.status === 'In Stock' ? 'bg-green-100 text-green-600' : 
              product.status === 'Low Stock' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
            }`}><Package size={24} /></div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-gray-900 leading-tight pr-2">{product.name}</h4>
                <div className="bg-gray-50 p-1 rounded-lg">
                  <MoreVertical size={14} className="text-gray-400" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500 uppercase tracking-tight font-medium">{product.category}</p>
                <div className="flex items-center space-x-2">
                   <span className="text-xs font-bold text-gray-700">${product.price.toFixed(2)}</span>
                   <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    product.status === 'In Stock' ? 'bg-green-50 text-green-600' : 
                    product.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                  }`}>{product.status} • {product.stock} units</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FBFBFE] relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300 px-6 py-3 rounded-2xl bg-gray-900 text-white shadow-2xl flex items-center space-x-2 text-sm font-medium">
          {toast.type === 'success' ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-orange-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto hide-scrollbar bg-[#FBFBFE]">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'inventory' && renderInventory()}
        {activeView === 'sales' && renderSales()}
        {activeView === 'customers' && renderCustomers()}
      </main>

      {/* Product Action Sheet */}
      {isProductActionsOpen && selectedProduct && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsProductActionsOpen(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[40px] px-6 pt-2 pb-12 animate-slide-up shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-4"></div>
            
            {!showDeleteConfirm ? (
              <>
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Package size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-500">{selectedProduct.category} • {selectedProduct.stock} in stock</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => { setEditingProduct(selectedProduct); setIsEditStockOpen(true); setIsProductActionsOpen(false); }}
                    className="w-full flex items-center space-x-4 p-5 bg-indigo-50/50 rounded-[28px] text-indigo-700 active:scale-[0.97] transition-all"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center"><Edit2 size={20} /></div>
                    <span className="font-bold text-lg">Edit Product Details</span>
                  </button>

                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center space-x-4 p-5 bg-red-50/50 rounded-[28px] text-red-600 active:scale-[0.97] transition-all"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center"><Trash2 size={20} /></div>
                    <span className="font-bold text-lg">Delete from Inventory</span>
                  </button>

                  <button 
                    onClick={() => setIsProductActionsOpen(false)}
                    className="w-full py-4 text-gray-400 font-bold text-center mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Are you sure?</h3>
                <p className="text-gray-500 mb-8 px-6 text-lg">This will permanently remove <span className="font-bold">"{selectedProduct.name}"</span> from your business records.</p>
                <div className="space-y-3 px-4">
                  <button 
                    onClick={confirmDeleteProduct}
                    className="w-full py-5 bg-red-600 text-white rounded-[24px] font-bold text-xl shadow-lg shadow-red-100 active:scale-[0.97] transition-all"
                  >
                    Yes, Delete Forever
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-5 bg-gray-100 text-gray-600 rounded-[24px] font-bold text-xl active:scale-[0.97] transition-all"
                  >
                    No, Keep It
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute bottom-32 right-6 space-y-4 flex flex-col items-end">
            <MenuAction icon={ShoppingCart} label="New Sale" color="bg-indigo-600" onClick={() => { setIsAddSaleOpen(true); setIsMenuOpen(false); }} />
            <MenuAction icon={Package} label="Add Stock" color="bg-orange-600" onClick={() => { setIsAddStockOpen(true); setIsMenuOpen(false); }} />
            <MenuAction icon={Users} label="Add Client" color="bg-blue-600" onClick={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Add/Edit/Sale Sheets */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-[120] bg-white animate-slide-up flex flex-col h-full">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600"><Plus size={22} /></div>
              <h3 className="font-bold text-lg">Add New Stock</h3>
            </div>
            <button onClick={() => setIsAddStockOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleAddProductSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Tag size={14} className="mr-1" /> Product Name</label>
              <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Arabica Coffee" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><DollarSign size={14} className="mr-1" /> Price</label>
                <input required type="number" step="0.01" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="0.00" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Package size={14} className="mr-1" /> Quantity</label>
                <input required type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} placeholder="0" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 active:scale-95 transition-all">Save to Inventory</button>
            </div>
          </form>
        </div>
      )}

      {isEditStockOpen && editingProduct && (
        <div className="fixed inset-0 z-[130] bg-white animate-slide-up flex flex-col h-full">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600"><Edit2 size={22} /></div>
              <h3 className="font-bold text-lg">Edit Stock</h3>
            </div>
            <button onClick={() => setIsEditStockOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleEditProductSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Tag size={14} className="mr-1" /> Product Name</label>
              <input required type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><DollarSign size={14} className="mr-1" /> Price</label>
                <input required type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Package size={14} className="mr-1" /> Quantity</label>
                <input required type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Update Item</button>
            </div>
          </form>
        </div>
      )}

      {isAddSaleOpen && (
        <div className="fixed inset-0 z-[120] bg-white animate-slide-up flex flex-col h-full">
          <div className="px-5 pt-12 pb-4 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600"><ShoppingCart size={22} /></div>
              <h3 className="font-bold text-lg">Record Sale</h3>
            </div>
            <button onClick={() => setIsAddSaleOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400"><X size={20} /></button>
          </div>
          <form onSubmit={handleAddSaleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Users size={14} className="mr-1" /> Customer</label>
              <input required type="text" value={newSale.customer} onChange={e => setNewSale({...newSale, customer: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><DollarSign size={14} className="mr-1" /> Amount</label>
                <input required type="number" step="0.01" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center"><Layers size={14} className="mr-1" /> Items</label>
                <input required type="number" value={newSale.items} onChange={e => setNewSale({...newSale, items: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm outline-none" />
              </div>
            </div>
            <div className="pt-4">
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">Confirm Sale</button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-between items-center rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={LayoutDashboard} label="Home" />
        <NavButton active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} icon={Package} label="Stock" />
        <div className="relative -top-8">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 ${isMenuOpen ? 'bg-red-500 rotate-45' : 'bg-indigo-600'}`}>
            <Plus size={32} strokeWidth={3} />
          </button>
        </div>
        <NavButton active={activeView === 'sales'} onClick={() => setActiveView('sales')} icon={ShoppingCart} label="Sales" />
        <NavButton active={activeView === 'customers'} onClick={() => setActiveView('customers')} icon={Users} label="CRM" />
      </nav>
    </div>
  );
};

// Sub-components
const MenuAction = ({ icon: Icon, label, color, onClick }: any) => (
  <button onClick={onClick} className="flex items-center space-x-3 group animate-in slide-in-from-bottom-2 duration-300 fill-mode-both">
    <span className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-gray-100 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
    <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform`}><Icon size={20} /></div>
  </button>
);

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 group">
    <div className={`p-2 rounded-2xl transition-all duration-300 ${active ? 'bg-indigo-600/10 text-indigo-600 scale-110' : 'text-gray-400 group-hover:text-indigo-400'}`}>
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${active ? 'text-indigo-600 opacity-100' : 'text-gray-400 opacity-60'}`}>{label}</span>
  </button>
);

// Dummy render functions for missing sections to keep code clean
const renderSales = () => null;
const renderCustomers = () => null;

export default App;