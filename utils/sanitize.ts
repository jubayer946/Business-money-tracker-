/**
 * Sanitize string input to prevent XSS by escaping HTML entities.
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

/**
 * Sanitize input for safe storage by removing script tags and potentially dangerous attributes.
 * Useful for fields where we want to keep most characters but prevent script execution.
 */
export const sanitizeForStorage = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Sanitize object recursively to clean all string properties.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        result[key] = sanitizeForStorage(value) as any;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = Array.isArray(value) 
          ? value.map(v => (typeof v === 'string' ? sanitizeForStorage(v) : (typeof v === 'object' && v !== null ? sanitizeObject(v) : v))) as any
          : sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
};

/**
 * Validate and sanitize numeric input with bounds checking and rounding.
 */
export const sanitizeNumber = (
  input: number | string,
  options: { min?: number; max?: number; decimals?: number; fallback?: number; } = {}
): number => {
  const { min = 0, max = Infinity, decimals = 2, fallback = 0 } = options;
  let num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num) || !isFinite(num)) return fallback;
  
  num = Math.max(min, Math.min(max, num));
  const factor = Math.pow(10, decimals);
  num = Math.round(num * factor) / factor;
  
  return num;
};