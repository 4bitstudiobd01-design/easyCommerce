'use client';

import React from 'react';
import { useGetMarketingLogsQuery, type EventLogItem } from '../api/marketingApi';
import { Eye, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface EventLogsTableProps {
  onViewPayload?: (log: EventLogItem) => void;
}

function formatRelativeTime(dateString?: string) {
  if (!dateString) return '-';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hr ago`;
  return new Date(dateString).toLocaleDateString();
}

export function EventLogsTable({ onViewPayload }: EventLogsTableProps) {
  const { data, isLoading } = useGetMarketingLogsQuery({});

  if (isLoading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Event Log</h2>
            <p className="text-xs text-slate-500 mt-1">Real-time events sent to your pixels</p>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="p-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  const logs = data.data || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Event Log</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Real-time events sent to your pixels</p>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (logs.length > 0 && onViewPayload) {
                onViewPayload(logs[0]);
              }
            }}
            className="h-8 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-lg flex items-center transition-colors shrink-0"
          >
            View All Logs ({data.total})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-left text-xs text-slate-900">
              <th className="py-2.5 px-4 font-bold w-1/5">Event</th>
              <th className="py-2.5 px-4 font-bold w-1/5">Source</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Order / Ref</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Status</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Time</th>
              <th className="py-2.5 px-4 font-bold w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <Activity className="w-6 h-6 mx-auto mb-2 text-slate-300 opacity-60" />
                  <p className="font-bold text-xs text-slate-600">No marketing events recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Connect a pixel and click &quot;Test All Pixels&quot; or fire a test event above to start streaming.
                  </p>
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr 
                  key={log.id} 
                  className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx === logs.length - 1 ? 'border-b-0' : ''}`}
                >
                  <td className="py-2.5 px-4 font-bold text-slate-900">{log.eventName}</td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium">{log.source}</td>
                  <td className="py-2.5 px-4">
                    <span className={`font-medium ${log.orderRef && log.orderRef !== '-' ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                      {log.orderRef || '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    {log.status === 'SENT' ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-bold text-emerald-600 text-[10px] uppercase tracking-wider">Sent</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="font-bold text-red-600 text-[10px] uppercase tracking-wider">Failed</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 font-medium">
                    {formatRelativeTime(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onViewPayload && onViewPayload(log)}
                      title="Inspect event payload"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
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
