import React from 'react';

export type RefreshStrategy = 'poll' | 'sse' | 'manual' | 'none';
export type WidgetCategory = 'financial' | 'operations' | 'infrastructure' | 'security' | 'ai';

export interface ResponsiveBreakpointSpan {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface WidgetLayoutConfig {
  colSpan: ResponsiveBreakpointSpan;
  rowSpan?: number;
  minWidthSpan?: number;
  minHeightPx?: number;
  order: number;
}

export interface RegisteredWidget<TProps extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  category: WidgetCategory;
  component: React.LazyExoticComponent<React.ComponentType<TProps>>;
  requiredPermissions: string[];
  featureFlag?: string;
  visibility: 'visible' | 'hidden' | 'permission_gated';
  isEnabled: boolean;
  isPinned: boolean;
  isCollapsible: boolean;
  isResizable: boolean;
  isMovable: boolean;
  isLazy: boolean;
  refreshStrategy: RefreshStrategy;
  refreshIntervalMs?: number;
  defaultLayout: WidgetLayoutConfig;
}

// Widget Registry Data Map
export const WIDGET_REGISTRY: Record<string, RegisteredWidget> = {
  'platform-health': {
    id: 'platform-health',
    name: 'Platform Health & Status',
    description: 'System uptime, API P99 latency, DB connection telemetry',
    category: 'infrastructure',
    component: React.lazy(() =>
      import('../components/widgets/PlatformHealthWidget').then((module) => ({
        default: module.PlatformHealthWidget,
      }))
    ),
    requiredPermissions: ['admin.infrastructure.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: true,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 10000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 12, xl: 12 }, order: 1 },
  },
  'revenue-kpis': {
    id: 'revenue-kpis',
    name: 'Revenue & Financial KPIs',
    description: 'Platform Gross Merchandise Value (GMV) and MRR',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/widgets/RevenueKpiWidget').then((module) => ({
        default: module.RevenueKpiWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: true,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 30000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 12, xl: 12 }, order: 2 },
  },
  'merchant-overview': {
    id: 'merchant-overview',
    name: 'Registered Merchant Overview',
    description: 'Total active vs suspended merchant accounts',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/widgets/MerchantOverviewWidget').then((module) => ({
        default: module.MerchantOverviewWidget,
      }))
    ),
    requiredPermissions: ['admin.stores.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 30000,
    defaultLayout: { colSpan: { sm: 12, md: 6, lg: 6, xl: 6 }, order: 3 },
  },
  'store-overview': {
    id: 'store-overview',
    name: 'Tenant Stores Overview',
    description: 'Total active store subdomains registered',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/widgets/StoreOverviewWidget').then((module) => ({
        default: module.StoreOverviewWidget,
      }))
    ),
    requiredPermissions: ['admin.stores.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 30000,
    defaultLayout: { colSpan: { sm: 12, md: 6, lg: 6, xl: 6 }, order: 4 },
  },
  'orders-overview': {
    id: 'orders-overview',
    name: 'System Purchases Overview',
    description: 'Cross-tenant customer purchase volume',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/widgets/OrdersOverviewWidget').then((module) => ({
        default: module.OrdersOverviewWidget,
      }))
    ),
    requiredPermissions: ['admin.orders.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 30000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 12, xl: 12 }, order: 5 },
  },
  'revenue-trend-chart': {
    id: 'revenue-trend-chart',
    name: 'Revenue Trend Chart',
    description: 'Time-series GMV performance curve',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/charts/RevenueTrendChartWidget').then((module) => ({
        default: module.RevenueTrendChartWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 8, xl: 8 }, order: 6 },
  },
  'subscription-breakdown-chart': {
    id: 'subscription-breakdown-chart',
    name: 'SaaS Subscription Breakdown',
    description: 'Distribution of merchant plan tiers',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/charts/SubscriptionBreakdownChartWidget').then((module) => ({
        default: module.SubscriptionBreakdownChartWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 4, xl: 4 }, order: 7 },
  },
  'merchant-growth-chart': {
    id: 'merchant-growth-chart',
    name: 'Merchant Growth Velocity',
    description: 'Cumulative merchant onboarding trend',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/charts/MerchantGrowthChartWidget').then((module) => ({
        default: module.MerchantGrowthChartWidget,
      }))
    ),
    requiredPermissions: ['admin.stores.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 8 },
  },
  'orders-trend-chart': {
    id: 'orders-trend-chart',
    name: 'Orders Trend Velocity',
    description: 'Daily order volume distribution bar chart',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/charts/OrdersTrendChartWidget').then((module) => ({
        default: module.OrdersTrendChartWidget,
      }))
    ),
    requiredPermissions: ['admin.orders.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 9 },
  },
  'payment-methods-chart': {
    id: 'payment-methods-chart',
    name: 'Payment Methods Share',
    description: 'Gateway ratio breakdown donut chart',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/charts/PaymentMethodsChartWidget').then((module) => ({
        default: module.PaymentMethodsChartWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 12, xl: 12 }, order: 10 },
  },
  'recent-activities': {
    id: 'recent-activities',
    name: 'Recent Platform Activity Stream',
    description: 'Realtime log of administrative and store events',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/widgets/RecentActivitiesWidget').then((module) => ({
        default: module.RecentActivitiesWidget,
      }))
    ),
    requiredPermissions: ['admin.audit.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 15000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 11 },
  },
  'notifications-widget': {
    id: 'notifications-widget',
    name: 'Platform Notifications & Alerts',
    description: 'System notices, gateway warnings and security alerts',
    category: 'security',
    component: React.lazy(() =>
      import('../components/widgets/NotificationsWidget').then((module) => ({
        default: module.NotificationsWidget,
      }))
    ),
    requiredPermissions: [],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'poll',
    refreshIntervalMs: 15000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 12 },
  },
  'quick-actions-widget': {
    id: 'quick-actions-widget',
    name: 'Platform Operations Shortcuts',
    description: 'Frequently executed administrative controls',
    category: 'operations',
    component: React.lazy(() =>
      import('../components/widgets/QuickActionsWidget').then((module) => ({
        default: module.QuickActionsWidget,
      }))
    ),
    requiredPermissions: ['admin.stores.manage'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: false,
    refreshStrategy: 'none',
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 13 },
  },
  'top-merchants-widget': {
    id: 'top-merchants-widget',
    name: 'Top Performing Merchants',
    description: 'Highest revenue generating tenant stores',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/widgets/TopMerchantsWidget').then((module) => ({
        default: module.TopMerchantsWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 14 },
  },
  'top-products-widget': {
    id: 'top-products-widget',
    name: 'Top Selling Products Platform-Wide',
    description: 'Highest revenue catalog items across all stores',
    category: 'financial',
    component: React.lazy(() =>
      import('../components/widgets/TopProductsWidget').then((module) => ({
        default: module.TopProductsWidget,
      }))
    ),
    requiredPermissions: ['admin.finance.read'],
    visibility: 'visible',
    isEnabled: true,
    isPinned: false,
    isCollapsible: true,
    isResizable: false,
    isMovable: true,
    isLazy: true,
    refreshStrategy: 'poll',
    refreshIntervalMs: 60000,
    defaultLayout: { colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 15 },
  },
};
