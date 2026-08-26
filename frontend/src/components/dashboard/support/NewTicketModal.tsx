'use client';

import React, { useState } from 'react';
import {
  X,
  Ticket,
  User,
  Store,
  Mail,
  HelpCircle,
  AlertCircle,
  Send,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TicketRecord,
  TicketCategory,
  TicketPriority,
  TicketChannel,
} from './types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: Partial<TicketRecord>) => void;
}

export function NewTicketModal({
  isOpen,
  onClose,
  onAddTicket,
}: NewTicketModalProps) {
  const [subject, setSubject] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [category, setCategory] = useState<TicketCategory>('Billing & Payments');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [channel, setChannel] = useState<TicketChannel>('Web');
  const [assignedAgent, setAssignedAgent] = useState('Sarah Jenkins');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !storeName.trim() || !merchantEmail.trim() || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCodeNumber = Math.floor(100000 + Math.random() * 900000);
    const newTicket: TicketRecord = {
      id: `tkt-${Date.now()}`,
      codeId: `TKT-2026-00${newCodeNumber}`,
      createdAt: 'Aug 14, 2026',
      subject: subject.trim(),
      category,
      categoryDetail: category,
      merchant: {
        id: `m-${Date.now()}`,
        name: merchantName.trim() || 'Store Owner',
        email: merchantEmail.trim(),
        storeName: storeName.trim(),
        subdomain: `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.easyco.com`,
        plan: 'Business',
      },
      priority,
      status: 'Open',
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
      channel,
      assignedAgent: {
        name: assignedAgent,
        email: `${assignedAgent.toLowerCase().replace(' ', '.')}@easycommerce.com`,
      },
      description: description.trim(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          authorName: merchantName.trim() || 'Store Owner',
          authorRole: 'Merchant',
          content: description.trim(),
          timestamp: 'Just now',
        },
      ],
    };

    onAddTicket(newTicket);
    toast.success(`Support ticket ${newTicket.codeId} created successfully!`);
    onClose();

    // Reset form
    setSubject('');
    setMerchantName('');
    setStoreName('');
    setMerchantEmail('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Create New Support Ticket
              </h2>
              <p className="text-xs text-slate-500">
                Open a new ticket on behalf of a merchant or internal query.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Checkout payment webhook failure"
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Merchant / Store Info (2 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Store Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Apex Footwear"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Merchant Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Classification (Category, Priority, Channel) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Billing & Payments">Billing & Payments</option>
                <option value="Account & Access">Account & Access</option>
                <option value="Technical Issues">Technical Issues</option>
                <option value="Store Management">Store Management</option>
                <option value="Feature Requests">Feature Requests</option>
                <option value="Domain & SSL">Domain & SSL</option>
                <option value="Product Management">Product Management</option>
                <option value="Refund & Payout">Refund & Payout</option>
                <option value="Other">Other</option>
              </select>
            </div>

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

          {/* Assigned Agent */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assign Agent
            </label>
            <select
              value={assignedAgent}
              onChange={(e) => setAssignedAgent(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Sarah Jenkins">Sarah Jenkins (Senior Billing Lead)</option>
              <option value="Alex Rivera">Alex Rivera (Platform Engineer)</option>
              <option value="David Miller">David Miller (Security & DevOps)</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Initial Message / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Issue Description / Initial Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete description of the issue or merchant inquiry..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
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
              className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
