import React from 'react';
import { WidgetCategory, RefreshStrategy, WidgetLayoutConfig, RegisteredWidget } from '@/features/admin/config/dashboard.widgets';

// Lazy loaded widgets
const MerchantRevenueKpiWidget = React.lazy(() => import('../components/widgets/MerchantKpiWidgets').then(m => ({ default: m.MerchantRevenueKpiWidget })));
const MerchantOrdersKpiWidget = React.lazy(() => import('../components/widgets/MerchantKpiWidgets').then(m => ({ default: m.MerchantOrdersKpiWidget })));
const MerchantProductsKpiWidget = React.lazy(() => import('../components/widgets/MerchantKpiWidgets').then(m => ({ default: m.MerchantProductsKpiWidget })));
const MerchantCustomersKpiWidget = React.lazy(() => import('../components/widgets/MerchantKpiWidgets').then(m => ({ default: m.MerchantCustomersKpiWidget })));
const StoreHealthWidget = React.lazy(() => import('../components/widgets/StoreHealthWidget').then(m => ({ default: m.StoreHealthWidget })));
const ActionCenterWidget = React.lazy(() => import('../components/widgets/ActionCenterWidget').then(m => ({ default: m.ActionCenterWidget })));
const InventoryAlertsWidget = React.lazy(() => import('../components/widgets/InventoryAlertsWidget').then(m => ({ default: m.InventoryAlertsWidget })));
const MerchantQuickActionsWidget = React.lazy(() => import('../components/widgets/MerchantQuickActionsWidget').then(m => ({ default: m.MerchantQuickActionsWidget })));
const RecentBusinessActivityWidget = React.lazy(() => import('../components/widgets/RecentBusinessActivityWidget').then(m => ({ default: m.RecentBusinessActivityWidget })));
const AnnouncementsWidget = React.lazy(() => import('../components/widgets/AnnouncementsWidget').then(m => ({ default: m.AnnouncementsWidget })));
const MerchantRevenueChartWidget = React.lazy(() => import('../components/widgets/MerchantChartWidgets').then(m => ({ default: m.MerchantRevenueChartWidget })));
const MerchantTopProductsWidget = React.lazy(() => import('../components/widgets/MerchantChartWidgets').then(m => ({ default: m.MerchantTopProductsWidget })));

const baseLayout = {
  rowSpan: 1,
  minWidthSpan: 1,
  minHeightPx: 100,
};

const baseWidgetSettings = {
  requiredPermissions: [],
  visibility: 'visible' as const,
  isEnabled: true,
  isPinned: true,
  isCollapsible: false,
  isResizable: false,
  isMovable: false,
  isLazy: true,
  refreshStrategy: 'none' as RefreshStrategy,
};

export const MERCHANT_WIDGET_REGISTRY: Record<string, RegisteredWidget> = {
  // Row 1: KPI Cards
  'merchant-revenue-kpi': {
    ...baseWidgetSettings,
    id: 'merchant-revenue-kpi',
    name: 'Total Sales',
    description: 'Total revenue KPI',
    category: 'financial',
    component: MerchantRevenueKpiWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 6, lg: 3, xl: 3 }, order: 1 },
  },
  'merchant-orders-kpi': {
    ...baseWidgetSettings,
    id: 'merchant-orders-kpi',
    name: 'Total Orders',
    description: 'Total orders KPI',
    category: 'operations',
    component: MerchantOrdersKpiWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 6, lg: 3, xl: 3 }, order: 2 },
  },
  'merchant-products-kpi': {
    ...baseWidgetSettings,
    id: 'merchant-products-kpi',
    name: 'Active Products',
    description: 'Active products KPI',
    category: 'operations',
    component: MerchantProductsKpiWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 6, lg: 3, xl: 3 }, order: 3 },
  },
  'merchant-customers-kpi': {
    ...baseWidgetSettings,
    id: 'merchant-customers-kpi',
    name: 'Store Customers',
    description: 'Store customers KPI',
    category: 'operations',
    component: MerchantCustomersKpiWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 6, lg: 3, xl: 3 }, order: 4 },
  },

  // Row 2: Health & Actions
  'action-center': {
    ...baseWidgetSettings,
    id: 'action-center',
    name: 'Action Center',
    description: 'Today\'s action center',
    category: 'operations',
    component: ActionCenterWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 8, xl: 8 }, order: 5 },
  },
  'quick-actions': {
    ...baseWidgetSettings,
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Frequently used tools',
    category: 'operations',
    component: MerchantQuickActionsWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 4, xl: 4 }, order: 6 },
  },

  // Row 3: Analytics
  'revenue-chart': {
    ...baseWidgetSettings,
    id: 'revenue-chart',
    name: 'Revenue Chart',
    description: '7-day revenue trend',
    category: 'financial',
    component: MerchantRevenueChartWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 8, xl: 8 }, order: 7 },
  },
  'store-health': {
    ...baseWidgetSettings,
    id: 'store-health',
    name: 'Store Health',
    description: 'Operational readiness checklist',
    category: 'operations',
    component: StoreHealthWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 4, xl: 4 }, order: 8 },
  },

  // Row 4: Operations & Activity
  'inventory-alerts': {
    ...baseWidgetSettings,
    id: 'inventory-alerts',
    name: 'Inventory Alerts',
    description: 'Low stock and out of stock alerts',
    category: 'operations',
    component: InventoryAlertsWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 9 },
  },
  'recent-activity': {
    ...baseWidgetSettings,
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Recent business activity',
    category: 'operations',
    component: RecentBusinessActivityWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 10 },
  },

  // Row 5: Quick Actions & Announcements
  'top-products': {
    ...baseWidgetSettings,
    id: 'top-products',
    name: 'Top Products',
    description: 'Top selling products',
    category: 'operations',
    component: MerchantTopProductsWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 11 },
  },
  'announcements': {
    ...baseWidgetSettings,
    id: 'announcements',
    name: 'Announcements',
    description: 'Platform announcements',
    category: 'operations',
    component: AnnouncementsWidget,
    defaultLayout: { ...baseLayout, colSpan: { sm: 12, md: 12, lg: 6, xl: 6 }, order: 12 },
  },
};
