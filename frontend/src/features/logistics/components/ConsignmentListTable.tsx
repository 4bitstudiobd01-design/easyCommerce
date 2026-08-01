'use client';

import React from 'react';
import { useGetMerchantConsignmentsQuery } from '../api/logisticsApi';
import { Truck, Phone, MapPin, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export function ConsignmentListTable() {
  const { data: consignments = [], isLoading, refetch } = useGetMerchantConsignmentsQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-3 w-32 bg-slate-200 animate-pulse rounded-lg" />
          </div>
          <div className="h-8 w-24 bg-slate-200 animate-pulse rounded-xl" />
        </div>
        <table className="w-full text-left text-xs">
          <tbody>
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
            <TableRowSkeleton columns={6} />
          </tbody>
        </table>
      </div>
    );
  }

  if (consignments.length === 0) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-6">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <Truck className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-base text-slate-900">No Courier Parcels Dispatched Yet</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Go to your Orders & Sales tab and click "Dispatch Courier" to send parcels via Steadfast or Pathao Express.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-slate-900">Logistics & Dispatched Consignments</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {consignments.length} parcels dispatched to Bangladeshi courier services
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
        >
          Refresh Parcels
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Tracking Waybill</th>
              <th className="px-6 py-3.5">Courier Partner</th>
              <th className="px-6 py-3.5">Recipient Details</th>
              <th className="px-6 py-3.5">COD Amount (৳)</th>
              <th className="px-6 py-3.5">Shipment Status</th>
              <th className="px-6 py-3.5 text-right">Dispatched Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {consignments.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Tracking Code */}
                <td className="px-6 py-4">
                  <div>
                    <span className="font-mono font-bold text-blue-600 text-sm block">
                      {item.trackingCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Order #{item.orderNumber}
                    </span>
                  </div>
                </td>

                {/* Courier Provider Tag */}
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 font-bold text-[10px] rounded-lg border inline-flex items-center gap-1 ${
                      item.courierProvider === 'PATHAO'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    <span>{item.courierProvider}</span>
                  </span>
                </td>

                {/* Recipient Details */}
                <td className="px-6 py-4">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      {item.recipientName}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{item.recipientPhone}</span>
                    </span>
                  </div>
                </td>

                {/* COD Amount */}
                <td className="px-6 py-4">
                  <span className="font-extrabold text-slate-900 text-sm block">
                    ৳{Number(item.codAmount).toLocaleString()}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    <span>{item.status}</span>
                  </span>
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-right text-slate-400 text-[11px]">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
