import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { useFirestoreConnection } from '../hooks/useFirestoreConnection';

export const ConnectionStatusBanner: React.FC = () => {
  const { status, isOnline, retryCount, forceReconnect } = useFirestoreConnection();

  // Don't show when connected and online
  if (status === 'connected' && isOnline) return null;

  const configs = {
    connecting: {
      bg: 'bg-amber-500',
      icon: <Loader2 size={16} className="animate-spin" />,
      text: 'Syncing with server...',
    },
    disconnected: {
      bg: 'bg-slate-700',
      icon: <WifiOff size={16} />,
      text: isOnline ? 'Connection lost. Retrying...' : 'You are offline',
    },
    error: {
      bg: 'bg-red-500',
      icon: <AlertTriangle size={16} />,
      text: 'Connection failed',
    },
    connected: {
      bg: 'bg-emerald-500',
      icon: <Wifi size={16} />,
      text: 'Connected',
    },
  };

  const config = configs[status] || configs.connecting;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[500] ${config.bg} text-white px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider animate-in slide-in-from-top duration-300`}
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <div className="flex items-center space-x-2">
        {config.icon}
        <span>{config.text}</span>
        {retryCount > 0 && status !== 'connected' && (
          <span className="opacity-70 normal-case font-bold">
            (Retry #{retryCount})
          </span>
        )}
      </div>
      {(status === 'error' || (status === 'disconnected' && isOnline)) && (
        <button
          onClick={forceReconnect}
          className="flex items-center space-x-1 bg-white/20 active:bg-white/40 px-3 py-1 rounded-lg transition-colors"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};