'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Link2, Key, Info, Trash2, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useConnectPixelMutation,
  useDisconnectPixelMutation,
  type ConnectedIntegration,
} from '../api/marketingApi';

interface ConnectPixelModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: ConnectedIntegration | null;
}

export function ConnectPixelModal({
  isOpen,
  onClose,
  integration,
}: ConnectPixelModalProps) {
  const [provider, setProvider] = useState<'META' | 'GOOGLE_ANALYTICS' | 'GOOGLE_ADS' | 'TIKTOK'>('META');
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [connectPixel, { isLoading: isConnecting }] = useConnectPixelMutation();
  const [disconnectPixel, { isLoading: isDisconnecting }] = useDisconnectPixelMutation();

  useEffect(() => {
    if (integration) {
      setProvider(integration.provider);
      setPixelId(integration.pixelId || '');
      setAccessToken('');
      setTestEventCode('');
      setValidationError(null);
    }
  }, [integration]);

  if (!isOpen || !integration) return null;

  const isConnected = integration.status === 'CONNECTED';

  const providerMeta = {
    META: {
      name: 'Meta Pixel & Conversions API',
      idLabel: 'Pixel Dataset ID',
      idPlaceholder: 'e.g. 849204928123456',
      idHelp: 'Found in Meta Events Manager > Data Sources > Settings (10-18 digits)',
      tokenLabel: 'Conversions API Access Token (Recommended)',
      tokenPlaceholder: 'EAABwz...',
      tokenHelp: 'Enables accurate server-side tracking bypassing ad-blockers and iOS privacy limits.',
      hasTestCode: true,
      validate: (val: string) => {
        if (!/^\d{10,18}$/.test(val.trim())) {
          return 'Meta Pixel ID must consist of 10 to 18 digits (numbers only).';
        }
        return null;
      },
    },
    GOOGLE_ANALYTICS: {
      name: 'Google Analytics 4 (GA4)',
      idLabel: 'Measurement ID',
      idPlaceholder: 'e.g. G-8492049281',
      idHelp: 'Found in Google Analytics > Admin > Data Streams > Web Stream Details (starts with G-)',
      tokenLabel: 'API Secret (Measurement Protocol)',
      tokenPlaceholder: 'Optional API secret for server tracking',
      tokenHelp: 'Generated under Measurement Protocol API secrets in GA4 stream settings.',
      hasTestCode: false,
      validate: (val: string) => {
        if (!/^G-[A-Z0-9]{7,14}$/i.test(val.trim())) {
          return "Google Analytics 4 ID must start with 'G-' followed by letters and numbers (e.g. G-8492049281).";
        }
        return null;
      },
    },
    GOOGLE_ADS: {
      name: 'Google Ads Conversion Tag',
      idLabel: 'Conversion ID',
      idPlaceholder: 'e.g. AW-123456789',
      idHelp: 'Found in Google Ads > Goals > Conversions > Summary',
      tokenLabel: 'Conversion Label',
      tokenPlaceholder: 'e.g. abC-D_efGHI123456',
      tokenHelp: 'Specific label for tracking completed purchases or leads.',
      hasTestCode: false,
      validate: (val: string) => {
        if (!/^(AW-)?\d{7,14}$/i.test(val.trim())) {
          return "Google Ads ID must be numeric or start with 'AW-' (e.g. AW-123456789).";
        }
        return null;
      },
    },
    TIKTOK: {
      name: 'TikTok Pixel & Events API',
      idLabel: 'TikTok Pixel ID',
      idPlaceholder: 'e.g. C1234567890ABCDEF',
      idHelp: 'Found in TikTok Ads Manager > Assets > Events > Web Events',
      tokenLabel: 'Events API Access Token',
      tokenPlaceholder: 'Optional token for TikTok Events API',
      tokenHelp: 'Generated in TikTok Events Manager settings.',
      hasTestCode: false,
      validate: (val: string) => {
        if (!/^[A-Za-z0-9_-]{12,28}$/.test(val.trim())) {
          return 'TikTok Pixel ID must be a 12 to 28 character alphanumeric code.';
        }
        return null;
      },
    },
  }[provider];

  const handleIdChange = (val: string) => {
    setPixelId(val);
    if (validationError) {
      setValidationError(providerMeta.validate(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = providerMeta.validate(pixelId);
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }
    setValidationError(null);

    try {
      const res = await connectPixel({
        provider,
        pixelId: pixelId.trim(),
        accessToken: accessToken.trim() || undefined,
        testEventCode: testEventCode.trim() || undefined,
      }).unwrap();

      toast.success(res.message || `${providerMeta.name} connected successfully!`);
      onClose();
    } catch (err: any) {
      const errMsg = err?.data?.message || 'Failed to connect pixel. Please check input format.';
      setValidationError(Array.isArray(errMsg) ? errMsg[0] : errMsg);
      toast.error(Array.isArray(errMsg) ? errMsg[0] : errMsg);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${providerMeta.name}? Tracking will stop.`)) {
      return;
    }

    try {
      await disconnectPixel(provider).unwrap();
      toast.success(`${providerMeta.name} disconnected successfully.`);
      onClose();
    } catch {
      toast.error('Failed to disconnect pixel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isConnected ? `Configure ${providerMeta.name}` : `Connect ${providerMeta.name}`}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isConnected ? 'Update credentials or Conversions API token' : 'Link pixel to track customer events'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {isConnected && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Pixel is currently Active & Transmitting Events
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-2.5 py-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0"
              >
                {isDisconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Disconnect
              </button>
            </div>
          )}

          {/* PIXEL ID INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              {providerMeta.idLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pixelId}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder={providerMeta.idPlaceholder}
              required
              className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl font-mono text-xs text-slate-900 focus:outline-none transition-all ${
                validationError
                  ? 'border-red-400 bg-red-50/40 focus:ring-2 focus:ring-red-500'
                  : 'border-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white'
              }`}
            />
            {validationError ? (
              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                {validationError}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                {providerMeta.idHelp}
              </p>
            )}
          </div>

          {/* ACCESS TOKEN / CAPI TOKEN */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>{providerMeta.tokenLabel}</span>
              <span className="text-[10px] text-blue-600 font-semibold">Recommended for CAPI</span>
            </label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={providerMeta.tokenPlaceholder}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {providerMeta.tokenHelp}
            </p>
          </div>

          {/* TEST EVENT CODE (META) */}
          {providerMeta.hasTestCode && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Meta Test Event Code (Optional)
              </label>
              <input
                type="text"
                value={testEventCode}
                onChange={(e) => setTestEventCode(e.target.value)}
                placeholder="e.g. TEST12345"
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all uppercase"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Used to see test events in Meta Events Manager &gt; Test Events tab in real time.
              </p>
            </div>
          )}

          {/* PRIVACY & COMPLIANCE NOTE */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2 text-[11px] text-slate-600">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              All customer IP and sensitive user data are hashed using SHA-256 before server transmission in compliance with global privacy standards.
            </span>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Validating & Connecting...
                </>
              ) : isConnected ? (
                'Save Changes'
              ) : (
                'Connect Pixel'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
