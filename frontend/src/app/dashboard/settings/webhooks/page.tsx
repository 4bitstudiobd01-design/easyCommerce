'use client';

import React, { useState } from 'react';
import { Link2, Plus, Trash2, Loader2, Send, AlertCircle, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import {
  useGetWebhooksQuery,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  type WebhookEvent,
  type StoreWebhook,
} from '@/features/tenant/api/tenantApi';

const ALL_EVENTS: { value: WebhookEvent; label: string }[] = [
  { value: 'ORDER_CREATED', label: 'Order created' },
  { value: 'ORDER_STATUS_UPDATED', label: 'Order status updated' },
  { value: 'ORDER_CANCELLED', label: 'Order cancelled' },
  { value: 'PAYMENT_COMPLETED', label: 'Payment completed' },
  { value: 'PRODUCT_CREATED', label: 'Product created' },
  { value: 'PRODUCT_UPDATED', label: 'Product updated' },
  { value: 'CUSTOMER_CREATED', label: 'Customer created' },
];

export default function WebhooksSettingsPage() {
  const { data: webhooks = [], isLoading } = useGetWebhooksQuery();
  const [createWebhook, { isLoading: isCreating }] = useCreateWebhookMutation();
  const [updateWebhook] = useUpdateWebhookMutation();
  const [deleteWebhook] = useDeleteWebhookMutation();
  const [testWebhook, { isLoading: isTesting }] = useTestWebhookMutation();

  const [showForm, setShowForm] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  const handleCreate = async () => {
    if (!targetUrl.trim()) {
      toast.error('Enter the URL that should receive events.');
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error('Select at least one event to subscribe to.');
      return;
    }

    try {
      await createWebhook({ targetUrl: targetUrl.trim(), events: selectedEvents }).unwrap();
      toast.success('Webhook endpoint registered.');
      setTargetUrl('');
      setSelectedEvents([]);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to register webhook.');
    }
  };

  const handleTest = async (hook: StoreWebhook) => {
    setTestingId(hook.id);
    try {
      const res = await testWebhook(hook.id).unwrap();
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Test delivery failed.');
    } finally {
      setTestingId(null);
    }
  };

  const handleToggle = async (hook: StoreWebhook) => {
    try {
      await updateWebhook({ id: hook.id, data: { isActive: !hook.isActive } }).unwrap();
      toast.success(hook.isActive ? 'Webhook paused.' : 'Webhook activated.');
    } catch {
      toast.error('Failed to update webhook.');
    }
  };

  const handleDelete = async (hook: StoreWebhook) => {
    try {
      await deleteWebhook(hook.id).unwrap();
      toast.success('Webhook deleted.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete webhook.');
    }
  };

  return (
    <SettingsPageShell
      icon={Link2}
      iconBgColor="bg-purple-50"
      iconColor="text-purple-600"
      title="Webhooks"
      description="Send real-time events from your store to your own systems. Every request is signed so you can verify it."
      isLoading={isLoading}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
              Endpoints ({webhooks.length})
            </h2>
            <p className="text-[11.5px] font-medium text-slate-500 mt-0.5">
              Payloads are signed with HMAC-SHA256 in the <code className="font-mono">x-easycommerce-signature</code> header.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Endpoint
            </button>
          )}
        </div>

        {showForm && (
          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-slate-700">Endpoint URL</label>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-app.com/hooks/easycommerce"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12.5px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[11.5px] font-bold text-slate-700">Subscribe to events</label>
              <div className="flex flex-wrap gap-2">
                {ALL_EVENTS.map((event) => {
                  const active = selectedEvents.includes(event.value);
                  return (
                    <button
                      key={event.value}
                      type="button"
                      onClick={() => toggleEvent(event.value)}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold border transition-colors ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {event.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setTargetUrl('');
                  setSelectedEvents([]);
                }}
                className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Endpoint
              </button>
            </div>
          </div>
        )}

        {webhooks.length === 0 && !showForm ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Webhook className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] font-bold text-slate-900">No webhook endpoints</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1 max-w-sm mx-auto">
              Add an endpoint to receive order, payment and product events in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {webhooks.map((hook) => (
              <div key={hook.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12.5px] font-extrabold text-slate-900 font-mono truncate">
                        {hook.targetUrl}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          hook.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {hook.isActive ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(hook.events || []).map((e) => (
                        <span
                          key={e}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTest(hook)}
                      disabled={isTesting && testingId === hook.id}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                    >
                      {isTesting && testingId === hook.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(hook)}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {hook.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(hook)}
                      aria-label="Delete webhook"
                      className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {hook.lastError && hook.failureCount > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-red-700">
                      Last delivery failed ({hook.failureCount} consecutive): {hook.lastError}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">Secret</span>
                  <code className="text-[11px] font-mono text-slate-500 select-all">{hook.secret}</code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
