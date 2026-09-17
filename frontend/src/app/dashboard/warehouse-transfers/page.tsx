'use client';

import { WarehouseTransferModal } from '@/features/inventory/components/WarehouseTransferModal';

export default function WarehouseTransfersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock Transfers</h1>
        <p className="text-xs text-slate-500 mt-1">Manage stock transfers between warehouses and branches.</p>
      </div>
      <WarehouseTransferModal />
    </div>
  );
}
