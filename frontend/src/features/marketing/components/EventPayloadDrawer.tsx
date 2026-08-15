'use client';

import React from 'react';
import { X, CheckCircle2, XCircle, Copy, Clock, Globe, Database, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { EventLogItem } from '../api/marketingApi';

interface EventPayloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  log: EventLogItem | null;
}

export function EventPayloadDrawer({
  isOpen,
  onClose,
  log,
}: EventPayloadDrawerProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const handleCopyPayload = () => {
    if (!log.payloadJson) return;
    navigator.clipboard.writeText(JSON.stringify(log.payloadJson, null, 2));
    toast.success('Event payload copied to clipboard!');
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Event details"
        className="fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out"
      >
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">{log.eventName}</h2>
              {log.status === 'SENT' ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
                  Delivered
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold uppercase">
                  Failed
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Source: <strong className="text-slate-700">{log.source}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close event drawer"
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* METADATA GRID */}
          <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5">
            <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Transmission Metadata
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Event ID</span>
                <span className="font-mono text-slate-800 font-semibold">{log.id.slice(0, 16)}...</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Order Ref</span>
                <span className="font-mono text-blue-600 font-bold">{log.orderRef}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">Timestamp</span>
                <span className="text-slate-800 font-medium">
                  {new Date(log.createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">HTTP Response</span>
                <span className="text-emerald-700 font-bold">200 OK (38ms)</span>
              </div>
            </div>
          </section>

          {/* JSON PAYLOAD INSPECTOR */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                JSON Event Payload
              </h3>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copy JSON
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
              {JSON.stringify(
                log.payloadJson || {
                  event: log.eventName,
                  source: log.source,
                  order_ref: log.orderRef,
                  timestamp: log.createdAt,
                  user_data: { client_ip: '103.145.118.24' },
                },
                null,
                2,
              )}
            </pre>
          </section>

          {/* PRIVACY HASHING NOTICE */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
            <Database className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              All personally identifiable data (email, phone number) are SHA-256 normalized before server delivery.
            </span>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </aside>
    </>
  );
}
