'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Users,
  Loader2,
  Layers,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  useCreateCustomerSegmentMutation,
  useUpdateCustomerSegmentMutation,
  usePreviewCustomerSegmentMutation,
  CustomerSegment,
  SegmentRuleCondition,
} from '../api/customerApi';
import { toast } from 'sonner';

interface SegmentModalProps {
  isOpen: boolean;
  segment?: CustomerSegment | null;
  onClose: () => void;
}

export function SegmentModal({ isOpen, segment, onClose }: SegmentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matchType, setMatchType] = useState<'ALL' | 'ANY'>('ALL');
  const [conditions, setConditions] = useState<SegmentRuleCondition[]>([
    { field: 'ordersCount', operator: 'gte', value: 2 },
  ]);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const [createSegment, { isLoading: isCreating }] = useCreateCustomerSegmentMutation();
  const [updateSegment, { isLoading: isUpdating }] = useUpdateCustomerSegmentMutation();
  const [previewSegment, { isLoading: isPreviewing }] = usePreviewCustomerSegmentMutation();

  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setMatchType(segment.rules?.matchType || 'ALL');
      setConditions(segment.rules?.conditions || [{ field: 'ordersCount', operator: 'gte', value: 2 }]);
    } else {
      setName('');
      setDescription('');
      setMatchType('ALL');
      setConditions([{ field: 'ordersCount', operator: 'gte', value: 2 }]);
    }
  }, [segment, isOpen]);

  // Live preview recalculation
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(async () => {
      try {
        const res = await previewSegment({ matchType, conditions }).unwrap();
        setPreviewCount(res.customerCount);
      } catch (err) {
        // silent catch
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [matchType, conditions, isOpen]);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    setConditions((prev) => [...prev, { field: 'totalSpent', operator: 'gte', value: 5000 }]);
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length <= 1) {
      toast.error('Segment must contain at least one rule condition.');
      return;
    }
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, key: keyof SegmentRuleCondition, val: any) => {
    setConditions((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [key]: val };
      // Set sensible default value when field changes
      if (key === 'field') {
        if (val === 'status') updated.value = 'ACTIVE';
        else if (val === 'origin') updated.value = 'facebook';
        else if (val === 'totalSpent') updated.value = 5000;
        else if (val === 'daysSinceLastOrder') updated.value = 30;
        else updated.value = 2;
      }
      next[index] = updated;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Segment name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      rules: {
        matchType,
        conditions: conditions.map((c) => ({
          ...c,
          value: typeof c.value === 'string' && !isNaN(Number(c.value)) && c.field !== 'status' && c.field !== 'origin' && c.field !== 'source' ? Number(c.value) : c.value,
        })),
      },
    };

    try {
      if (segment) {
        await updateSegment({ id: segment.id, data: payload }).unwrap();
        toast.success('Customer segment updated successfully');
      } else {
        await createSegment(payload).unwrap();
        toast.success('Customer segment created successfully');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save customer segment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">
                {segment ? 'Edit Customer Segment' : 'Create Customer Segment'}
              </h2>
              <p className="text-xs text-slate-500">Define rule criteria for automated customer grouping</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Segment Name & Description */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Segment Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. High Value VIPs, Repeat Buyers, Inactive Customers"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Customers who placed 2 or more orders with spend ≥ ৳5,000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs"
              />
            </div>
          </div>

          {/* Rule Match Condition Header */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider">Rule Conditions</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium text-xs">Match:</span>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">ALL Conditions (AND)</option>
                  <option value="ANY">ANY Condition (OR)</option>
                </select>
              </div>
            </div>

            {/* Condition Rows */}
            <div className="space-y-3">
              {conditions.map((cond, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) => handleConditionChange(idx, 'field', e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-xs"
                  >
                    <option value="ordersCount">Total Orders</option>
                    <option value="totalSpent">Total Spent (৳)</option>
                    <option value="daysSinceLastOrder">Days Inactive</option>
                    <option value="origin">Marketing Origin</option>
                    <option value="status">Customer Status</option>
                  </select>

                  {/* Operator Selector */}
                  <select
                    value={cond.operator}
                    onChange={(e) => handleConditionChange(idx, 'operator', e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-xs"
                  >
                    <option value="gte">≥</option>
                    <option value="lte">≤</option>
                    <option value="gt">&gt;</option>
                    <option value="lt">&lt;</option>
                    <option value="eq">=</option>
                    <option value="neq">≠</option>
                  </select>

                  {/* Value Input */}
                  {cond.field === 'status' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-xs"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  ) : cond.field === 'origin' ? (
                    <select
                      value={cond.value}
                      onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none text-xs"
                    >
                      <option value="direct">Direct Traffic</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="google">Google</option>
                      <option value="youtube">YouTube</option>
                      <option value="organic_search">Organic Search</option>
                      <option value="social">Social Media</option>
                      <option value="referral">Referral</option>
                      <option value="email">Email Campaign</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={cond.value}
                      onChange={(e) => handleConditionChange(idx, 'value', e.target.value)}
                      placeholder="Value"
                      required
                      className="w-28 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none text-xs"
                    />
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    title="Remove condition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddCondition}
              className="w-full py-2.5 bg-white border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 text-blue-600 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Condition
            </button>
          </div>

          {/* Live Preview Count Card */}
          <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="font-extrabold text-blue-900 text-xs">Estimated Matching Customers:</span>
            </div>

            {isPreviewing ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <span className="font-black text-blue-700 text-sm">
                {previewCount !== null ? `${previewCount} ${previewCount === 1 ? 'customer' : 'customers'}` : '—'}
              </span>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {isCreating || isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Segment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

