'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Building2, Plus, RefreshCw, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Department, useGetDepartmentsQuery, useDeleteDepartmentMutation } from '../api/hrmApi';
import { DepartmentFormModal } from './DepartmentFormModal';

export function DepartmentManagementTable() {
  const { data: departments = [], isLoading, isFetching, refetch } = useGetDepartmentsQuery();
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation();

  const [formState, setFormState] = useState<{ open: boolean; department: Department | null }>({
    open: false,
    department: null,
  });
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);

  const handleDeleteConfirm = async () => {
    if (!deletingDepartment) return;
    try {
      await deleteDepartment(deletingDepartment.id).unwrap();
      toast.success('Department deleted.');
      setDeletingDepartment(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Departments
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {departments.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Group employees by team or function</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setFormState({ open: true, department: null })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>
      </div>

      {/* Department Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={4} />
                  <TableRowSkeleton columns={4} />
                </>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No departments yet.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click "Add Department" to start organizing your team.
                    </p>
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-sm truncate">
                      {dept.description || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {dept.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setFormState({ open: true, department: dept })}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingDepartment(dept)}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Delete department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DepartmentFormModal
        isOpen={formState.open}
        department={formState.department}
        onClose={() => setFormState({ open: false, department: null })}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        title="Delete Department?"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDeletingDepartment(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-slate-600">
          Are you sure you want to delete <strong>{deletingDepartment?.name}</strong>? Employees in this
          department will be unassigned, not deleted.
        </div>
      </Modal>
    </div>
  );
}
