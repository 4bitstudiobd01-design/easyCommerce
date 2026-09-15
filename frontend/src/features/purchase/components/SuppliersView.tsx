'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  Search,
  ChevronDown,
  Edit2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Trash2,
} from 'lucide-react';
import {
  useGetSuppliersQuery,
  useGetSupplierStatsQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  type SupplierListItem,
  type SupplierStatus,
} from '../api/purchaseApi';
<<<<<<< HEAD
import { CustomDropdown } from './CustomDropdown';
=======
import { PurchaseTabsHeader, type PurchaseTabKey } from './PurchaseTabsHeader';
>>>>>>> 28beebd18d9f9b378e71bc134817fba440e55106

const SORT_MAP: Record<string, 'name_asc' | 'name_desc' | 'purchases_desc' | 'due_desc'> = {
  'Name (A-Z)': 'name_asc',
  'Name (Z-A)': 'name_desc',
  'Total Purchases': 'purchases_desc',
  'Outstanding Due': 'due_desc',
};

const AVATAR_STYLES = [
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-purple-100 text-purple-600',
  'bg-orange-100 text-orange-600',
  'bg-amber-100 text-amber-600',
];

const avatarFor = (name: string) => {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_STYLES[code % AVATAR_STYLES.length];
};

const money = (v: string | number) =>
  `৳ ${Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

interface SupplierFormState {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
}

const EMPTY_FORM: SupplierFormState = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  location: '',
};

interface SuppliersViewProps {
  activeTab?: PurchaseTabKey;
  onNavigateTab?: (tab: PurchaseTabKey) => void;
}

export function SuppliersView({ activeTab = 'suppliers', onNavigateTab }: SuppliersViewProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Name (A-Z)');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);

  const { data, isLoading, isFetching, isError } = useGetSuppliersQuery({
    search: searchTerm.trim() || undefined,
    status:
      statusFilter === 'All' ? undefined : (statusFilter.toUpperCase() as SupplierStatus),
    sort: SORT_MAP[sortBy],
    page: currentPage,
    limit: perPage,
  });
  const { data: stats } = useGetSupplierStatsQuery();

  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeletingSupplier }] = useDeleteSupplierMutation();

  const suppliers = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = Math.min(currentPage * perPage, total);

  const canSave = form.name.trim() && form.contactPerson.trim() && form.phone.trim();
  const saving = isCreating || isUpdating;

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (s: SupplierListItem) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson ?? '',
      phone: s.phone ?? '',
      email: s.email ?? '',
      location: s.location ?? '',
    });
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      toast.error('Fill in the supplier name, contact person and phone.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      location: form.location.trim() || undefined,
    };
    try {
      if (editingId) {
        await updateSupplier({ id: editingId, ...payload }).unwrap();
        toast.success('Supplier updated.');
      } else {
        await createSupplier(payload).unwrap();
        toast.success('Supplier added.');
      }
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not save the supplier.';
      toast.error(message);
    }
  };

  const [supplierPendingDelete, setSupplierPendingDelete] = useState<SupplierListItem | null>(null);

  const remove = (s: SupplierListItem) => {
    setActiveMenuId(null);
    setSupplierPendingDelete(s);
  };

  const confirmRemove = async () => {
    if (!supplierPendingDelete) return;
    try {
      const res = await deleteSupplier(supplierPendingDelete.id).unwrap();
      toast.success(res.message ?? 'Supplier deleted.');
      setSupplierPendingDelete(null);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not delete the supplier.';
      toast.error(message);
    }
  };

  const kpis = useMemo(
    () => [
      {
        label: 'Total Suppliers',
        value: stats ? String(stats.totalSuppliers) : '—',
        sub: `${stats?.activeSuppliers ?? 0} active`,
        icon: Users,
        tone: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Total Purchases',
        value: stats ? money(stats.monthPurchases) : '—',
        sub: 'This month',
        icon: DollarSign,
        tone: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Outstanding Due',
        value: stats ? money(stats.outstandingDue) : '—',
        sub: 'Payable to suppliers',
        icon: TrendingUp,
        tone: 'bg-rose-50 text-rose-500',
      },
      {
        label: 'Overdue Amount',
        value: stats ? money(stats.overdueAmount) : '—',
        sub: 'Overdue payments',
        icon: Clock,
        tone: 'bg-purple-50 text-purple-600',
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6 pb-12 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage all your suppliers and their related information.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <PurchaseTabsHeader activeTab={activeTab} onTabChange={(tab) => onNavigateTab?.(tab)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${kpi.tone} flex items-center justify-center shrink-0`}
            >
              <kpi.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">{kpi.label}</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {kpi.value}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <div className="min-w-[130px]">
            <CustomDropdown
              size="sm"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'All', label: 'All Status' },
                { value: 'Active', label: 'Active', badge: 'Active', badgeColor: 'bg-emerald-50 text-emerald-700' },
                { value: 'Inactive', label: 'Inactive', badge: 'Inactive', badgeColor: 'bg-slate-100 text-slate-700' },
              ]}
            />
          </div>

          <div className="min-w-[170px]">
            <CustomDropdown
              size="sm"
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={Object.keys(SORT_MAP).map((label) => ({
                value: label,
                label,
              }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-blue-600">SUPPLIER</th>
                <th className="px-5 py-3.5">CONTACT PERSON</th>
                <th className="px-5 py-3.5">EMAIL</th>
                <th className="px-5 py-3.5">PHONE</th>
                <th className="px-5 py-3.5">TOTAL PURCHASES</th>
                <th className="px-5 py-3.5">OUTSTANDING DUE</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-rose-500">
                    Could not load suppliers. Try again.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && suppliers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No suppliers yet. Add your first supplier.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${avatarFor(s.name)} font-black text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{s.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            {s.location || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {s.contactPerson || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-normal">
                      {s.email || '—'}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">
                      {s.phone || '—'}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {money(s.totalPurchases)}
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-600">
                      {money(s.outstandingDue)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:border-slate-300 transition shadow-2xs"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === s.id ? null : s.id)
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition hover:bg-slate-100"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === s.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-left text-xs font-semibold">
                              <Link
                                href="/dashboard/purchase?tab=purchase-orders"
                                className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span>Create PO</span>
                              </Link>
                              <Link
                                href="/dashboard/purchase?tab=purchases"
                                className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                                <span>Record Purchase</span>
                              </Link>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                type="button"
                                onClick={() => remove(s)}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete Supplier</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            {isFetching && !isLoading
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} suppliers`}
          </p>

          <div className="flex items-center gap-3">
            <div className="w-32">
              <CustomDropdown
                size="sm"
                value={String(perPage)}
                onChange={(val) => {
                  setPerPage(Number(val));
                  setCurrentPage(1);
                }}
                options={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                ]}
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-bold text-slate-600">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingId ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter vendor contact and billing details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. ABC Wholesale"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    placeholder="e.g. Arif Rahman"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+880 1..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="arif@abcwholesale.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !canSave}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  {saving ? 'Saving…' : editingId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={supplierPendingDelete !== null}
        onClose={() => setSupplierPendingDelete(null)}
        onConfirm={confirmRemove}
        title="Delete Supplier"
        message={
          <>
            Delete supplier <strong>&quot;{supplierPendingDelete?.name}&quot;</strong>?
          </>
        }
        confirmLabel="Delete"
        isLoading={isDeletingSupplier}
      />
    </div>
  );
}
