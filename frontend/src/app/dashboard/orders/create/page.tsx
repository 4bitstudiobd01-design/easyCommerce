import { Metadata } from 'next';
import { CreateOrderPage } from '@/features/order/components/CreateOrderPage';

export const metadata: Metadata = {
  title: 'Create Order | BitCommerce',
  description: 'Manually create a new order for a customer',
};

export default function Page() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <CreateOrderPage />
    </div>
  );
}
