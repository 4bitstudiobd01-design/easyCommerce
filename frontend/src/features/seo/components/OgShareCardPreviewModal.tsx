'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sparkles,
  Search,
  MessageCircle,
} from 'lucide-react';

interface OgShareCardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  image: string;
  url: string;
  price?: number;
  currency?: string;
  storeName?: string;
}

export const OgShareCardPreviewModal: React.FC<OgShareCardPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  image,
  url,
  price,
  currency = 'BDT',
  storeName = 'BitCommerce Store',
}) => {
  const [activePlatform, setActivePlatform] = useState<'facebook' | 'whatsapp' | 'google'>('facebook');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const domainName = url.replace(/^https?:\/\//, '').split('/')[0] || 'store.bitcommerce.app';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Social OpenGraph Card Previewer</h3>
              <p className="text-xs text-slate-400">Facebook, WhatsApp &amp; Google Search preview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Platform Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActivePlatform('facebook')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                activePlatform === 'facebook'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              Facebook &amp; Messenger
            </button>

            <button
              onClick={() => setActivePlatform('whatsapp')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                activePlatform === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Share
            </button>

            <button
              onClick={() => setActivePlatform('google')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition ${
                activePlatform === 'google'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              Google Search Snippet
            </button>
          </div>

          {/* Platform Preview Card Mockups */}

          {/* 1. FACEBOOK OPENGRAPH CARD MOCKUP */}
          {activePlatform === 'facebook' && (
            <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Facebook Newsfeed Post Card Preview</span>
                <span className="text-blue-600 font-extrabold">og:type = product</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md max-w-lg mx-auto">
                <div className="relative h-56 bg-slate-900 overflow-hidden">
                  <img
                    src={image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {price !== undefined && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                      ৳{price.toLocaleString()} {currency}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-1">
                  <span className="text-[11px] font-mono text-slate-500 uppercase block">
                    {domainName}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2">
                    {title}
                  </h4>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. WHATSAPP SHARE CARD MOCKUP */}
          {activePlatform === 'whatsapp' && (
            <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>WhatsApp Rich Link Preview</span>
                <span className="text-emerald-600 font-extrabold">WhatsApp Visual Card</span>
              </div>

              <div className="bg-emerald-950/90 text-white rounded-2xl p-4 max-w-sm mx-auto shadow-lg space-y-3 border border-emerald-800/50 font-sans">
                <div className="bg-emerald-900/60 rounded-xl overflow-hidden border border-emerald-700/50 p-2.5 flex items-center gap-3">
                  <img
                    src={image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'}
                    alt={title}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 border border-emerald-600/40"
                  />
                  <div className="space-y-0.5 truncate">
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase block tracking-wider">
                      {domainName}
                    </span>
                    <h5 className="text-xs font-bold text-white leading-tight truncate">
                      {title}
                    </h5>
                    <p className="text-[11px] text-emerald-200 line-clamp-1">
                      {description}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-emerald-100 font-mono underline break-all">
                  {url}
                </div>
              </div>
            </div>
          )}

          {/* 3. GOOGLE SEARCH RICH SNIPPET MOCKUP */}
          {activePlatform === 'google' && (
            <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Google Search Rich Snippet Preview</span>
                <span className="text-purple-600 font-extrabold">schema.org/Product</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md max-w-lg mx-auto space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    G
                  </div>
                  <div className="text-xs text-slate-700 truncate">
                    <span className="font-bold">{storeName}</span>
                    <span className="text-slate-400 font-mono text-[11px] ml-1">{url}</span>
                  </div>
                </div>
                <h4 className="text-blue-700 font-semibold text-base hover:underline leading-tight cursor-pointer">
                  {title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  {price !== undefined && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ৳{price.toLocaleString()} {currency}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {description}
                </p>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <a
              href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1.5"
            >
              Test on Facebook Sharing Debugger <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied Share Link!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Share Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
