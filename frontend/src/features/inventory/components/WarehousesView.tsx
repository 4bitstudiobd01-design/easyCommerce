'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Warehouse as WarehouseIcon,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Star,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import {
  useGetWarehousesQuery,
  useGetInventoryStockQuery,
  useDeleteWarehouseMutation,
  Warehouse,
} from '../api/inventoryApi';
import { WarehouseFormModal } from './WarehouseFormModal';

export function WarehousesView() {
  const router = useRouter();
  const { data: warehouses = [], isLoading, isError } = useGetWarehousesQuery();
  const { data: stockItems = [] } = useGetInventoryStockQuery();
  const [deleteWarehouse, { isLoading: isDeleting }] = useDeleteWarehouseMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const handleAddClick = () => {
    setEditTarget(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (wh: Warehouse) => {
    setEditTarget(wh);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteWarehouse(deleteTarget.id).unwrap();
      toast.success(result?.message || 'Warehouse deleted successfully.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete warehouse.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Dashboard
            </Link>
            <span>&gt;</span>
            <Link href="/dashboard/inventory" className="hover:text-slate-600 transition-colors">
              Inventory
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-semibold">Warehouses</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Warehouses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your fulfillment locations used across stock and transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Warehouse</span>
        </button>
      </div>

      {/* Warehouse Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="h-5 w-32 bg-slate-200 animate-pulse rounded-lg" />
              <div className="h-3 w-48 bg-slate-100 animate-pulse rounded-lg" />
              <div className="h-3 w-24 bg-slate-100 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-sm font-bold text-slate-700">Failed to load warehouses.</p>
          <p className="text-xs text-slate-400 mt-1">Please refresh the page and try again.</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <WarehouseIcon className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">No warehouses yet</p>
          <p className="text-xs text-slate-400">Create your first warehouse to start tracking stock by location.</p>
          <button
            type="button"
            onClick={handleAddClick}
            className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => {
            const whStockItems = stockItems.filter((s) => s.warehouseId === wh.id);
            const totalUnits = whStockItems.reduce((sum, s) => sum + s.quantityOnHand, 0);
            const hasStock = whStockItems.length > 0;

            return (
              <div
                key={wh.id}
                onClick={() => router.push(`/dashboard/inventory?warehouseId=${wh.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/dashboard/inventory?warehouseId=${wh.id}`);
                  }
                }}
                title={`View inventory in ${wh.name}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <WarehouseIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{wh.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{wh.code}</p>
                    </div>
                  </div>
                  {wh.isDefault && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 flex items-center gap-1 shrink-0">
                      <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                      Default
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {wh.address && (
                    <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span>{wh.address}</span>
                    </p>
                  )}
                  {wh.phone && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{wh.phone}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">{totalUnits} units in stock</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(wh);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit warehouse"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(wh);
                      }}
                      disabled={hasStock}
                      title={hasStock ? 'Move or clear stock before deleting' : 'Delete warehouse'}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <WarehouseFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        warehouse={editTarget}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 z-10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Delete Warehouse?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
