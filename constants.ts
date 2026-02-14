import { Product, Sale, AdCost, AdPlatform } from './types';
import { getLocalDateString, getDateDaysAgo } from './utils';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'nigiri-nami',
    name: 'Nigiri: Regular',
    price: 12.00,
    costPrice: 4.50,
    stock: 50,
    status: 'In Stock'
  },
  {
    id: 'nigiri-jo',
    name: 'Nigiri: Deluxe',
    price: 18.50,
    costPrice: 7.00,
    stock: 30,
    status: 'In Stock'
  },
  {
    id: 'nigiri-tokujo',
    name: 'Nigiri: Premium',
    price: 24.00,
    costPrice: 9.00,
    stock: 20,
    status: 'In Stock'
  },
  {
    id: 'chirashi-nami',
    name: 'Chirashi: Regular',
    price: 15.00,
    costPrice: 5.50,
    stock: 40,
    status: 'In Stock'
  },
  {
    id: 'tekka-don',
    name: 'Tuna Donburi',
    price: 14.50,
    costPrice: 6.00,
    stock: 25,
    status: 'In Stock'
  },
  {
    id: 'dashimaki',
    name: 'Tamagoyaki Omelet',
    price: 6.50,
    costPrice: 1.50,
    stock: 15,
    status: 'In Stock'
  },
  {
    id: 'sushi-platter',
    name: 'Mixed Sushi Platter',
    price: 35.00,
    costPrice: 12.00,
    stock: 10,
    status: 'In Stock',
    hasVariants: true,
    variants: [
      { id: 'platter-medium', name: 'Medium (12pc)', stock: 5 },
      { id: 'platter-large', name: 'Large (20pc)', stock: 5 }
    ]
  }
];

export const MOCK_SALES: Sale[] = [
  { 
    id: '1001', 
    productId: 'nigiri-tokujo',
    date: getLocalDateString(), 
    amount: 24.00, 
    productName: 'Nigiri: Premium', 
    items: 1, 
    status: 'Paid'
  },
  { 
    id: '1002', 
    productId: 'chirashi-nami',
    date: getDateDaysAgo(1), 
    amount: 30.00, 
    productName: 'Chirashi: Regular', 
    items: 2, 
    status: 'Paid'
  },
  {
    id: '1003',
    productId: 'sushi-platter',
    variantId: 'platter-medium',
    date: getDateDaysAgo(2),
    amount: 35.00,
    productName: 'Mixed Sushi Platter',
    variantName: 'Medium (12pc)',
    items: 1,
    status: 'Paid'
  }
];

export const DEFAULT_PLATFORMS: AdPlatform[] = [
  { id: 'p1', name: 'Google Ads', order: 0 },
  { id: 'p2', name: 'Facebook', order: 1 },
  { id: 'p3', name: 'Instagram', order: 2 },
  { id: 'p4', name: 'Other', order: 3 },
];

export const MOCK_AD_COSTS: AdCost[] = [
  { id: 'ad-1', platform: 'Leaflet Printing', amount: 45.00, date: getDateDaysAgo(7), notes: 'Local neighborhood posting' },
];