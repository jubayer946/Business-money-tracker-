
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface ProductVariant {
  id: string;        // e.g. "round", "oval"
  name: string;      // e.g. "Round", "Oval"
  stock: number;     // how many of this shape
  buyPrice?: number; // optional – cost price for this shape
  sellPrice?: number;// optional – sell price for this shape
}

export interface Product {
  id: string;
  name: string;
  price: number;        // main selling price
  costPrice?: number;   // main buying price
  stock: number;        // total stock (sum of all variants, or simple stock if no variants)
  status: StockStatus;
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  customer: string;
  productName: string; // Added to track which product was sold
  items: number;
}

export interface AdPlatform {
  id: string;
  name: string;
}

export interface AdCost {
  id: string;
  platform: string; // e.g. "Google Ads", "Facebook", "Instagram"
  amount: number;
  date: string;     // Represents start date
  endDate?: string; // Optional end date for range-based expenses
  notes?: string;
}

// Added Customer interface to fix import error in CustomersView.tsx
export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
}

export interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  totalAdSpend: number;
  inventoryValue: number;
}

// Updated ViewType to include 'customers'
export type ViewType = 'dashboard' | 'inventory' | 'sales' | 'adCosts' | 'customers';
