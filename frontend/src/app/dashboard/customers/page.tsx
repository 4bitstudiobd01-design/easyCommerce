'use client';

import { useGetMyStoreQuery } from '@/features/tenant/api/tenantApi';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  const { data: store } = useGetMyStoreQuery();
  const { data: response } = useGetMerchantOrdersQuery(undefined, { skip: !store });
  const orders = response?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Customers Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Row-level isolated customer profiles for {store?.name}.</p>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">No Customers Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            As buyers place orders on your storefront, their customer profiles will be saved here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h3 className="font-bold text-base text-slate-900 mb-4">Customer Directory</h3>
          <div className="divide-y divide-slate-100">
            {Array.from(new Set(orders.map((o) => o.customerPhone))).map((phone) => {
              const custOrder = orders.find((o) => o.customerPhone === phone);
              return (
                <div key={phone} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{custOrder?.customerName}</span>
                    <span className="text-xs text-slate-500">{phone} • {custOrder?.shippingAddress}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                    Active Buyer
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
