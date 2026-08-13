import React from 'react';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { MetricCard } from '@/features/admin/components/core/MetricCard';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function weekOverWeekTrend(orders: Order[], valueFn: (o: Order) => number): number | undefined {
  if (orders.length === 0) return undefined;

  const now = Date.now();
  const thisWeekStart = now - ONE_WEEK_MS;
  const lastWeekStart = now - 2 * ONE_WEEK_MS;

  let thisWeek = 0;
  let lastWeek = 0;

  for (const order of orders) {
    const createdAt = new Date(order.createdAt).getTime();
    if (createdAt >= thisWeekStart) {
      thisWeek += valueFn(order);
    } else if (createdAt >= lastWeekStart) {
      lastWeek += valueFn(order);
    }
  }

  if (lastWeek <= 0) return thisWeek > 0 ? 100 : undefined;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 1000) / 10;
}

export function MerchantRevenueKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: response, isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const orders = response?.data || [];

  const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
  const isLoading = isStoreLoading || isOrdersLoading;
  const trendPercent = weekOverWeekTrend(orders, (o) => Number(o.grandTotal));

  return (
    <MetricCard
      label="Total Sales"
      value={`৳${totalSales.toLocaleString()}`}
      subtitle={`Currency: ${store?.currency || 'BDT (৳)'}`}
      icon={DollarSign}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      trendPercent={trendPercent}
      trendLabel="vs last week"
      compact={true}
    />
  );
}

export function MerchantOrdersKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: response, isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const orders = response?.data || [];

  const isLoading = isStoreLoading || isOrdersLoading;
  const trendPercent = weekOverWeekTrend(orders, () => 1);

  return (
    <MetricCard
      label="Total Orders"
      value={orders.length}
      subtitle="Completed & pending purchases"
      icon={ShoppingCart}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      trendPercent={trendPercent}
      trendLabel="vs last week"
      compact={true}
    />
  );
}

export function MerchantProductsKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: productRes, isLoading: isProductsLoading } = useGetProductsQuery(undefined, { skip: !store });
  const totalCount = productRes?.meta?.total ?? (productRes?.data?.length || 0);

  const isLoading = isStoreLoading || isProductsLoading;

  return (
    <MetricCard
      label="Active Products"
      value={totalCount}
      subtitle="Decoupled stock modeling"
      icon={Package}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      compact={true}
    />
  );
}

export function MerchantCustomersKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: response, isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const orders = response?.data || [];

  const activeCustomersCount = orders.length > 0 ? new Set(orders.map(o => o.customerPhone)).size : 0;
  const isLoading = isStoreLoading || isOrdersLoading;

  return (
    <MetricCard
      label="Store Customers"
      value={activeCustomersCount}
      subtitle="Unique customers who have ordered"
      icon={Users}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      compact={true}
    />
  );
}
