'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CalendarRange, CalendarPlus, RefreshCw, Ban, Paperclip, ShieldOff, UserCircle2 } from 'lucide-react';
import {
  LeaveStatus,
  useGetMyEmployeeQuery,
  useGetMyLeaveBalanceQuery,
  useGetMyLeaveRequestsQuery,
  useCancelMyLeaveRequestMutation,
  openMyLeaveDocument,
} from '../api/hrmApi';
import { MyLeaveRequestModal } from './MyLeaveRequestModal';

const STATUS_BADGE: Record<LeaveStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-100 text-slate-600',
};

const TYPE_BADGE: Record<string, string> = {
  EARNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  CASUAL: 'bg-sky-50 text-sky-700 border-sky-200',
  SICK: 'bg-rose-50 text-rose-700 border-rose-200',
};

export function MyLeaveView() {
  const { data: me, isLoading: isMeLoading, isError: isMeError, error: meError } = useGetMyEmployeeQuery();
  const { data: balance = [] } = useGetMyLeaveBalanceQuery(undefined, { skip: !me });
  const { data, isLoading, isFetching, refetch } = useGetMyLeaveRequestsQuery(undefined, { skip: !me });
  const [cancelRequest] = useCancelMyLeaveRequestMutation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const requests = data?.items ?? [];

  const handleCancel = async (id: string) => {
    try {
      await cancelRequest(id).unwrap();
      toast.success('Leave request cancelled.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to cancel leave request.');
    }
  };

  const handleViewDocument = async (id: string) => {
    try {
      await openMyLeaveDocument(id);
    } catch {
      toast.error('Could not load the attached document.');
    }
  };

  if (isMeLoading) {
    return <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center text-slate-400">Loading...</div>;
  }

  if (isMeError) {
    const message = (meError as any)?.data?.message;
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 text-center">
        <ShieldOff className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-800">This account isn't linked to an employee record.</p>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          {message || 'Ask your HR admin to invite you to self-service using the same email as your employee record, then reload this page.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-purple-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{me?.fullName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {me?.employeeCode}
              {me?.designation ? ` · ${me.designation}` : ''}
              {me?.department?.name ? ` · ${me.department.name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <CalendarPlus className="w-4 h-4" />
            New Leave Request
          </button>
        </div>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balance.map((line) => (
          <div key={line.leaveType} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{line.leaveType} Leave</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {line.remaining} <span className="text-sm font-semibold text-slate-400">/ {line.allocated} days</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{line.used} used this year</div>
          </div>
        ))}
      </div>

      {/* My Leave Requests */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <CalendarRange className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No leave requests yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Click "New Leave Request" to file one.</p>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${TYPE_BADGE[request.leaveType]}`}>
                        {request.leaveType}
                        {request.documentFileId && <Paperclip className="w-3 h-3" />}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(request.startDate).toLocaleDateString()} – {new Date(request.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">{request.totalDays}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[request.status]}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {request.documentFileId && (
                          <button
                            onClick={() => handleViewDocument(request.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View attached document"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                        )}
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(request.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                            title="Cancel"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MyLeaveRequestModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
