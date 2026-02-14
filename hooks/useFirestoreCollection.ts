import { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint, 
  DocumentData, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';

interface UseFirestoreCollectionOptions<T> {
  collectionName: string;
  constraints?: QueryConstraint[];
  normalizer: (id: string, data: DocumentData) => T;
  enabled?: boolean;
}

export function useFirestoreCollection<T>({
  collectionName,
  constraints = [],
  normalizer,
  enabled = true,
}: UseFirestoreCollectionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track active subscription
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const q = query(collection(db, collectionName), ...constraints);
      
      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          if (!isMountedRef.current) return;
          const items = snapshot.docs.map((doc) => normalizer(doc.id, doc.data()));
          setData(items);
          setIsLoading(false);
        },
        (err) => {
          if (!isMountedRef.current) return;
          console.error(`Firestore ${collectionName} error:`, err);
          setError(err as Error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error(`Failed to setup Firestore listener for ${collectionName}:`, err);
      setError(err as Error);
      setIsLoading(false);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
    // Note: constraints are handled via reference. If inline arrays are used, 
    // it's recommended to wrap them in useMemo at the call site.
  }, [collectionName, constraints, normalizer, enabled]);

  return { data, isLoading, error };
}