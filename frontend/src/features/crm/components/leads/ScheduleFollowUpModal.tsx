'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar, Bell, Sparkles, Check, Trash2, CalendarDays, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../../types/crm.types';
import { useScheduleLeadFollowUpMutation } from '../../api/crmApi';

interface ScheduleFollowUpModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpSaved: (leadId: string, followUpAt: string | null, note: string) => void;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  lead,
  isOpen,
  onClose,
  onFollowUpSaved,
}) => {
  const [scheduleFollowUp, { isLoading: isSaving }] = useScheduleLeadFollowUpMutation();
  // Format local default date string (tomorrow 10:00 AM)
  const getTomorrowAt = (hours: number, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    // Return format YYYY-MM-DDTHH:mm in local time
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  };

  const getTodayAt = (hours: number, minutes = 0) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  };

  const [datetime, setDatetime] = useState(
    lead?.nextFollowUpAt
      ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16)
      : getTomorrowAt(11, 0)
  );
  const [note, setNote] = useState(lead?.followUpNote || '');

  if (!isOpen || !lead) return null;

  const handleSelectQuickTime = (dtString: string, defaultAgenda: string) => {
    setDatetime(dtString);
    if (!note) {
      setNote(defaultAgenda);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datetime) {
      toast.error('অনুগ্রহ করে তারিখ ও সময় নির্ধারণ করুন (Please select date and time)');
      return;
    }

    const isoDate = new Date(datetime).toISOString();
    const finalNote = note.trim() || 'Client discussion on scheduled time';

    // Save to backend database
    try {
      await scheduleFollowUp({
        id: lead.id,
        followUpAt: isoDate,
        note: finalNote,
      }).unwrap();
    } catch (err: any) {
      console.warn('Follow-up backend sync:', err?.message || err);
    }

    // Update local state regardless
    onFollowUpSaved(lead.id, isoDate, finalNote);
    toast.success(`কথা বলার সময় নির্ধারণ করা হয়েছে: ${new Date(datetime).toLocaleString()}`);
    onClose();
  };

  const handleRemoveFollowUp = async () => {
    try {
      await scheduleFollowUp({
        id: lead.id,
        followUpAt: null,
        note: '',
      }).unwrap();
    } catch (err: any) {
      console.warn('Clear follow-up sync:', err?.message || err);
    }
    onFollowUpSaved(lead.id, null, '');
    toast.success('শিডিউল রিমাইন্ডার মুছে ফেলা হয়েছে (Follow-up cleared)');
    onClose();
  };


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">শিডিউল কল / ফলো-আপ</h3>
              <p className="text-xs text-slate-500 mt-0.5">Schedule discussion with {lead.name}</p>
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
        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          {/* Target Lead Info Card */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-amber-50/40 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ক্লায়েন্ট / লিড</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.name}</p>
              <p className="text-slate-600 text-xs">{lead.phone} {lead.companyName ? `• ${lead.companyName}` : ''}</p>
            </div>
            <div className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-[11px]">
              {lead.stage.replace('_', ' ')}
            </div>
          </div>

          {/* 1-Click Quick Time Presets */}
          <div>
            <label className="font-extrabold text-slate-800 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>এক ক্লিকে সময় নির্বাচন (1-Click Presets):</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickTime(getTomorrowAt(11, 0), 'কাল সকাল ১১টায় কথা হবে')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-amber-700 font-black text-xs group-hover:text-amber-800">
                  <Sunrise className="w-3.5 h-3.5" />
                  <span>কাল সকাল ১১:০০</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tomorrow 11:00 AM</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickTime(getTomorrowAt(16, 0), 'কাল বিকাল ৪টায় বিস্তারিত প্রপোজাল নিয়ে কথা হবে')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-amber-700 font-black text-xs group-hover:text-amber-800">
                  <Sun className="w-3.5 h-3.5" />
                  <span>কাল বিকাল ৪:০০</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tomorrow 04:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickTime(getTomorrowAt(20, 0), 'কাল রাত ৮টায় ফাইনাল ডিসিশন কনফার্মেশন')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-indigo-700 font-black text-xs group-hover:text-indigo-800">
                  <Moon className="w-3.5 h-3.5" />
                  <span>কাল রাত ৮:০০</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Tomorrow 08:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickTime(getTodayAt(17, 0), 'আজ বিকাল ৫টায় কল ব্যাক করা হবে')}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-emerald-700 font-black text-xs group-hover:text-emerald-800">
                  <Sunset className="w-3.5 h-3.5" />
                  <span>আজ বিকাল ৫:০০</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Today 05:00 PM</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 2);
                  d.setHours(11, 0, 0, 0);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  handleSelectQuickTime(
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T11:00`,
                    'পরশুদিন সকাল ১১টায় কথা হবে'
                  );
                }}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-purple-700 font-black text-xs group-hover:text-purple-800">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>পরশুদিন সকাল ১১:০০</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">In 2 Days</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 7);
                  d.setHours(11, 0, 0, 0);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  handleSelectQuickTime(
                    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T11:00`,
                    'পরের সপ্তাহে সাপ্তাহিক ফলো-আপ'
                  );
                }}
                className="p-2.5 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 border border-slate-200/90 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-blue-700 font-black text-xs group-hover:text-blue-800">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>পরের সপ্তাহে</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">Next Week</span>
              </button>
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div>
            <label className="font-extrabold text-slate-800 block mb-1">
              নির্দিষ্ট তারিখ ও সময় নির্বাচন করুন (Exact Date & Time) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Discussion Agenda / Reminder Note */}
          <div>
            <label className="font-extrabold text-slate-800 block mb-1">
              কথা বলার বিষয় / নোট (Discussion Agenda / Note)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: কাল সকাল ১১টায় পাইকারি রেট ও কালার সিলেকশন নিয়ে কথা বলবে..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none text-xs leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {lead.nextFollowUpAt ? (
              <button
                type="button"
                onClick={handleRemoveFollowUp}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs"
                title="Clear Follow-up"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>রিমাইন্ডার মুছুন</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 active:scale-95 text-xs disabled:opacity-60"
              >
                <Bell className="w-4 h-4" />
                <span>{isSaving ? 'সেভ হচ্ছে...' : 'সময় সেভ করুন (Save Time)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
