
import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

import { Product, Sale, Expense, BusinessStats, ViewType, AdPlatform, ExpenseCategory, AuditLogEntry } from './types';
import { getLocalDateString, getProductStock, cleanObject } from './utils';
import { sanitizeForStorage, sanitizeNumber } from './utils/sanitize';

import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { SalesView } from './views/SalesView';
import { ExpensesView } from './views/ExpensesView';

import { AddSaleModal } from './components/AddSaleModal';
import { AddProductModal } from './components/AddProductModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ManagePlatformsModal } from './components/ManagePlatformsModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { useConfirmDelete } from './hooks/useConfirmDelete';
import { LoadingScreen } from './components/LoadingScreen';
import { ConnectionStatusBanner } from './components/ConnectionStatusBanner';
import { useToast } from './contexts/ToastContext';
import { useFirestoreCollection } from './hooks/useFirestoreCollection';
import { useRateLimitedMutation } from './hooks/useRateLimitedMutation';
import { RateLimitIndicator } from './components/RateLimitIndicator';
import { useAuditLog } from './hooks/useAuditLog';
import { AccessibleModal } from './components/AccessibleModal';
import { ActivityFeed } from './components/ActivityFeed';

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Plus,
  DollarSign,
  History,
} from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';

const normalizeProduct = (id: string, data: any): Product => ({
  id,
  name: String(data?.name ?? 'Unnamed'),
  price: Number(data?.price ?? 0),
  costPrice: data?.costPrice != null ? Number(data.costPrice) : undefined,
  stock: Number(data?.stock ?? 0),
  status: (data?.status ?? 'In Stock') as any,
  hasVariants: Boolean(data?.hasVariants ?? false),
  variants: Array.isArray(data?.variants) ? data.variants : undefined,
  dateAdded: data?.dateAdded ? String(data.dateAdded) : undefined,
});

const normalizeSale = (id: string, data: any): Sale => ({
  id,
  productId: String(data?.productId ?? ''),
  variantId: data?.variantId ? String(data.variantId) : undefined,
  date: String(data?.date ?? getLocalDateString()),
  amount: Number(data?.amount ?? 0),
  productName: String(data?.productName ?? 'Product'),
  variantName: data?.variantName ? String(data.variantName) : undefined,
  items: Number(data?.items ?? 0),
  itemsDetail: Array.isArray(data?.itemsDetail) ? data.itemsDetail : undefined,
  status: (data?.status ?? 'Paid') as any,
});

const normalizeExpense = (id: string, data: any): Expense => ({
  id,
  name: String(data?.name ?? 'Expense'),
  platform: String(data?.platform ?? 'Other'),
  amount: Number(data?.amount ?? 0),
  date: String(data?.date ?? getLocalDateString()),
  endDate: data?.endDate ? String(data.endDate) : undefined,
  productIds: Array.isArray(data?.productIds) ? data.productIds : undefined,
  productNames: Array.isArray(data?.productNames) ? data.productNames : undefined,
  category: (data?.category ?? 'other') as ExpenseCategory,
  notes: data?.notes ? String(data.notes) : undefined,
});

const normalizeAuditLog = (id: string, data: any): AuditLogEntry => ({
  ...data,
  id,
});

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('theme') as ThemeMode) || 'auto');
  const [prefersDark, setPrefersDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const toast = useToast();
  const { logCreate, logUpdate, logDelete } = useAuditLog();
  
  const [isAddSaleModalOpen, setIsAddSaleModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isManagePlatformsOpen, setIsManagePlatformsOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

  const productDelete = useConfirmDelete<Product>();
  const saleDelete = useConfirmDelete<Sale>();
  const expenseDelete = useConfirmDelete<Expense>();
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Firestore Data Subscriptions
  const { data: products, isLoading: productsLoading } = useFirestoreCollection({
    collectionName: 'products',
    constraints: useMemo(() => [orderBy('name', 'asc')], []),
    normalizer: normalizeProduct,
  });

  const { data: sales, isLoading: salesLoading } = useFirestoreCollection({
    collectionName: 'sales',
    constraints: useMemo(() => [orderBy('date', 'desc')], []),
    normalizer: normalizeSale,
  });

  const { data: expenses, isLoading: expensesLoading } = useFirestoreCollection({
    collectionName: 'expenses',
    constraints: useMemo(() => [orderBy('date', 'desc')], []),
    normalizer: normalizeExpense,
  });

  const { data: platforms, isLoading: platformsLoading } = useFirestoreCollection({
    collectionName: 'platforms',
    constraints: useMemo(() => [orderBy('order', 'asc')], []),
    normalizer: useMemo(() => (id, data) => ({ ...data, id } as AdPlatform), []),
  });

  const { data: auditLogs } = useFirestoreCollection({
    collectionName: 'audit_logs',
    constraints: useMemo(() => [orderBy('timestamp', 'desc')], []),
    normalizer: normalizeAuditLog,
  });

  const isInitialLoading = productsLoading || salesLoading || expensesLoading || platformsLoading;

  useEffect(() => { localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setPrefersDark(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const isDark = theme === 'dark' || (theme === 'auto' && prefersDark);
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    const themeColor = isDark ? '#0F172A' : '#FBFBFE';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColor);
  }, [isDark]);

  // Rate-limited mutations
  const { mutate: saveProductMutation } = useRateLimitedMutation(
    async (data: any) => {
      const sanitizedData = {
        name: sanitizeForStorage(data.name),
        price: sanitizeNumber(data.price, { min: 0, max: 999999 }),
        costPrice: data.costPrice != null ? sanitizeNumber(data.costPrice, { min: 0 }) : undefined,
        stock: sanitizeNumber(data.stock, { min: 0, decimals: 0 }),
        hasVariants: Boolean(data.hasVariants),
        variants: data.variants?.map((v: any) => ({
          id: String(v.id),
          name: sanitizeForStorage(v.name),
          stock: sanitizeNumber(v.stock, { min: 0, decimals: 0 }),
        })),
      };

      const payload = {
        ...sanitizedData,
        status: sanitizedData.stock > 10 ? 'In Stock' : sanitizedData.stock > 0 ? 'Low Stock' : 'Out of Stock',
      };
      
      const cleaned = cleanObject(payload);

      if (editingProduct) {
        // Track changes
        const changes: Record<string, { from: any; to: any }> = {};
        if (cleaned.price !== editingProduct.price) changes.price = { from: editingProduct.price, to: cleaned.price };
        if (cleaned.stock !== editingProduct.stock) changes.stock = { from: editingProduct.stock, to: cleaned.stock };
        
        await updateDoc(doc(db, 'products', editingProduct.id), cleaned);
        logUpdate('products', editingProduct.id, cleaned.name, changes);
      } else {
        const docRef = await addDoc(collection(db, 'products'), { ...cleaned, dateAdded: getLocalDateString() });
        logCreate('products', docRef.id, cleaned.name);
      }
    },
    {
      onSuccess: () => {
        toast.success(editingProduct ? 'Product updated' : 'Product added');
        setIsAddProductModalOpen(false);
        setEditingProduct(null);
      },
      onError: () => toast.error('Save failed', 'Rate limit or connection issue')
    }
  );

  const { mutate: saveSaleMutation } = useRateLimitedMutation(
    async (data: any) => {
      const batch = writeBatch(db);
      const sanitizedQuantity = sanitizeNumber(data.quantity, { min: 1, decimals: 0 });
      const sanitizedPrice = sanitizeNumber(data.price, { min: 0 });
      const totalAmount = sanitizedQuantity * sanitizedPrice;
      
      const saleRef = editingSale ? doc(db, 'sales', editingSale.id) : doc(collection(db, 'sales'));
      const saleData = cleanObject({
        productId: String(data.productId),
        variantId: data.variantId ? String(data.variantId) : null,
        amount: totalAmount,
        productName: sanitizeForStorage(data.productName),
        variantName: data.variantName ? sanitizeForStorage(data.variantName) : null,
        date: String(data.date || getLocalDateString()),
        items: sanitizedQuantity,
        status: data.status || 'Paid',
      });

      if (editingSale) {
        batch.update(saleRef, saleData);
        logUpdate('sales', editingSale.id, saleData.productName, { amount: { from: editingSale.amount, to: saleData.amount } });
      } else {
        batch.set(saleRef, saleData);
        logCreate('sales', saleRef.id, saleData.productName);
      }
      await batch.commit();
    },
    {
      onSuccess: () => {
        toast.success(editingSale ? 'Sale updated' : 'Sale recorded');
        setIsAddSaleModalOpen(false);
        setEditingSale(null);
        setView('sales');
      },
      onError: () => toast.error('Sync failed', 'Rate limit or connection issue')
    }
  );

  const { mutate: saveExpenseMutation } = useRateLimitedMutation(
    async (data: Omit<Expense, 'id'>) => {
      const sanitizedData = {
        ...data,
        name: sanitizeForStorage(data.name),
        platform: sanitizeForStorage(data.platform),
        amount: sanitizeNumber(data.amount, { min: 0 }),
        notes: data.notes ? sanitizeForStorage(data.notes) : undefined,
      };
      const cleaned = cleanObject(sanitizedData);
      
      if (editingExpense) {
        await updateDoc(doc(db, 'expenses', editingExpense.id), cleaned);
        logUpdate('expenses', editingExpense.id, cleaned.name, { amount: { from: editingExpense.amount, to: cleaned.amount } });
      } else {
        const docRef = await addDoc(collection(db, 'expenses'), { ...cleaned, createdAt: new Date().toISOString() });
        logCreate('expenses', docRef.id, cleaned.name);
      }
    },
    {
      onSuccess: () => {
        toast.success(editingExpense ? 'Expense updated' : 'Expense recorded');
        setIsAddExpenseModalOpen(false);
        setEditingExpense(null);
        setView('ads');
      },
      onError: () => toast.error('Save failed', 'Rate limit or connection issue')
    }
  );

  const handleAddPlatform = async (name: string) => { 
    try {
      const sanitizedName = sanitizeForStorage(name);
      const docRef = await addDoc(collection(db, 'platforms'), cleanObject({ name: sanitizedName, order: platforms.length, createdAt: new Date().toISOString() })); 
      logCreate('platforms', docRef.id, sanitizedName);
      toast.success('Category added', `Added ${sanitizedName} to platforms`);
    } catch (e) {
      toast.error('Add failed', 'Could not create new category');
    }
  };

  const handleDeletePlatform = async (id: string) => { 
    try {
      const platform = platforms.find(p => p.id === id);
      await deleteDoc(doc(db, 'platforms', id)); 
      if (platform) logDelete('platforms', id, platform.name);
      toast.success('Category removed', 'Deleted platform category');
    } catch (e) {
      toast.error('Delete failed', 'Could not remove category');
    }
  };

  const handleConfirmProductDelete = async () => {
    const p = productDelete.confirmDelete(); 
    if (p) { 
      setIsDeleting(true); 
      try { 
        await deleteDoc(doc(db, 'products', p.id));
        logDelete('products', p.id, p.name);
        toast.success('Product removed', 'Inventory updated');
      } catch (e) {
        console.error(e);
        toast.error('Delete failed', 'Could not remove product');
      } finally { 
        setIsDeleting(false); 
      } 
    }
  };

  const handleConfirmSaleDelete = async () => {
    const s = saleDelete.confirmDelete(); 
    if (s) { 
      setIsDeleting(true); 
      try { 
        await deleteDoc(doc(db, 'sales', s.id));
        logDelete('sales', s.id, s.productName);
        toast.success('Record deleted', 'Sales history updated');
      } catch (e) {
        console.error(e);
        toast.error('Delete failed', 'Could not remove sale record');
      } finally { 
        setIsDeleting(false); 
      } 
    }
  };

  const handleConfirmExpenseDelete = async () => {
    const e = expenseDelete.confirmDelete(); 
    if (e) { 
      setIsDeleting(true); 
      try { 
        await deleteDoc(doc(db, 'expenses', e.id));
        logDelete('expenses', e.id, e.name);
        toast.success('Expense removed', 'Records updated');
      } catch (e) {
        console.error(e);
        toast.error('Delete failed', 'Could not remove expense record');
      } finally { 
        setIsDeleting(false); 
      } 
    }
  };

  const globalStats = useMemo((): BusinessStats => {
    const totalRevenue = sales.reduce((acc, s) => acc + (s.status === 'Paid' ? s.amount : 0), 0);
    const totalAdSpend = expenses.reduce((acc, a) => acc + a.amount, 0);
    const inventoryValue = products.reduce((acc, p) => acc + (p.price * getProductStock(p)), 0);
    return { totalRevenue, totalOrders: sales.length, totalAdSpend, inventoryValue, netProfit: totalRevenue - totalAdSpend };
  }, [products, sales, expenses]);

  const handleOpenActivity = () => setIsActivityLogOpen(true);

  if (isInitialLoading) return <LoadingScreen />;

  return (
    <div className={isDark ? 'dark min-h-screen' : 'min-h-screen'}>
      <ConnectionStatusBanner />
      <RateLimitIndicator />
      <main className="relative bg-slate-50 dark:bg-[#0F172A] min-h-screen">
        <div className="pb-32 view-enter" key={view}>
          {view === 'dashboard' && <DashboardView products={products} sales={sales} expenses={expenses} stats={globalStats} auditLogs={auditLogs || []} theme={theme} setTheme={setTheme} onAlertClick={id => { setView('inventory'); setExpandedProductId(id); }} onMigrate={async () => {}} onActivityClick={handleOpenActivity} />}
          {view === 'inventory' && <InventoryView products={products} sales={sales} adCosts={expenses} searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} setTheme={setTheme} expandedProductId={expandedProductId} setExpandedProductId={setExpandedProductId} onEdit={p => { setEditingProduct(p); setIsAddProductModalOpen(true); }} onDelete={productDelete.requestDelete} onActivityClick={handleOpenActivity} />}
          {view === 'sales' && <SalesView sales={sales} searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} setTheme={setTheme} onEdit={s => { setEditingSale(s); setIsAddSaleModalOpen(true); }} onDelete={saleDelete.requestDelete} onActivityClick={handleOpenActivity} />}
          {view === 'ads' && <ExpensesView expenses={expenses} products={products} searchQuery={searchQuery} setSearchQuery={setSearchQuery} theme={theme} setTheme={setTheme} onAdd={() => { setEditingExpense(null); setIsAddExpenseModalOpen(true); }} onEdit={e => { setEditingExpense(e); setIsAddExpenseModalOpen(true); }} onDelete={expenseDelete.requestDelete} onActivityClick={handleOpenActivity} />}
        </div>

        {isAddMenuOpen && <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 animate-in fade-in" onClick={() => setIsAddMenuOpen(false)} aria-hidden="true" />}

        <div 
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-6 transition-all duration-500 ${isAddMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}
          aria-hidden={!isAddMenuOpen}
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[32px] p-2 shadow-2xl border border-white/20 dark:border-slate-800 grid grid-cols-1 gap-1" role="menu">
            <button onClick={() => { setIsAddMenuOpen(false); setIsAddSaleModalOpen(true); }} className="flex items-center p-4 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors" role="menuitem">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mr-4"><DollarSign size={20}/></div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Record Sale</span>
            </button>
            <button onClick={() => { setIsAddMenuOpen(false); setIsAddProductModalOpen(true); }} className="flex items-center p-4 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors" role="menuitem">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mr-4"><Package size={20}/></div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Add Product</span>
            </button>
            <button onClick={() => { setIsAddMenuOpen(false); setEditingExpense(null); setIsAddExpenseModalOpen(true); }} className="flex items-center p-4 rounded-2xl active:bg-slate-100 dark:active:bg-slate-800 transition-colors" role="menuitem">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mr-4"><Receipt size={20}/></div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Record Expense</span>
            </button>
          </div>
        </div>

        <AddSaleModal isOpen={isAddSaleModalOpen} onClose={() => { setIsAddSaleModalOpen(false); setEditingSale(null); }} products={products} initialData={editingSale} onSave={saveSaleMutation} />
        <AddProductModal isOpen={isAddProductModalOpen} onClose={() => { setIsAddProductModalOpen(false); setEditingProduct(null); }} initialData={editingProduct} onSave={saveProductMutation} />
        <AddExpenseModal isOpen={isAddExpenseModalOpen} onClose={() => { setIsAddExpenseModalOpen(false); setEditingExpense(null); }} products={products} platforms={platforms} initialData={editingExpense} onSave={saveExpenseMutation} />
        <ManagePlatformsModal isOpen={isManagePlatformsOpen} onClose={() => setIsManagePlatformsOpen(false)} platforms={platforms} onAdd={handleAddPlatform} onDelete={handleDeletePlatform} />

        <AccessibleModal
          isOpen={isActivityLogOpen}
          onClose={() => setIsActivityLogOpen(false)}
          title="Business Activity"
          headerIcon={
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <History size={20} />
            </div>
          }
        >
          <div className="p-6">
            <ActivityFeed entries={auditLogs || []} maxItems={20} />
          </div>
        </AccessibleModal>

        <ConfirmDeleteModal isOpen={productDelete.isOpen} itemName={productDelete.item?.name || ''} itemType="product" isLoading={isDeleting} onConfirm={handleConfirmProductDelete} onCancel={productDelete.cancelDelete} />
        <ConfirmDeleteModal isOpen={saleDelete.isOpen} itemName={saleDelete.item?.productName || ''} itemType="sale" isLoading={isDeleting} onConfirm={handleConfirmSaleDelete} onCancel={saleDelete.cancelDelete} />
        <ConfirmDeleteModal isOpen={expenseDelete.isOpen} itemName={expenseDelete.item?.name || ''} itemType="expense" isLoading={isDeleting} onConfirm={handleConfirmExpenseDelete} onCancel={expenseDelete.cancelDelete} />

        <nav 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-5xl h-20 glass dark:bg-slate-900/80 rounded-[32px] border border-white/20 dark:border-slate-800 px-2 flex items-center justify-between z-50 shadow-2xl"
          role="navigation"
          aria-label="Main navigation"
        >
          <button 
            onClick={() => setView('dashboard')} 
            aria-label="Dashboard"
            aria-current={view === 'dashboard' ? 'page' : undefined}
            className={`flex flex-col items-center flex-1 py-2 rounded-2xl transition-all ${view === 'dashboard' ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={22} aria-hidden="true" />
            <span className="text-[9px] font-bold mt-1">Home</span>
          </button>
          <button 
            onClick={() => setView('inventory')} 
            aria-label="Inventory"
            aria-current={view === 'inventory' ? 'page' : undefined}
            className={`flex flex-col items-center flex-1 py-2 rounded-2xl transition-all ${view === 'inventory' ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}
          >
            <Package size={22} aria-hidden="true" />
            <span className="text-[9px] font-bold mt-1">Stock</span>
          </button>
          <div className="relative -top-8 px-2">
            <button 
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} 
              aria-label={isAddMenuOpen ? "Close add menu" : "Open add menu"}
              aria-expanded={isAddMenuOpen}
              className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all border-4 border-slate-50 dark:border-[#0F172A] ${isAddMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-indigo-600 active:scale-90'}`}
            >
              <Plus size={32} aria-hidden="true" />
            </button>
          </div>
          <button 
            onClick={() => setView('sales')} 
            aria-label="Sales"
            aria-current={view === 'sales' ? 'page' : undefined}
            className={`flex flex-col items-center flex-1 py-2 rounded-2xl transition-all ${view === 'sales' ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}
          >
            <ShoppingCart size={22} aria-hidden="true" />
            <span className="text-[9px] font-bold mt-1">Sales</span>
          </button>
          <button 
            onClick={() => setView('ads')} 
            aria-label="Expenses"
            aria-current={view === 'ads' ? 'page' : undefined}
            className={`flex flex-col items-center flex-1 py-2 rounded-2xl transition-all ${view === 'ads' ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}
          >
            <Receipt size={22} aria-hidden="true" />
            <span className="text-[9px] font-bold mt-1">Expenses</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default App;
