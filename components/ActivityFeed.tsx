import React from 'react';
import { Plus, Edit2, Trash2, Package, ShoppingCart, Receipt, Settings, History } from 'lucide-react';
import { AuditLogEntry } from '../types';
import { formatRelativeDate, formatFullDateTime } from '../utils/formatters';

interface ActivityFeedProps {
  entries: AuditLogEntry[];
  maxItems?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  entries, 
  maxItems = 10 
}) => {
  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'create': return <Plus size={14} className="text-emerald-500" />;
      case 'update': return <Edit2 size={14} className="text-amber-500" />;
      case 'delete': return <Trash2 size={14} className="text-red-500" />;
    }
  };

  const getCollectionIcon = (col: AuditLogEntry['collection']) => {
    switch (col) {
      case 'products': return <Package size={12} />;
      case 'sales': return <ShoppingCart size={12} />;
      case 'expenses': return <Receipt size={12} />;
      case 'platforms': return <Settings size={12} />;
    }
  };

  const getActionText = (entry: AuditLogEntry) => {
    const actions = {
      create: 'added',
      update: 'updated',
      delete: 'removed',
    };
    return `${actions[entry.action]} ${entry.documentName}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 px-1">
        <History size={14} className="text-slate-400" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Activity Log
        </h3>
      </div>

      <div className="space-y-2">
        {entries.slice(0, maxItems).map((entry) => (
          <div 
            key={entry.id} 
            className="flex items-start space-x-3 p-4 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-white dark:border-slate-700 shadow-inner">
              {getActionIcon(entry.action)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold">{getActionText(entry)}</span>
              </p>
              
              {entry.action === 'update' && entry.changes && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(entry.changes).map(([key, val]) => (
                    <span key={key} className="text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">
                      {key}: {(val as any).from} → {(val as any).to}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col space-y-1 mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                    {formatFullDateTime(entry.timestamp)}
                  </span>
                  <span className="text-slate-200 dark:text-slate-800">•</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {formatRelativeDate(entry.timestamp)}
                  </span>
                </div>
                <span className="flex items-center space-x-1 text-[9px] font-black uppercase text-indigo-400 dark:text-indigo-500 tracking-widest">
                  {getCollectionIcon(entry.collection)}
                  <span>{entry.collection}</span>
                </span>
              </div>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900/40 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              No recent activity recorded
            </p>
          </div>
        )}
      </div>
    </div>
  );
};