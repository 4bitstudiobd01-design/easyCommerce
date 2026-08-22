'use client';

import React, { useState } from 'react';
import { OrderListTable } from '@/features/order/components/OrderListTable';
import { SendCourierModal } from '@/features/order/components/SendCourierModal';
import { Order } from '@/features/order/api/orderApi';

export default function OrdersPage() {
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);

  return (
    <>
      <OrderListTable
        onDispatchCourierClick={(order) => setCourierOrder(order)}
      />

      {courierOrder && (
        <SendCourierModal order={courierOrder} onClose={() => setCourierOrder(null)} />
      )}
    </>
  );
}
