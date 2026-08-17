import { Metadata } from 'next';
import { EditOrderPage } from '@/features/order/components/EditOrderPage';

export const metadata: Metadata = {
  title: 'Edit Order | BitCommerce',
  description: 'Modify an existing order',
};

export default function Page({ params }: { params: { orderId: string } }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <EditOrderPage orderId={params.orderId} />
    </div>
  );
}
