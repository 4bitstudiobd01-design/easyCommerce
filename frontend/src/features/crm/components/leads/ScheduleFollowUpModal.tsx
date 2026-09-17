'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Bell,
  Sparkles,
  Trash2,
  CalendarDays,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  AlertTriangle,
  Edit3,
  RotateCcw,
  FileText,
  CheckCircle2,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../../types/crm.types';
import { useScheduleLeadFollowUpMutation } from '../../api/crmApi';
import { formatCrmDate } from '../../utils/formatDate';
import { getFollowUpInfo } from '../../utils/followUpHelper';

interface ScheduleFollowUpModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpSaved: (leadId: string, followUpAt: string | null, note: string) => void;
}

function formatLocalDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  lead,
  isOpen,
  onClose,
  onFollowUpSaved,
}) => {
  const [scheduleFollowUp, { isLoading: isSaving }] = useScheduleLeadFollowUpMutation();

  const getTomorrowAt = (hours: number, minutes = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  };

  const getTodayAt = (hours: number, minutes = 0) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hours)}:${pad(minutes)}`;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [note, setNote] = useState('');

  // Synchronize state when lead or modal opens
  useEffect(() => {
    if (lead) {
      if (lead.nextFollowUpAt) {
        setIsEditing(false);
        setDatetime(formatLocalDateTime(lead.nextFollowUpAt));
        setNote(lead.followUpNote || '');
      } else {
        setIsEditing(true);
        setDatetime(getTomorrowAt(11, 0));
        setNote('');
      }
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const hasExistingSchedule = Boolean(lead.nextFollowUpAt);
  const followUpInfo = getFollowUpInfo(lead.nextFollowUpAt, lead.stage);

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

    try {
      await scheduleFollowUp({
        id: lead.id,
        followUpAt: isoDate,
        note: finalNote,
      }).unwrap();
    } catch (err: any) {
      toast.error('ফলো-আপ সেভ করা যায়নি। আবার চেষ্টা করুন। (Failed to save follow-up. Please try again.)');
      return;
    }

    onFollowUpSaved(lead.id, isoDate, finalNote);
    toast.success(
      hasExistingSchedule
        ? 'শিডিউল সময় সফলভাবে পরিবর্তন করা হয়েছে (Schedule updated successfully)'
        : 'নতুন কথা বলার সময় সফলভাবে নির্ধারণ করা হয়েছে (Follow-up scheduled successfully)'
    );
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
      toast.error('রিমাইন্ডার মুছে ফেলা যায়নি। আবার চেষ্টা করুন। (Failed to clear follow-up. Please try again.)');
      return;
    }
    onFollowUpSaved(lead.id, null, '');
    toast.success('শিডিউল রিমাইন্ডার মুছে ফেলা হয়েছে (Follow-up removed)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${
                hasExistingSchedule && followUpInfo.isMissed
                  ? 'bg-rose-100 text-rose-700'
                  : hasExistingSchedule
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {hasExistingSchedule && followUpInfo.isMissed ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : hasExistingSchedule ? (
                <Clock className="w-5 h-5" />
              ) : (
                <Calendar className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {hasExistingSchedule && !isEditing
                  ? 'বর্তমান ফলো-আপ শিডিউল'
                  : hasExistingSchedule && isEditing
                  ? 'শিডিউল পরিবর্তন / রিশিডিউল'
                  : 'নতুন ফলো-আপ শিডিউল নির্ধারণ'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lead.name} • {lead.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Target Lead Info Card */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                ক্লায়েন্ট / লিড
              </span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{lead.name}</p>
              <p className="text-slate-600 text-xs mt-0.5 flex items-center gap-1.5">
                <span>{lead.phone}</span>
                {lead.companyName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Building className="w-3 h-3 text-slate-400" />
                      {lead.companyName}
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl font-bold text-[11px] text-slate-700 shadow-2xs">
              {lead.stage.replace('_', ' ')}
            </div>
          </div>

          {/* VIEW 1: EXISTING SCHEDULE SUMMARY VIEW (When schedule exists and not in editing mode) */}
          {hasExistingSchedule && !isEditing ? (
            <div className="space-y-4">
              {/* Existing Schedule Card */}
              <div
                className={`p-4 rounded-2xl border space-y-3 transition-all ${
                  followUpInfo.isMissed
                    ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-200 text-rose-950'
                    : 'bg-amber-50/90 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    নির্ধারিত আলোচনার সময়
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 border ${followUpInfo.badgeClasses}`}
                  >
                    {followUpInfo.isMissed && <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />}
                    {followUpInfo.isToday && !followUpInfo.isMissed && <Clock className="w-3 h-3 text-amber-600" />}
                    {followUpInfo.isTomorrow && <Calendar className="w-3 h-3 text-blue-600" />}
                    <span>{followUpInfo.isMissed ? `🔴 ${followUpInfo.label}` : followUpInfo.label}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      followUpInfo.isMissed ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-900">
                      {formatCrmDate(lead.nextFollowUpAt, { showTime: true })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {followUpInfo.isMissed
                        ? '⚠️ নির্ধারিত সময় পার হয়ে গেছে, ক্লায়েন্টকে দ্রুত কল বা মেসেজ দিন'
                        : 'শিডিউল রিমাইন্ডার নির্ধারিত রয়েছে'}
                    </p>
                  </div>
                </div>

                {/* Agenda / Note */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    আলোচনার বিষয় / নোট:
                  </span>
                  <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                    {lead.followUpNote ? lead.followUpNote : 'কোনো বিশেষ নোট যুক্ত করা নেই।'}
                  </p>
                </div>
              </div>

              {/* View Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRemoveFollowUp}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs border border-rose-200"
                  title="রিমাইন্ডার মুছে ফেলুন"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>রিমাইন্ডার মুছুন</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    বন্ধ করুন (Close)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 text-xs active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>সময় পরিবর্তন করুন (Edit / Reschedule)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: FORM / EDIT SCHEDULE MODE */
            <form onSubmit={handleSave} className="space-y-4">
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
                    onClick={() =>
                      handleSelectQuickTime(
                        getTomorrowAt(16, 0),
                        'কাল বিকাল ৪টায় বিস্তারিত প্রপোজাল নিয়ে কথা হবে',
                      )
                    }
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
                    onClick={() =>
                      handleSelectQuickTime(
                        getTomorrowAt(20, 0),
                        'কাল রাত ৮টায় ফাইনাল ডিসিশন কনফার্মেশন',
                      )
                    }
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
                        'পরশুদিন সকাল ১১টায় কথা হবে',
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
                        'পরের সপ্তাহে সাপ্তাহিক ফলো-আপ',
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
                  নির্দিষ্ট তারিখ ও সময় নির্ধারণ করুন (Exact Date & Time) <span className="text-red-500">*</span>
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
                  placeholder="যেমন: কাল সকাল ১১টায় পাইকারি রেট ও স্যাম্পল সিলেকশন নিয়ে কথা বলবে..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {hasExistingSchedule ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    পেছনে যান (Back)
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    বাতিল (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 active:scale-95 text-xs disabled:opacity-60"
                  >
                    <Bell className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? 'সেভ হচ্ছে...'
                        : hasExistingSchedule
                        ? 'পরিবর্তন সেভ করুন (Save Changes)'
                        : 'সময় সেভ করুন (Save Time)'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
