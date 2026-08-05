'use client';

import React, { useMemo } from 'react';
import { WIDGET_REGISTRY, RegisteredWidget, WidgetCategory } from '../../config/dashboard.widgets';
import { DashboardSection } from '../layout/DashboardSection';
import { DashboardGrid } from '../layout/DashboardGrid';
import { WidgetBoundary } from '../../context/WidgetBoundary';

export interface DashboardRendererProps {
  userPermissions?: string[];
  enabledCategories?: WidgetCategory[];
  className?: string;
  registry?: Record<string, RegisteredWidget>;
  layoutId?: string;
  flattenLayout?: boolean;
}

const CATEGORY_SECTION_TITLES: Record<WidgetCategory, { title: string; subtitle?: string }> = {
  infrastructure: {
    title: 'Infrastructure & System Health',
    subtitle: 'Microservices telemetry, latency & uptime status',
  },
  financial: {
    title: 'Financial Growth & Revenue Metrics',
    subtitle: 'Gross merchandise volume & subscription MRR',
  },
  operations: {
    title: 'Tenants & Operations Breakdown',
    subtitle: 'Merchant accounts & store subdomains directory',
  },
  security: {
    title: 'Security & Audit Telemetry',
    subtitle: 'Access logs & administrative audit trails',
  },
  ai: {
    title: 'AI Usage & Automation Telemetry',
    subtitle: 'Token usage & assistant interactions',
  },
};

import {
  useGetDashboardSummaryQuery,
  useGetDashboardAnalyticsQuery,
  useGetDashboardOperationsQuery,
  useGetDashboardInfrastructureQuery,
} from '../../api/adminApi';

export function DashboardRenderer({
  userPermissions,
  enabledCategories,
  className = '',
  registry,
  layoutId,
  flattenLayout,
}: DashboardRendererProps) {
  // 1. Fetch Aggregator RTK Query Data
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useGetDashboardSummaryQuery();

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useGetDashboardAnalyticsQuery();

  const {
    data: operations,
    isLoading: isOperationsLoading,
    isError: isOperationsError,
    refetch: refetchOperations,
  } = useGetDashboardOperationsQuery();

  const {
    data: infra,
    isLoading: isInfraLoading,
    isError: isInfraError,
    refetch: refetchInfra,
  } = useGetDashboardInfrastructureQuery();

  // Filter and group widgets dynamically from the Widget Registry
  const groupedWidgets = useMemo(() => {
    const activeRegistry = registry || WIDGET_REGISTRY;
    const widgetsList = Object.values(activeRegistry);

    const filtered = widgetsList.filter((widget) => {
      if (!widget.isEnabled) return false;
      if (widget.visibility === 'hidden') return false;

      if (enabledCategories && !enabledCategories.includes(widget.category)) {
        return false;
      }

      if (userPermissions && widget.requiredPermissions.length > 0) {
        const hasPermission = widget.requiredPermissions.every((perm) =>
          userPermissions.includes(perm)
        );
        if (!hasPermission) return false;
      }

      return true;
    });

    filtered.sort((a, b) => a.defaultLayout.order - b.defaultLayout.order);

    const groups: Record<WidgetCategory, RegisteredWidget[]> = {
      infrastructure: [],
      financial: [],
      operations: [],
      security: [],
      ai: [],
    };

    filtered.forEach((widget) => {
      if (groups[widget.category]) {
        groups[widget.category].push(widget);
      }
    });

    return groups;
  }, [userPermissions, enabledCategories]);

  // Helper function to resolve dynamic RTK Query props per widget ID
  const getWidgetProps = (widgetId: string): Record<string, unknown> => {
    switch (widgetId) {
      case 'platform-health':
        return {
          status: infra?.overallStatus,
          statusLabel: infra?.overallLabel,
          services: infra?.microservices,
          isLoading: isInfraLoading,
          isError: isInfraError,
          onRefresh: refetchInfra,
        };
      case 'revenue-kpis':
        return {
          totalRevenueBdt: summary?.kpis?.totalRevenueBdt,
          totalRevenueGrowthPercent: summary?.kpis?.totalRevenueGrowthPercent,
          monthlyRevenueBdt: summary?.kpis?.monthlyRevenueBdt,
          monthlyRevenueGrowthPercent: summary?.kpis?.monthlyRevenueGrowthPercent,
          quarterlyGrowthPercent: summary?.kpis?.quarterlyGrowthPercent,
          isLoading: isSummaryLoading,
          isError: isSummaryError,
          onRefresh: refetchSummary,
        };
      case 'merchant-overview':
        return {
          totalMerchants: summary?.merchantSummary?.totalMerchants,
          activeMerchants: summary?.merchantSummary?.activeMerchants,
          newMerchantsThisMonth: summary?.merchantSummary?.newMerchantsThisMonth,
          suspendedMerchants: summary?.merchantSummary?.suspendedMerchants,
          isLoading: isSummaryLoading,
          isError: isSummaryError,
          onRefresh: refetchSummary,
        };
      case 'store-overview':
        return {
          totalStores: summary?.storeSummary?.totalStores,
          activeStores: summary?.storeSummary?.activeStores,
          trialStores: summary?.storeSummary?.trialStores,
          suspendedStores: summary?.storeSummary?.suspendedStores,
          isLoading: isSummaryLoading,
          isError: isSummaryError,
          onRefresh: refetchSummary,
        };
      case 'orders-overview':
        return {
          todayOrders: summary?.orderSummary?.todayOrders,
          pendingOrders: summary?.orderSummary?.pendingOrders,
          completedOrders: summary?.orderSummary?.completedOrders,
          cancelledOrders: summary?.orderSummary?.cancelledOrders,
          isLoading: isSummaryLoading,
          isError: isSummaryError,
          onRefresh: refetchSummary,
        };
      case 'revenue-trend-chart':
        return {
          data: analytics?.revenueTrend,
          isLoading: isAnalyticsLoading,
          isError: isAnalyticsError,
          onRefresh: refetchAnalytics,
        };
      case 'subscription-breakdown-chart':
        return {
          data: analytics?.subscriptionBreakdown,
          isLoading: isAnalyticsLoading,
          isError: isAnalyticsError,
          onRefresh: refetchAnalytics,
        };
      case 'merchant-growth-chart':
        return {
          data: analytics?.merchantGrowth,
          isLoading: isAnalyticsLoading,
          isError: isAnalyticsError,
          onRefresh: refetchAnalytics,
        };
      case 'orders-trend-chart':
        return {
          data: analytics?.ordersTrend,
          isLoading: isAnalyticsLoading,
          isError: isAnalyticsError,
          onRefresh: refetchAnalytics,
        };
      case 'payment-methods-chart':
        return {
          data: analytics?.paymentMethodsShare,
          isLoading: isAnalyticsLoading,
          isError: isAnalyticsError,
          onRefresh: refetchAnalytics,
        };
      case 'recent-activities':
        return {
          items: operations?.recentActivities,
          isLoading: isOperationsLoading,
          isError: isOperationsError,
          onRefresh: refetchOperations,
        };
      case 'notifications-widget':
        return {
          notifications: operations?.notifications,
          isLoading: isOperationsLoading,
          isError: isOperationsError,
          onRefresh: refetchOperations,
        };
      case 'top-merchants-widget':
        return {
          merchants: operations?.topMerchants,
          isLoading: isOperationsLoading,
          isError: isOperationsError,
          onRefresh: refetchOperations,
        };
      case 'top-products-widget':
        return {
          products: operations?.topProducts,
          isLoading: isOperationsLoading,
          isError: isOperationsError,
          onRefresh: refetchOperations,
        };
      default:
        return {};
    }
  };

  // Helper to map dynamic colSpan numbers to static Tailwind classes
  const getColSpanClasses = (colSpan: { sm: number; md: number; lg: number; xl: number }) => {
    const sm = {
      1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
      5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
      9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
    };
    const md = {
      1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
      5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
      9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
    };
    const lg = {
      1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
      5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
      9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
    };
    const xl = {
      1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4',
      5: 'xl:col-span-5', 6: 'xl:col-span-6', 7: 'xl:col-span-7', 8: 'xl:col-span-8',
      9: 'xl:col-span-9', 10: 'xl:col-span-10', 11: 'xl:col-span-11', 12: 'xl:col-span-12',
    };

    return [
      sm[(colSpan.sm as keyof typeof sm) || 12],
      md[(colSpan.md as keyof typeof md) || 12],
      lg[(colSpan.lg as keyof typeof lg) || 12],
      xl[(colSpan.xl as keyof typeof xl) || 12],
    ].join(' ');
  };

  if (flattenLayout) {
    const flatWidgets = (Object.values(groupedWidgets) as RegisteredWidget[][])
      .flat()
      .sort((a, b) => a.defaultLayout.order - b.defaultLayout.order);

    return (
      <div className={`space-y-4 ${className}`}>
        <DashboardGrid className="!gap-3">
          {flatWidgets.map((widget) => {
            const WidgetComponent = widget.component;
            const colSpanClass = getColSpanClasses(widget.defaultLayout.colSpan);
            const widgetProps = getWidgetProps(widget.id);

            return (
              <div key={widget.id} className={colSpanClass}>
                <WidgetBoundary widgetId={widget.id}>
                  <WidgetComponent {...widgetProps} />
                </WidgetBoundary>
              </div>
            );
          })}
        </DashboardGrid>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {(Object.keys(groupedWidgets) as WidgetCategory[]).map((category) => {
        const widgetsInCategory = groupedWidgets[category];
        if (widgetsInCategory.length === 0) return null;

        const sectionInfo = CATEGORY_SECTION_TITLES[category];

        return (
          <DashboardSection
            key={category}
            title={sectionInfo.title}
            subtitle={sectionInfo.subtitle}
            collapsible
          >
            <DashboardGrid>
              {widgetsInCategory.map((widget) => {
                const WidgetComponent = widget.component;
                const colSpanClass = getColSpanClasses(widget.defaultLayout.colSpan);
                const widgetProps = getWidgetProps(widget.id);

                return (
                  <div key={widget.id} className={colSpanClass}>
                    <WidgetBoundary widgetId={widget.id}>
                      <WidgetComponent {...widgetProps} />
                    </WidgetBoundary>
                  </div>
                );
              })}
            </DashboardGrid>
          </DashboardSection>
        );
      })}
    </div>
  );
}
