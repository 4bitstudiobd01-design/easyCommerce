'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Activity,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Webhook,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCourierIntegrationQuery,
  useUpsertCourierIntegrationMutation,
  useTestCourierConnectionMutation,
  type CourierDashboardItem,
  type CourierProvider,
} from '../api/logisticsApi';
import { Skeleton } from '@/components/ui/Skeleton';

interface CourierDetailsDrawerProps {
  /** Provider code, or null when the drawer is closed. */
  provider: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditCredentials: (courier: CourierDashboardItem) => void;
}

type DrawerTab = 'overview' | 'configuration' | 'automation' | 'webhooks';

const TABS: Array<{ key: DrawerTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'configuration', label: 'Configuration' },
  { key: 'automation', label: 'Automation' },
  { key: 'webhooks', label: 'Webhooks' },
];

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}, ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3 text-[13px]">
    <span className="text-slate-500 shrink-0">{label}</span>
    <span className="font-semibold text-slate-900 text-right">{children}</span>
  </div>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
    <span className="text-[11px] font-medium text-slate-500 leading-none">{label}</span>
    <span className="text-[15px] font-bold text-slate-900 leading-none">{value}</span>
  </div>
);

/** A labelled on/off switch backed by a real mutation. */
const ToggleRow = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) => (
  <label
    className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors ${
      disabled
        ? 'border-slate-100 bg-slate-50/60 cursor-not-allowed'
        : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
    }`}
  >
    <span className="min-w-0">
      <span className="block text-[13px] font-bold text-slate-900">{label}</span>
      <span className="block text-[11px] text-slate-500 mt-0.5 leading-relaxed">
        {description}
      </span>
    </span>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-1 w-4 h-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
    />
  </label>
);

/**
 * Full detail for one courier integration.
 *
 * Fetches by provider rather than taking a row object, so reopening after a
 * mutation always shows current state. Every value here comes from the server —
 * where a number is genuinely unknown (a courier never called), the drawer says
 * so instead of estimating.
 */
export function CourierDetailsDrawer({
  provider,
  isOpen,
  onClose,
  onEditCredentials,
}: CourierDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');

  const { data: courier, isLoading } = useGetCourierIntegrationQuery(
    (provider ?? '') as CourierProvider,
    { skip: !provider },
  );

  const [upsertIntegration, { isLoading: isSavingSettings }] =
    useUpsertCourierIntegrationMutation();
  const [testConnection, { isLoading: isTesting }] = useTestCourierConnectionMutation();

  useEffect(() => {
    setActiveTab('overview');
  }, [provider]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !provider) return null;

  const handleSettingChange = async (
    patch: { autoCreateShipment?: boolean; autoUpdateTracking?: boolean; sandbox?: boolean },
    successMessage: string,
  ) => {
    if (!courier) return;
    try {
      await upsertIntegration({ provider: courier.code, ...patch }).unwrap();
      toast.success(successMessage);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not update this setting.';
      toast.error(message);
    }
  };

  const handleTestConnection = async () => {
    if (!courier) return;
    try {
      const result = await testConnection(courier.code).unwrap();
      if (result.success) {
        toast.success(result.message);
      } else {
        // A failed handshake is an expected answer, not a crash — the merchant
        // is told exactly what the courier said.
        toast.error(result.message);
      }
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not reach the courier.';
      toast.error(message);
    }
  };

  const lastTested = formatDateTime(courier?.lastTestedAt);

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="courier-drawer-title"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <h2
              id="courier-drawer-title"
              className="text-xl font-bold text-slate-900 truncate"
            >
              {courier?.name ?? 'Courier'}
            </h2>
            {courier && (
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                  courier.status === 'Connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : courier.status === 'Error'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {courier.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 border-b border-slate-100">
          <div className="flex items-center gap-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={activeTab === tab.key ? 'page' : undefined}
                className={`py-3 text-[13px] font-semibold tracking-tight border-b-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading || !courier ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <section>
                    <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">
                      Courier Information
                    </h3>
                    <div className="space-y-3">
                      <Row label="Courier Name">{courier.name}</Row>
                      <Row label="Type">{courier.type}</Row>
                      <Row label="COD Support">
                        <span className={courier.codSupport ? 'text-emerald-600' : 'text-slate-500'}>
                          {courier.codSupport ? 'Yes' : 'No'}
                        </span>
                      </Row>
                      <Row label="Coverage">{courier.coverage}</Row>
                      <Row label="Tracking API">
                        <span
                          className={
                            courier.supportsTracking ? 'text-emerald-600' : 'text-slate-500'
                          }
                        >
                          {courier.supportsTracking ? 'Supported' : 'Webhook only'}
                        </span>
                      </Row>
                      <Row label="Cancellation API">
                        <span
                          className={
                            courier.supportsCancellation ? 'text-emerald-600' : 'text-slate-500'
                          }
                        >
                          {courier.supportsCancellation ? 'Supported' : 'Manual'}
                        </span>
                      </Row>
                      <Row label="Website">
                        <a
                          href={`https://${courier.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {courier.website}
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      </Row>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">
                      Integration Status
                    </h3>
                    <div className="space-y-3">
                      <Row label="API Health">
                        {courier.apiHealth === 'N/A' ? (
                          <span className="text-slate-400">Not called yet</span>
                        ) : (
                          courier.apiHealth
                        )}
                      </Row>
                      <Row label="API Success Rate">
                        {courier.apiHealth === 'N/A' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          `${courier.apiSuccessRate}%`
                        )}
                      </Row>
                      <Row label="Last API Call">
                        {formatDateTime(courier.lastApiSync) ?? (
                          <span className="text-slate-400">Never</span>
                        )}
                      </Row>
                      <Row label="Last Webhook">
                        {formatDateTime(courier.lastWebhook) ?? (
                          <span className="text-slate-400">Never</span>
                        )}
                      </Row>
                      <Row label="Default Courier">
                        <span
                          className={courier.isDefault ? 'text-emerald-600' : 'text-slate-500'}
                        >
                          {courier.isDefault ? 'Yes' : 'No'}
                        </span>
                      </Row>
                      <Row label="Mode">
                        <span className={courier.sandbox ? 'text-amber-600' : 'text-slate-900'}>
                          {courier.sandbox ? 'Sandbox' : 'Live'}
                        </span>
                      </Row>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">
                      Shipment Performance
                    </h3>
                    {courier.shipments === 0 ? (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        No parcels have been booked with {courier.name} yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <StatCard
                          label="Total Shipments"
                          value={courier.shipments.toLocaleString('en-US')}
                        />
                        <StatCard
                          label="Delivered"
                          value={courier.delivered.toLocaleString('en-US')}
                        />
                        <StatCard label="Success Rate" value={`${courier.successRate}%`} />
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'configuration' && (
                <>
                  <section>
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                      <ShieldCheck
                        className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-[11px] font-medium text-blue-900 leading-relaxed">
                        Stored credentials are encrypted and can never be read back in full.
                        Only the last few characters are shown.
                      </p>
                    </div>

                    <h3 className="text-[13px] font-bold text-slate-900 mb-3 tracking-tight">
                      Credentials
                    </h3>

                    {courier.hasCredentials ? (
                      <div className="space-y-3">
                        {courier.credentialFields.map((field) => (
                          <Row key={field.key} label={field.label}>
                            <span className="font-mono text-[12px]">
                              {courier.maskedCredentials[field.key] ?? (
                                <span className="text-slate-400 font-sans">Not set</span>
                              )}
                            </span>
                          </Row>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        {courier.name} is not connected yet. Add its credentials to start booking
                        parcels.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditCredentials(courier)}
                      className="mt-4 w-full h-10 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl shadow-2xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Settings className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      {courier.hasCredentials ? 'Update Credentials' : 'Add Credentials'}
                    </button>
                  </section>

                  <section>
                    <h3 className="text-[13px] font-bold text-slate-900 mb-3 tracking-tight">
                      Last Connection Test
                    </h3>
                    {courier.lastTestedAt === null ? (
                      <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4">
                        This connection has not been tested yet.
                      </p>
                    ) : (
                      <div
                        className={`flex items-start gap-2 p-3 rounded-xl border ${
                          courier.lastTestSucceeded
                            ? 'bg-emerald-50 border-emerald-100'
                            : 'bg-red-50 border-red-100'
                        }`}
                      >
                        {courier.lastTestSucceeded ? (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        ) : (
                          <XCircle
                            className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-[12px] font-semibold leading-relaxed ${
                              courier.lastTestSucceeded ? 'text-emerald-900' : 'text-red-900'
                            }`}
                          >
                            {courier.lastTestMessage}
                          </p>
                          {lastTested && (
                            <p className="text-[11px] text-slate-500 mt-1">{lastTested}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {activeTab === 'automation' && (
                <section className="space-y-3">
                  <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">
                    Automation
                  </h3>

                  {!courier.hasCredentials && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <AlertCircle
                        className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <p className="text-[11px] font-medium text-amber-900 leading-relaxed">
                        Connect {courier.name} before changing its automation settings.
                      </p>
                    </div>
                  )}

                  <ToggleRow
                    label="Auto-create shipment"
                    description="Book a parcel automatically when an order becomes ready to ship."
                    checked={courier.autoCreateShipment}
                    disabled={!courier.hasCredentials || isSavingSettings}
                    onChange={(next) =>
                      handleSettingChange(
                        { autoCreateShipment: next },
                        `Auto-create ${next ? 'enabled' : 'disabled'} for ${courier.name}.`,
                      )
                    }
                  />

                  <ToggleRow
                    label="Auto-update tracking"
                    description={
                      courier.supportsTracking
                        ? 'Pull the latest tracking state from this courier on a schedule.'
                        : 'This courier pushes updates by webhook rather than polling.'
                    }
                    checked={courier.autoUpdateTracking}
                    disabled={
                      !courier.hasCredentials || !courier.supportsTracking || isSavingSettings
                    }
                    onChange={(next) =>
                      handleSettingChange(
                        { autoUpdateTracking: next },
                        `Auto-update ${next ? 'enabled' : 'disabled'} for ${courier.name}.`,
                      )
                    }
                  />

                  <ToggleRow
                    label="Sandbox mode"
                    description="Test bookings without sending parcels to the live courier."
                    checked={courier.sandbox}
                    disabled={!courier.hasCredentials || isSavingSettings}
                    onChange={(next) =>
                      handleSettingChange(
                        { sandbox: next },
                        `${courier.name} switched to ${next ? 'sandbox' : 'live'} mode.`,
                      )
                    }
                  />
                </section>
              )}

              {activeTab === 'webhooks' && (
                <section>
                  <h3 className="text-[13px] font-bold text-slate-900 mb-3 tracking-tight">
                    Webhooks
                  </h3>
                  <div className="space-y-3">
                    <Row label="Last Received">
                      {formatDateTime(courier.lastWebhook) ?? (
                        <span className="text-slate-400">Never</span>
                      )}
                    </Row>
                  </div>

                  <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <Webhook
                      className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
                      {courier.supportsTracking
                        ? `${courier.name} exposes a tracking API, so shipment status is kept current by syncing rather than by inbound webhooks.`
                        : `${courier.name} reports parcel status by webhook. Inbound webhook endpoints are not part of this release — use Sync on a shipment to refresh it manually.`}
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !courier?.hasCredentials}
            className="w-full h-10 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <Activity className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="button"
            onClick={() => courier && onEditCredentials(courier)}
            disabled={!courier}
            className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-sm transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            Configure Courier
          </button>
        </div>
      </div>
    </>
  );
}
