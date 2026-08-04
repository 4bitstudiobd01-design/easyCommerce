'use client';

import React, { useState } from 'react';
import { OrderListTable } from '@/features/order/components/OrderListTable';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';

import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();

  const handleOpenCourierModal = (order: Order) => {
    router.push(`/dashboard/orders/${order.id}/book-courier`);
  };

  return (
    <>
      <OrderListTable
        onDispatchCourierClick={(order) => handleOpenCourierModal(order)}
      />
    </>
  );
}
