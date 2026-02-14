import React, { useState, useEffect } from 'react';
import { X, Megaphone, DollarSign, Calendar, Activity, Clock, AlertCircle } from 'lucide-react';
import { AdPlatform, AdCampaign } from '../types';

interface AddAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: AdPlatform[];
  initialData?: AdCampaign | null;
  onSave: (data: any) => Promise<void>;
}

export const AddAdModal: React.FC<AddAdModalProps> = ({ 
  isOpen, 
  onClose, 
  platforms, 
  initialData, 
  onSave 
}) => {
  const [name, setName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isRange, setIsRange] = useState(false);
  const [clicks, setClicks] = useState('');
  const [impressions, setImpressions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setSelectedPlatform('');
    setCustomPlatform('');
    setAmount('');
    setClicks('');
    setImpressions('');
    setDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsRange(false);
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (initialData) {
      setName(initialData.name);
      setSelectedPlatform(initialData.platform);
      setCustomPlatform('');
      setAmount(String(initialData.amount));
      setDate(initialData.date);
      setEndDate(initialData.endDate || '');
      setIsRange(!!initialData.endDate);
      setClicks(initialData.clicks != null ? String(initialData.clicks) : '');
      setImpressions(initialData.impressions != null ? String(initialData.impressions) : '');
    } else {
      resetForm();
    }
  }, [isOpen, initialData]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const isValidDecimal = (value: string): boolean => {
    if (value === '') return true;
    return /^\d*\.?\d{0,2}$/.test(value);
  };

  const isValidInteger = (value: string): boolean => {
    if (value === '') return true;
    return /^\d+$/.test(value);
  };

  const handleAmountChange = (value: string) => {
    if (isValidDecimal(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleClicksChange = (value: string) => {
    if (isValidInteger(value)) {
      setClicks(value);
      setError(null);
    }
  };

  const handleImpressionsChange = (value: string) => {
    if (isValidInteger(value)) {
      setImpressions(value);
      setError(null);
    }
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return 'Campaign name is required';
    
    const platform = (customPlatform.trim() || selectedPlatform).trim();
    if (!platform) return 'Please select or enter a platform';
    
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) return 'Please enter a valid budget amount';
    
    const numClicks = clicks ? parseInt(clicks) : 0;
    const numImpressions = impressions ? parseInt(impressions) : 0;
    
    if (numClicks < 0 || numImpressions < 0) return 'Metrics cannot be negative';
    if (numClicks > numImpressions && numImpressions > 0) return 'Clicks cannot exceed impressions';
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ 
        name: name.trim(), 
        platform: (customPlatform.trim() || selectedPlatform).trim(), 
        amount: parseFloat(amount), 
        date, 
        endDate: isRange ? endDate : undefined,
        clicks: clicks ? parseInt(clicks) : undefined, 
        impressions: impressions ? parseInt(impressions) : undefined 
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Marketing Campaign</h2>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar overscroll-contain">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl border border-red-100 dark:border-red-900/40 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button 
              disabled={isSubmitting}
              onClick={() => setIsRange(false)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRange ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              One-time
            </button>
            <button 
              disabled={isSubmitting}
              onClick={() => setIsRange(true)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRange ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400'}`}
            >
              Duration
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign Name *</label>
            <input 
              type="text" 
              value={name} 
              disabled={isSubmitting}
              onChange={e => setName(e.target.value)} 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
              placeholder="e.g. Summer Sale 2024" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Platform *</label>
            <div className="grid grid-cols-2 gap-2">
              {platforms.map(p => (
                <button 
                  key={p.id} 
                  disabled={isSubmitting}
                  onClick={() => { setSelectedPlatform(p.name); setCustomPlatform(''); setError(null); }} 
                  className={`p-3 rounded-2xl text-[10px] font-bold border transition-all ${selectedPlatform === p.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <input 
              type="text" 
              value={customPlatform} 
              disabled={isSubmitting}
              placeholder="Or type other platform..."
              onChange={e => { setCustomPlatform(e.target.value); setSelectedPlatform(''); setError(null); }} 
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                <DollarSign size={10} className="mr-1"/> Budget ($) *
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={amount} 
                disabled={isSubmitting}
                onChange={e => handleAmountChange(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-sm font-black dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                <Calendar size={10} className="mr-1"/> {isRange ? 'Start' : 'Date'}
              </label>
              <input 
                type="date" 
                value={date} 
                disabled={isSubmitting}
                onChange={e => setDate(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
              />
            </div>
          </div>

          {isRange && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center">
                <Clock size={10} className="mr-1"/> End Date
              </label>
              <input 
                type="date" 
                min={date} 
                value={endDate} 
                disabled={isSubmitting}
                onChange={e => setEndDate(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-3.5 px-4 text-xs font-bold dark:text-white border-2 border-indigo-100 dark:border-indigo-900/20 disabled:opacity-50" 
              />
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[28px] space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity size={14}/> Performance Metrics
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">Impressions</p>
                   <input 
                     type="text" 
                     inputMode="numeric"
                     value={impressions} 
                     disabled={isSubmitting}
                     onChange={e => handleImpressionsChange(e.target.value)} 
                     placeholder="0"
                     className="w-full bg-white dark:bg-slate-700 border-none rounded-xl py-2 px-3 text-sm font-bold dark:text-white outline-none disabled:opacity-50" 
                   />
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-slate-400">Clicks</p>
                   <input 
                     type="text" 
                     inputMode="numeric"
                     value={clicks} 
                     disabled={isSubmitting}
                     onChange={e => handleClicksChange(e.target.value)} 
                     placeholder="0"
                     className="w-full bg-white dark:bg-slate-700 border-none rounded-xl py-2 px-3 text-sm font-bold dark:text-white outline-none disabled:opacity-50" 
                   />
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            onClick={handleSave} 
            disabled={isSubmitting || !name || (!selectedPlatform && !customPlatform) || (isRange && !endDate)} 
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Confirm Campaign</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};