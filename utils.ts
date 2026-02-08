import { Product } from './types';

export const getProductStock = (p: Product): number => {
  if (p.hasVariants && p.variants && p.variants.length) {
    return p.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  return p.stock;
};

export const getStatusFromStock = (stock: number): Product['status'] => {
  if (stock > 10) return 'In Stock';
  if (stock > 0) return 'Low Stock';
  return 'Out of Stock';
};
