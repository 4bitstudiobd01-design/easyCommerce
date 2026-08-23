'use client';

import React, { useState } from 'react';
import { X, Key, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { AccessRequestItem } from './types';
import { ACCESS_REQUESTS_DATA } from './rolesMockData';

interface AccessRequestsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestApproved?: (request: AccessRequestItem) => void;
}

export function AccessRequestsDrawer({
  isOpen,
  onClose,
  onRequestApproved,
}: AccessRequestsDrawerProps) {
  const [requests, setRequests] =
    useState<AccessRequestItem[]>(ACCESS_REQUESTS_DATA);

  if (!isOpen) return null;

  const handleApprove = (req: AccessRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success(`Access request approved: ${req.userName} is now ${req.requestedRole}`);
    onRequestApproved?.(req);
  };

  const handleReject = (req: AccessRequestItem) => {
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.error(`Access request from ${req.userName} was rejected.`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Access Requests ({requests.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pending privilege elevation approvals
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-200">
            {requests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="font-bold text-slate-700">All requests handled!</p>
                <p className="text-[11px]">No pending access requests at this time.</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        {req.userName}
                      </h4>
                      <span className="text-[11px] text-slate-400 block">
                        {req.userEmail}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {req.requestDate}
                    </span>
                  </div>

                  {/* Role Transition Badges */}
                  <div className="flex items-center gap-2 text-xs py-1">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                      {req.currentRole}
                    </span>
                    <span className="text-slate-400 font-bold">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                      {req.requestedRole}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed italic">
                    &quot;{req.reason}&quot;
                  </p>

                  {/* Approve / Reject Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleReject(req)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(req)}
                      className="px-3.5 py-1.5 bg-[#008060] hover:bg-[#006e52] text-white rounded-xl font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Approve Request
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
