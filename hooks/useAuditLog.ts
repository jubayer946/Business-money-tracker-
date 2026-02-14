
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuditLogEntry } from '../types';

export const useAuditLog = () => {
  const logAction = async (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to log business activity:', e);
    }
  };

  return {
    logCreate: (col: AuditLogEntry['collection'], id: string, name: string) => 
      logAction({ action: 'create', collection: col, documentId: id, documentName: name }),
    
    logUpdate: (col: AuditLogEntry['collection'], id: string, name: string, changes?: Record<string, { from: any; to: any }>) => 
      logAction({ action: 'update', collection: col, documentId: id, documentName: name, changes }),
    
    logDelete: (col: AuditLogEntry['collection'], id: string, name: string) => 
      logAction({ action: 'delete', collection: col, documentId: id, documentName: name }),
  };
};
