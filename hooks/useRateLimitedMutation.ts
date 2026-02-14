
import { useState, useCallback } from 'react';
import { writeRateLimiter } from '../utils/rateLimiter';
import { useToast } from '../contexts/ToastContext';

export function useRateLimitedMutation<T extends (...args: any[]) => Promise<any>>(
  mutationFn: T,
  options?: { onSuccess?: () => void; onError?: (err: Error) => void }
) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const mutate = useCallback(async (...args: Parameters<T>) => {
    if (!writeRateLimiter.canMakeRequest()) {
      const waitSecs = Math.ceil(writeRateLimiter.getWaitTime() / 1000);
      toast.error('Rate Limit Active', `Please wait ${waitSecs}s before next action.`);
      return;
    }

    setIsLoading(true);
    writeRateLimiter.recordRequest();

    try {
      const result = await mutationFn(...args);
      options?.onSuccess?.();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, options, toast]);

  return { mutate, isLoading };
}
