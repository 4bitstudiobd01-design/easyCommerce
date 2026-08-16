'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Loader2, Pencil, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import {
  useGetDeliveryZonesQuery,
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
  useDeleteDeliveryZoneMutation,
  useGetMyStoreQuery,
  type DeliveryZone,
} from '@/features/tenant/api/tenantApi';

interface ZoneDraft {
  name: string;
  areas: string;
  deliveryCharge: string;
  estimatedDeliveryTime: string;
}

const EMPTY_DRAFT: ZoneDraft = { name: '', areas: '', deliveryCharge: '', estimatedDeliveryTime: '' };

const inputClass =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12.5px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all';

export default function DeliveryZonesPage() {
  const { data: store } = useGetMyStoreQuery();
  const { data: zones = [], isLoading } = useGetDeliveryZonesQuery();
  const [createZone, { isLoading: isCreating }] = useCreateDeliveryZoneMutation();
  const [updateZone] = useUpdateDeliveryZoneMutation();
  const [deleteZone] = useDeleteDeliveryZoneMutation();

  const [draft, setDraft] = useState<ZoneDraft>(EMPTY_DRAFT);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ZoneDraft>(EMPTY_DRAFT);

  const currency = store?.currency || 'BDT';

  const parseAreas = (raw: string) =>
    raw
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast.error('Give the zone a name.');
      return;
    }
    const charge = Number(draft.deliveryCharge);
    if (!Number.isFinite(charge) || charge < 0) {
      toast.error('Enter a valid delivery charge.');
      return;
    }

    try {
      await createZone({
        name: draft.name.trim(),
        areas: parseAreas(draft.areas),
        deliveryCharge: charge,
        estimatedDeliveryTime: draft.estimatedDeliveryTime.trim() || undefined,
      }).unwrap();
      toast.success(`Zone "${draft.name.trim()}" created.`);
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create delivery zone.');
    }
  };

  const startEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setEditDraft({
      name: zone.name,
      areas: (zone.areas || []).join(', '),
      deliveryCharge: String(zone.deliveryCharge),
      estimatedDeliveryTime: zone.estimatedDeliveryTime || '',
    });
  };

  const handleUpdate = async (id: string) => {
    const charge = Number(editDraft.deliveryCharge);
    if (!editDraft.name.trim() || !Number.isFinite(charge) || charge < 0) {
      toast.error('Zone name and a valid delivery charge are required.');
      return;
    }

    try {
      await updateZone({
        id,
        data: {
          name: editDraft.name.trim(),
          areas: parseAreas(editDraft.areas),
          deliveryCharge: charge,
          estimatedDeliveryTime: editDraft.estimatedDeliveryTime.trim() || undefined,
        },
      }).unwrap();
      toast.success('Zone updated.');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update zone.');
    }
  };

  const handleToggleActive = async (zone: DeliveryZone) => {
    try {
      await updateZone({ id: zone.id, data: { isActive: !zone.isActive } }).unwrap();
      toast.success(zone.isActive ? 'Zone disabled.' : 'Zone enabled.');
    } catch {
      toast.error('Failed to update zone.');
    }
  };

  const handleDelete = async (zone: DeliveryZone) => {
    try {
      await deleteZone(zone.id).unwrap();
      toast.success(`Zone "${zone.name}" deleted.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete zone.');
    }
  };

  return (
    <SettingsPageShell
      icon={MapPin}
      iconBgColor="bg-blue-50"
      iconColor="text-blue-600"
      title="Delivery Zones"
      description="Define delivery areas with their own charges and estimated delivery times."
      isLoading={isLoading}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
              Zones ({zones.length})
            </h2>
            <p className="text-[11.5px] font-medium text-slate-500 mt-0.5">
              Checkout matches a customer&apos;s city or area against these zones to price delivery.
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-xl shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Zone
            </button>
          )}
        </div>

        {showForm && (
          <div className="p-4 bg-blue-50/40 border border-blue-100 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Zone name (e.g. Inside Dhaka)"
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                value={draft.deliveryCharge}
                onChange={(e) => setDraft({ ...draft, deliveryCharge: e.target.value })}
                placeholder={`Delivery charge (${currency})`}
                className={inputClass}
              />
              <input
                value={draft.areas}
                onChange={(e) => setDraft({ ...draft, areas: e.target.value })}
                placeholder="Areas, comma separated (dhanmondi, gulshan)"
                className={inputClass}
              />
              <input
                value={draft.estimatedDeliveryTime}
                onChange={(e) => setDraft({ ...draft, estimatedDeliveryTime: e.target.value })}
                placeholder="Estimated time (e.g. 1-2 days)"
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setDraft(EMPTY_DRAFT);
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
                Create Zone
              </button>
            </div>
          </div>
        )}

        {zones.length === 0 && !showForm ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <MapPin className="w-7 h-7 text-slate-300 mx-auto mb-2" />
            <p className="text-[13px] font-bold text-slate-900">No delivery zones yet</p>
            <p className="text-[11.5px] font-medium text-slate-500 mt-1 max-w-sm mx-auto">
              Without zones, checkout falls back to your default flat delivery rate.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {zones.map((zone) =>
              editingId === zone.id ? (
                <div key={zone.id} className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      type="number"
                      min={0}
                      value={editDraft.deliveryCharge}
                      onChange={(e) => setEditDraft({ ...editDraft, deliveryCharge: e.target.value })}
                      className={inputClass}
                    />
                    <input
                      value={editDraft.areas}
                      onChange={(e) => setEditDraft({ ...editDraft, areas: e.target.value })}
                      placeholder="Areas, comma separated"
                      className={inputClass}
                    />
                    <input
                      value={editDraft.estimatedDeliveryTime}
                      onChange={(e) => setEditDraft({ ...editDraft, estimatedDeliveryTime: e.target.value })}
                      placeholder="Estimated time"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11.5px] font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdate(zone.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11.5px] font-bold rounded-lg flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={zone.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-extrabold text-slate-900">{zone.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          zone.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {zone.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-[11.5px] font-medium text-slate-500 mt-1 truncate">
                      {(zone.areas || []).length > 0 ? zone.areas.join(', ') : 'No areas mapped'}
                      {zone.estimatedDeliveryTime ? ` · ${zone.estimatedDeliveryTime}` : ''}
                    </p>
                  </div>

                  <span className="text-[13px] font-extrabold text-slate-900 shrink-0">
                    ৳{Number(zone.deliveryCharge).toLocaleString()}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(zone)}
                      className="px-2.5 py-1.5 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {zone.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(zone)}
                      aria-label={`Edit ${zone.name}`}
                      className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(zone)}
                      aria-label={`Delete ${zone.name}`}
                      className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
