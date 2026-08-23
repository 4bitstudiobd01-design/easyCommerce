'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { LeadsKanbanBoard } from '@/features/crm/components/leads/LeadsKanbanBoard';
import { LeadsTableView } from '@/features/crm/components/leads/LeadsTableView';
import { AddLeadModal } from '@/features/crm/components/leads/AddLeadModal';
import { ConvertLeadModal } from '@/features/crm/components/leads/ConvertLeadModal';
import { ScheduleFollowUpModal } from '@/features/crm/components/leads/ScheduleFollowUpModal';
import { QuickContactModal } from '@/features/crm/components/customers/QuickContactModal';
import { useGetCrmLeadsQuery } from '@/features/crm/api/crmApi';
import { Lead, LeadStageType, Customer360 } from '@/features/crm/types/crm.types';
import { mockLeads } from '@/features/crm/data/crmMockData';
import { formatCrmDate } from '@/features/crm/utils/formatDate';
import {
  LayoutGrid,
  List,
  Plus,
  Clock,
  Bell,
  PhoneCall,
  MessageCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CrmLeadsPage() {
  const { data: serverLeads } = useGetCrmLeadsQuery();
  const [localLeads, setLocalLeads] = useState<Lead[]>(mockLeads);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');

  const leadsList = serverLeads && serverLeads.length > 0 ? serverLeads : localLeads;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);

  // Follow-up modal
  const [followUpTarget, setFollowUpTarget] = useState<Lead | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Quick contact modal
  const [quickContactTarget, setQuickContactTarget] = useState<Lead | null>(null);
  const [quickContactChannel, setQuickContactChannel] = useState<'WHATSAPP' | 'CALL' | 'SMS'>('WHATSAPP');
  const [isQuickContactOpen, setIsQuickContactOpen] = useState(false);

  const handleStageChange = (leadId: string, newStage: LeadStageType) => {
    setLocalLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: newStage, updatedAt: new Date().toISOString() } : l))
    );
    toast.success(`Lead moved to "${newStage}" stage`);
  };

  const handleLeadAdded = (newLead: Lead) => {
    setLocalLeads([newLead, ...localLeads]);
  };

  const handleLeadConverted = (customer: Customer360) => {
    if (convertTarget) {
      handleStageChange(convertTarget.id, 'WON');
    }
  };

  const handleOpenQuickContact = (lead: Lead, channel: 'WHATSAPP' | 'CALL' | 'SMS') => {
    setQuickContactTarget(lead);
    setQuickContactChannel(channel);
    setIsQuickContactOpen(true);
  };

  const handleOpenScheduleFollowUp = (lead: Lead) => {
    setFollowUpTarget(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleFollowUpSaved = (leadId: string, followUpAt: string | null, note: string) => {
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              nextFollowUpAt: followUpAt,
              followUpNote: note,
              followUpStatus: followUpAt ? 'PENDING' : undefined,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    );
  };

  // Calculate upcoming / due follow-ups
  const dueFollowUps = leadsList.filter((l) => Boolean(l.nextFollowUpAt));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <CrmNavigationHeader
        title="Sales Leads & Deals Pipeline"
        subtitle="Track incoming prospective buyer inquiries, scheduled follow-ups, and conversion stages"
        activeCount={leadsList.length}
        addLabel="New Lead"
        onAddClick={() => setIsAddModalOpen(true)}
        secondaryAction={
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'KANBAN'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table Data View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        }
      />

      {/* Smart Due Follow-Up Reminders Banner */}
      {dueFollowUps.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 p-4 md:p-5 rounded-3xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs md:text-sm text-slate-900 flex items-center gap-2">
                  <span>Scheduled Follow-Up Reminders</span>
                  <span className="px-2 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black">
                    {dueFollowUps.length} Active
                  </span>
                </h3>
                <p className="text-[11px] text-slate-600">
                  Customers who requested a callback or message at scheduled times
                </p>
              </div>
            </div>
          </div>

          {/* Quick reminder pills */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {dueFollowUps.map((lead) => (
              <div
                key={lead.id}
                className="bg-white p-3 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between gap-2 hover:border-amber-400 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">{lead.name}</span>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-extrabold shrink-0">
                      {formatCrmDate(lead.nextFollowUpAt, { showTime: true })}
                    </span>
                  </div>
                  {lead.followUpNote && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{lead.followUpNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenQuickContact(lead, 'WHATSAPP')}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenQuickContact(lead, 'CALL')}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                    title="Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main View: Kanban or Table */}
      {viewMode === 'KANBAN' ? (
        <LeadsKanbanBoard
          leads={leadsList}
          onStageChange={handleStageChange}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenConvertModal={(lead) => setConvertTarget(lead)}
          onOpenQuickContact={handleOpenQuickContact}
          onOpenScheduleFollowUp={handleOpenScheduleFollowUp}
        />
      ) : (
        <LeadsTableView
          leads={leadsList}
          onStageChange={handleStageChange}
          onOpenConvertModal={(lead) => setConvertTarget(lead)}
          onOpenQuickContact={handleOpenQuickContact}
          onOpenScheduleFollowUp={handleOpenScheduleFollowUp}
        />
      )}

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadAdded={handleLeadAdded}
      />

      {/* Convert Lead to Customer Modal */}
      <ConvertLeadModal
        lead={convertTarget}
        isOpen={Boolean(convertTarget)}
        onClose={() => setConvertTarget(null)}
        onLeadConverted={handleLeadConverted}
      />

      {/* Schedule Follow-Up Modal */}
      <ScheduleFollowUpModal
        lead={followUpTarget}
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setFollowUpTarget(null);
        }}
        onFollowUpSaved={handleFollowUpSaved}
      />

      {/* Quick Contact Modal */}
      <QuickContactModal
        contact={quickContactTarget}
        channel={quickContactChannel}
        isOpen={isQuickContactOpen}
        onClose={() => setIsQuickContactOpen(false)}
      />
    </div>
  );
}
