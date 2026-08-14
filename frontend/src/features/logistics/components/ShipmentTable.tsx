'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  MoreVertical,
  Package,
  Truck,
  Eye,
  FileText,
  RefreshCw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Shipment } from '../api/logisticsApi';
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

interface ShipmentTableProps {
  shipments: Shipment[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onViewShipment: (id: string) => void;
  onCancelShipment: (shipment: Shipment) => void;
  onSyncShipment: (shipment: Shipment) => void;
  onCreateShipment: () => void;
}

const COLUMNS = [
  'Shipment',
  'Order',
  'Customer',
  'Courier',
  'Tracking ID',
  'COD',
  'Status',
  'Created',
  'Actions',
];

/** Copy control that confirms inline as well as through a toast. */
const CopyTrackingButton = ({ trackingCode }: { trackingCode: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success('Tracking ID copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy the tracking ID');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy tracking ID ${trackingCode}`}
      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
};

/**
 * Row action menu. Only actions valid for the shipment's current state are
 * offered — a delivered parcel never shows "Cancel", and a parcel with no
 * tracking code never shows "Track".
 */
const RowActionMenu = ({
  shipment,
  onView,
  onCancel,
  onSync,
}: {
  shipment: Shipment;
  onView: () => void;
  onCancel: () => void;
  onSync: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const itemClass =
    'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left focus:outline-none focus-visible:bg-slate-50';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Actions for shipment ${shipment.shipmentNumber}`}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <MoreVertical className="w-4 h-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 overflow-hidden"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onView();
            }}
            className={itemClass}
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            View Shipment
          </button>

          <Link
            role="menuitem"
            href={`/dashboard/orders/${shipment.orderId}`}
            onClick={() => setIsOpen(false)}
            className={itemClass}
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            View Order
          </Link>

          {shipment.trackingCode && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onSync();
              }}
              className={itemClass}
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              Track Shipment
            </button>
          )}

          {shipment.isCancellable && (
            <>
              <div className="my-1 border-t border-slate-100" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onCancel();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left focus:outline-none focus-visible:bg-red-50"
              >
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Cancel Shipment
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const TableSkeleton = () => (
  <tbody className="divide-y divide-slate-100">
    {Array.from({ length: 10 }).map((_, rowIndex) => (
      <tr key={rowIndex}>
        {COLUMNS.map((column) => (
          <td key={column} className="px-4 py-3.5">
            <Skeleton className="h-4 w-full max-w-[110px] rounded" />
          </td>
        ))}
      </tr>
    ))}
  </tbody>
);

export const ShipmentTable = ({
  shipments,
  isLoading,
  hasActiveFilters,
  onClearFilters,
  onViewShipment,
  onCancelShipment,
  onSyncShipment,
  onCreateShipment,
}: ShipmentTableProps) => {
  // Empty states distinguish "no shipments at all" from "no matches", because
  // the useful next action is different in each case.
  if (!isLoading && shipments.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-slate-300" aria-hidden="true" />
        </div>
        {hasActiveFilters ? (
          <>
            <p className="text-sm font-bold text-slate-900">No shipments found</p>
            <p className="text-xs text-slate-500 mt-1.5">
              No shipments match your current filters.
            </p>
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Clear Filters
            </button>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-900">No shipments yet</p>
            <p className="text-xs text-slate-500 mt-1.5">
              Create your first shipment to start tracking deliveries.
            </p>
            <button
              type="button"
              onClick={onCreateShipment}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Create Shipment
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP / TABLET — full table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[920px] text-left border-collapse">
          <caption className="sr-only">
            Shipments with courier, tracking, COD and delivery status
          </caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap ${
                    column === 'Actions' ? 'text-right' : ''
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <tbody className="divide-y divide-slate-100">
              {shipments.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* SHIPMENT — number over courier name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${getCourierBrandStyle(
                          shipment.courierProvider,
                        )}`}
                        aria-hidden="true"
                      >
                        <Truck className="w-3.5 h-3.5" strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewShipment(shipment.id)}
                          className="block text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          {shipment.shipmentNumber}
                        </button>
                        <span className="block text-[10px] font-medium text-slate-400 truncate">
                          {shipment.courierName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* ORDER — links into the existing order details page */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${shipment.orderId}`}
                      title={`#${shipment.orderNumber}`}
                      className="block max-w-[130px] truncate whitespace-nowrap text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      #{shipment.orderNumber}
                    </Link>
                  </td>

                  {/* CUSTOMER — avatar, name, phone */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(
                          shipment.customer.name,
                        )}`}
                        aria-hidden="true"
                      >
                        {getInitials(shipment.customer.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate max-w-[140px]">
                          {shipment.customer.name}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-400 truncate">
                          {shipment.customer.phone ?? 'No phone'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* COURIER */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${getCourierBrandStyle(
                          shipment.courierProvider,
                        )}`}
                        aria-hidden="true"
                      >
                        <Truck className="w-3 h-3" strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {shipment.courierName}
                      </span>
                    </div>
                  </td>

                  {/* TRACKING ID — never invented when absent */}
                  <td className="px-4 py-3">
                    {shipment.trackingCode ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-600 font-mono">
                          {shipment.trackingCode}
                        </span>
                        <CopyTrackingButton trackingCode={shipment.trackingCode} />
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        Not Assigned
                      </span>
                    )}
                  </td>

                  {/* COD — amount plus settlement state */}
                  <td className="px-4 py-3">
                    {shipment.codStatus === 'NOT_APPLICABLE' ? (
                      <span className="text-xs font-medium text-slate-400">Prepaid</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                          {formatCurrency(shipment.codAmount, shipment.currency)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded w-fit ${
                            COD_STATUS_STYLES[shipment.codStatus]
                          }`}
                        >
                          {shipment.codStatusLabel}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* STATUS — text always present, never colour alone */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ring-1 ring-inset whitespace-nowrap ${
                        SHIPMENT_STATUS_STYLES[shipment.status]
                      }`}
                    >
                      {shipment.statusLabel}
                    </span>
                  </td>

                  {/* CREATED — date over time */}
                  <td className="px-4 py-3">
                    <span className="block text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {formatShipmentDate(shipment.createdAt)}
                    </span>
                    <span className="block text-[10px] font-medium text-slate-400">
                      {formatShipmentTime(shipment.createdAt)}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <RowActionMenu
                        shipment={shipment}
                        onView={() => onViewShipment(shipment.id)}
                        onCancel={() => onCancelShipment(shipment)}
                        onSync={() => onSyncShipment(shipment)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* MOBILE — a real card layout, not a squeezed table */}
      <div className="md:hidden divide-y divide-slate-100">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 space-y-2.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            ))
          : shipments.map((shipment) => (
              <div key={shipment.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewShipment(shipment.id)}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      {shipment.shipmentNumber}
                    </button>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                      {shipment.courierName} ·{' '}
                      <Link
                        href={`/dashboard/orders/${shipment.orderId}`}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        #{shipment.orderNumber}
                      </Link>
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ring-1 ring-inset shrink-0 ${
                      SHIPMENT_STATUS_STYLES[shipment.status]
                    }`}
                  >
                    {shipment.statusLabel}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(
                      shipment.customer.name,
                    )}`}
                    aria-hidden="true"
                  >
                    {getInitials(shipment.customer.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {shipment.customer.name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">
                      {shipment.customer.phone ?? 'No phone'}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                  <div className="min-w-0">
                    <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Tracking
                    </dt>
                    <dd className="text-[11px] font-medium text-slate-700 truncate">
                      {shipment.trackingCode ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-mono truncate">{shipment.trackingCode}</span>
                          <CopyTrackingButton trackingCode={shipment.trackingCode} />
                        </span>
                      ) : (
                        <span className="italic text-slate-400">Not Assigned</span>
                      )}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      COD
                    </dt>
                    <dd className="text-[11px] font-bold text-slate-900">
                      {shipment.codStatus === 'NOT_APPLICABLE' ? (
                        <span className="font-medium text-slate-400">Prepaid</span>
                      ) : (
                        <>
                          {formatCurrency(shipment.codAmount, shipment.currency)}{' '}
                          <span className="font-medium text-slate-400">
                            · {shipment.codStatusLabel}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Created
                    </dt>
                    <dd className="text-[11px] font-medium text-slate-700">
                      {formatShipmentDate(shipment.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewShipment(shipment.id)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    Details
                  </button>
                  <Link
                    href={`/dashboard/orders/${shipment.orderId}`}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    Order
                  </Link>
                  {shipment.isCancellable && (
                    <button
                      type="button"
                      onClick={() => onCancelShipment(shipment)}
                      aria-label={`Cancel shipment ${shipment.shipmentNumber}`}
                      className="px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-red-600 text-xs font-bold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>
    </>
  );
};
