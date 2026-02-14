import { useState, useCallback, useRef } from 'react';

interface AsyncActionState {
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to execute async actions with a lock to prevent duplicate submissions (race conditions).
 */
export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
) {
  const [state, setState] = useState<AsyncActionState>({
    isLoading: false,
    error: null
  });
  
  // pendingRef serves as a mutex lock to prevent concurrent executions
  const pendingRef = useRef(false);

  const execute = useCallback(async (...args: Parameters<T>) => {
    if (pendingRef.current) {
      console.warn('Action already in progress, ignoring duplicate call');
      return;
    }

    pendingRef.current = true;
    setState({ isLoading: true, error: null });

    try {
      const result = await action(...args);
      setState({ isLoading: false, error: null });
      options?.onSuccess?.();
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ isLoading: false, error: err });
      options?.onError?.(err);
      throw err;
    } finally {
      pendingRef.current = false;
    }
  }, [action, options]);

  return { 
    ...state, 
    execute, 
    isPending: state.isLoading // providing isPending as a synonym for stateful loading
  };
}
