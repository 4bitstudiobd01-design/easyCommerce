'use client';

import React, { useState } from 'react';
import { Activity, CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetMarketingLogsQuery, type MarketingLogsQuery } from '../api/marketingApi';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(iso).toLocaleDateString();
}

const EVENT_OPTIONS = ['', 'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];

export function MarketingEventLogPanel() {
  const [filters, setFilters] = useState<MarketingLogsQuery>({ page: 1, limit: 20 });
  const { data, isLoading, isFetching } = useGetMarketingLogsQuery(filters);

  const rows = data?.data ?? [];
  const meta = data?.meta;

  // A filter change resets to page 1; an explicit `page` in the patch is a paginate.
  const set = (patch: Partial<MarketingLogsQuery>) =>
    setFilters((f) => ({ ...f, ...patch, page: 'page' in patch ? patch.page : 1 }));

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Event Log</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Every browser + server-side pixel event, newest first.
          </p>
        </div>
        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <select
          value={filters.eventName ?? ''}
          onChange={(e) => set({ eventName: e.target.value || undefined })}
          className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          {EVENT_OPTIONS.map((e) => (
            <option key={e} value={e}>{e || 'All events'}</option>
          ))}
        </select>
        <select
          value={filters.transport ?? ''}
          onChange={(e) => set({ transport: (e.target.value || undefined) as MarketingLogsQuery['transport'] })}
          className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="">Any transport</option>
          <option value="BROWSER">Browser</option>
          <option value="SERVER">Server</option>
        </select>
        <select
          value={filters.status ?? ''}
          onChange={(e) => set({ status: (e.target.value || undefined) as MarketingLogsQuery['status'] })}
          className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="">Any status</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </select>
        <select
          value={filters.provider ?? ''}
          onChange={(e) => set({ provider: e.target.value || undefined })}
          className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none"
        >
          <option value="">Any provider</option>
          <option value="META">Meta</option>
          <option value="GOOGLE_ANALYTICS">GA4</option>
          <option value="GOOGLE_ADS">Google Ads</option>
          <option value="TIKTOK">TikTok</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 rounded-lg w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
            <Activity className="w-6 h-6 text-slate-300" />
            <p className="text-slate-500 font-medium text-xs">No events match these filters yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-500">
                <th className="py-2 px-3 font-bold">Event</th>
                <th className="py-2 px-3 font-bold">Pixel</th>
                <th className="py-2 px-3 font-bold">Transport</th>
                <th className="py-2 px-3 font-bold">Status</th>
                <th className="py-2 px-3 font-bold">Order / Ref</th>
                <th className="py-2 px-3 font-bold text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-bold text-slate-900">{log.eventName}</td>
                  <td className="py-2 px-3 text-slate-600">
                    {log.pixelLabel ?? log.provider ?? '—'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                        log.transport === 'SERVER'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {log.transport}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {log.status === 'SENT' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-red-600 font-bold text-[10px]"
                        title={log.errorMessage ?? undefined}
                      >
                        <XCircle className="w-3 h-3" /> Failed
                        {log.httpStatus ? ` (${log.httpStatus})` : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-500 font-medium">
                    {log.orderRef && log.orderRef !== '-' ? log.orderRef : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 font-medium">
                    {relTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} events
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={meta.page <= 1}
              onClick={() => set({ page: meta.page - 1 })}
              className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={meta.page >= meta.totalPages}
              onClick={() => set({ page: meta.page + 1 })}
              className="p-1 rounded border border-slate-200 disabled:opacity-30 hover:bg-slate-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
