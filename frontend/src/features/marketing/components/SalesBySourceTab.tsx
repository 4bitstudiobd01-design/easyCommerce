'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Radar, ArrowUpRight, Settings2, CheckCircle2, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChannelBadge } from '@/features/order/utils/channelBadge';
import {
  useGetSourceSalesQuery,
  dimensionForGroupBy,
  type SourceSalesGroupBy,
  type SourceSalesRow,
} from '../api/marketingApi';
import { ManageSpendDrawer } from './ManageSpendDrawer';
import { MarketingEventLogPanel } from './MarketingEventLogPanel';

const GROUP_TABS: { key: SourceSalesGroupBy; label: string }[] = [
  { key: 'channel', label: 'By Channel' },
  { key: 'source', label: 'By Source' },
  { key: 'campaign', label: 'By Campaign' },
];

const RANGE_OPTIONS: { key: string; label: string; days: number }[] = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: 'all', label: 'All Time', days: 3650 },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtMoney(n: number, currency?: string | null): string {
  const c = currency || 'BDT';
  return `${c} ${Math.round(n).toLocaleString('en-US')}`;
}

export function SalesBySourceTab() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<SourceSalesGroupBy>('channel');
  const [rangeKey, setRangeKey] = useState('30d');
  const [manageRow, setManageRow] = useState<SourceSalesRow | null>(null);

  const { dateFrom, dateTo } = useMemo(() => {
    const range = RANGE_OPTIONS.find((r) => r.key === rangeKey) || RANGE_OPTIONS[1];
    const to = new Date();
    const from =
      range.key === 'all'
        ? new Date('2020-01-01T00:00:00.000Z')
        : new Date(to.getTime() - (range.days - 1) * 24 * 60 * 60 * 1000);
    return { dateFrom: isoDate(from), dateTo: isoDate(to) };
  }, [rangeKey]);

  const { data: report, isLoading, isFetching } = useGetSourceSalesQuery({ groupBy, dateFrom, dateTo });
  const rows = report?.rows;
  const deliveryHealth = report?.deliveryHealth ?? [];

  // Drill into the merchant order list, filtered by this row's attribution value.
  const openOrdersFor = (row: SourceSalesRow) => {
    const param =
      groupBy === 'channel' ? 'channel' : groupBy === 'source' ? 'utmSource' : 'utmCampaign';
    router.push(`/dashboard/orders?${param}=${encodeURIComponent(row.dimensionValue)}`);
  };

  const dimensionLabel =
    groupBy === 'channel' ? 'Channel' : groupBy === 'source' ? 'Source' : 'Campaign';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Sales by Source</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Which channel / source / campaign your orders and revenue came from — record monthly ad spend to see ROAS.
          </p>
        </div>
        <select
          value={rangeKey}
          onChange={(e) => setRangeKey(e.target.value)}
          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {RANGE_OPTIONS.map((r) => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Dimension tabs */}
      <div className="px-4 pt-3 flex items-center gap-1.5 border-b border-slate-100">
        {GROUP_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setGroupBy(t.key)}
            className={`px-3 py-2 text-xs font-bold rounded-t-lg transition-colors ${
              groupBy === t.key
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-[1px]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 ml-2" />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg w-full" />
            ))}
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 text-center p-10">
            <Radar className="w-6 h-6 text-slate-300" />
            <p className="text-slate-500 font-medium text-xs">
              No visit or order data in this range yet.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-[13px] border-collapse min-w-[920px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-900">
                <th className="py-2.5 px-4 font-bold">{dimensionLabel}</th>
                <th className="py-2.5 px-4 font-bold text-right">Sessions</th>
                <th className="py-2.5 px-4 font-bold text-right">Orders</th>
                <th className="py-2.5 px-4 font-bold text-right">Revenue</th>
                <th className="py-2.5 px-4 font-bold text-right">Conv. Rate</th>
                <th className="py-2.5 px-4 font-bold text-right">Ad Spend</th>
                <th className="py-2.5 px-4 font-bold text-right">ROAS</th>
                <th className="py-2.5 px-4 font-bold text-right">CPA</th>
                <th className="py-2.5 px-4 font-bold text-right w-12" aria-label="Orders" />
              </tr>
            </thead>
            <tbody className="text-xs">
              {rows.map((row, idx) => (
                <tr
                  key={row.dimensionValue}
                  className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                    idx === rows.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-2.5 px-4">
                    {groupBy === 'channel' ? (
                      <ChannelBadge channel={row.dimensionValue} />
                    ) : groupBy === 'source' ? (
                      <ChannelBadge utmSource={row.dimensionValue} />
                    ) : (
                      <span className="font-bold text-slate-900">{row.dimensionValue}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                    {row.sessions.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                    {row.orders.toLocaleString('en-US')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                    {fmtMoney(row.revenue, row.currency)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                    {row.conversionRate}%
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setManageRow(row)}
                      className="group inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-blue-600"
                      title="Record / edit monthly ad spend"
                    >
                      {row.spend > 0 ? (
                        fmtMoney(row.spend, row.currency)
                      ) : (
                        <span className="text-slate-400">Add spend</span>
                      )}
                      <Settings2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {row.roas != null ? (
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded border text-[11px] ${
                          row.roas >= 1
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                            : 'text-red-600 bg-red-50 border-red-100'
                        }`}
                      >
                        {row.roas.toFixed(2)}x
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-slate-600">
                    {row.cpa != null ? fmtMoney(row.cpa, row.currency) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openOrdersFor(row)}
                      title={`View ${row.orders} order${row.orders === 1 ? '' : 's'} from ${row.dimensionValue}`}
                      disabled={row.orders === 0}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Per-pixel server-side Purchase delivery health */}
      {deliveryHealth.length > 0 && (
        <div className="border-t border-slate-100 p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Server-side Purchase delivery ({RANGE_OPTIONS.find((r) => r.key === rangeKey)?.label})
          </p>
          <div className="flex flex-wrap gap-2">
            {deliveryHealth.map((h) => (
              <div
                key={h.pixelId}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px]"
              >
                <span className="font-bold text-slate-800">{h.label ?? h.provider}</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  {h.purchaseSent}
                </span>
                {h.purchaseFailed > 0 && (
                  <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                    <XCircle className="w-3 h-3" />
                    {h.purchaseFailed}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event log */}
      <div className="border-t border-slate-100">
        <MarketingEventLogPanel />
      </div>

      {manageRow && (
        <ManageSpendDrawer
          isOpen
          onClose={() => setManageRow(null)}
          dimension={dimensionForGroupBy(groupBy)}
          dimensionValue={manageRow.dimensionValue}
          displayLabel={manageRow.dimensionValue}
        />
      )}
    </div>
  );
}
