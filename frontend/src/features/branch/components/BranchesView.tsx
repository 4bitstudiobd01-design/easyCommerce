'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  Store as BranchIcon,
  MapPin,
  Phone,
  Pencil,
  Trash2,
  Star,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  useGetBranchesQuery,
  useDeleteBranchMutation,
  Branch,
} from '@/features/tenant/api/tenantApi';
import { BranchFormModal } from './BranchFormModal';

export function BranchesView() {
  const router = useRouter();
  const { data: branches = [], isLoading, isError } = useGetBranchesQuery();
  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const handleAddClick = () => {
    setEditTarget(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (branch: Branch) => {
    setEditTarget(branch);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteBranch(deleteTarget.id).unwrap();
      toast.success(result?.message || 'Branch deleted successfully.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete branch.');
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
            <span className="text-slate-700 font-semibold">Branches</span>
          </nav>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Branches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage the physical outlets/showrooms under this store.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddClick}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* Branch Cards */}
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
          <p className="text-sm font-bold text-slate-700">Failed to load branches.</p>
          <p className="text-xs text-slate-400 mt-1">Please refresh the page and try again.</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
            <BranchIcon className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">No branches yet</p>
          <p className="text-xs text-slate-400">Add your first physical outlet or showroom.</p>
          <button
            type="button"
            onClick={handleAddClick}
            className="mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                    <BranchIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate">{branch.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{branch.code}</p>
                  </div>
                </div>
                {branch.isDefault && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 flex items-center gap-1 shrink-0">
                    <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                    Default
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                {(branch.address || branch.city) && (
                  <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{[branch.address, branch.city].filter(Boolean).join(', ')}</span>
                  </p>
                )}
                {branch.phone && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{branch.phone}</span>
                  </p>
                )}
              </div>

              <Link
                href={`/dashboard/inventory/branches/${branch.id}/stock`}
                className="flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                <span>View Stock</span>
              </Link>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className={`text-[11px] font-bold ${branch.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {branch.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleEditClick(branch)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit branch"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(branch)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete branch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <BranchFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        branch={editTarget}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Branch?"
        message={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
