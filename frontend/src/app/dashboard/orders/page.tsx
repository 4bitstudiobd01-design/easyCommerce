'use client';

import React, { useState } from 'react';
import { OrderListTable } from '@/features/order/components/OrderListTable';
import { BookCourierModal } from '@/features/logistics/components/BookCourierModal';
import { useGetMerchantOrdersQuery, Order } from '@/features/order/api/orderApi';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';

export default function OrdersPage() {
  const { data: store } = useGetMyStoreQuery();
  const { refetch: refetchOrders } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState<Order | null>(null);
  const [isBookCourierModalOpen, setIsBookCourierModalOpen] = useState(false);

  const handleOpenCourierModal = (order: Order) => {
    setSelectedOrderForCourier(order);
    setIsBookCourierModalOpen(true);
  };

  return (
    <>
      <BookCourierModal
        order={selectedOrderForCourier}
        isOpen={isBookCourierModalOpen}
        onClose={() => setIsBookCourierModalOpen(false)}
        onSuccess={() => refetchOrders()}
      />
      <OrderListTable
        onDispatchCourierClick={(order) => handleOpenCourierModal(order)}
      />
    </>
  );
}
