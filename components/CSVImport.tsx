import React, { useState, useRef, useMemo } from 'react';
import { Upload, AlertCircle, CheckCircle, X, Loader2, FileText, Check, Package, ChevronDown, Search } from 'lucide-react';
import { Expense, Product, AdPlatform } from '../types';
import { formatCurrency } from '../utils';

interface CSVImportProps {
  onImport: (expenses: Expense[]) => Promise<void>;
  onClose: () => void;
  products: Product[];
  platforms: AdPlatform[];
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImport, onClose, products, platforms }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Batch settings
  const [batchPlatform, setBatchPlatform] = useState('Facebook Ads');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    setPreview([]);
    
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
      setError('Please upload a CSV or TXT file from Facebook Ads Manager.');
      return;
    }

    setFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const expenses = parseCSV(text);
        setPreview(expenses);
      } catch (err: any) {
        console.error('❌ CSV Import Error:', err);
        setError(err.message || 'Failed to read the report. Check the file format.');
      }
    };
    
    reader.onerror = () => setError('Failed to read file from storage.');
    reader.readAsText(file);
  };

  const parseFacebookDate = (dateStr: string): string | null => {
    try {
      dateStr = dateStr.trim();
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        return null;
      }
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  };

  const parseCSV = (text: string): Expense[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 5) {
      throw new Error('File is too short. Make sure this is a Facebook billing report.');
    }
    // Find the header row
    let headerIndex = -1;
    let dataStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Date') && line.includes('Transaction') && line.includes('Amount')) {
        headerIndex = i;
        dataStartIndex = i + 1;
        break;
      }
    }
    if (headerIndex === -1) {
      throw new Error('Could not find the data table. Make sure this is a Facebook Ads billing report.');
    }
    // Parse the header row - detect separator
    const headerLine = lines[headerIndex];
    let headers: string[];
    let separator: string;
    if (headerLine.includes(',')) {
      separator = ',';
      headers = headerLine.split(',').map(h => h.trim());
    } else if (headerLine.includes('\t')) {
      separator = '\t';
      headers = headerLine.split('\t').map(h => h.trim());
    } else {
      throw new Error('Could not detect separator in CSV file');
    }

    const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date');
    const transactionIdx = headers.findIndex(h => h.toLowerCase().includes('transaction'));
    const amountIdx = headers.findIndex(h => h.toLowerCase() === 'amount');
    const currencyIdx = headers.findIndex(h => h.toLowerCase() === 'currency');

    if (dateIdx === -1 || amountIdx === -1) {
      throw new Error('Could not find "Date" and "Amount" columns.');
    }

    const expenses: Expense[] = [];
    let vatAmount: number | null = null;
    let vatRate: string | null = null;
    let billingPeriod: string = '';
    let currency: string = 'BDT';
    let lastExpenseDate: string | null = null;

    for (let i = 0; i < headerIndex; i++) {
      if (lines[i].includes('Billing Report:')) {
        billingPeriod = lines[i].replace('Billing Report:', '').trim();
        break;
      }
    }

    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes('vat rate')) {
        const rateMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
        if (rateMatch) vatRate = rateMatch[1];
        continue;
      }
      if (line.toLowerCase().includes('vat amount')) {
        const amountMatch = line.match(/[\d,]+\.?\d*/);
        if (amountMatch) vatAmount = parseFloat(amountMatch[0].replace(/,/g, ''));
        continue;
      }
      if (line.toLowerCase().includes('total amount')) continue;
      if (!line || line.trim() === '') continue;

      const fields = line.split(separator).map(f => f.trim());
      if (fields.length < Math.max(dateIdx, amountIdx) + 1) continue;

      const dateStr = fields[dateIdx];
      const amountStr = fields[amountIdx];
      const transactionId = transactionIdx >= 0 ? fields[transactionIdx] : '';
      const currencyValue = currencyIdx >= 0 ? fields[currencyIdx] : currency;
      if (currencyValue) currency = currencyValue;

      if (!dateStr || !amountStr) continue;

      const amount = parseFloat(amountStr.replace(/,/g, ''));
      if (isNaN(amount) || amount <= 0) continue;

      const date = parseFacebookDate(dateStr);
      if (!date) continue;
      lastExpenseDate = date;

      expenses.push({
        id: `fb_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Facebook Ads - ${dateStr}`,
        amount: amount,
        date: date,
        category: 'advertising',
        platform: 'Facebook Ads',
        productIds: [],
        productNames: [],
        notes: `Transaction: ${transactionId || 'N/A'} | Currency: ${currency}`,
      });
    }

    if (vatAmount && vatAmount > 0) {
      const vatDate = lastExpenseDate || new Date().toISOString().split('T')[0];
      expenses.push({
        id: `fb_vat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Facebook Ads VAT${vatRate ? ` (${vatRate}%)` : ''}`,
        amount: vatAmount,
        date: vatDate,
        category: 'advertising',
        platform: 'Facebook Ads',
        productIds: [],
        productNames: [],
        notes: `VAT on Facebook Ads${billingPeriod ? ` | Period: ${billingPeriod}` : ''} | Rate: ${vatRate || 'N/A'}% | Currency: ${currency}`,
      });
    }

    if (expenses.length === 0) {
      throw new Error('No payment data found in the file.');
    }
    return expenses;
  };

  const handleImport = async () => {
    if (preview.length > 0 && !isImporting) {
      setIsImporting(true);
      setError(null);
      
      const productNames = products
        .filter(p => selectedProductIds.includes(p.id))
        .map(p => p.name);

      // Apply batch settings to all preview items
      const finalizedExpenses = preview.map(exp => ({
        ...exp,
        platform: batchPlatform,
        productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
        productNames: productNames.length > 0 ? productNames : undefined,
      }));

      try {
        await onImport(finalizedExpenses);
        onClose();
      } catch (err: any) {
        setError('Cloud save failed. Check your connection.');
        setIsImporting(false);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-md flex flex-col max-h-[90vh]">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Import Facebook Ads CSV
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Upload your Facebook Ads export file
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
          {/* File Upload Area */}
          {!file && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Upload size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                Drop CSV file here
              </p>
              <p className="text-xs text-slate-500">
                or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {/* File Selected */}
          {file && !error && preview.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <FileText size={24} className="text-indigo-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                }}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-600">Error</p>
                <p className="text-xs text-red-500 mt-1">{error}</p>
                <button
                  onClick={() => {
                    setFile(null);
                    setError(null);
                  }}
                  className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-2 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Success Preview & Import Options */}
          {preview.length > 0 && (
            <div className="space-y-6">
              {/* Quick Import at Top */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 pb-3">
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {isImporting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Import {preview.length} Expenses Now
                </button>
              </div>

              {/* Import Options Section */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-5 space-y-5 border border-slate-100 dark:border-slate-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Import Settings</h3>
                
                {/* Platform Selector */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400">Target Platform</label>
                  <select
                    value={batchPlatform}
                    onChange={(e) => setBatchPlatform(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {platforms.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                    {!platforms.some(p => p.name === 'Facebook Ads') && <option value="Facebook Ads">Facebook Ads</option>}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Link to Products */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400">Link to Inventory</label>
                  <button 
                    onClick={() => setShowProductPicker(!showProductPicker)} 
                    type="button"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Package size={14} className="text-slate-400 shrink-0" />
                      {selectedProductIds.length > 0 ? (
                        <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                          {selectedProductIds.length} Products Linked
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">Select products to link...</span>
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showProductPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showProductPicker && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 mt-2">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type="text" 
                            value={productSearch} 
                            onChange={(e) => setProductSearch(e.target.value)} 
                            placeholder="Search inventory..." 
                            className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg py-1.5 pl-8 pr-2 text-[11px] outline-none" 
                          />
                        </div>
                      </div>
                      <div className="max-h-40 overflow-y-auto hide-scrollbar">
                        {filteredProducts.map(product => (
                          <button 
                            key={product.id} 
                            type="button" 
                            onClick={() => toggleProduct(product.id)} 
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              selectedProductIds.includes(product.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 dark:border-slate-700'
                            }`}>
                              {selectedProductIds.includes(product.id) && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{product.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-emerald-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-600">
                    Ready to Import
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    {preview.filter(e => !e.name.includes('VAT')).length} transactions + {preview.filter(e => e.name.includes('VAT')).length > 0 ? ' VAT' : ''} • {formatCurrency(preview.reduce((sum, e) => sum + e.amount, 0))} total
                  </p>
                </div>
              </div>

              {/* Preview List with VAT Badge */}
              <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 hide-scrollbar">
                {preview.map((expense, i) => {
                  const isVAT = expense.name.includes('VAT');
                  return (
                    <div
                      key={i}
                      className={`bg-white dark:bg-slate-900 rounded-xl p-3 flex justify-between items-center ${
                        isVAT ? 'border-2 border-amber-200 dark:border-amber-800' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-bold text-xs truncate ${
                              isVAT ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {expense.name}
                          </p>
                          {isVAT && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase rounded-full">
                              VAT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {expense.date}
                        </p>
                      </div>
                      <p className={`font-black text-sm ${isVAT ? 'text-amber-600' : 'text-red-500'}`}>
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Breakdown Summary */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Transactions</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(
                      preview
                        .filter(e => !e.name.includes('VAT'))
                        .reduce((sum, e) => sum + e.amount, 0)
                    )}
                  </span>
                </div>
                {preview.filter(e => e.name.includes('VAT')).length > 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-amber-600 dark:text-amber-400">VAT</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">
                      {formatCurrency(
                        preview
                          .filter(e => e.name.includes('VAT'))
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Total
                  </span>
                  <span className="font-black text-lg text-slate-900 dark:text-white">
                    {formatCurrency(preview.reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Format Guide */}
          {!preview.length && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  ✅ Accepts Facebook Billing Reports
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 font-mono text-[9px] overflow-x-auto">
                  <div className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    Date,Transaction ID,Amount,Currency
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 whitespace-nowrap mt-1">
                    2/15/2026,25600692526282339,286.79,BDT
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    2/8/2026,25546868341664754,638.96,BDT
                  </div>
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">
                  📋 How to Export from Facebook
                </p>
                <ol className="text-[9px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                  <li>1. Go to <span className="font-bold">Ads Manager</span> → <span className="font-bold">Billing</span></li>
                  <li>2. Click <span className="font-bold">Transactions</span> tab</li>
                  <li>3. Select date range</li>
                  <li>4. Click <span className="font-bold">Download</span></li>
                  <li>5. Upload that file here!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at Bottom with Import Button */}
        {preview.length > 0 && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setError(null);
                }}
                className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isImporting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Import {preview.length}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
