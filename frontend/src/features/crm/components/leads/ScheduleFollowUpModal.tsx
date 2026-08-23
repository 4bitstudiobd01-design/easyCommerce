'use client';

import React, { useState } from 'react';
import { X, Clock, Calendar, Bell, Sparkles, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../../types/crm.types';

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
  // Format local default date string (tomorrow 10:00 AM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const defaultIso = tomorrow.toISOString().slice(0, 16);

  const [datetime, setDatetime] = useState(
    lead?.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : defaultIso
  );
  const [note, setNote] = useState(lead?.followUpNote || '');

  if (!isOpen || !lead) return null;

  const handlePreset = (hoursFromNow: number, presetNote?: string) => {
    const target = new Date(Date.now() + hoursFromNow * 3600000);
    setDatetime(target.toISOString().slice(0, 16));
    if (presetNote && !note) {
      setNote(presetNote);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datetime) {
      toast.error('Please select follow-up date and time.');
      return;
    }

    const isoDate = new Date(datetime).toISOString();
    onFollowUpSaved(lead.id, isoDate, note.trim() || 'Follow-up with lead on scheduled time');
    toast.success(`Follow-up scheduled for ${new Date(datetime).toLocaleString()}`);
    onClose();
  };

  const handleRemoveFollowUp = () => {
    onFollowUpSaved(lead.id, null, '');
    toast.success('Follow-up schedule cleared.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Schedule Lead Follow-Up</h2>
              <p className="text-xs text-slate-500">Set reminder & notification to contact customer on time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Target Lead</span>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{lead.name}</p>
            <p className="text-slate-600">{lead.phone} {lead.companyName ? `• ${lead.companyName}` : ''}</p>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(16, 'Morning follow-up discussion')}
                className="p-2 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl font-semibold text-slate-700 text-left transition-all"
              >
                🌅 Tomorrow 10:00 AM
              </button>
              <button
                type="button"
                onClick={() => handlePreset(21, 'Afternoon follow-up discussion')}
                className="p-2 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl font-semibold text-slate-700 text-left transition-all"
              >
                ☀️ Tomorrow 03:00 PM
              </button>
              <button
                type="button"
                onClick={() => handlePreset(48, 'Check decision feedback')}
                className="p-2 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl font-semibold text-slate-700 text-left transition-all"
              >
                🗓️ In 2 Days (48 hrs)
              </button>
              <button
                type="button"
                onClick={() => handlePreset(168, 'Weekly follow-up check')}
                className="p-2 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-200 rounded-xl font-semibold text-slate-700 text-left transition-all"
              >
                📅 Next Week
              </button>
            </div>
          </div>

          {/* Date and Time Picker */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Select Follow-Up Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
            />
          </div>

          {/* Follow-up Note / Memo */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Reminder Note / Agenda</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Call customer at 10 AM to confirm wholesale pricing discount"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {lead.nextFollowUpAt ? (
              <button
                type="button"
                onClick={handleRemoveFollowUp}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center gap-1.5 transition-all text-xs"
                title="Clear Follow-up"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>Save Reminder</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
