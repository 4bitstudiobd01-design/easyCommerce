import React from 'react';
import { OrderDetails } from '@/features/order/components/OrderDetails';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Details | BitCommerce',
  description: 'View order details, status, and fulfillment information.',
};

interface OrderDetailsPageProps {
  params: {
    orderId: string;
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      <OrderDetails orderId={params.orderId} />
    </div>
  );
}
