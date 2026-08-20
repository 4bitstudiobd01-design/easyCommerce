export type PlanStatus = 'Active' | 'Inactive';
export type PlanBillingCycle = 'Monthly' | 'Annual' | 'Quarterly' | 'One-time' | 'Custom';

export interface PlanFeatureItem {
  id: string;
  name: string;
  iconName: 'store' | 'globe' | 'lock' | 'users' | 'package' | 'layers' | 'download' | 'shopping-bag' | 'file-down' | 'tag' | 'mail' | 'shield' | 'check';
  included: boolean | string | number;
  details: string;
}

export interface PlanFeatureCategory {
  category: string;
  items: PlanFeatureItem[];
}

export interface PlanPerformanceStats {
  merchants: number;
  merchantsGrowth: string;
  newSubscriptions: number;
  newSubscriptionsGrowth: string;
  cancelled: number;
  cancelledGrowth: string;
  mrr: string;
  mrrGrowth: string;
}

export interface PlanLimitsSummary {
  stores: number | string;
  products: string;
  staffAccounts: number | string;
  monthlyOrders: string;
  storage: string;
  bandwidth: string;
  emailSends: string;
  customDomain: boolean;
  apiAccess: boolean;
}

export interface PlanHistoryEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  type: 'update' | 'price' | 'feature' | 'create';
}

export interface PlanAddon {
  id: string;
  name: string;
  description: string;
  price: string;
  billingPeriod: string;
  isEnabled: boolean;
}

export interface PlanPermission {
  id: string;
  name: string;
  category: string;
  allowed: boolean;
  description: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  code?: string;
  subtitle: string;
  badge?: string;
  displayOrder?: number;
  featuresCountText: string;
  iconType: 'starter' | 'growth' | 'business' | 'enterprise' | 'custom';
  iconBg: string;
  price: string;
  yearlyPrice?: string;
  yearlyDiscount?: string;
  billingPeriod: string; // e.g. "/ month"
  billingCycle: PlanBillingCycle;
  trialDays?: number;
  trialAvailable?: boolean;
  visibility?: 'Visible to merchants' | 'Visible to all merchants' | 'Hidden from storefronts' | 'Hidden / Private' | 'Enterprise Only';
  merchantsCount: string; // e.g. "842"
  merchantsShare: string; // e.g. "(33.1%)"
  mrr: string; // e.g. "৳9,80,000"
  mrrShare: string; // e.g. "(19.6%)"
  status: PlanStatus;
  createdAt: {
    date: string;
    time: string;
  };
  updatedAt?: {
    date: string;
    time: string;
  };
  description: string;
  featuresUsed: number;
  featuresTotal: number;
  whatsIncluded?: string[];
  featureCategories?: PlanFeatureCategory[];
  performance?: PlanPerformanceStats;
  limitsSummary?: PlanLimitsSummary;
  addons?: PlanAddon[];
  permissions?: PlanPermission[];
  history?: PlanHistoryEntry[];
}

export interface CreatePlanFormData {
  name: string;
  code: string;
  description: string;
  badge: string;
  displayOrder: number;
  price: string;
  billingCycle: PlanBillingCycle;
  yearlyPrice: string;
  offerYearlyDiscount: boolean;
  yearlyDiscountPercent: number;
  stores: number | string;
  products: string;
  productVariants: string;
  monthlyOrders: string;
  staffAccounts: number | string;
  storage: number | string;
  storageUnit: 'GB' | 'TB' | 'MB';
  bandwidth: number | string;
  bandwidthUnit: 'GB' | 'TB';
  customDomain: boolean;
  status: PlanStatus;
  visibility: 'Visible to all merchants' | 'Hidden / Private' | 'Enterprise Only';
  featureHighlights: string[];
  advancedLimits?: {
    apiAccess: boolean;
    posAccess: boolean;
    abandonedCart: boolean;
    multiWarehouse: boolean;
    webhooks: boolean;
    smsSends: string;
  };
}

export interface PlanKpiItem {
  id: string;
  title: string;
  value: string;
  subtext: string;
  iconType: 'total' | 'active' | 'inactive' | 'popular' | 'mrr';
}

export interface PlanDonutItem {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

export interface PlanHighlightItem {
  id: string;
  tag: string;
  planName: string;
  statValue: string;
  tagColor: 'green' | 'blue' | 'amber' | 'purple';
}

export interface PlanRecentChangeItem {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  iconType: 'edit' | 'price' | 'create';
}

export interface PlanFilterState {
  search: string;
  status: string;
  billingCycle: string;
  dateRange: string;
}
