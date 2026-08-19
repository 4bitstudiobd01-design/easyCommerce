export type StorePlan = 'Starter' | 'Growth' | 'Business' | 'Enterprise';
export type StoreStatus = 'Active' | 'Trial' | 'Suspended' | 'Blocked';

export interface StoreRecord {
  id: string;
  codeId: string; // e.g. "store_01HBXX3Z9Q"
  name: string;
  initials: string;
  avatarBg: string;
  merchant: {
    name: string;
    email: string;
  };
  domain: string;
  plan: StorePlan;
  status: StoreStatus;
  country: {
    code: string;
    name: string;
  };
  orders30d: {
    count: string | number;
    trend: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  revenue30d: {
    amount: string;
    trend: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  createdAt: {
    date: string;
    time: string;
  };
}

export interface StoreKpiCardItem {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  period: string;
  iconType: 'total-stores' | 'active-stores' | 'suspended-stores' | 'blocked-stores' | 'new-stores';
}

export interface StoreFilterState {
  search: string;
  merchant: string;
  status: string;
  plan: string;
  country: string;
  dateRange: string;
}
