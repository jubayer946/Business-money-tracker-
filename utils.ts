import { Product, StockStatus } from './types';

export const getProductStock = (p: Product): number => {
  if (p.hasVariants && p.variants && p.variants.length) {
    return p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return p.stock || 0;
};

export const getStatusFromStock = (stock: number): StockStatus => {
  if (stock > 10) return 'In Stock';
  if (stock > 0) return 'Low Stock';
  return 'Out of Stock';
};

/**
 * Get local date string in YYYY-MM-DD format (no timezone issues)
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get date N days ago in local timezone
 */
export const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getLocalDateString(date);
};

export const getDaysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateString(d);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Removes undefined values from an object before Firestore save.
 * Firestore accepts null but throws on undefined.
 */
export const cleanObject = <T extends object>(obj: T): T => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      (acc as any)[key] = value;
    }
    return acc;
  }, {} as T);
};

// ==================== CSV EXPORT (SECURE) ====================

export const escapeCsvCell = (cell: string | number | undefined | null): string => {
  if (cell === undefined || cell === null) {
    return '""';
  }
  const str = String(cell);
  if (/^[=+\-@\t]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export const generateCSV = (
  headers: string[],
  rows: (string | number | undefined | null)[][]
): string => {
  const BOM = '\uFEFF';
  const csvContent = [
    headers.map(h => escapeCsvCell(h)).join(','),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(','))
  ].join('\r\n');
  return BOM + csvContent;
};

export const downloadCSV = (filename: string, csvContent: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateFilename = (prefix: string, extension = 'csv'): string => {
  const date = getLocalDateString().replace(/-/g, '');
  return `${prefix}_${date}.${extension}`;
};
