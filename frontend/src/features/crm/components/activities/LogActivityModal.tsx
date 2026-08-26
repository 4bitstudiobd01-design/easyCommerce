'use client';

import React, { useState } from 'react';
import { X, Activity, Plus, PhoneCall, MessageCircle, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { CrmActivity, ActivityType } from '../../types/crm.types';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityLogged: (activity: CrmActivity) => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  onActivityLogged,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [type, setType] = useState<ActivityType>('CALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [outcome, setOutcome] = useState('Completed');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Activity title and summary description are required.');
      return;
    }

    const newActivity: CrmActivity = {
      id: `act-${Date.now()}`,
      tenantId: '9139e1ed-04cf-4778-810e-da3f248f1ffd',
      customerName: customerName.trim() || 'Store Prospect',
      type,
      title: title.trim(),
      description: description.trim(),
      authorName: 'MD Belal Hossain',
      authorRole: 'Store Merchant',
      outcome,
      createdAt: new Date().toISOString(),
    };

    onActivityLogged(newActivity);
    toast.success('Activity interaction logged successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Log Interaction</h2>
              <p className="text-xs text-slate-500">Record an omnichannel touchpoint with customer</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Interaction Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
              >
                <option value="CALL">📞 Phone Call</option>
                <option value="WHATSAPP">💬 WhatsApp Chat</option>
                <option value="NOTE">📝 Internal Staff Note</option>
                <option value="SMS">📩 SMS Outreach</option>
                <option value="MEETING">🤝 In-Person Store Visit</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
              >
                <option value="Completed">Completed / Resolved</option>
                <option value="Call Answered">Call Answered</option>
                <option value="No Answer">No Answer / Busy</option>
                <option value="Follow-up Required">Follow-up Required</option>
                <option value="Sent">Message Sent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Customer / Lead Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Tahmid Rahman"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Activity Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Order Delivery Address Confirmation"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Summary Details <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was discussed? Any special customer requests or delivery instructions?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
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
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
