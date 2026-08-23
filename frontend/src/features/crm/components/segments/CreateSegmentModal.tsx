'use client';

import React, { useState } from 'react';
import { X, Layers, Plus, Sparkles, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerSegment } from '../../types/crm.types';

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSegmentCreated: (segment: CustomerSegment) => void;
}

export const CreateSegmentModal: React.FC<CreateSegmentModalProps> = ({
  isOpen,
  onClose,
  onSegmentCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minSpend, setMinSpend] = useState('10000');
  const [minOrders, setMinOrders] = useState('2');
  const [daysSinceLastOrder, setDaysSinceLastOrder] = useState('30');
  const [color, setColor] = useState('#8B5CF6');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Segment name is required.');
      return;
    }

    const newSegment: CustomerSegment = {
      id: `seg-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom filter rule segment',
      type: 'DYNAMIC',
      customerCount: Math.floor(12 + Math.random() * 25),
      avgSpend: Number(minSpend) || 12000,
      criteria: {
        minSpend: Number(minSpend) || undefined,
        minOrders: Number(minOrders) || undefined,
        daysSinceLastOrder: Number(daysSinceLastOrder) || undefined,
      },
      color,
      createdAt: new Date().toISOString(),
    };

    onSegmentCreated(newSegment);
    toast.success(`Segment "${name}" created successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Create Audience Segment</h2>
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
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
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
            <h4 className="font-bold text-purple-900 text-xs">Dynamic Rule Criteria</h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min. Total Spent (BDT)</label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Min. Orders Count</label>
                <input
                  type="number"
                  value={minOrders}
                  onChange={(e) => setMinOrders(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Days Inactive (Recency)</label>
              <input
                type="number"
                value={daysSinceLastOrder}
                onChange={(e) => setDaysSinceLastOrder(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
              />
            </div>
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
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Segment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
