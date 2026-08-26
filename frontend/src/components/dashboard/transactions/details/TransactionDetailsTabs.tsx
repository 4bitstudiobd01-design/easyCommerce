'use client';

import React, { useState } from 'react';
import { TransactionRecord } from '../types';
import { PaymentInformationCard } from './PaymentInformationCard';
import { GatewayInformationCard } from './GatewayInformationCard';
import { RelatedInformationCard } from './RelatedInformationCard';
import { Send, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionDetailsTabsProps {
  transaction: TransactionRecord;
}

export function TransactionDetailsTabs({
  transaction,
}: TransactionDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<
    'payment' | 'webhooks' | 'refunds' | 'notes' | 'activity'
  >('payment');

  const [notes, setNotes] = useState(
    transaction.notesList || [
      {
        id: 'note-1',
        author: 'Platform Admin',
        role: 'Superadmin',
        text: 'Automatic monthly renewal succeeded on first attempt via Stripe customer token.',
        createdAt: 'Aug 14, 2026 10:32 AM',
      },
    ]
  );
  const [newNote, setNewNote] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes([
      ...notes,
      {
        id: `note-${Date.now()}`,
        author: 'Platform Admin',
        role: 'Superadmin',
        text: newNote.trim(),
        createdAt: 'Just now',
      },
    ]);
    setNewNote('');
    toast.success('Internal note added');
  };

  const tabs = [
    { id: 'payment', label: 'Payment Details' },
    { id: 'webhooks', label: 'Webhook Events' },
    {
      id: 'refunds',
      label: `Refunds (${transaction.status === 'Refunded' ? '1' : '0'})`,
    },
    { id: 'notes', label: 'Notes' },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation Header */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Payment Details */}
      {activeTab === 'payment' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start animate-in fade-in duration-150">
          <PaymentInformationCard transaction={transaction} />
          <GatewayInformationCard transaction={transaction} />
          <RelatedInformationCard transaction={transaction} />
        </div>
      )}

      {/* Tab Content 2: Webhook Events */}
      {activeTab === 'webhooks' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
          <h3 className="font-bold text-slate-900 text-sm">
            Webhook Delivery Logs
          </h3>

          <div className="space-y-2.5">
            {(
              transaction.webhooks || [
                {
                  id: 'wh-1',
                  event: 'charge.succeeded',
                  status: 'Delivered',
                  statusCode: 200,
                  timestamp: 'Aug 14, 2026 10:31:30 AM',
                  payloadPreview:
                    '{"id": "evt_3M7tZtL2e", "type": "charge.succeeded", "amount": 500000}',
                },
                {
                  id: 'wh-2',
                  event: 'payment_intent.succeeded',
                  status: 'Delivered',
                  statusCode: 200,
                  timestamp: 'Aug 14, 2026 10:31:28 AM',
                  payloadPreview:
                    '{"id": "evt_3M7tZtL2e_pi", "type": "payment_intent.succeeded"}',
                },
              ]
            ).map((wh) => (
              <div
                key={wh.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono">
                      {wh.event}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {wh.statusCode} {wh.status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 block mt-1">
                    {wh.payloadPreview}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0">
                  {wh.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 3: Refunds */}
      {activeTab === 'refunds' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
          <h3 className="font-bold text-slate-900 text-sm">Refund Records</h3>

          {transaction.status === 'Refunded' ? (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  REF-2026-0008451
                </span>
                <span className="font-extrabold text-rose-600 text-sm">
                  - ৳2,500.00
                </span>
              </div>
              <p className="text-slate-600 text-xs">
                Full refund issued for plan downgrade. Processed back to
                original Visa card ending in 4242.
              </p>
              <span className="text-[11px] text-slate-400 block">
                Processed on Aug 13, 2026 11:20 AM by Platform Admin
              </span>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
              No refunds have been processed for this transaction.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Notes */}
      {activeTab === 'notes' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
          <h3 className="font-bold text-slate-900 text-sm">
            Internal Staff Notes
          </h3>

          <div className="space-y-2.5">
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {n.author}{' '}
                    <span className="text-slate-400 font-normal">
                      ({n.role})
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {n.createdAt}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note about this transaction..."
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Note</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab Content 5: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
          <h3 className="font-bold text-slate-900 text-sm">Audit Trail</h3>

          <div className="space-y-3">
            {[
              {
                action: 'Payment Captured',
                actor: 'Stripe Gateway',
                time: 'Aug 14, 2026 10:31:27 AM',
              },
              {
                action: 'Merchant Subscription Renewed',
                actor: 'System Automation',
                time: 'Aug 14, 2026 10:31:32 AM',
              },
              {
                action: 'Invoice Generated & Emailed',
                actor: 'Mailgun Delivery',
                time: 'Aug 14, 2026 10:31:35 AM',
              },
            ].map((act, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60"
              >
                <div>
                  <span className="font-bold text-slate-900 block">
                    {act.action}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    By {act.actor}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {act.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
