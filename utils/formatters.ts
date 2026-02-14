const locale = 'en-US';

/**
 * Format currency with proper symbol and decimals
 */
export const formatCurrency = (
  amount: number,
  options: { currency?: string; compact?: boolean; showSign?: boolean; } = {}
): string => {
  const { currency = 'USD', compact = false, showSign = false } = options;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: 2,
    signDisplay: showSign ? 'exceptZero' : 'auto',
  });
  return formatter.format(amount);
};

/**
 * Format large numbers with K, M suffixes
 */
export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
};

/**
 * Format percentage
 */
export const formatPercent = (
  value: number,
  options: { decimals?: number; showSign?: boolean } = {}
): string => {
  const { decimals = 1, showSign = false } = options;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: showSign ? 'exceptZero' : 'auto',
  }).format(value / 100);
};

/**
 * Format relative date (e.g., "Today", "2 days ago")
 * Handles both YYYY-MM-DD and ISO string formats
 */
export const formatRelativeDate = (dateStr: string): string => {
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const date = new Date(cleanStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Format date for display with different length options
 */
export const formatDate = (
  dateStr: string,
  options: { format?: 'short' | 'medium' | 'long' } = {}
): string => {
  const { format = 'medium' } = options;
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const date = new Date(cleanStr + 'T00:00:00');
  const formats = {
    short: { month: 'numeric' as const, day: 'numeric' as const },
    medium: { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const },
    long: { weekday: 'long' as const, month: 'long' as const, day: 'numeric' as const, year: 'numeric' as const },
  };
  return date.toLocaleDateString(locale, formats[format]);
};

/**
 * Format full timestamp into human readable string
 */
export const formatFullDateTime = (isoStr: string): string => {
  const date = new Date(isoStr);
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};