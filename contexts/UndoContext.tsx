
import React, { createContext, useContext, useState, useCallback } from 'react';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { UndoToast } from '../components/UndoToast';

interface UndoContextType {
  trackDelete: (collection: string, id: string, data: any) => Promise<void>;
  trackCreate: (collection: string, id: string, data: any) => void;
  trackUpdate: (collection: string, id: string, newData: any, oldData: any) => void;
}

const UndoContext = createContext<UndoContextType | null>(null);

export const useUndo = () => {
  const context = useContext(UndoContext);
  if (!context) throw new Error('useUndo must be used within UndoProvider');
  return context;
};

export const UndoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addAction, undo } = useUndoRedo<any>();
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');

  const performUndo = useCallback(async () => {
    const action = undo();
    if (!action) return;
    try {
      switch (action.type) {
        case 'delete':
          // Restore deleted item
          await setDoc(doc(db, action.collection, action.id), action.data);
          break;
        case 'create':
          // Remove created item
          await deleteDoc(doc(db, action.collection, action.id));
          break;
        case 'update':
          // Restore previous data
          if (action.previousData) {
            await updateDoc(doc(db, action.collection, action.id), action.previousData);
          }
          break;
      }
      setShowUndoToast(false);
    } catch (error) {
      console.error('Undo failed:', error);
    }
  }, [undo]);

  const trackDelete = useCallback(async (collectionName: string, id: string, data: any) => {
    addAction({ id, type: 'delete', collection: collectionName, data });
    await deleteDoc(doc(db, collectionName, id));
    setUndoMessage(`Deleted "${data.name || data.productName || 'item'}"`);
    setShowUndoToast(true);
  }, [addAction]);

  const trackCreate = useCallback((collectionName: string, id: string, data: any) => {
    addAction({ id, type: 'create', collection: collectionName, data });
  }, [addAction]);

  const trackUpdate = useCallback((collectionName: string, id: string, newData: any, oldData: any) => {
    addAction({ id, type: 'update', collection: collectionName, data: newData, previousData: oldData });
  }, [addAction]);

  return (
    <UndoContext.Provider value={{ trackDelete, trackCreate, trackUpdate }}>
      {children}
      {showUndoToast && (
        <UndoToast
          message={undoMessage}
          onUndo={performUndo}
          onDismiss={() => setShowUndoToast(false)}
        />
      )}
    </UndoContext.Provider>
  );
};
