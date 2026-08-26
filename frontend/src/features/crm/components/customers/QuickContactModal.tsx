'use client';

import React, { useState } from 'react';
import { X, MessageCircle, PhoneCall, Send, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Customer360, Lead } from '../../types/crm.types';

interface QuickContactModalProps {
  contact: Customer360 | Lead | null;
  channel: 'WHATSAPP' | 'CALL' | 'SMS';
  isOpen: boolean;
  onClose: () => void;
}

export const QuickContactModal: React.FC<QuickContactModalProps> = ({
  contact,
  channel,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const contactName = contact
    ? 'fullName' in contact
      ? contact.fullName
      : (contact as Lead).name
    : 'Customer';

  const [customMessage, setCustomMessage] = useState(
    `Hello ${contactName}, thank you for reaching out to our store! How can we assist you today?`
  );

  if (!isOpen || !contact) return null;

  const phoneRaw = contact.phone.replace(/[^0-9]/g, '');
  const phoneFormatted = phoneRaw.startsWith('880') ? phoneRaw : `88${phoneRaw}`;

  const messageTemplates = [
    {
      title: '📦 Order Confirmation',
      text: `Hello ${contactName}, your order from our store is ready for dispatch! Please confirm your delivery address.`,
    },
    {
      title: '🏷️ Catalog & Wholesale',
      text: `Hello ${contactName}, here is our latest product catalog and special discount pricing for you!`,
    },
    {
      title: '🎁 Win-Back 10% Promo',
      text: `We miss you! Use coupon code SPECIAL10 on our store for an instant 10% discount on your next order today.`,
    },
  ];

  const handleLaunchWhatsApp = () => {
    const url = `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp conversation launched!');
    onClose();
  };

  const handleDirectCall = () => {
    window.location.href = `tel:${contact.phone}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    toast.success('Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-600 shadow-emerald-500/20'
                  : 'bg-blue-600 shadow-blue-500/20'
              }`}
            >
              {channel === 'WHATSAPP' ? (
                <MessageCircle className="w-5 h-5" />
              ) : (
                <PhoneCall className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {channel === 'WHATSAPP' ? 'WhatsApp Outreach' : 'Phone Call Connection'}
              </h2>
              <p className="text-xs text-slate-500">
                Contact: <strong className="text-slate-800">{contactName}</strong> ({contact.phone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {channel === 'WHATSAPP' ? (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Quick Templates</label>
              <div className="space-y-1.5">
                {messageTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomMessage(tmpl.text)}
                    className="w-full text-left p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl font-medium text-slate-700 transition-all flex items-center justify-between"
                  >
                    <span>{tmpl.title}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Use Template</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Message Content</label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <PhoneCall className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{contact.phone}</p>
              <p className="text-xs text-slate-500 mt-1">Direct call via cellular or VoIP dialer</p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDirectCall}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Dial Number</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
