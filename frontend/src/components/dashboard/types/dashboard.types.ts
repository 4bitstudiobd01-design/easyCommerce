export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  changePeriod: string;
  icon: 'users' | 'merchants' | 'stores' | 'orders' | 'gmv' | 'mrr';
}

export interface RevenueDataPoint {
  date: string;
  netRevenue: number;
  subscriptionRevenue: number;
  refunds: number;
}

export interface MerchantGrowthDataPoint {
  date: string;
  newMerchants: number;
  activeMerchants: number;
  churnedMerchants: number;
}

export interface SubscriptionBreakdown {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ServiceStatus {
  name: string;
  status: 'Operational' | 'Warning' | 'Down';
  icon: string;
}

export interface PlatformHealthMetric {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  type?: 'text' | 'progress';
  progressValue?: number;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'merchant' | 'subscription' | 'payment' | 'suspended' | 'store';
}

export interface TopMerchant {
  rank: number;
  name: string;
  plan: 'Starter' | 'Growth' | 'Business' | 'Enterprise';
  revenue: string;
  growth: string;
  isPositive: boolean;
}

export interface AlertNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
}

export interface QuickActionItem {
  id: string;
  title: string;
  icon: 'create-merchant' | 'create-plan' | 'audit-logs' | 'settings' | 'health';
  href: string;
}

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}
