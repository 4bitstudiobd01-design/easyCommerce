'use client';

import React, { useState } from 'react';
import { X, Edit, Send } from 'lucide-react';
import { toast } from 'sonner';
import { TicketRecord, TicketCategory, TicketPriority, TicketChannel } from '../types';

interface EditTicketModalProps {
  ticket: TicketRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TicketRecord) => void;
}

export function EditTicketModal({
  ticket,
  isOpen,
  onClose,
  onSave,
}: EditTicketModalProps) {
  const [subject, setSubject] = useState(ticket.subject);
  const [category, setCategory] = useState<TicketCategory>(ticket.category);
  const [subCategory, setSubCategory] = useState(ticket.subCategory || 'Plan Upgrade Issue');
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [channel, setChannel] = useState<TicketChannel>(ticket.channel);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }

    const updated: TicketRecord = {
      ...ticket,
      subject: subject.trim(),
      category,
      categoryDetail: category,
      subCategory: subCategory.trim(),
      priority,
      channel,
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
    };

    onSave(updated);
    toast.success('Ticket updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Edit Ticket #{ticket.codeId}
              </h2>
              <p className="text-xs text-slate-500">
                Update ticket classification and metadata.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Plan & Billing">Plan & Billing</option>
                <option value="Billing & Payments">Billing & Payments</option>
                <option value="Account & Access">Account & Access</option>
                <option value="Technical Issues">Technical Issues</option>
                <option value="Store Management">Store Management</option>
                <option value="Feature Requests">Feature Requests</option>
                <option value="Domain & SSL">Domain & SSL</option>
                <option value="Product Management">Product Management</option>
                <option value="Refund & Payout">Refund & Payout</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sub Category
              </label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as TicketChannel)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Web">Web</option>
                <option value="Email">Email</option>
                <option value="Chat">Chat</option>
                <option value="Phone">Phone</option>
                <option value="API">API</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
