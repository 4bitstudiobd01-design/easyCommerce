'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useSubmitContactMessageMutation } from '@/features/admin/api/adminApi';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [submitContactMessage, { isLoading }] = useSubmitContactMessageMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await submitContactMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject,
        message: formData.message,
      }).unwrap();
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-16 px-6 max-w-6xl mx-auto w-full space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Get In Touch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            We’d Love To Hear From You
          </h1>
          <p className="text-slate-600 text-base">
            Have a question about BitCommerce merchant plans, MFS integration, or custom enterprise solutions? Our Dhaka team is ready to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="space-y-6 md:col-span-1">
            <div className="solid-card p-6 rounded-2xl space-y-3">
              <div className="p-2.5 bg-blue-50 w-fit rounded-xl border border-blue-100 text-blue-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Headquarters</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Level 12, Gulshan Avenue Tower, Block C, Gulshan 2, Dhaka-1212, Bangladesh.
              </p>
            </div>

            <div className="solid-card p-6 rounded-2xl space-y-3">
              <div className="p-2.5 bg-emerald-50 w-fit rounded-xl border border-emerald-100 text-emerald-600">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Hotline & Support</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                +880 9600-EASYBD (3279)<br />
                Mon - Sat: 9:00 AM - 8:00 PM
              </p>
            </div>

            <div className="solid-card p-6 rounded-2xl space-y-3">
              <div className="p-2.5 bg-indigo-50 w-fit rounded-xl border border-indigo-100 text-indigo-600">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Email Us</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                support@bitcommerce.com<br />
                sales@bitcommerce.com
              </p>
            </div>
          </div>

          {/* Interactive Form Column */}
          <div className="solid-card p-8 rounded-3xl md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Send Us A Message</h2>
                <p className="text-slate-500 text-xs">Fill out the form below and we will respond within 2 hours.</p>
              </div>
            </div>

            {submitted ? (
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-900">Thank You! Message Sent</h3>
                <p className="text-xs text-slate-600">
                  Our merchant support team has received your message and will reach out to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahim Ahmed"
                      className="w-full px-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="merchant@example.com"
                      className="w-full px-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+8801700000000"
                      className="w-full px-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 solid-input rounded-xl text-slate-900 text-sm bg-white"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Merchant Onboarding">Merchant Onboarding</option>
                      <option value="bKash / Nagad Integration">bKash / Nagad Integration</option>
                      <option value="Enterprise Custom Plan">Enterprise Custom Plan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your business or question..."
                    className="w-full px-4 py-3 solid-input rounded-xl text-slate-900 text-sm placeholder-slate-400 resize-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20 text-sm active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
