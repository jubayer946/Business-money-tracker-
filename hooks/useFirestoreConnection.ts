import { useState, useEffect, useCallback } from 'react';
import { db, reconnectFirestore } from '../firebase';
import { onSnapshotsInSync } from 'firebase/firestore';

export const useFirestoreConnection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<'connecting' | 'disconnected' | 'error' | 'connected'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (status === 'disconnected') setStatus('connecting');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setStatus('disconnected');
    }

    // listen for firestore sync status
    const unsubscribe = onSnapshotsInSync(db, () => {
      setStatus('connected');
      setRetryCount(0);
      setLastError(null);
    });

    // Fallback for connecting state if no snapshots are syncing
    const timeout = setTimeout(() => {
      if (status === 'connecting' && navigator.onLine) {
        // We assume connected if online and no immediate error
        setStatus('connected');
      }
    }, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [status]);

  const forceReconnect = useCallback(async () => {
    setStatus('connecting');
    setRetryCount(prev => prev + 1);
    try {
      await reconnectFirestore();
      // Status will be updated by onSnapshotsInSync or the effect above
    } catch (err) {
      setLastError(err as Error);
      setStatus('error');
    }
  }, []);

  return { status, isOnline, retryCount, forceReconnect, lastError };
};