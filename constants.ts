
import { Product, Sale, AdCost } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'ball-1',
    name: 'Ball',
    price: 70,
    costPrice: 20,
    stock: 30,
    status: 'In Stock',
    hasVariants: true,
    variants: [
      { id: 'round', name: 'Round', stock: 10, buyPrice: 20, sellPrice: 70 },
      { id: 'oval',  name: 'Oval',  stock: 20, buyPrice: 20, sellPrice: 70 },
    ],
  },
  { id: '1', name: 'Premium Coffee Beans', price: 24.99, costPrice: 10.00, stock: 45, status: 'In Stock' },
  { id: '2', name: 'Organic Matcha Powder', price: 35.00, costPrice: 15.00, stock: 8, status: 'Low Stock' },
  { id: '3', name: 'Glass Storage Jars', price: 12.50, costPrice: 4.50, stock: 120, status: 'In Stock' },
  { id: '4', name: 'Bamboo Stirrers', price: 5.99, costPrice: 1.20, stock: 0, status: 'Out of Stock' },
];

// Added productName to mock sales data to fix type errors
export const MOCK_SALES: Sale[] = [
  { id: '1001', date: '2023-10-20', amount: 156.40, customer: 'John Doe', productName: 'Ball', items: 3 },
  { id: '1002', date: '2023-10-21', amount: 45.00, customer: 'Jane Smith', productName: 'Premium Coffee Beans', items: 1 },
  { id: '1003', date: '2023-10-21', amount: 89.20, customer: 'Mike Ross', productName: 'Organic Matcha Powder', items: 2 },
  { id: '1004', date: '2023-10-22', amount: 210.15, customer: 'Sarah Connor', productName: 'Glass Storage Jars', items: 5 },
  { id: '1005', date: '2023-10-23', amount: 12.50, customer: 'Harvey Specter', productName: 'Bamboo Stirrers', items: 1 },
];

export const MOCK_AD_COSTS: AdCost[] = [
  { id: 'ad-1', platform: 'Google Ads', amount: 450.00, date: '2023-10-15', notes: 'Search Campaign' },
  { id: 'ad-2', platform: 'Facebook', amount: 320.50, date: '2023-10-18', notes: 'Retargeting' },
  { id: 'ad-3', platform: 'Instagram', amount: 150.00, date: '2023-10-20', notes: 'Influencer Post' },
  { id: 'ad-4', platform: 'Google Ads', amount: 200.00, date: '2023-10-22', notes: 'Display Ads' },
];
