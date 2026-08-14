'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Package,
  MapPin,
  Truck,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useGetShipmentDetailsQuery,
  useSyncShipmentMutation,
  type ShipmentDetails,
} from '../api/logisticsApi';
import {
  formatCurrency,
  formatShipmentDate,
  formatShipmentTime,
  getAvatarColor,
  getCourierBrandStyle,
  getInitials,
  SHIPMENT_STATUS_STYLES,
  COD_STATUS_STYLES,
} from '../utils/shipmentFormatters';

interface ShipmentDetailsDrawerProps {
  shipmentId: string | null;
  onClose: () => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <dt className="text-[11px] font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className="text-[11px] font-bold text-slate-900 text-right min-w-0 break-words">
      {value}
    </dd>
  </div>
);

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <section className="bg-white rounded-2xl border border-slate-200/80 p-4">
    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      {title}
    </h3>
    {children}
  </section>
);

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success('Tracking ID copied');
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error('Could not copy the tracking ID');
        }
      }}
      aria-label={`Copy tracking ID ${value}`}
      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {copied ? (
        <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="w-3 h-3" aria-hidden="true" />
      )}
    </button>
  );
};

const DrawerSkeleton = () => (
  <div className="p-5 space-y-4">
    <Skeleton className="h-6 w-40 rounded" />
    <Skeleton className="h-24 w-full rounded-2xl" />
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-52 w-full rounded-2xl" />
  </div>
);

const ShipmentDetailsBody = ({
  shipment,
  onSync,
  isSyncing,
}: {
  shipment: ShipmentDetails;
  onSync: () => void;
  isSyncing: boolean;
}) => (
  <div className="p-5 space-y-4">
    {/* Identity + status */}
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getCourierBrandStyle(
              shipment.courierProvider,
            )}`}
            aria-hidden="true"
          >
            <Truck className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">
              {shipment.shipmentNumber}
            </p>
            <p className="text-[11px] font-medium text-slate-500 truncate">
              {shipment.courierName} ·{' '}
              <Link
                href={`/dashboard/orders/${shipment.orderId}`}
                className="text-blue-600 font-bold hover:underline"
              >
                #{shipment.orderNumber}
              </Link>
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ring-1 ring-inset shrink-0 ${
            SHIPMENT_STATUS_STYLES[shipment.status]
          }`}
        >
          {shipment.statusLabel}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tracking ID
          </p>
          {shipment.trackingCode ? (
            <span className="inline-flex items-center gap-1">
              <span className="text-xs font-bold text-slate-900 font-mono truncate">
                {shipment.trackingCode}
              </span>
              <CopyButton value={shipment.trackingCode} />
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400 italic">Not Assigned</span>
          )}
        </div>

        {shipment.trackingCode && (
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {isSyncing ? (
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
            )}
            {isSyncing ? 'Syncing...' : 'Track'}
          </button>
        )}
      </div>
    </div>

    {/* Customer */}
    <Section title="Customer" icon={Package}>
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${getAvatarColor(
            shipment.customer.name,
          )}`}
          aria-hidden="true"
        >
          {getInitials(shipment.customer.name)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{shipment.customer.name}</p>
          <p className="text-[11px] font-medium text-slate-500 truncate">
            {shipment.customer.phone ?? 'No phone on file'}
          </p>
        </div>
      </div>
    </Section>

    {/* Parcel + COD */}
    <Section title="Parcel & Payment" icon={Package}>
      <dl className="divide-y divide-slate-100">
        <DetailRow
          label="COD Amount"
          value={
            shipment.codStatus === 'NOT_APPLICABLE' ? (
              <span className="text-slate-400">Prepaid — no cash to collect</span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {formatCurrency(shipment.codAmount, shipment.currency)}
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    COD_STATUS_STYLES[shipment.codStatus]
                  }`}
                >
                  {shipment.codStatusLabel}
                </span>
              </span>
            )
          }
        />
        <DetailRow
          label="Delivery Charge"
          value={formatCurrency(shipment.deliveryCharge, shipment.currency)}
        />
        <DetailRow label="Parcel Weight" value={`${shipment.parcelWeight} kg`} />
        <DetailRow label="Parcel Type" value={shipment.parcelType} />
        <DetailRow
          label="Dimensions"
          value={shipment.parcelDimensions ? `${shipment.parcelDimensions} cm` : '—'}
        />
        {shipment.codCollectedAt && (
          <DetailRow
            label="COD Collected"
            value={`${formatShipmentDate(shipment.codCollectedAt)}, ${formatShipmentTime(
              shipment.codCollectedAt,
            )}`}
          />
        )}
        {shipment.codSettledAt && (
          <DetailRow
            label="COD Settled"
            value={`${formatShipmentDate(shipment.codSettledAt)}, ${formatShipmentTime(
              shipment.codSettledAt,
            )}`}
          />
        )}
      </dl>
    </Section>

    {/* Addresses */}
    <Section title="Addresses" icon={MapPin}>
      <dl className="divide-y divide-slate-100">
        <DetailRow label="Pickup" value={shipment.pickupAddress || '—'} />
        <DetailRow label="Delivery" value={shipment.deliveryAddress} />
        <DetailRow label="City / Area" value={shipment.city} />
        {shipment.deliveryNote && <DetailRow label="Delivery Note" value={shipment.deliveryNote} />}
        {shipment.specialInstructions && (
          <DetailRow label="Instructions" value={shipment.specialInstructions} />
        )}
      </dl>
    </Section>

    {/* Timestamps */}
    <Section title="Timestamps" icon={Clock}>
      <dl className="divide-y divide-slate-100">
        <DetailRow
          label="Created"
          value={`${formatShipmentDate(shipment.createdAt)}, ${formatShipmentTime(
            shipment.createdAt,
          )}`}
        />
        <DetailRow
          label="Last Updated"
          value={`${formatShipmentDate(shipment.updatedAt)}, ${formatShipmentTime(
            shipment.updatedAt,
          )}`}
        />
        {shipment.lastSyncAt && (
          <DetailRow
            label="Last Synced"
            value={`${formatShipmentDate(shipment.lastSyncAt)}, ${formatShipmentTime(
              shipment.lastSyncAt,
            )}`}
          />
        )}
      </dl>
    </Section>

    {/* Timeline — real recorded events only */}
    <Section title="Shipment Timeline" icon={Truck}>
      {shipment.timeline.length === 0 ? (
        <p className="text-[11px] font-medium text-slate-400 py-2">
          No tracking events have been reported by the courier yet.
        </p>
      ) : (
        <ol className="relative space-y-4 pl-5 pt-1">
          <span
            className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200"
            aria-hidden="true"
          />
          {shipment.timeline.map((event, index) => {
            const isLatest = index === shipment.timeline.length - 1;
            return (
              <li key={event.id} className="relative">
                <span
                  className={`absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border-2 border-white ring-1 ${
                    isLatest ? 'bg-blue-600 ring-blue-200' : 'bg-slate-300 ring-slate-200'
                  }`}
                  aria-hidden="true"
                />
                <p className="text-[11px] font-bold text-slate-900">{event.statusLabel}</p>
                {event.description && (
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                    {event.description}
                  </p>
                )}
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                  {formatShipmentDate(event.timestamp)}, {formatShipmentTime(event.timestamp)}
                  {event.location ? ` · ${event.location}` : ''}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  </div>
);

export const ShipmentDetailsDrawer = ({ shipmentId, onClose }: ShipmentDetailsDrawerProps) => {
  const isOpen = Boolean(shipmentId);

  const { data, isLoading, isError, error } = useGetShipmentDetailsQuery(shipmentId as string, {
    skip: !shipmentId,
  });
  const [syncShipment, { isLoading: isSyncing }] = useSyncShipmentMutation();

  // Escape closes the drawer, and the page behind it must not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const status = (error as { status?: number } | undefined)?.status;
  const errorMessage =
    status === 403
      ? 'You do not have permission to view this shipment.'
      : status === 404
        ? 'This shipment no longer exists.'
        : 'We could not load this shipment. Please try again.';

  const handleSync = async () => {
    if (!shipmentId) return;
    try {
      await syncShipment(shipmentId).unwrap();
      toast.success('Tracking updated from the courier.');
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not reach the courier. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close shipment details"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shipment details"
        className="relative w-full max-w-md bg-slate-50 h-full overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">Shipment Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {isLoading ? (
          <DrawerSkeleton />
        ) : isError || !data ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-900">{errorMessage}</p>
          </div>
        ) : (
          <ShipmentDetailsBody shipment={data} onSync={handleSync} isSyncing={isSyncing} />
        )}
      </div>
    </div>
  );
};
