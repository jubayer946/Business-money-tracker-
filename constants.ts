import { Product, Sale, Customer, BusinessStats } from './types';

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Coffee Beans', category: 'Grocery', price: 24.99, stock: 45, status: 'In Stock' },
  { id: '2', name: 'Organic Matcha Powder', category: 'Grocery', price: 35.00, stock: 8, status: 'Low Stock' },
  { id: '3', name: 'Glass Storage Jars', category: 'Houseware', price: 12.50, stock: 120, status: 'In Stock' },
  { id: '4', name: 'Bamboo Stirrers', category: 'Houseware', price: 5.99, stock: 0, status: 'Out of Stock' },
  { id: '5', name: 'Artisan Honey', category: 'Grocery', price: 18.00, stock: 32, status: 'In Stock' },
];

export const MOCK_SALES: Sale[] = [
  { id: '1001', date: '2023-10-20', amount: 156.40, customer: 'John Doe', items: 3 },
  { id: '1002', date: '2023-10-21', amount: 45.00, customer: 'Jane Smith', items: 1 },
  { id: '1003', date: '2023-10-21', amount: 89.20, customer: 'Mike Ross', items: 2 },
  { id: '1004', date: '2023-10-22', amount: 210.15, customer: 'Sarah Connor', items: 5 },
  { id: '1005', date: '2023-10-23', amount: 12.50, customer: 'Harvey Specter', items: 1 },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'John Doe', email: 'john@example.com', totalSpent: 1250.50, lastOrder: '2023-10-20' },
  { id: 'c2', name: 'Jane Smith', email: 'jane@example.com', totalSpent: 840.20, lastOrder: '2023-10-21' },
  { id: 'c3', name: 'Mike Ross', email: 'mike@pearsonhardman.com', totalSpent: 3450.00, lastOrder: '2023-10-21' },
  { id: 'c4', name: 'Sarah Connor', email: 'sarah@resistance.com', totalSpent: 120.00, lastOrder: '2023-10-22' },
];

export const MOCK_STATS: BusinessStats = {
  totalRevenue: 54200.50,
  totalOrders: 412,
  activeCustomers: 89,
  inventoryValue: 12400.00,
};