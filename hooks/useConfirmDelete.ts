import { useState, useCallback } from 'react';

interface DeleteState<T> {
  item: T | null;
  isOpen: boolean;
}

export function useConfirmDelete<T>() {
  const [state, setState] = useState<DeleteState<T>>({ item: null, isOpen: false });

  const requestDelete = useCallback((item: T) => {
    setState({ item, isOpen: true });
  }, []);

  const confirmDelete = useCallback(() => {
    const item = state.item;
    setState({ item: null, isOpen: false });
    return item;
  }, [state.item]);

  const cancelDelete = useCallback(() => {
    setState({ item: null, isOpen: false });
  }, []);

  return { ...state, requestDelete, confirmDelete, cancelDelete };
}