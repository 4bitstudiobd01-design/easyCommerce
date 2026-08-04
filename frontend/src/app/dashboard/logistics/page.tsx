'use client';

import { ConsignmentListTable } from '@/features/logistics/components/ConsignmentListTable';
import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';

export default function LogisticsPage() {
  const { data: store } = useGetMyStoreQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Logistics & Parcel Shipments</h1>
        <p className="text-xs text-slate-500 mt-1">Manage Steadfast & Pathao courier parcel bookings, waybill tracking, and COD collections for {store?.name}.</p>
      </div>

      <ConsignmentListTable />
    </div>
  );
}
