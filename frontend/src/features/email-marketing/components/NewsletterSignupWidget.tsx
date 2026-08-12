'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useSubscribePublicMutation } from '../api/emailMarketingApi';
import { Mail, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';

interface NewsletterSignupWidgetProps {
  storeSlug: string;
  storeName?: string;
}

export const NewsletterSignupWidget: React.FC<NewsletterSignupWidgetProps> = ({
  storeSlug,
  storeName = 'Our Store',
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [subscribe, { isLoading, error }] = useSubscribePublicMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      await subscribe({
        storeSlug,
        email,
        name: name || undefined,
        source: 'STOREFRONT_FOOTER',
      }).unwrap();

      setIsSubmitted(true);
      setEmail('');
      setName('');
      toast.success('Subscribed successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden my-8 font-sans">
      {/* Background Subtle Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
        {/* Discount Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>JOIN OUR VIP NEWSLETTER & GET 10% OFF</span>
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Subscribe to {storeName} Weekly Deals
        </h3>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Be the first to receive exclusive discount codes, flash sales notifications, and new arrival announcements directly in your inbox!
        </p>

        {/* Submission Form or Success Message */}
        {isSubmitted ? (
          <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 max-w-md mx-auto space-y-2 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-lg text-white">You're Subscribed!</h4>
            <p className="text-xs text-slate-300">
              Thank you for joining our newsletter. We'll send special discount codes to your email!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3">
            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-400/30 rounded-xl text-rose-200 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{(error as any)?.data?.message || 'Failed to subscribe. Please try again.'}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 shrink-0"
              >
                {isLoading ? (
                  <>Subscribing...</>
                ) : (
                  <>
                    <span>Subscribe Now</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              🔒 No spam ever. Unsubscribe anytime with 1-click.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
