'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  Smartphone,
  Info,
  Clock,
  Globe,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_SMS_TEMPLATES, type SmsTemplate } from '../data/abandonedCartMockData';

export const SmsTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<SmsTemplate[]>(MOCK_SMS_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(MOCK_SMS_TEMPLATES[0].id);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+8801712345678');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [useBanglaPreview, setUseBanglaPreview] = useState(false);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const toggleTemplate = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    );
    toast.success('Template status updated');
  };

  const handleSendTestSms = () => {
    if (!testPhoneNumber.trim()) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      toast.success(`Test SMS dispatched to ${testPhoneNumber} via Greenweb Gateway!`);
    }, 800);
  };

  // Preview replacement
  const rawText =
    useBanglaPreview && selectedTemplate.banglaContent
      ? selectedTemplate.banglaContent
      : selectedTemplate.content;

  const renderedPreview = rawText
    .replace('{{customer_name}}', 'Nusrat Jahan')
    .replace('{{store_name}}', 'Royal Threads BD')
    .replace('{{cart_url}}', 'https://easycommerce.store/r/tk892f')
    .replace('{{discount_code}}', 'SAVE10')
    .replace('{{cart_total}}', '৳4,850');

  const charCount = renderedPreview.length;
  const isGsm = !/[^\u0000-\u007F]/.test(renderedPreview);
  const maxCharsPerPart = isGsm ? 160 : 70;
  const parts = Math.ceil(charCount / maxCharsPerPart) || 1;

  return (
    <div className="space-y-6">
      {/* 1. HEADER INFO BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            SMS Recovery Templates & Automation
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Automate SMS sequences to re-engage cart abandoners and boost store conversions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Greenweb Gateway Connected (৳1,420.50)
          </span>
          <button
            type="button"
            onClick={() => toast.success('New template builder opening soon!')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Template
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT: TEMPLATE LIST vs SMARTPHONE MOCKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: TEMPLATE CARDS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Configured Recovery Sequences ({templates.length})
            </h4>
            <span className="text-[11px] text-slate-400 font-semibold">
              Click a template to preview on phone
            </span>
          </div>

          <div className="space-y-3">
            {templates.map((template) => {
              const isSelected = selectedTemplate.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/20 shadow-sm ring-1 ring-emerald-600'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-extrabold text-slate-900">
                          {template.name}
                        </h5>
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-full">
                          {template.badge}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          After {template.delayHours}h
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Trigger: {template.triggerEvent}
                      </p>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleTemplate(template.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          template.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                        aria-label="Toggle template"
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            template.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl font-mono text-[11px] text-slate-700 leading-relaxed break-words">
                    {template.content}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-400 font-medium">Variables:</span>
                      {template.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-emerald-700 font-semibold"
                        >
                          {v}
                        </span>
                      ))}
                    </div>

                    {template.banglaContent && (
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Bangla Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: SMARTPHONE LIVE MOCKUP (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Live Mobile SMS Preview
            </h4>

            {selectedTemplate.banglaContent && (
              <button
                type="button"
                onClick={() => setUseBanglaPreview(!useBanglaPreview)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg transition-colors"
              >
                {useBanglaPreview ? 'Show English' : 'Show Bangla'}
              </button>
            )}
          </div>

          {/* SMARTPHONE FRAME CONTAINER */}
          <div className="mx-auto max-w-[320px] bg-slate-900 rounded-[38px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-950">
            {/* PHONE SCREEN */}
            <div className="bg-slate-100 rounded-[28px] overflow-hidden flex flex-col h-[480px] shadow-inner">
              {/* STATUS BAR */}
              <div className="bg-slate-100 px-6 pt-3 pb-1 flex items-center justify-between text-[10px] font-bold text-slate-800">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-slate-900 rounded-full mx-auto" />
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <div className="w-4 h-2 bg-slate-800 rounded-sm" />
                </div>
              </div>

              {/* MESSAGES APP HEADER */}
              <div className="bg-slate-100/90 backdrop-blur px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    E
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900 leading-none">
                      EASYCOMMERCE
                    </p>
                    <span className="text-[9px] font-semibold text-emerald-600">
                      Verified Sender ID
                    </span>
                  </div>
                </div>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* CHAT MESSAGES BODY */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-end space-y-3">
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                    Today 10:24 AM
                  </span>
                </div>

                {/* INCOMING SMS BUBBLE */}
                <div className="flex items-start gap-2 max-w-[92%]">
                  <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-200/70 text-slate-800 text-[11px] leading-relaxed">
                    <p>{renderedPreview}</p>
                    <span className="block text-[8px] text-slate-400 text-right mt-1.5 font-medium">
                      Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* CHARACTER & PART METER BAR */}
              <div className="bg-white px-4 py-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                <span>
                  Chars: <strong className="text-slate-800">{charCount}</strong>
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                  {parts} SMS Part ({isGsm ? 'GSM-7' : 'Unicode'})
                </span>
              </div>
            </div>
          </div>

          {/* TEST SMS DISPATCH CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <h5 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              Send Live Test SMS
            </h5>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="+88017..."
                className="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={isSendingTest}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Sends an actual preview via Greenweb API using test credits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
