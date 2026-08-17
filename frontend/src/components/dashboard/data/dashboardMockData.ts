import {
  KpiMetric,
  RevenueDataPoint,
  MerchantGrowthDataPoint,
  SubscriptionBreakdown,
  ServiceStatus,
  PlatformHealthMetric,
  RecentActivityItem,
  TopMerchant,
  AlertNotificationItem,
  QuickActionItem,
  NavSection,
} from '../types/dashboard.types';

export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'total-merchants',
    label: 'Total Merchants',
    value: '2,548',
    change: '12.5%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'users',
  },
  {
    id: 'active-merchants',
    label: 'Active Merchants',
    value: '2,214',
    change: '8.3%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'merchants',
  },
  {
    id: 'total-stores',
    label: 'Total Stores',
    value: '2,731',
    change: '10.2%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'stores',
  },
  {
    id: 'total-orders',
    label: 'Total Orders',
    value: '128,420',
    change: '15.6%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'orders',
  },
  {
    id: 'platform-gmv',
    label: 'Platform GMV',
    value: '৳4,80,00,000',
    change: '17.8%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'gmv',
  },
  {
    id: 'monthly-mrr',
    label: 'MRR (Monthly)',
    value: '৳18,40,000',
    change: '14.6%',
    isPositive: true,
    changePeriod: 'from last 30 days',
    icon: 'mrr',
  },
];

export const REVENUE_DATA: RevenueDataPoint[] = [
  { date: 'Aug 8', netRevenue: 245000, subscriptionRevenue: 180000, refunds: 65000 },
  { date: 'Aug 9', netRevenue: 290000, subscriptionRevenue: 200000, refunds: 72000 },
  { date: 'Aug 10', netRevenue: 340000, subscriptionRevenue: 260000, refunds: 68000 },
  { date: 'Aug 11', netRevenue: 310000, subscriptionRevenue: 235000, refunds: 74000 },
  { date: 'Aug 12', netRevenue: 300000, subscriptionRevenue: 215000, refunds: 62000 },
  { date: 'Aug 13', netRevenue: 365000, subscriptionRevenue: 275000, refunds: 78000 },
  { date: 'Aug 14', netRevenue: 420000, subscriptionRevenue: 250000, refunds: 70000 },
];

export const MERCHANT_GROWTH_DATA: MerchantGrowthDataPoint[] = [
  { date: 'Jul 16', newMerchants: 80, activeMerchants: 155, churnedMerchants: 25 },
  { date: 'Jul 23', newMerchants: 110, activeMerchants: 175, churnedMerchants: 35 },
  { date: 'Jul 30', newMerchants: 95, activeMerchants: 160, churnedMerchants: 45 },
  { date: 'Aug 6', newMerchants: 135, activeMerchants: 195, churnedMerchants: 30 },
  { date: 'Aug 13', newMerchants: 150, activeMerchants: 220, churnedMerchants: 40 },
];

export const MERCHANT_GROWTH_SUMMARY = {
  newCount: '128',
  newChange: '18.7%',
  activeCount: '2,214',
  activeChange: '8.3%',
  trialCount: '214',
  trialChange: '12.2%',
  churnedCount: '78',
  churnedChange: '7.6%',
};

export const SUBSCRIPTION_BREAKDOWN: SubscriptionBreakdown[] = [
  { name: 'Starter', count: 1240, percentage: 48.7, color: '#10B981' },
  { name: 'Growth', count: 842, percentage: 33.1, color: '#3B82F6' },
  { name: 'Business', count: 328, percentage: 12.9, color: '#F59E0B' },
  { name: 'Enterprise', count: 56, percentage: 2.2, color: '#8B5CF6' },
  { name: 'Trial', count: 82, percentage: 3.2, color: '#06B6D4' },
];

export const SUBSCRIPTION_SUMMARY = {
  total: '2,548',
  activeSubscriptions: '2,466',
  activeChange: '9.8%',
  trialSubscriptions: '82',
  trialChange: '5.7%',
  conversionRate: '31.3%',
  conversionChange: '4.2%',
  churnRate: '2.8%',
  churnChange: '0.6%',
};

export const SERVICES_STATUS: ServiceStatus[] = [
  { name: 'API Services', status: 'Operational', icon: 'api' },
  { name: 'Database', status: 'Operational', icon: 'database' },
  { name: 'Redis', status: 'Operational', icon: 'redis' },
  { name: 'Background Jobs', status: 'Operational', icon: 'jobs' },
  { name: 'Storage', status: 'Operational', icon: 'storage' },
  { name: 'Payment Gateway', status: 'Operational', icon: 'payment' },
  { name: 'Courier APIs', status: 'Warning', icon: 'courier' },
  { name: 'Webhooks', status: 'Operational', icon: 'webhooks' },
];

export const PLATFORM_HEALTH_METRICS: PlatformHealthMetric[] = [
  { label: 'API Uptime', value: '99.8%', change: '0.2%', isPositive: true, type: 'text' },
  { label: 'Avg. Response Time', value: '320ms', change: '12ms', isPositive: false, type: 'text' },
  { label: 'Error Rate', value: '0.42%', change: '0.18%', isPositive: true, type: 'text' },
  { label: 'Queue Backlog', value: '142', change: '18', isPositive: true, type: 'text' },
  { label: 'Storage Used', value: '78%', type: 'progress', progressValue: 78 },
  { label: 'CDN Hit Rate', value: '95.6%', change: '1.3%', isPositive: true, type: 'text' },
];

export const RECENT_ACTIVITIES: RecentActivityItem[] = [
  {
    id: 'act-1',
    title: 'New merchant registered',
    description: 'ABC Fashion Store',
    timestamp: '2 min ago',
    type: 'merchant',
  },
  {
    id: 'act-2',
    title: 'Subscription upgraded',
    description: 'XYZ Store upgraded to Business Plan',
    timestamp: '15 min ago',
    type: 'subscription',
  },
  {
    id: 'act-3',
    title: 'Payment received',
    description: '৳12,500 from Gadget Hub',
    timestamp: '28 min ago',
    type: 'payment',
  },
  {
    id: 'act-4',
    title: 'Merchant suspended',
    description: 'Test Store suspended by admin',
    timestamp: '1 hour ago',
    type: 'suspended',
  },
  {
    id: 'act-5',
    title: 'New store created',
    description: 'Urban Style Store created a new store',
    timestamp: '2 hours ago',
    type: 'store',
  },
];

export const TOP_MERCHANTS: TopMerchant[] = [
  {
    rank: 1,
    name: 'Urban Style Store',
    plan: 'Business',
    revenue: '৳2,45,000',
    growth: '22.5%',
    isPositive: true,
  },
  {
    rank: 2,
    name: 'ABC Fashion Store',
    plan: 'Growth',
    revenue: '৳1,80,000',
    growth: '18.3%',
    isPositive: true,
  },
  {
    rank: 3,
    name: 'Gadget Hub',
    plan: 'Business',
    revenue: '৳1,45,000',
    growth: '15.7%',
    isPositive: true,
  },
  {
    rank: 4,
    name: 'Book Haven',
    plan: 'Growth',
    revenue: '৳1,28,000',
    growth: '12.1%',
    isPositive: true,
  },
  {
    rank: 5,
    name: 'Daily Essentials',
    plan: 'Starter',
    revenue: '৳98,000',
    growth: '9.4%',
    isPositive: true,
  },
];

export const ALERTS_NOTIFICATIONS: AlertNotificationItem[] = [
  {
    id: 'alert-1',
    title: 'High Error Rate',
    description: 'API error rate increased to 4.8%',
    timestamp: '5 min ago',
    severity: 'error',
  },
  {
    id: 'alert-2',
    title: 'Payment Failures',
    description: '12 payment webhooks failed',
    timestamp: '15 min ago',
    severity: 'warning',
  },
  {
    id: 'alert-3',
    title: 'Storage Limit',
    description: '8 merchants exceeded storage limit',
    timestamp: '1 hour ago',
    severity: 'warning',
  },
  {
    id: 'alert-4',
    title: 'System Update',
    description: 'Platform will be updated tonight',
    timestamp: '2 hours ago',
    severity: 'info',
  },
];

export const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'action-merchant',
    title: 'Create Merchant',
    icon: 'create-merchant',
    href: '/admin/merchants',
  },
  {
    id: 'action-plan',
    title: 'Create Plan',
    icon: 'create-plan',
    href: '/admin/plans',
  },
  {
    id: 'action-logs',
    title: 'View Audit Logs',
    icon: 'audit-logs',
    href: '/admin/audit-logs',
  },
  {
    id: 'action-settings',
    title: 'Platform Settings',
    icon: 'settings',
    href: '/admin/settings',
  },
  {
    id: 'action-health',
    title: 'System Health',
    icon: 'health',
    href: '/admin/health',
  },
];

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        title: 'Dashboard',
        href: '/admin',
        iconName: 'LayoutDashboard',
      },
    ],
  },
  {
    title: 'PLATFORM',
    items: [
      { title: 'Merchants', href: '/admin/merchants', iconName: 'Users' },
      { title: 'Stores', href: '/admin/stores', iconName: 'Store' },
      { title: 'Subscriptions', href: '/admin/subscriptions', iconName: 'CreditCard' },
      { title: 'Plans', href: '/admin/plans', iconName: 'Bookmark' },
      { title: 'Transactions', href: '/admin/transactions', iconName: 'ArrowLeftRight' },
      { title: 'Usage & Limits', href: '/admin/usage', iconName: 'PieChart' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { title: 'Support', href: '/admin/support', iconName: 'Headphones' },
      { title: 'Notifications', href: '/admin/notifications', iconName: 'Bell', badge: 12 },
      { title: 'Integrations', href: '/admin/integrations', iconName: 'Boxes' },
      { title: 'System Health', href: '/admin/health', iconName: 'Activity' },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { title: 'Admin Users', href: '/admin/users', iconName: 'UserCheck' },
      { title: 'Roles & Permissions', href: '/admin/roles', iconName: 'KeyRound' },
      { title: 'Audit Logs', href: '/admin/audit-logs', iconName: 'FileText' },
      { title: 'Security', href: '/admin/security', iconName: 'Shield' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { title: 'Platform Settings', href: '/admin/settings', iconName: 'Settings' },
      { title: 'Feature Flags', href: '/admin/feature-flags', iconName: 'Flag' },
      { title: 'Background Jobs', href: '/admin/jobs', iconName: 'Cpu' },
      { title: 'Maintenance', href: '/admin/maintenance', iconName: 'Wrench' },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { title: 'Revenue', href: '/admin/reports/revenue', iconName: 'BarChart2' },
      { title: 'Merchant Growth', href: '/admin/reports/growth', iconName: 'TrendingUp' },
      { title: 'System Reports', href: '/admin/reports/system', iconName: 'FileBarChart' },
    ],
  },
];
