export type SubscriptionPlan = 'Starter' | 'Growth' | 'Business' | 'Enterprise';
export type SubscriptionStatus = 'Active' | 'Trial' | 'Suspended' | 'Cancelled' | 'Expired';
export type BillingCycle = 'Monthly' | 'Annual';

export interface SubscriptionRecord {
  id: string;
  codeId: string; // e.g. "SUB-0001"
  initials: string;
  avatarBg: string;
  domain: string;
  storeName: string;
  merchantName: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  nextBillingDate: {
    date: string;
    subtext: string; // e.g. "in 31 days", "Expired", "Cancelled"
  };
  mrr: string;
  amount: string;
}

export interface SubscriptionKpiCardItem {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  iconType: 'active' | 'trial' | 'expired' | 'cancelled' | 'mrr' | 'arr';
}

export interface RevenueDataPoint {
  date: string;
  mrr: number;
  arr: number;
}

export interface NewVsCancelledPoint {
  date: string;
  newCount: number;
  cancelledCount: number;
}

export interface DonutSegment {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

export interface FunnelMetric {
  label: string;
  value: string | number;
  subtext?: string;
  percentage: number;
  color: string;
}

export interface FailedPaymentRecord {
  id: string;
  storeName: string;
  subId: string;
  initials: string;
  avatarBg: string;
  amount: string;
  date: string;
}

export interface SubscriptionFilterState {
  search: string;
  plan: string;
  status: string;
  merchant: string;
  cycle: string;
  dateRange: string;
}
