'use client';

import React from 'react';
import { Lead, LeadStageType } from '../../types/crm.types';
import {
  Plus,
  Phone,
  Mail,
  Building,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
  DollarSign,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { LeadStageDropdown } from './LeadStageDropdown';
import { formatCrmDate } from '../../utils/formatDate';

interface LeadsKanbanBoardProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStageType) => void;
  onOpenAddModal: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenQuickContact: (lead: Lead, channel: 'WHATSAPP' | 'CALL') => void;
  onOpenScheduleFollowUp: (lead: Lead) => void;
}

const STAGES: { id: LeadStageType; label: string; color: string; bg: string; border: string }[] = [
  { id: 'NEW', label: 'New Inquiry', color: 'text-blue-700', bg: 'bg-blue-50/80', border: 'border-blue-200' },
  { id: 'CONTACTED', label: 'Contacted', color: 'text-indigo-700', bg: 'bg-indigo-50/80', border: 'border-indigo-200' },
  { id: 'QUALIFIED', label: 'Qualified Lead', color: 'text-purple-700', bg: 'bg-purple-50/80', border: 'border-purple-200' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'text-amber-700', bg: 'bg-amber-50/80', border: 'border-amber-200' },
  { id: 'WON', label: 'Won / Converted', color: 'text-emerald-700', bg: 'bg-emerald-50/80', border: 'border-emerald-200' },
  { id: 'LOST', label: 'Lost / Closed', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
];

export const LeadsKanbanBoard: React.FC<LeadsKanbanBoardProps> = ({
  leads,
  onStageChange,
  onOpenAddModal,
  onOpenConvertModal,
  onOpenQuickContact,
  onOpenScheduleFollowUp,
}) => {
  const getLeadsByStage = (stage: LeadStageType) => leads.filter((l) => l.stage === stage);

  const getStageTotalValue = (stage: LeadStageType) =>
    getLeadsByStage(stage).reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);

  return (
    <div className="w-full pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
        {STAGES.map((col) => {
          const columnLeads = getLeadsByStage(col.id);
          const totalVal = getStageTotalValue(col.id);

          return (
            <div
              key={col.id}
              className="w-full bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col space-y-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.bg} border ${col.border}`} />
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight">
                    {col.label}
                  </h3>
                  <span className="px-2 py-0.2 bg-white text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold">
                    {columnLeads.length}
                  </span>
                </div>

                <span className="text-[11px] font-black text-slate-700">
                  ৳{totalVal.toLocaleString()}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3">
                {columnLeads.length === 0 ? (
                  <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    <span>No leads in this stage</span>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all space-y-3 group"
                    >
                      {/* Lead Title & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                            {lead.name}
                          </h4>
                          {lead.companyName && (
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-slate-400" />
                              {lead.companyName}
                            </p>
                          )}
                        </div>

                        {lead.leadScore && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded text-[10px] font-black flex items-center gap-0.5 shrink-0">
                            <Flame className="w-3 h-3 text-amber-500" />
                            {lead.leadScore}
                          </span>
                        )}
                      </div>

                      {/* Lead Notes Snippet */}
                      {lead.notes && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {lead.notes}
                        </p>
                      )}

                      {/* Follow-Up Reminder Badge */}
                      {lead.nextFollowUpAt ? (
                        <div
                          onClick={() => onOpenScheduleFollowUp(lead)}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs ${
                            lead.followUpStatus === 'OVERDUE' || new Date(lead.nextFollowUpAt) < new Date()
                              ? 'bg-red-50/90 border-red-200 text-red-800 hover:bg-red-100'
                              : 'bg-amber-50/90 border-amber-200 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">
                              {lead.followUpStatus === 'OVERDUE' || new Date(lead.nextFollowUpAt) < new Date()
                                ? '⚠️ Due: '
                                : '⏰ '}
                              {formatCrmDate(lead.nextFollowUpAt, { showTime: true })}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold underline shrink-0">Edit</span>
                        </div>
                      ) : null}

                      {/* Value & Source */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                          ৳{Number(lead.estimatedValue || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                          {lead.source}
                        </span>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        {/* Quick Contact & Follow-up buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenQuickContact(lead, 'WHATSAPP')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                            title="WhatsApp Lead"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenQuickContact(lead, 'CALL')}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                            title="Call Lead"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenScheduleFollowUp(lead)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-all"
                            title="Schedule Follow-Up Reminder"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stage Mover / Convert */}
                        <div className="flex items-center gap-1.5">
                          {col.id === 'QUALIFIED' || col.id === 'PROPOSAL_SENT' ? (
                            <button
                              onClick={() => onOpenConvertModal(lead)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Convert</span>
                            </button>
                          ) : null}

                          <LeadStageDropdown
                            currentStage={lead.stage}
                            onStageChange={(newStage) => onStageChange(lead.id, newStage)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
