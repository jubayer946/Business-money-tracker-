import { useState, useCallback } from 'react';

interface LoadingState {
  products: boolean;
  sales: boolean;
  ads: boolean;
  platforms: boolean;
}

export const useLoadingState = () => {
  const [loading, setLoading] = useState<LoadingState>({
    products: true,
    sales: true,
    ads: true,
    platforms: true
  });

  const setLoaded = useCallback((key: keyof LoadingState) => {
    setLoading(prev => ({ ...prev, [key]: false }));
  }, []);

  const isInitialLoading = Object.values(loading).some(v => v);

  return { loading, setLoaded, isInitialLoading };
};