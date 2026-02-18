export interface CategoryConfig {
  id: string;
  icon: string;
  label: string;
  color: string;
  description?: string;
}

export const EXPENSE_CATEGORIES: CategoryConfig[] = [
  {
    id: 'paid_ads',
    icon: '📢',
    label: 'Paid Advertising',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    description: 'Facebook Ads, Google Ads, TikTok Ads'
  },
  {
    id: 'marketing_tools',
    icon: '🛠️',
    label: 'Marketing Tools',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    description: 'Email marketing, social media tools, SEO'
  },
  {
    id: 'supplies',
    icon: '📦',
    label: 'Supplies & Materials',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    description: 'Packaging, raw materials, inventory'
  },
  {
    id: 'shipping',
    icon: '🚚',
    label: 'Shipping & Delivery',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    description: 'Courier, postage, freight'
  },
  {
    id: 'software',
    icon: '💻',
    label: 'Software & Apps',
    color: 'bg-indigo-50 dark:bg-indigo-900/20',
    description: 'Shopify, hosting, SaaS subscriptions'
  },
  {
    id: 'other',
    icon: '📋',
    label: 'Other Expenses',
    color: 'bg-slate-50 dark:bg-slate-800',
    description: 'Miscellaneous business expenses'
  }
];

export const getCategoryConfig = (categoryId: string): CategoryConfig => {
  return EXPENSE_CATEGORIES.find(cat => cat.id === categoryId) || EXPENSE_CATEGORIES.find(cat => cat.id === 'other')!;
};

export type ExpenseCategoryId = typeof EXPENSE_CATEGORIES[number]['id'];
