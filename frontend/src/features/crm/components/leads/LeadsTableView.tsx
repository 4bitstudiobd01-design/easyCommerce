'use client';

import React, { useState } from 'react';
import { Lead, LeadStageType } from '../../types/crm.types';
import {
  Search,
  Phone,
  Mail,
  Building,
  DollarSign,
  MessageCircle,
  PhoneCall,
  UserCheck,
  Flame,
  ArrowUpDown,
  Filter,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';
import { getFollowUpInfo } from '../../utils/followUpHelper';
import { LeadStageDropdown } from './LeadStageDropdown';

interface LeadsTableViewProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStageType) => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenQuickContact: (lead: Lead, channel: 'WHATSAPP' | 'CALL') => void;
  onOpenScheduleFollowUp: (lead: Lead) => void;
  onClearFollowUp?: (leadId: string) => void;
  onSelectLead?: (lead: Lead) => void;
}

export const LeadsTableView: React.FC<LeadsTableViewProps> = ({
  leads,
  onStageChange,
  onOpenConvertModal,
  onOpenQuickContact,
  onOpenScheduleFollowUp,
  onClearFollowUp,
  onSelectLead,
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.companyName && l.companyName.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.notes && l.notes.toLowerCase().includes(q)) ||
      (l.followUpNote && l.followUpNote.toLowerCase().includes(q)) ||
      (l.tags && l.tags.some((t) => t.toLowerCase().includes(q)));

    const matchStage = stageFilter === 'ALL' || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const getStageBadge = (stage: LeadStageType) => {
    switch (stage) {
      case 'NEW':
        return <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold">New</span>;
      case 'CONTACTED':
        return <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold">Contacted</span>;
      case 'QUALIFIED':
        return <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold">Qualified</span>;
      case 'PROPOSAL_SENT':
        return <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold">Proposal Sent</span>;
      case 'WON':
        return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">Won / Converted</span>;
      case 'LOST':
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">Lost</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, company, or requirement..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 rounded"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Stages</option>
          <option value="NEW">New Inquiries</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="PROPOSAL_SENT">Proposal Sent</option>
          <option value="WON">Won</option>
          <option value="LOST">Lost</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Lead Contact</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Est. Value</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No leads found matching criteria
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td
                      className="py-3.5 px-5 cursor-pointer group"
                      onClick={() => onSelectLead && onSelectLead(lead)}
                    >
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.leadScore ? (
                          <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded text-[9px] font-black">
                            {lead.leadScore}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{lead.phone}</span>
                        {lead.companyName && <span>• {lead.companyName}</span>}
                      </div>
                      {lead.nextFollowUpAt && (() => {
                        const info = getFollowUpInfo(lead.nextFollowUpAt, lead.stage);
                        return (
                          <div className="mt-1.5 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span
                              onClick={() => onOpenScheduleFollowUp(lead)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-md text-[10px] font-bold cursor-pointer transition-colors ${info.badgeClasses}`}
                            >
                              {info.isMissed ? (
                                <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-600" />
                              )}
                              <span>{info.isMissed ? `🔴 Missed: ${info.label}` : info.formattedDate}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onClearFollowUp && onClearFollowUp(lead.id)}
                              className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="সময় রিসেট / মুছে ফেলুন (Remove Time)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <LeadStageDropdown
                        currentStage={lead.stage}
                        onStageChange={(newStage) => onStageChange(lead.id, newStage)}
                      />
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ৳{Number(lead.estimatedValue || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-semibold text-[11px] uppercase">
                      {lead.source}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {lead.assignedStaffName || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatCrmDate(lead.createdAt)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenQuickContact(lead, 'WHATSAPP')}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenQuickContact(lead, 'CALL')}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                          title="Call"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenScheduleFollowUp(lead)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg"
                          title="Schedule Follow-up"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenConvertModal(lead)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Convert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
