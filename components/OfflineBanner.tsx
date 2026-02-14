
import React from 'react';
import { WifiOff, Cloud, CloudOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  showReconnected?: boolean;
}

/**
 * OfflineBanner displays a sticky status message at the top of the viewport
 * when the user is offline or has just reconnected.
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, showReconnected }) => {
  // Only show if offline or in the "just reconnected" phase
  if (isOnline && !showReconnected) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[500] px-4 py-2.5 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 animate-in slide-in-from-top ${
        isOnline ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-white'
      }`}
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      {isOnline ? (
        <>
          <Cloud size={14} className="animate-bounce" />
          <span>Syncing Back Online</span>
        </>
      ) : (
        <>
          <WifiOff size={14} />
          <span>Offline Mode • Saving Locally</span>
        </>
      )}
    </div>
  );
};
