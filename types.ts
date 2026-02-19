import type { LucideIcon } from 'lucide-react';
import { ExpenseCategoryId } from './config/expenseCategories';

// ==================== ENUMS & STATUS TYPES ====================

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type SaleStatus = 'Paid' | 'Pending' | 'Refunded';

export type AdStatus = 'Active' | 'Paused' | 'Ended';

// Changed to string to allow user-defined categories in the future
export type ExpenseCategory = string; 

// ==================== PRODUCT TYPES ====================

export interface ProductVariant {
  id: string;
  name: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  status: StockStatus;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  dateAdded?: string;
}

// ==================== SALE TYPES ====================

export interface SaleItemDetail {
  productId?: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  pricePerItem: number;
  deliveryCharge?: number;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  productId?: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  items: number;
  itemsDetail?: SaleItemDetail[];
  status?: SaleStatus;
  deliveryCharge?: number;
}

// ==================== EXPENSE TYPES ====================

export interface Expense {
  id: string;
  name: string;
  platform: string;
  amount: number;
  date: string;
  endDate?: string;
  productIds?: string[];
  productNames?: string[];
  category: ExpenseCategory;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
  createdAt?: string;
}

/** @deprecated Use Expense instead */
export interface AdCampaign extends Expense {
  status: AdStatus;
  clicks?: number;
  impressions?: number;
}

// Keeping AdCost for internal legacy logic
export interface AdCost {
  id: string;
  platform: string; 
  amount: number;
  date: string;
  endDate?: string;
  notes?: string;
}

// ==================== AD PLATFORM TYPES ====================

export interface AdPlatform {
  id: string;
  name: string;
  order: number;
}

// ==================== AUDIT TYPES ====================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete';
  collection: 'products' | 'sales' | 'expenses' | 'platforms';
  documentId: string;
  documentName: string;
  changes?: Record<string, { from: any; to: any }>;
  userId?: string;
}

// ==================== BUSINESS STATS ====================

export interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  totalAdSpend: number;
  inventoryValue: number;
  netProfit: number;
}

export type ViewType = 'dashboard' | 'inventory' | 'sales' | 'ads';

// ==================== COMPONENT PROP TYPES ====================

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: number;
  trendLabel?: string;
}

export interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}