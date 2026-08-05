import React from 'react';
import { DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { MetricCard } from '@/features/admin/components/core/MetricCard';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';

export function MerchantRevenueKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: orders = [], isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  
  const totalSales = orders.reduce((acc, order) => acc + Number(order.grandTotal), 0);
  const isLoading = isStoreLoading || isOrdersLoading;

  return (
    <MetricCard
      label="Total Sales"
      value={`৳${totalSales.toLocaleString()}`}
      subtitle={`Currency: ${store?.currency || 'BDT (৳)'}`}
      icon={DollarSign}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      trendPercent={12.5}
      trendLabel="vs last week"
      compact={true}
    />
  );
}

export function MerchantOrdersKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: orders = [], isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  
  const isLoading = isStoreLoading || isOrdersLoading;

  return (
    <MetricCard
      label="Total Orders"
      value={orders.length}
      subtitle="Completed & pending purchases"
      icon={ShoppingCart}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      trendPercent={8.2}
      trendLabel="vs last week"
      compact={true}
    />
  );
}

export function MerchantProductsKpiWidget() {
  const { data: store, isLoading: isStoreLoading } = useGetMyStoreQuery();
  const { data: products = [], isLoading: isProductsLoading } = useGetProductsQuery(undefined, { skip: !store });
  
  const isLoading = isStoreLoading || isProductsLoading;

  return (
    <MetricCard
      label="Active Products"
      value={products.length}
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
  const { data: orders = [], isLoading: isOrdersLoading } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  
  const activeCustomersCount = orders.length > 0 ? new Set(orders.map(o => o.customerPhone)).size : 0;
  const isLoading = isStoreLoading || isOrdersLoading;

  return (
    <MetricCard
      label="Store Customers"
      value={activeCustomersCount}
      subtitle="Row-level security context"
      icon={Users}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      trendPercent={18.4}
      trendLabel="vs last week"
      compact={true}
    />
  );
}
