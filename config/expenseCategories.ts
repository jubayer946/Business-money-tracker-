export interface CategoryConfig {
  id: string;
  icon: string;
  label: string;
  color: string;
  description?: string;
  isDefault?: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'paid_ads',
    icon: '📢',
    label: 'Paid Advertising',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Facebook Ads, Google Ads, TikTok Ads',
    isDefault: true
  },
  {
    id: 'marketing_tools',
    icon: '🛠️',
    label: 'Marketing Tools',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Email marketing, social media tools',
    isDefault: true
  },
  {
    id: 'supplies',
    icon: '📦',
    label: 'Supplies & Materials',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Packaging, raw materials',
    isDefault: true
  },
  {
    id: 'shipping',
    icon: '🚚',
    label: 'Shipping & Delivery',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'Courier, postage, freight',
    isDefault: true
  },
  {
    id: 'software',
    icon: '💻',
    label: 'Software & Apps',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'Subscriptions, SaaS tools',
    isDefault: true
  },
  {
    id: 'other',
    icon: '📋',
    label: 'Other Expenses',
    color: 'bg-slate-50 dark:bg-slate-800',
    description: 'Miscellaneous expenses',
    isDefault: true
  }
];

// Helper to get category configuration by its ID to resolve missing export error.
export const getCategoryConfig = (id: string): CategoryConfig => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id) || 
         DEFAULT_CATEGORIES.find(cat => cat.id === 'other') || 
         DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length - 1];
};

export type ExpenseCategoryId = string;