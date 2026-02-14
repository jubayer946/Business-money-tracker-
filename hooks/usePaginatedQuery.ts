import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  onSnapshot, 
  QueryDocumentSnapshot, 
  DocumentData,
  getDocs,
  OrderByDirection
} from 'firebase/firestore';
import { db } from '../firebase';

interface UsePaginatedQueryOptions<T> {
  collectionName: string;
  orderByField: string;
  orderDirection?: OrderByDirection;
  pageSize?: number;
  normalizer: (id: string, data: DocumentData) => T;
}

interface PaginatedState<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
}

/**
 * usePaginatedQuery handles incremental data fetching from Firestore.
 * It maintains the 'lastDoc' cursor to allow subsequent page fetches.
 */
export function usePaginatedQuery<T>({
  collectionName,
  orderByField,
  orderDirection = 'asc',
  pageSize = 20,
  normalizer,
}: UsePaginatedQueryOptions<T>) {
  const [state, setState] = useState<PaginatedState<T>>({
    items: [],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    error: null,
  });

  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  
  // Ref to track the current subscription to avoid leaks or multiple listeners
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initial load or configuration change
  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true, items: [], error: null }));
    
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, orderDirection),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => normalizer(doc.id, doc.data()));
        
        // Update the cursor for the next page
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        
        setState({
          items,
          isLoading: false,
          isLoadingMore: false,
          hasMore: snapshot.docs.length === pageSize,
          error: null,
        });
      },
      (error) => {
        console.error(`Error fetching paginated ${collectionName}:`, error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [collectionName, orderByField, orderDirection, pageSize, normalizer]);

  /**
   * Fetches the next page of results starting after the last processed document.
   */
  const loadMore = useCallback(async () => {
    if (!lastDoc || state.isLoadingMore || !state.hasMore) return;

    setState((prev) => ({ ...prev, isLoadingMore: true }));

    try {
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        startAfter(lastDoc),
        limit(pageSize)
      );

      // We use getDocs for "Load More" to avoid complex multi-subscription management 
      // of active result sets, or one could use a cumulative subscription strategy.
      const snapshot = await getDocs(q);
      const newItems = snapshot.docs.map((doc) => normalizer(doc.id, doc.data()));
      
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }

      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
        isLoadingMore: false,
        hasMore: snapshot.docs.length === pageSize,
      }));
    } catch (error) {
      console.error(`Error loading more ${collectionName}:`, error);
      setState((prev) => ({ 
        ...prev, 
        isLoadingMore: false, 
        error: error as Error 
      }));
    }
  }, [lastDoc, state.isLoadingMore, state.hasMore, collectionName, orderByField, orderDirection, pageSize, normalizer]);

  return {
    ...state,
    loadMore,
  };
}