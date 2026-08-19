export type PlanStatus = 'Active' | 'Inactive';
export type PlanBillingCycle = 'Monthly' | 'Annual' | 'Custom';

export interface PlanRecord {
  id: string;
  name: string;
  subtitle: string;
  featuresCountText: string;
  iconType: 'starter' | 'growth' | 'business' | 'enterprise' | 'custom';
  iconBg: string;
  price: string;
  billingPeriod: string; // e.g. "/ month"
  billingCycle: PlanBillingCycle;
  merchantsCount: string; // e.g. "1,240"
  merchantsShare: string; // e.g. "(48.7%)"
  mrr: string; // e.g. "৳12,40,000"
  mrrShare: string; // e.g. "(24.8%)"
  status: PlanStatus;
  createdAt: {
    date: string;
    time: string;
  };
  description: string;
  featuresUsed: number;
  featuresTotal: number;
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
