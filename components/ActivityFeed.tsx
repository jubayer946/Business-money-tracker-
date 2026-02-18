
import React, { useMemo } from 'react';
import { Plus, Edit2, Trash2, Package, ShoppingCart, Receipt, Settings, History, ChevronRight } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { formatRelativeDate } from '../utils/formatters';

interface ActivityFeedProps {
  entries: AuditLogEntry[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  entries, 
  maxItems = 20 
}) => {
  const getActionStyles = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'update': return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'delete': return 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
    }
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create': return <Plus size={14} />;
      case 'update': return <Edit2 size={14} />;
      case 'delete': return <Trash2 size={14} />;
    }
  };

  const getCollectionIcon = (col: AuditLogEntry['collection']) => {
    switch (col) {
      case 'products': return <Package size={14} />;
      case 'sales': return <ShoppingCart size={14} />;
      case 'expenses': return <Receipt size={14} />;
      case 'platforms': return <Settings size={14} />;
    }
  };

  const getActionText = (entry: AuditLogEntry) => {
    const actions = {
      create: 'Added',
      update: 'Updated',
      delete: 'Removed',
    };
    return `${actions[entry.action]} ${entry.documentName}`;
  };

  const displayEntries = useMemo(() => entries.slice(0, maxItems), [entries, maxItems]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
        <History size={32} className="mx-auto mb-3 text-slate-200" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          No Recent Activity
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Business Activity
        </h3>
      </div>
      
      <div className="space-y-3">
        {displayEntries.map((entry) => (
          <div 
            key={entry.id} 
            className="bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center space-x-4 active:scale-[0.98] transition-all"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getActionStyles(entry.action)}`}>
              {getActionIcon(entry.action)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                  {getActionText(entry)}
                </p>
                <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">
                  {formatRelativeDate(entry.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-slate-400 dark:text-slate-500">
                  {getCollectionIcon(entry.collection)}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  {entry.collection}
                </span>
              </div>

              {entry.action === 'update' && entry.changes && (
                <div className="mt-2 pt-2 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-x-3 gap-y-1">
                  {Object.entries(entry.changes).map(([key, val]) => (
                    <div key={key} className="flex items-center space-x-1 text-[9px]">
                      <span className="font-bold text-slate-400 uppercase">{key}:</span>
                      <span className="text-slate-900 dark:text-white font-black">{(val as any).to}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <ChevronRight size={14} className="text-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
};
