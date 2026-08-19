export type MerchantPlan = 'Starter' | 'Growth' | 'Business' | 'Enterprise';
export type MerchantStatus = 'Active' | 'Trial' | 'Suspended' | 'Churned';

export interface MerchantRecord {
  id: string;
  name: string;
  domain: string;
  initials: string;
  avatarBg: string;
  contact: {
    email: string;
    phone: string;
  };
  stores: number;
  plan: MerchantPlan;
  status: MerchantStatus;
  joinedAt: {
    date: string;
    time: string;
  };
  revenue30d: {
    amount: string;
    trend: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  orders30d: {
    amount: string | number;
    trend: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  mrr: string;
  country?: string;
  registrationSource?: string;
}

export interface MerchantKpiCardItem {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  iconType: 'users' | 'store' | 'hourglass' | 'pause' | 'user-minus' | 'user-plus';
}

export interface MerchantFilterState {
  search: string;
  status: string;
  plan: string;
  country: string;
  source: string;
  dateRange: string;
}
