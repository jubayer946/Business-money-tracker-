export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  customer: string;
  items: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  lastOrder: string;
}

export interface BusinessStats {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  inventoryValue: number;
}

export type ViewType = 'dashboard' | 'inventory' | 'sales' | 'customers';