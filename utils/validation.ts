export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateProduct = (data: {
  name: string;
  price: number;
  costPrice: number;
  stock: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name.trim()) {
    errors.name = 'Product name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be under 100 characters';
  }

  if (isNaN(data.price) || data.price < 0) {
    errors.price = 'Price cannot be negative';
  } else if (data.price > 999999) {
    errors.price = 'Price is too high';
  }

  if (isNaN(data.costPrice) || data.costPrice < 0) {
    errors.costPrice = 'Cost cannot be negative';
  }

  if (data.costPrice > data.price && data.price > 0) {
    errors.costPrice = 'Cost exceeds selling price';
  }

  if (data.stock < 0) {
    errors.stock = 'Stock cannot be negative';
  } else if (!Number.isInteger(data.stock)) {
    errors.stock = 'Stock must be a whole number';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateSale = (data: {
  productId: string;
  quantity: number;
  availableStock: number;
  price: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.productId) {
    errors.product = 'Please select a product';
  }

  if (data.quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  } else if (!Number.isInteger(data.quantity)) {
    errors.quantity = 'Quantity must be a whole number';
  } else if (data.quantity > data.availableStock) {
    errors.quantity = `Only ${data.availableStock} in stock`;
  }

  if (isNaN(data.price) || data.price <= 0) {
    errors.price = 'Price must be greater than zero';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
