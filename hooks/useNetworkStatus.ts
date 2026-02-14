
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

interface NetworkStatus {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastOnline: Date | null;
}

/**
 * useNetworkStatus monitors the browser's online/offline state
 * and Firestore's backend synchronization status.
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isFirestoreConnected: false,
    lastOnline: navigator.onLine ? new Date() : null
  });

  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      setShowReconnected(true);
      // Auto-hide the "Back Online" message after 3 seconds
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false, lastOnline: new Date() }));
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Firestore specific sync monitoring
    const unsubscribe = onSnapshotsInSync(db, () => {
      setStatus(prev => ({ ...prev, isFirestoreConnected: true }));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  return { ...status, showReconnected };
};
