'use client';

import React, { useState } from 'react';
import { X, Target, DollarSign, Phone, Mail, Building, FileText, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Lead, LeadSourceType, LeadStageType } from '../../types/crm.types';
import { useCreateCrmLeadMutation } from '../../api/crmApi';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (lead: Lead) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('15000');
  const [source, setSource] = useState<LeadSourceType>('WHATSAPP');
  const [stage, setStage] = useState<LeadStageType>('NEW');
  const [notes, setNotes] = useState('');

  const [createLead, { isLoading }] = useCreateCrmLeadMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Lead name and contact phone number are required.');
      return;
    }

    try {
      const serverLead = await createLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        companyName: companyName.trim() || undefined,
        estimatedValue: Number(estimatedValue) || 0,
        leadScore: 75,
        source,
        stage,
        notes: notes.trim() || undefined,
        tags: ['New Lead', source],
      }).unwrap();

      onLeadAdded(serverLead);
      toast.success(`Lead for "${name}" added to pipeline!`);
      onClose();
    } catch (err: any) {
      toast.error('Failed to create lead. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Add Sales Lead</h3>
              <p className="text-xs text-slate-500 mt-0.5">Capture a new prospective customer in your pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Asif Mahmud"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+88017..."
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company / Organization</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Footwear"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Deal Value (BDT)</label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">৳</span>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="15000"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Inbound Channel</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:outline-none"
              >
                <option value="WHATSAPP">💬 WhatsApp Catalog</option>
                <option value="WEBSITE">🌐 Online Store</option>
                <option value="FACEBOOK">📘 Facebook Page / Ad</option>
                <option value="INSTAGRAM">📸 Instagram Direct</option>
                <option value="PHONE_CALL">📞 Phone Inquiry</option>
                <option value="STORE_INQUIRY">🏬 Retail Store</option>
                <option value="MANUAL">✍️ Manual Outreach</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Pipeline Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:outline-none"
              >
                <option value="NEW">New Inquiry</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified Lead</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Customer Requirement / Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What products or wholesale bulk quantity is this lead interested in?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Save Lead</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
