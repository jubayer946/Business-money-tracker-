
import { useState, useCallback, useRef } from 'react';

interface UndoableAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: T;
  previousData?: T;
  timestamp: number;
}

interface UndoRedoState<T> {
  past: UndoableAction<T>[];
  future: UndoableAction<T>[];
}

const MAX_HISTORY = 20;

export function useUndoRedo<T>() {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    future: [],
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addAction = useCallback((action: Omit<UndoableAction<T>, 'timestamp'>) => {
    setState(prev => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), { ...action, timestamp: Date.now() }],
      future: [], // Clear redo stack on new action
    }));

    // Auto-clear old actions after 5 minutes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        past: prev.past.filter(a => Date.now() - a.timestamp < 5 * 60 * 1000),
      }));
    }, 5 * 60 * 1000);
  }, []);

  const undo = useCallback((): UndoableAction<T> | null => {
    let actionToUndo: UndoableAction<T> | null = null;
    setState(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      actionToUndo = newPast.pop()!;
      return {
        past: newPast,
        future: [actionToUndo, ...prev.future],
      };
    });
    return actionToUndo;
  }, []);

  const redo = useCallback((): UndoableAction<T> | null => {
    let actionToRedo: UndoableAction<T> | null = null;
    setState(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      actionToRedo = newFuture.shift()!;
      return {
        past: [...prev.past, actionToRedo],
        future: newFuture,
      };
    });
    return actionToRedo;
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;
  const lastAction = state.past[state.past.length - 1];

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    lastAction,
    historyLength: state.past.length,
  };
}
