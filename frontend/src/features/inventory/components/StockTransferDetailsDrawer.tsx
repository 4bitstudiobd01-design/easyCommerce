'use client';

import React from 'react';
import { X, ArrowRight, Package, Warehouse as WarehouseIcon, Store as BranchIcon, Clock, FileText } from 'lucide-react';
import { StockTransfer, Warehouse } from '../api/inventoryApi';
import { Product } from '@/features/catalog/api/catalogApi';
import { Branch } from '@/features/tenant/api/tenantApi';

interface StockTransferDetailsDrawerProps {
  transfer: StockTransfer | null;
  onClose: () => void;
  productMap: Map<string, Product>;
  warehouseMap: Map<string, Warehouse>;
  branchMap?: Map<string, Branch>;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3 py-2">
    <dt className="text-[11px] font-medium text-slate-500 shrink-0">{label}</dt>
    <dd className="text-[11px] font-bold text-slate-900 text-right min-w-0 break-words">{value}</dd>
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

export function StockTransferDetailsDrawer({
  transfer,
  onClose,
  productMap,
  warehouseMap,
  branchMap,
}: StockTransferDetailsDrawerProps) {
  const isOpen = Boolean(transfer);
  if (!isOpen || !transfer) return null;

  const product = productMap.get(transfer.productId);
  const fromWarehouse = transfer.fromWarehouseId
    ? transfer.fromWarehouse || warehouseMap.get(transfer.fromWarehouseId)
    : undefined;
  const toWarehouse = transfer.toWarehouseId
    ? transfer.toWarehouse || warehouseMap.get(transfer.toWarehouseId)
    : undefined;
  const fromBranch = transfer.fromBranchId ? branchMap?.get(transfer.fromBranchId) : undefined;
  const toBranch = transfer.toBranchId ? branchMap?.get(transfer.toBranchId) : undefined;
  const fromLabel = fromWarehouse?.name || fromBranch?.name || 'Unknown';
  const toLabel = toWarehouse?.name || toBranch?.name || 'Unknown';

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
        aria-labelledby="transfer-drawer-title"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 id="transfer-drawer-title" className="text-xl font-bold text-slate-900 truncate">
            Transfer Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {/* Route Visual */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between gap-2">
            <div className="min-w-0 text-center flex-1">
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center mx-auto mb-1.5">
                {fromBranch ? <BranchIcon className="w-4 h-4 text-blue-600" /> : <WarehouseIcon className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] font-bold text-slate-900 truncate">{fromLabel}</p>
              <p className="text-[10px] text-slate-400">From{fromBranch ? ' (Branch)' : ''}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="min-w-0 text-center flex-1">
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center mx-auto mb-1.5">
                {toBranch ? <BranchIcon className="w-4 h-4 text-blue-600" /> : <WarehouseIcon className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[11px] font-bold text-slate-900 truncate">{toLabel}</p>
              <p className="text-[10px] text-slate-400">To{toBranch ? ' (Branch)' : ''}</p>
            </div>
          </div>

          <Section title="Product" icon={Package}>
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Product" value={product?.name || product?.title || transfer.productId} />
              {product?.sku && <DetailRow label="SKU" value={product.sku} />}
              {transfer.variant && <DetailRow label="Variant" value={transfer.variant.name || transfer.variant.sku || transfer.variantId} />}
              <DetailRow label="Quantity Transferred" value={`${transfer.quantity} units`} />
            </dl>
          </Section>

          <Section title="Locations" icon={WarehouseIcon}>
            <dl className="divide-y divide-slate-100">
              <DetailRow label="Source" value={fromLabel} />
              {fromWarehouse?.code && <DetailRow label="Source Code" value={fromWarehouse.code} />}
              <DetailRow label="Destination" value={toLabel} />
              {toWarehouse?.code && <DetailRow label="Destination Code" value={toWarehouse.code} />}
            </dl>
          </Section>

          <Section title="Timing" icon={Clock}>
            <dl className="divide-y divide-slate-100">
              <DetailRow
                label="Transferred At"
                value={new Date(transfer.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </dl>
          </Section>

          {transfer.notes && (
            <Section title="Notes" icon={FileText}>
              <p className="text-[11px] text-slate-600 leading-relaxed">{transfer.notes}</p>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
