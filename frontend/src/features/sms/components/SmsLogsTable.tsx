'use client';

import React from 'react';
import { useGetSmsLogsQuery } from '../api/smsApi';
import { MessageSquare, Phone, CheckCircle2, Clock, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export function SmsLogsTable() {
  const { data: logs = [], isLoading, isError, refetch } = useGetSmsLogsQuery();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Table Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Automated SMS Notification History</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live log of SMS messages dispatched to customer phones for order updates
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* SMS Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Recipient Phone</th>
              <th className="px-6 py-3.5">Message Content</th>
              <th className="px-6 py-3.5">Gateway</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {isLoading ? (
              <TableRowSkeleton columns={5} />
            ) : isError || logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No SMS notifications sent yet. SMS alerts will be triggered when customer orders are placed or shipped!
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{log.recipientPhone}</span>
                    </span>
                  </td>

                  <td className="px-6 py-4 max-w-xs sm:max-w-md">
                    <p className="text-slate-800 line-clamp-2 leading-relaxed text-xs">
                      {log.message}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[10px] rounded-full border border-slate-200">
                      {log.gateway}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {log.status === 'SENT' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>DISPATCHED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200 inline-flex items-center gap-1">
                        <Send className="w-3 h-3 text-blue-600" />
                        <span>SANDBOX LOG</span>
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right text-slate-400 font-medium text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
