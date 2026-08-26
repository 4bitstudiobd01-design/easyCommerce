'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStageType } from '../../types/crm.types';
import {
  X,
  Phone,
  Mail,
  Building,
  DollarSign,
  Calendar,
  Clock,
  Flame,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Tag,
  User,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  ChevronRight,
  Send,
  Trash2,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';
import { toast } from 'sonner';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onStageChange: (leadId: string, newStage: LeadStageType) => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenQuickContact: (lead: Lead, channel: 'WHATSAPP' | 'CALL') => void;
  onOpenScheduleFollowUp: (lead: Lead) => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

const STAGES: { id: LeadStageType; label: string; dotColor: string; activeBg: string }[] = [
  { id: 'NEW', label: 'New Inquiry', dotColor: 'bg-sky-500', activeBg: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'CONTACTED', label: 'Contacted', dotColor: 'bg-indigo-500', activeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'QUALIFIED', label: 'Qualified Lead', dotColor: 'bg-amber-500', activeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', dotColor: 'bg-purple-500', activeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'WON', label: 'Won / Converted', dotColor: 'bg-emerald-500', activeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'LOST', label: 'Lost / Closed', dotColor: 'bg-rose-400', activeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onStageChange,
  onOpenConvertModal,
  onOpenQuickContact,
  onOpenScheduleFollowUp,
  onLeadUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'followup' | 'timeline'>('overview');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');
  const [editableValue, setEditableValue] = useState('');

  useEffect(() => {
    if (lead) {
      setEditableNotes(lead.notes || '');
      setEditableValue(String(lead.estimatedValue || ''));
      setIsEditingNotes(false);
      setActiveTab('overview');
    }
  }, [lead?.id]);

  if (!isOpen || !lead) return null;

  const currentStageConfig = STAGES.find((s) => s.id === lead.stage) || STAGES[0];

  const handleSaveRequirements = () => {
    const updatedLead: Lead = {
      ...lead,
      notes: editableNotes.trim() || undefined,
      estimatedValue: Number(editableValue) || lead.estimatedValue,
      updatedAt: new Date().toISOString(),
    };
    if (onLeadUpdated) {
      onLeadUpdated(updatedLead);
    }
    setIsEditingNotes(false);
    toast.success('Lead requirements and estimated value updated!');
  };

  const handleStageSelect = (stageId: LeadStageType) => {
    onStageChange(lead.id, stageId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-start justify-between shrink-0 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-3.5 relative z-10 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white truncate">{lead.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${currentStageConfig.activeBg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStageConfig.dotColor}`} />
                  <span>{currentStageConfig.label}</span>
                </span>
                {lead.leadScore ? (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-black flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    Score {lead.leadScore}/100
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                {lead.companyName && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.companyName}</span>
                  </span>
                )}
                <span>•</span>
                <span className="text-emerald-400 font-extrabold">
                  Est. Deal: ৳{Number(lead.estimatedValue || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickContact(lead, 'WHATSAPP')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => onOpenQuickContact(lead, 'CALL')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Direct Call</span>
            </button>
            <button
              onClick={() => onOpenScheduleFollowUp(lead)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule Follow-Up</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenConvertModal(lead);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Convert to Customer (Won)</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-500 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Details
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`pb-2.5 transition-all border-b-2 flex items-center gap-1 ${
              activeTab === 'requirements'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Inquiry Requirements</span>
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`pb-2.5 transition-all border-b-2 flex items-center gap-1 ${
              activeTab === 'followup'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Follow-Up ({lead.nextFollowUpAt ? 'Active' : 'None'})</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 transition-all border-b-2 ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Pipeline Stage Flow
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Contact Information Grid */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <h3 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                  Contact & Business Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                      <a href={`tel:${lead.phone}`} className="font-bold text-slate-900 hover:text-blue-600">
                        {lead.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                      <span className="font-bold text-slate-900">
                        {lead.email || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Organization</p>
                      <span className="font-bold text-slate-900">
                        {lead.companyName || 'Individual Customer'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Lead Source</p>
                      <span className="font-bold text-slate-900 uppercase">
                        {lead.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Value & Staff Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                  <span className="text-[10px] text-emerald-700 font-black uppercase tracking-wider block">
                    Estimated Deal Budget
                  </span>
                  <div className="text-xl font-black text-emerald-900 mt-1">
                    ৳{Number(lead.estimatedValue || 0).toLocaleString()} BDT
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1">Potential lifetime value of converted lead</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">
                    Assigned Account Staff
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>{lead.assignedStaffName || 'MD Belal Hossain'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Created on {formatCrmDate(lead.createdAt)}
                  </p>
                </div>
              </div>

              {/* Tags Section */}
              {lead.tags && lead.tags.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                    Associated Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INQUIRY REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Customer Requirements & Notes</h3>
                  <p className="text-xs text-slate-500">Products requested, timeline, and customer notes</p>
                </div>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estimated Value (BDT)</label>
                    <input
                      type="number"
                      value={editableValue}
                      onChange={(e) => setEditableValue(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Requirement Notes</label>
                    <textarea
                      rows={5}
                      value={editableNotes}
                      onChange={(e) => setEditableNotes(e.target.value)}
                      placeholder="Enter customer specific inquiry requirements..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditableNotes(lead.notes || '');
                        setEditableValue(String(lead.estimatedValue || ''));
                        setIsEditingNotes(false);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRequirements}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                  <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                    {lead.notes || 'No specific requirements or notes recorded yet.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOLLOW-UP REMINDER */}
          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Scheduled Follow-Up</h3>
                  <p className="text-xs text-slate-500">Upcoming call or message reminders for this deal</p>
                </div>
                <button
                  onClick={() => onOpenScheduleFollowUp(lead)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lead.nextFollowUpAt ? 'Reschedule' : 'Set Reminder'}</span>
                </button>
              </div>

              {lead.nextFollowUpAt ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="font-black text-amber-900 text-sm">
                      {formatCrmDate(lead.nextFollowUpAt, { showTime: true })}
                    </span>
                    {new Date(lead.nextFollowUpAt) < new Date() && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-black text-[10px]">
                        Overdue
                      </span>
                    )}
                  </div>
                  {lead.followUpNote && (
                    <p className="text-slate-700 text-xs mt-1 bg-white p-2.5 rounded-xl border border-amber-200/60">
                      📝 {lead.followUpNote}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                  <Clock className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs">No follow-up reminder scheduled yet</p>
                  <button
                    onClick={() => onOpenScheduleFollowUp(lead)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                  >
                    Schedule Callback
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PIPELINE STAGE FLOW */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Move Pipeline Stage</h3>
                <p className="text-xs text-slate-500">Click any stage below to transition this lead immediately</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STAGES.map((s) => {
                  const isCurrent = lead.stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStageSelect(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isCurrent
                          ? `${s.activeBg} ring-2 ring-blue-500 font-black shadow-sm`
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dotColor}`} />
                        <span className="text-xs font-bold">{s.label}</span>
                      </div>
                      {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
