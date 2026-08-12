'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useCreateCampaignMutation } from '../api/emailMarketingApi';
import { X, Mail, Send, AlertCircle, Sparkles, FileText, Users } from 'lucide-react';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [contentHtml, setContentHtml] = useState(
    '<h2>🔥 Exclusive Offer for Our Valued Customers!</h2>\n<p>Dear Customer,</p>\n<p>Enjoy 15% OFF on your next order using coupon code: <strong>SPECIAL15</strong></p>\n<p>Shop now on our official store before stock runs out!</p>',
  );
  const [recipientType, setRecipientType] = useState<
    'ALL_SUBSCRIBERS' | 'ALL_CUSTOMERS' | 'ALL_AUDIENCE'
  >('ALL_SUBSCRIBERS');

  const [createCampaign, { isLoading, error }] = useCreateCampaignMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCampaign({
        title,
        subject,
        contentHtml,
        recipientType,
      }).unwrap();

      setTitle('');
      setSubject('');
      toast.success('Campaign draft created.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create email campaign.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Create Email Campaign (নতুন ইমেইল ক্যাম্পেইন)</h3>
              <p className="text-xs text-slate-400">Compose broadcast template for newsletter subscribers & buyers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{(error as any)?.data?.message || 'Failed to create campaign.'}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Title (অভ্যন্তরীণ রেফারেন্স নাম) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Eid Discount Broadcast 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Subject Line (গ্রাহকের ইমেইলের সাবজেক্ট) *
            </label>
            <input
              type="text"
              required
              placeholder="🔥 Special 20% Discount Offer Just For You!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Target Recipient Audience (প্রাপক নির্বাচন করুন)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setRecipientType('ALL_SUBSCRIBERS')}
                className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                  recipientType === 'ALL_SUBSCRIBERS'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Subscribers Only</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">সব নিউজরুম সাবস্ক্রাইবার</p>
              </div>

              <div
                onClick={() => setRecipientType('ALL_CUSTOMERS')}
                className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                  recipientType === 'ALL_CUSTOMERS'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Past Buyers Only</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">পূর্বে কেনাকাটা করা কাস্টমার</p>
              </div>

              <div
                onClick={() => setRecipientType('ALL_AUDIENCE')}
                className={`p-3 rounded-2xl border cursor-pointer transition select-none ${
                  recipientType === 'ALL_AUDIENCE'
                    ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Combined All</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">কাস্টমার ও সাবস্ক্রাইবার উভয়ই</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Content Template (HTML/Text) *
            </label>
            <textarea
              required
              rows={6}
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can paste standard HTML tags or plain text message content.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>Creating Campaign...</>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Save Campaign Draft
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
