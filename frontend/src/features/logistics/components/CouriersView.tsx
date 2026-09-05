'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  Settings,
  AlertCircle,
  CheckCircle2,
  Truck,
  Activity,
  ShieldCheck,
  PowerOff,
  Loader2,
  Database,
  Star,
  Power,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCouriersDashboardQuery,
  useToggleCourierIntegrationMutation,
  useSetDefaultCourierMutation,
  useSeedCourierDemoDataMutation,
  type CourierDashboardItem,
  type CourierConnectionStatus,
} from '../api/logisticsApi';
import { CourierDetailsDrawer } from './CourierDetailsDrawer';
import { CourierConnectModal } from './CourierConnectModal';
import { Skeleton } from '@/components/ui/Skeleton';

type StatusFilter = 'ALL' | CourierConnectionStatus;
type TypeFilter = 'ALL' | string;
type CodFilter = 'ALL' | 'YES' | 'NO';

const selectClass =
  'h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:bg-slate-50 transition-colors cursor-pointer';

/** Fixed short date so server and client render the same string. */
const formatSync = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
};

const KpiCard = ({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className={`text-xs font-bold ${accent}`}>{label}</span>
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
    <p className="text-[11px] text-slate-500 mt-1">{caption}</p>
  </div>
);

const StatusPill = ({ status }: { status: CourierConnectionStatus }) => {
  const config = {
    Connected: { dot: 'bg-emerald-500', text: 'text-slate-900' },
    Disconnected: { dot: 'bg-slate-300', text: 'text-slate-500' },
    Error: { dot: 'bg-red-500', text: 'text-red-700' },
  }[status];

  return (
    <div className="flex items-center gap-1.5 font-medium">
      <div className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span className={config.text}>{status}</span>
    </div>
  );
};

const HealthBadge = ({ health }: { health: CourierDashboardItem['apiHealth'] }) => {
  if (health === 'N/A') {
    return <span className="text-slate-400 font-medium">N/A</span>;
  }
  const styles = {
    Healthy: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Fair: 'bg-amber-50 text-amber-600 border-amber-100',
    Poor: 'bg-red-50 text-red-600 border-red-100',
  }[health];

  return (
    <span className={`px-2 py-0.5 rounded font-bold border text-[11px] ${styles}`}>{health}</span>
  );
};

export function CouriersView() {
  const { data, isLoading, isError, error, refetch } = useGetCouriersDashboardQuery();

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [codFilter, setCodFilter] = useState<CodFilter>('ALL');

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<CourierDashboardItem | null>(null);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const [toggleIntegration] = useToggleCourierIntegrationMutation();
  const [setDefaultCourier] = useSetDefaultCourierMutation();
  const [seedDemoData, { isLoading: isSeeding }] = useSeedCourierDemoDataMutation();

  // The demo-data seeder is a development aid only — never exposed in production.
  const isDev = process.env.NODE_ENV !== 'production';

  const couriers = useMemo(() => data?.couriers ?? [], [data]);

  // Every distinct service type the backend actually returned, so the filter can
  // never offer an option that matches nothing.
  const typeOptions = useMemo(
    () => Array.from(new Set(couriers.map((courier) => courier.type))).sort(),
    [couriers],
  );

  const filteredCouriers = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return couriers.filter((courier) => {
      if (term && !`${courier.name} ${courier.code}`.toLowerCase().includes(term)) return false;
      if (statusFilter !== 'ALL' && courier.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && courier.type !== typeFilter) return false;
      if (codFilter === 'YES' && !courier.codSupport) return false;
      if (codFilter === 'NO' && courier.codSupport) return false;
      return true;
    });
  }, [couriers, searchInput, statusFilter, typeFilter, codFilter]);

  const hasActiveFilters =
    Boolean(searchInput) || statusFilter !== 'ALL' || typeFilter !== 'ALL' || codFilter !== 'ALL';

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setCodFilter('ALL');
  };

  const handleToggle = async (courier: CourierDashboardItem) => {
    setPendingProvider(courier.code);
    try {
      await toggleIntegration({ provider: courier.code, isEnabled: !courier.isEnabled }).unwrap();
      toast.success(`${courier.name} ${courier.isEnabled ? 'disconnected' : 'connected'}.`);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        `Could not update ${courier.name}.`;
      toast.error(message);
    } finally {
      setPendingProvider(null);
    }
  };

  const handleSetDefault = async (courier: CourierDashboardItem) => {
    setPendingProvider(courier.code);
    try {
      await setDefaultCourier(courier.code).unwrap();
      toast.success(`${courier.name} is now the default courier.`);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        `Could not make ${courier.name} the default.`;
      toast.error(message);
    } finally {
      setPendingProvider(null);
    }
  };

  const handleSeed = async () => {
    try {
      const result = await seedDemoData().unwrap();
      toast.success(result.message);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not seed courier demo data.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    const status = (error as { status?: number } | undefined)?.status;
    const message =
      status === 401
        ? 'Your session has expired. Please sign in again.'
        : status === 403
          ? 'You do not have permission to view courier integrations.'
          : status === 400
            ? 'Create a store before managing couriers.'
            : 'We could not load your couriers. Please try again.';

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-12 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-900">{message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary } = data;
  // The seeder is only worth offering when there is genuinely nothing set up —
  // and only in development.
  const showSeedAction = isDev && summary.connected.count === 0 && !hasActiveFilters;

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Couriers"
          value={String(summary.totalCouriers.count)}
          caption="Supported providers"
          accent="text-blue-600"
          icon={<Truck className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          label="Connected"
          value={String(summary.connected.count)}
          caption="Ready to book parcels"
          accent="text-emerald-600"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <KpiCard
          label="Disconnected"
          value={String(summary.disconnected.count)}
          caption="Not yet configured"
          accent="text-orange-600"
          icon={<PowerOff className="w-4 h-4 text-orange-600" />}
        />
        <KpiCard
          label="Active"
          value={String(summary.active.count)}
          caption="Used in the last 30 days"
          accent="text-purple-600"
          icon={<Activity className="w-4 h-4 text-purple-600" />}
        />
        <KpiCard
          label="API Health"
          value={summary.apiHealth.rate > 0 ? `${summary.apiHealth.rate}%` : '—'}
          caption={
            summary.apiHealth.rate > 0
              ? 'Average success rate'
              : 'No courier calls recorded yet'
          }
          accent="text-blue-600"
          icon={<ShieldCheck className="w-4 h-4 text-blue-600" />}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search courier by name..."
                aria-label="Search couriers"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by connection status"
              className={selectClass}
            >
              <option value="ALL">All Status</option>
              <option value="Connected">Connected</option>
              <option value="Disconnected">Disconnected</option>
              <option value="Error">Error</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by service type"
              className={selectClass}
            >
              <option value="ALL">All Types</option>
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={codFilter}
              onChange={(e) => setCodFilter(e.target.value as CodFilter)}
              aria-label="Filter by COD support"
              className={selectClass}
            >
              <option value="ALL">COD Support</option>
              <option value="YES">COD: Yes</option>
              <option value="NO">COD: No</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          {showSeedAction && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={isSeeding}
              className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95 disabled:opacity-50 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" aria-hidden="true" />
              ) : (
                <Database className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {isSeeding ? 'Seeding...' : 'Load Demo Data'}
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-5 font-bold text-slate-900">COURIER</th>
                <th className="py-3 px-5 font-bold text-slate-900">TYPE</th>
                <th className="py-3 px-5 font-bold text-slate-900">STATUS</th>
                <th className="py-3 px-5 font-bold text-slate-900">API HEALTH</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-right">SHIPMENTS</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-right">DELIVERED</th>
                <th className="py-3 px-5 font-bold text-slate-900">SUCCESS RATE</th>
                <th className="py-3 px-5 font-bold text-slate-900">COD</th>
                <th className="py-3 px-5 font-bold text-slate-900">LAST SYNC</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCouriers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm font-bold text-slate-900">
                      {hasActiveFilters ? 'No couriers match these filters' : 'No couriers found'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCouriers.map((courier, idx) => {
                  const sync = formatSync(courier.lastApiSync);
                  const isPending = pendingProvider === courier.code;

                  return (
                    <tr
                      key={courier.code}
                      className={`group border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                        idx === filteredCouriers.length - 1 ? 'border-b-0' : ''
                      }`}
                      onClick={() => setSelectedProvider(courier.code)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                            <span className="font-extrabold text-blue-600 text-lg">
                              {courier.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{courier.name}</span>
                            {courier.isDefault && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                                Default
                              </span>
                            )}
                            {courier.sandbox && courier.isEnabled && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-100">
                                Sandbox
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-blue-600 font-medium">{courier.type}</td>
                      <td className="py-4 px-5">
                        <StatusPill status={courier.status} />
                      </td>
                      <td className="py-4 px-5">
                        <HealthBadge health={courier.apiHealth} />
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900">
                        {courier.shipments.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900">
                        {courier.delivered.toLocaleString('en-US')}
                      </td>
                      <td className="py-4 px-5">
                        {courier.shipments === 0 ? (
                          <span className="text-slate-400 font-medium">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 w-10">
                              {courier.successRate}%
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  courier.successRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, courier.successRate)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {courier.codSupport ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[11px]">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[11px]">
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-slate-900 font-medium">
                        {sync ? (
                          <div className="flex flex-col">
                            <span>{sync.date}</span>
                            <span className="text-[11px] text-slate-500">{sync.time}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {courier.hasCredentials ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggle(courier)}
                                disabled={isPending}
                                title={courier.isEnabled ? 'Disconnect' : 'Connect'}
                                aria-label={
                                  courier.isEnabled
                                    ? `Disconnect ${courier.name}`
                                    : `Connect ${courier.name}`
                                }
                                className={`p-1.5 rounded-lg border transition-colors bg-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                  courier.isEnabled
                                    ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Power className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetDefault(courier)}
                                disabled={isPending || courier.isDefault || !courier.isEnabled}
                                title={
                                  courier.isDefault
                                    ? 'Already the default courier'
                                    : 'Make default courier'
                                }
                                aria-label={`Make ${courier.name} the default courier`}
                                className={`p-1.5 rounded-lg border transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                  courier.isDefault
                                    ? 'border-emerald-200 text-emerald-600'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <Star
                                  className="w-4 h-4"
                                  fill={courier.isDefault ? 'currentColor' : 'none'}
                                />
                              </button>

                              <button
                                type="button"
                                onClick={() => setConnectTarget(courier)}
                                title="Edit credentials"
                                aria-label={`Edit ${courier.name} credentials`}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConnectTarget(courier)}
                              className="h-8 px-3 rounded-lg border border-blue-200 text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-colors bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          Showing {filteredCouriers.length} of {couriers.length} couriers
        </div>
      </div>

      <CourierDetailsDrawer
        provider={selectedProvider}
        isOpen={selectedProvider !== null}
        onClose={() => setSelectedProvider(null)}
        onEditCredentials={(courier) => {
          setSelectedProvider(null);
          setConnectTarget(courier);
        }}
      />

      <CourierConnectModal
        courier={connectTarget}
        isOpen={connectTarget !== null}
        onClose={() => setConnectTarget(null)}
      />
    </div>
  );
}
