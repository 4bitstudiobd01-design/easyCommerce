'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  RotateCw,
  Search,
  ChevronDown,
  ChevronRight,
  Info,
  RotateCcw,
} from 'lucide-react';
import {
  useGetAccountMappingsQuery,
  useUpdateAccountMappingMutation,
  useGetAccountsQuery,
  AccountMappingEvent,
} from '../api/accountingApi';

// ─── Event → human label + module badge ──────────────────────────────────────

interface EventMeta {
  label: string;
  module: 'Sales' | 'Inventory' | 'Purchase' | 'Accounts';
  moduleColor: string;
}

const EVENT_META: Record<AccountMappingEvent, EventMeta> = {
  SALES_REVENUE: {
    label: 'Storefront Sales Revenue',
    module: 'Sales',
    moduleColor: 'bg-blue-50 text-blue-600',
  },
  SHIPPING_INCOME: {
    label: 'Shipping & Delivery Income',
    module: 'Sales',
    moduleColor: 'bg-blue-50 text-blue-600',
  },
  SALES_RETURNS: {
    label: 'Sales Returns & Refunds',
    module: 'Sales',
    moduleColor: 'bg-blue-50 text-blue-600',
  },
  COURIER_COST: {
    label: 'Courier Logistics Cost',
    module: 'Purchase',
    moduleColor: 'bg-purple-50 text-purple-600',
  },
  PAYMENT_GATEWAY_FEE: {
    label: 'Payment Gateway Fee',
    module: 'Purchase',
    moduleColor: 'bg-purple-50 text-purple-600',
  },
  COGS: {
    label: 'Cost of Goods Sold',
    module: 'Inventory',
    moduleColor: 'bg-emerald-50 text-emerald-600',
  },
  INVENTORY_ASSET: {
    label: 'Inventory Asset',
    module: 'Inventory',
    moduleColor: 'bg-emerald-50 text-emerald-600',
  },
  ACCOUNTS_RECEIVABLE: {
    label: 'Accounts Receivable',
    module: 'Accounts',
    moduleColor: 'bg-amber-50 text-amber-600',
  },
  ACCOUNTS_PAYABLE: {
    label: 'Accounts Payable',
    module: 'Accounts',
    moduleColor: 'bg-amber-50 text-amber-600',
  },
  CASH: {
    label: 'Cash Account',
    module: 'Accounts',
    moduleColor: 'bg-amber-50 text-amber-600',
  },
  BANK: {
    label: 'Bank Account',
    module: 'Accounts',
    moduleColor: 'bg-amber-50 text-amber-600',
  },
  TAX_PAYABLE: {
    label: 'Tax / VAT Payable',
    module: 'Accounts',
    moduleColor: 'bg-amber-50 text-amber-600',
  },
};

const MODULE_OPTIONS = ['All', 'Sales', 'Inventory', 'Purchase', 'Accounts'] as const;
const STATUS_OPTIONS = ['All', 'Mapped', 'Unmapped'] as const;

export function AccountMappingView() {
  const { data: mappings, isLoading: mappingsLoading } = useGetAccountMappingsQuery();
  const { data: accounts, isLoading: accountsLoading } = useGetAccountsQuery({
    activeOnly: true,
  });
  const [updateMapping] = useUpdateAccountMappingMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] =
    useState<(typeof MODULE_OPTIONS)[number]>('All');
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>('All');
  const [savingEvent, setSavingEvent] = useState<AccountMappingEvent | null>(null);

  const accountLabel = useMemo(() => {
    const map = new Map<string, string>();
    (accounts ?? []).forEach((a) => map.set(a.id, `${a.code} — ${a.name}`));
    return map;
  }, [accounts]);

  const rows = useMemo(() => {
    const list = (mappings ?? []).map((m) => {
      const meta = EVENT_META[m.event];
      return {
        event: m.event,
        label: meta?.label ?? m.event,
        module: meta?.module ?? 'Accounts',
        moduleColor: meta?.moduleColor ?? 'bg-slate-50 text-slate-600',
        accountId: m.accountId ?? '',
        status: m.accountId ? ('Mapped' as const) : ('Unmapped' as const),
      };
    });

    return list.filter((row) => {
      const matchesSearch =
        row.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.accountId
          ? (accountLabel.get(row.accountId) ?? '')
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          : false);
      const matchesModule = moduleFilter === 'All' || row.module === moduleFilter;
      const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [mappings, accountLabel, searchTerm, moduleFilter, statusFilter]);

  const totalAccounts = mappings?.length ?? 0;
  const mappedCount = (mappings ?? []).filter((m) => m.accountId).length;
  const unmappedCount = totalAccounts - mappedCount;

  const handleAccountChange = async (
    event: AccountMappingEvent,
    accountId: string,
  ) => {
    setSavingEvent(event);
    try {
      await updateMapping({ event, accountId: accountId || null }).unwrap();
      toast.success(
        accountId
          ? `${EVENT_META[event]?.label ?? event} mapped.`
          : `${EVENT_META[event]?.label ?? event} mapping cleared.`,
      );
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to update mapping.';
      toast.error(message);
    } finally {
      setSavingEvent(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setModuleFilter('All');
    setStatusFilter('All');
    toast.info('Filters reset.');
  };

  const isLoading = mappingsLoading || accountsLoading;

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/dashboard/accounting/settings/general" className="text-blue-600 hover:underline">
              Settings
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">Account Mapping</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Mapping</h1>
          <p className="text-sm text-slate-500 mt-1">
            Map automation events to your chart of accounts. Changes save automatically.
          </p>
        </div>
      </div>

      {/* Top Summary Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <RotateCw className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">About Account Mapping</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Bind each BitCommerce automation event to a Chart of Accounts entry. Auto-posted
                transactions (orders, courier cost, gateway fees) use the mapped account.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div>
              <span className="text-xs font-medium text-slate-400 block">Total Events</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                {totalAccounts}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Mapped</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
                {mappedCount}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Unmapped</span>
              <div className="text-xl font-extrabold text-rose-500 mt-1 font-mono">
                {unmappedCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card with Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-end justify-between gap-3.5">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3.5 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Module
              </label>
              <div className="relative">
                <select
                  value={moduleFilter}
                  onChange={(e) =>
                    setModuleFilter(e.target.value as (typeof MODULE_OPTIONS)[number])
                  }
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {MODULE_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="w-44">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mapping Status
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])
                  }
                  className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-blue-600 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Account Mapping Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 font-bold">AUTOMATION EVENT</th>
                <th className="px-6 py-3.5 font-bold">MODULE</th>
                <th className="px-6 py-3.5 font-bold">
                  <div className="flex items-center gap-1">
                    <span>CHART OF ACCOUNT</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-3.5 font-bold">MAPPING STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 w-64 bg-slate-100 rounded-xl animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No events match the current filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.event} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${row.moduleColor}`}
                      >
                        {row.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[280px]">
                      <div className="relative w-full max-w-xs">
                        <select
                          value={row.accountId}
                          disabled={savingEvent === row.event}
                          onChange={(e) => handleAccountChange(row.event, e.target.value)}
                          className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-3 py-1.5 pr-8 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="">— Not set —</option>
                          {(accounts ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                          row.status === 'Mapped'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-500'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
