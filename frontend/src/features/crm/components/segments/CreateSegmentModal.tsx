'use client';

import React, { useEffect, useState } from 'react';
import { X, Layers, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  CustomerSegment,
  SegmentRuleCondition,
  SegmentRuleField,
  SegmentRuleOperator,
} from '../../types/crm.types';
import { useCreateCrmSegmentMutation, useUpdateCrmSegmentMutation } from '../../api/crmApi';

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment?: CustomerSegment | null;
}

const FIELD_OPTIONS: { value: SegmentRuleField; label: string }[] = [
  { value: 'totalSpent', label: 'Total Spent (BDT)' },
  { value: 'ordersCount', label: 'Orders Count' },
  { value: 'daysSinceLastOrder', label: 'Days Since Last Order' },
  { value: 'status', label: 'Customer Status' },
  { value: 'origin', label: 'Acquisition Origin' },
  { value: 'source', label: 'Customer Source' },
];

const OPERATOR_OPTIONS: { value: SegmentRuleOperator; label: string }[] = [
  { value: 'eq', label: 'is equal to' },
  { value: 'neq', label: 'is not equal to' },
  { value: 'gt', label: 'is greater than' },
  { value: 'gte', label: 'is greater than or equal to' },
  { value: 'lt', label: 'is less than' },
  { value: 'lte', label: 'is less than or equal to' },
];

const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'GUEST'];

let conditionIdSeq = 0;
const nextConditionId = () => `cond-${++conditionIdSeq}`;

type DraftCondition = SegmentRuleCondition & { _id: string };

const emptyCondition = (): DraftCondition => ({
  _id: nextConditionId(),
  field: 'totalSpent',
  operator: 'gte',
  value: '',
});

const toDraftConditions = (conditions?: SegmentRuleCondition[]): DraftCondition[] => {
  if (!conditions || conditions.length === 0) return [emptyCondition()];
  return conditions.map((c) => ({ ...c, _id: nextConditionId() }));
};

export const CreateSegmentModal: React.FC<CreateSegmentModalProps> = ({
  isOpen,
  onClose,
  segment,
}) => {
  const isEditMode = Boolean(segment);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matchType, setMatchType] = useState<'ALL' | 'ANY'>('ALL');
  const [conditions, setConditions] = useState<DraftCondition[]>([emptyCondition()]);

  const [createSegment, { isLoading: isCreating }] = useCreateCrmSegmentMutation();
  const [updateSegment, { isLoading: isUpdating }] = useUpdateCrmSegmentMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setMatchType(segment.rules?.matchType || 'ALL');
      setConditions(toDraftConditions(segment.rules?.conditions));
    } else {
      setName('');
      setDescription('');
      setMatchType('ALL');
      setConditions([emptyCondition()]);
    }
  }, [isOpen, segment]);

  if (!isOpen) return null;

  const updateCondition = (id: string, patch: Partial<SegmentRuleCondition>) => {
    setConditions((prev) => prev.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, emptyCondition()]);
  };

  const removeCondition = (id: string) => {
    setConditions((prev) => (prev.length > 1 ? prev.filter((c) => c._id !== id) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Segment name is required.');
      return;
    }

    const cleanedConditions: SegmentRuleCondition[] = conditions
      .filter((c) => String(c.value).trim() !== '')
      .map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.field === 'totalSpent' || c.field === 'ordersCount' || c.field === 'daysSinceLastOrder'
          ? Number(c.value)
          : c.value,
      }));

    if (cleanedConditions.length === 0) {
      toast.error('Add at least one rule condition.');
      return;
    }

    try {
      if (isEditMode && segment) {
        await updateSegment({
          id: segment.id,
          name: name.trim(),
          description: description.trim() || undefined,
          rules: { matchType, conditions: cleanedConditions },
        }).unwrap();
        toast.success(`Segment "${name}" updated successfully!`);
      } else {
        await createSegment({
          name: name.trim(),
          description: description.trim() || 'Custom filter rule segment',
          rules: { matchType, conditions: cleanedConditions },
          isActive: true,
        }).unwrap();
        toast.success(`Segment "${name}" created successfully!`);
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save segment. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isEditMode ? 'Edit Audience Segment' : 'Create Audience Segment'}
              </h2>
              <p className="text-xs text-slate-500">Define dynamic filtering rules for customer targeting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs overflow-y-auto pr-1">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Segment Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 🌟 Eid Big Spenders"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the target audience for this segment..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/30 focus:outline-none"
            />
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-purple-900 text-xs">Rule Conditions</h4>
              <div className="flex items-center bg-white border border-purple-200 rounded-lg p-0.5">
                {(['ALL', 'ANY'] as const).map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setMatchType(mt)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase transition-all ${
                      matchType === mt
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-purple-700'
                    }`}
                  >
                    Match {mt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {conditions.map((cond) => (
                <div
                  key={cond._id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5 items-center bg-white p-2 rounded-xl border border-slate-200"
                >
                  <select
                    value={cond.field}
                    onChange={(e) => updateCondition(cond._id, { field: e.target.value as SegmentRuleField })}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold"
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond._id, { operator: e.target.value as SegmentRuleOperator })}
                    className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold"
                  >
                    {OPERATOR_OPTIONS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {cond.field === 'status' ? (
                    <select
                      value={String(cond.value)}
                      onChange={(e) => updateCondition(cond._id, { value: e.target.value })}
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold"
                    >
                      <option value="">Select...</option>
                      {STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={['totalSpent', 'ordersCount', 'daysSinceLastOrder'].includes(cond.field) ? 'number' : 'text'}
                      value={cond.value}
                      onChange={(e) => updateCondition(cond._id, { value: e.target.value })}
                      placeholder="Value"
                      className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold w-full"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => removeCondition(cond._id)}
                    disabled={conditions.length === 1}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove condition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addCondition}
              className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 hover:text-purple-900 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add condition</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isEditMode ? 'Save Changes' : 'Save Segment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
