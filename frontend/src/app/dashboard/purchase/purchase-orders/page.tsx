import { redirect } from 'next/navigation';

export default function PurchaseOrdersPage() {
  redirect('/dashboard/purchase?tab=purchase-orders');
}
