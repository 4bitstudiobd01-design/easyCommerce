'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ExternalLink, AlertTriangle, Store as StoreIcon, Power } from 'lucide-react';
import { useGetAllStoresQuery, useToggleStoreStatusMutation } from '@/features/admin/api/adminApi';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function AdminStoresPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: stores = [], isLoading: isStoresLoading, refetch: refetchStores } = useGetAllStoresQuery();
  const [toggleStatus, { isLoading: isToggling }] = useToggleStoreStatusMutation();

  const handleToggleStatus = async (storeId: string) => {
    try {
      await toggleStatus(storeId).unwrap();
      toast.success('Store status toggled successfully.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to toggle store active status.');
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0 animate-in fade-in duration-200">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">Merchant Stores Directory</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {filteredStores.length} stores registered on the platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store, slug, owner..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            onClick={() => refetchStores()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Store & Subdomain</th>
              <th className="px-6 py-3.5">Merchant Owner</th>
              <th className="px-6 py-3.5">Sales Revenue (৳)</th>
              <th className="px-6 py-3.5">Orders Count</th>
              <th className="px-6 py-3.5">Active Status</th>
              <th className="px-6 py-3.5 text-right">Super-Admin Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {isStoresLoading ? (
              <TableRowSkeleton columns={6} />
            ) : filteredStores.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No stores found matching your query.
                </td>
              </tr>
            ) : (
              filteredStores.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                        {item.name ? item.name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 block">
                          {item.name}
                        </span>
                        <a
                          href={`/store/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{item.slug}.bitcommerce.app</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-slate-900 block">{item.ownerName}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.ownerEmail}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-extrabold text-emerald-600 text-sm block">
                      ৳{item.totalRevenue.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {item.ordersCount} orders
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {item.isActive ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold text-[10px] rounded-full border border-red-200 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>SUSPENDED</span>
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/dashboard`}
                        target="_blank"
                        className="px-3 py-1.5 font-bold text-xs bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl transition-all inline-flex items-center gap-1.5"
                        title="Inspect Merchant Dashboard View"
                      >
                        <StoreIcon className="w-3.5 h-3.5" />
                        <span>Merchant View</span>
                      </Link>

                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        disabled={isToggling}
                        className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all inline-flex items-center gap-1.5 ${
                          item.isActive
                            ? 'bg-red-50 hover:bg-red-600 hover:text-white text-red-700 border-red-200'
                            : 'bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{item.isActive ? 'Suspend Store' : 'Activate Store'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
