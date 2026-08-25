'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  UserX,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import {
  Employee,
  EmploymentStatus,
  useGetEmployeesQuery,
  useGetDepartmentsQuery,
  useTerminateEmployeeMutation,
  useInviteEmployeeSelfServiceMutation,
} from '../api/hrmApi';
import { EmployeeFormModal } from './EmployeeFormModal';

const STATUS_BADGE: Record<EmploymentStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  ON_LEAVE: 'bg-amber-100 text-amber-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  TERMINATED: 'bg-rose-100 text-rose-800',
};

export function EmployeeManagementTable() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState<EmploymentStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data, isLoading, isFetching, refetch } = useGetEmployeesQuery({
    search: search || undefined,
    departmentId: departmentId || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });
  const [terminateEmployee, { isLoading: isTerminating }] = useTerminateEmployeeMutation();
  const [inviteSelfService, { isLoading: isInviting }] = useInviteEmployeeSelfServiceMutation();

  const [formState, setFormState] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [terminatingEmployee, setTerminatingEmployee] = useState<Employee | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInviteSelfService = async (employee: Employee) => {
    try {
      const result = await inviteSelfService(employee.id).unwrap();
      setLinkCopied(false);
      setInviteLink(`${window.location.origin}/staff-invite?token=${result.inviteToken}`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create self-service invite.');
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
  };

  const employees = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (data?.limit ?? 20)));

  const handleTerminateConfirm = async () => {
    if (!terminatingEmployee) return;
    try {
      await terminateEmployee(terminatingEmployee.id).unwrap();
      toast.success('Employee terminated.');
      setTerminatingEmployee(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to terminate employee.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Employees
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {total}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Centralized employee records and profiles</p>
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
            onClick={() => setFormState({ open: true, employee: null })}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, employee code, email, or phone..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full text-sm text-slate-800 focus:outline-none bg-transparent"
          />
        </div>
        <select
          value={departmentId}
          onChange={(e) => {
            setPage(1);
            setDepartmentId(e.target.value);
          }}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-600"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as EmploymentStatus | '');
          }}
          className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-600"
        >
          <option value="">All Statuses</option>
          {(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] as EmploymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                </>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No employees found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click "Add Employee" to start building your team roster.
                    </p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 text-white font-extrabold text-sm rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{emp.fullName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{emp.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {emp.department?.name || <span className="text-slate-300">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {emp.designation || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        {emp.employmentType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[emp.employmentStatus]}`}
                      >
                        {emp.employmentStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(emp.dateOfJoining).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button
                        onClick={() => setFormState({ open: true, employee: emp })}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit employee"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {emp.employmentStatus !== 'TERMINATED' && !emp.linkedUserId && emp.email && (
                        <button
                          onClick={() => handleInviteSelfService(emp)}
                          disabled={isInviting}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                          title="Invite to self-service"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                      )}
                      {emp.linkedUserId && (
                        <span
                          className="inline-flex items-center p-2 text-emerald-500"
                          title="Self-service login linked"
                        >
                          <KeyRound className="w-4 h-4" />
                        </span>
                      )}
                      {emp.employmentStatus !== 'TERMINATED' && (
                        <button
                          onClick={() => setTerminatingEmployee(emp)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                          title="Terminate employee"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing page <span className="font-bold text-slate-700">{page}</span> of{' '}
              <span className="font-bold text-slate-700">{totalPages}</span> · {total} total employees
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <EmployeeFormModal
        isOpen={formState.open}
        employee={formState.employee}
        onClose={() => setFormState({ open: false, employee: null })}
      />

      {/* Terminate Confirmation */}
      <Modal
        isOpen={!!terminatingEmployee}
        onClose={() => setTerminatingEmployee(null)}
        title="Terminate Employee?"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setTerminatingEmployee(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTerminateConfirm}
              disabled={isTerminating}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
            >
              {isTerminating ? 'Terminating...' : 'Yes, Terminate'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-slate-600">
          Are you sure you want to terminate <strong>{terminatingEmployee?.fullName}</strong>? Their record is
          kept for historical attendance and payroll, but they'll no longer count as an active employee.
        </div>
      </Modal>

      {/* Self-Service Invite Link */}
      <Modal
        isOpen={!!inviteLink}
        onClose={() => setInviteLink(null)}
        title="Self-Service Invite Created"
        icon={<KeyRound className="w-5 h-5" />}
        size="sm"
        footer={
          <button
            onClick={() => setInviteLink(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
          >
            Done
          </button>
        }
      >
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Share this link with the employee. They'll set a password, log in, and see only their own leave
            requests and balance under "My Leave".
          </p>
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <code className="flex-1 text-xs text-slate-700 break-all">{inviteLink}</code>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition shrink-0"
              title="Copy link"
            >
              {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10.5px] text-slate-400">This link expires in 7 days.</p>
        </div>
      </Modal>
    </div>
  );
}
