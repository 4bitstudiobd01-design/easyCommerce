'use client';

import React, { useState } from 'react';
import { X, Play, Loader2, CheckCircle2, Zap, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useTestEventMutation } from '../api/marketingApi';

interface TestEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventName?: string;
}

export function TestEventModal({
  isOpen,
  onClose,
  defaultEventName = 'PageView',
}: TestEventModalProps) {
  const [eventName, setEventName] = useState(defaultEventName);
  const [provider, setProvider] = useState<string>('META');
  const [orderRef, setOrderRef] = useState('#ORD-TEST');
  const [testEvent, { isLoading: isTesting }] = useTestEventMutation();

  if (!isOpen) return null;

  const samplePayloads: Record<string, any> = {
    PageView: {
      event_name: 'PageView',
      event_source_url: 'https://bitcommerce.store/products/silk-panjabi',
      user_data: { client_ip_address: '103.145.118.24', client_user_agent: 'Mozilla/5.0 Chrome/122.0' },
    },
    ViewContent: {
      event_name: 'ViewContent',
      content_name: 'Premium Silk Panjabi - Royal Navy',
      content_category: 'Apparel & Clothing',
      content_ids: ['prod-101'],
      value: 3250,
      currency: 'BDT',
    },
    AddToCart: {
      event_name: 'AddToCart',
      content_name: 'Wireless ANC Earbuds Pro',
      content_ids: ['prod-103'],
      value: 4990,
      currency: 'BDT',
      quantity: 1,
    },
    InitiateCheckout: {
      event_name: 'InitiateCheckout',
      num_items: 2,
      value: 8240,
      currency: 'BDT',
      coupon: 'SAVE10',
    },
    Purchase: {
      event_name: 'Purchase',
      order_id: orderRef || '#ORD-TEST-99',
      value: 8240,
      currency: 'BDT',
      payment_method: 'BKASH',
      shipping_city: 'Dhaka',
    },
  };

  const currentPayload = samplePayloads[eventName] || samplePayloads.PageView;

  const handleSendTest = async () => {
    try {
      await testEvent({
        eventName,
        provider,
        orderRef: eventName === 'Purchase' ? orderRef : '-',
        customPayload: currentPayload,
      }).unwrap();

      toast.success(`Test event '${eventName}' transmitted successfully! Check event logs.`);
      onClose();
    } catch {
      toast.error('Failed to fire test event.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Fire Test Pixel Event
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Verify pixel transmission with live server-side payload
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Event Name
              </label>
              <select
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="PageView">PageView</option>
                <option value="ViewContent">ViewContent</option>
                <option value="AddToCart">AddToCart</option>
                <option value="InitiateCheckout">InitiateCheckout</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Target Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="META">Meta Pixel (CAPI)</option>
                <option value="GOOGLE_ANALYTICS">Google Analytics 4</option>
                <option value="GOOGLE_ADS">Google Ads</option>
                <option value="TIKTOK">TikTok Pixel</option>
              </select>
            </div>
          </div>

          {eventName === 'Purchase' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Order Reference
              </label>
              <input
                type="text"
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="#ORD-9281"
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-700">
                Simulated JSON Payload:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">JSON (RFC 8259)</span>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
              {JSON.stringify(currentPayload, null, 2)}
            </pre>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendTest}
              disabled={isTesting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Fire Event
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
