'use client';

import React, { useState, useEffect } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { LeadsKanbanBoard } from '@/features/crm/components/leads/LeadsKanbanBoard';
import { LeadsTableView } from '@/features/crm/components/leads/LeadsTableView';
import { AddLeadModal } from '@/features/crm/components/leads/AddLeadModal';
import { ConvertLeadModal } from '@/features/crm/components/leads/ConvertLeadModal';
import { ScheduleFollowUpModal } from '@/features/crm/components/leads/ScheduleFollowUpModal';
import { LeadDetailModal } from '@/features/crm/components/leads/LeadDetailModal';
import { QuickContactModal } from '@/features/crm/components/customers/QuickContactModal';
import {
  useGetCrmLeadsQuery,
  useUpdateLeadStageMutation,
  useScheduleLeadFollowUpMutation,
} from '@/features/crm/api/crmApi';
import { Lead, LeadStageType, Customer360 } from '@/features/crm/types/crm.types';
import { formatCrmDate } from '@/features/crm/utils/formatDate';
import {
  getFollowUpInfo,
  getFollowUpCounts,
  filterFollowUpLeads,
  FollowUpFilterType,
} from '@/features/crm/utils/followUpHelper';
import {
  LayoutGrid,
  List,
  Bell,
  PhoneCall,
  MessageCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
  Clock,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CrmLeadsPage() {
  const { data: serverLeads, refetch } = useGetCrmLeadsQuery();
  const [updateLeadStage] = useUpdateLeadStageMutation();

  const [localLeads, setLocalLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN');
  const [followUpFilter, setFollowUpFilter] = useState<FollowUpFilterType>('ALL');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>('');
  const [followUpSearch, setFollowUpSearch] = useState<string>('');
  const [followUpPage, setFollowUpPage] = useState(1);

  // Synchronize server data into local state when available
  useEffect(() => {
    if (serverLeads !== undefined) {
      setLocalLeads(serverLeads);
    }
  }, [serverLeads]);

  // Reset pagination when filters change
  useEffect(() => {
    setFollowUpPage(1);
  }, [followUpFilter, customFollowUpDate, followUpSearch]);

  const activeLeadsList = localLeads;

  // Lead Details Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);

  // Follow-up modal
  const [followUpTarget, setFollowUpTarget] = useState<Lead | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Quick contact modal
  const [quickContactTarget, setQuickContactTarget] = useState<Lead | null>(null);
  const [quickContactChannel, setQuickContactChannel] = useState<'WHATSAPP' | 'CALL' | 'SMS'>('WHATSAPP');
  const [isQuickContactOpen, setIsQuickContactOpen] = useState(false);

  const [scheduleFollowUpMutation] = useScheduleLeadFollowUpMutation();

  const handleStageChange = async (leadId: string, newStage: LeadStageType) => {
    const isContactedOrClosed = newStage === 'CONTACTED' || newStage === 'WON' || newStage === 'LOST';

    // 1. Instant optimistic UI update
    setLocalLeads((prev) => {
      const base = prev.length > 0 ? prev : (serverLeads || []);
      return base.map((l) =>
        l.id === leadId
          ? {
              ...l,
              stage: newStage,
              nextFollowUpAt: isContactedOrClosed ? null : l.nextFollowUpAt,
              followUpNote: isContactedOrClosed ? undefined : l.followUpNote,
              followUpStatus: isContactedOrClosed ? 'COMPLETED' : l.followUpStatus,
              updatedAt: new Date().toISOString(),
            }
          : l
      );
    });

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              stage: newStage,
              nextFollowUpAt: isContactedOrClosed ? null : prev.nextFollowUpAt,
              followUpNote: isContactedOrClosed ? undefined : prev.followUpNote,
              followUpStatus: isContactedOrClosed ? 'COMPLETED' : prev.followUpStatus,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }

    if (isContactedOrClosed) {
      toast.success(`Lead moved to "${newStage.replace('_', ' ')}" (Follow-up auto-completed)`);
    } else {
      toast.success(`Lead moved to "${newStage.replace('_', ' ')}" stage`);
    }

    // 2. Persist to backend database
    try {
      await updateLeadStage({ id: leadId, stage: newStage }).unwrap();
    } catch (err: any) {
      console.warn('Lead stage backend update sync:', err?.message || err);
    }
  };

  const handleClearFollowUp = async (leadId: string) => {
    handleFollowUpSaved(leadId, null, '');
    try {
      await scheduleFollowUpMutation({ id: leadId, followUpAt: null, note: '' }).unwrap();
    } catch (err: any) {
      console.warn('Clear follow-up backend sync:', err?.message || err);
    }
    toast.success('কথা বলার সময় রিসেট / রিমুভ করা হয়েছে (Scheduled time removed)');
  };

  const handleLeadAdded = (newLead: Lead) => {
    setLocalLeads((prev) => [newLead, ...(prev.length > 0 ? prev : (serverLeads || []))]);
    refetch();
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLocalLeads((prev) => {
      const base = prev.length > 0 ? prev : (serverLeads || []);
      return base.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    });
    setSelectedLead(updatedLead);
    refetch();
  };

  const handleLeadConverted = (customer: Customer360) => {
    if (convertTarget) {
      setLocalLeads((prev) =>
        prev.map((l) =>
          l.id === convertTarget.id
            ? {
                ...l,
                stage: 'WON',
                convertedCustomerId: customer.id,
                followUpStatus: 'COMPLETED',
                nextFollowUpAt: null,
                followUpNote: undefined,
              }
            : l
        )
      );
    }
    refetch();
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
    setLocalLeads((prev) => {
      const base = prev.length > 0 ? prev : (serverLeads || []);
      return base.map((l) =>
        l.id === leadId
          ? {
              ...l,
              nextFollowUpAt: followUpAt,
              followUpNote: note,
              followUpStatus: followUpAt ? 'PENDING' : undefined,
              updatedAt: new Date().toISOString(),
            }
          : l
      );
    });

    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              nextFollowUpAt: followUpAt,
              followUpNote: note,
              followUpStatus: followUpAt ? 'PENDING' : undefined,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
    refetch();
  };

  // Calculate follow-up counts and filtered leads
  const FOLLOW_UPS_PER_PAGE = 6;
  const followUpCounts = getFollowUpCounts(activeLeadsList);
  const filteredFollowUps = filterFollowUpLeads(
    activeLeadsList,
    followUpFilter,
    customFollowUpDate,
    followUpSearch,
  );
  const totalFollowUpPages = Math.ceil(filteredFollowUps.length / FOLLOW_UPS_PER_PAGE);
  const paginatedFollowUps = filteredFollowUps.slice(
    (followUpPage - 1) * FOLLOW_UPS_PER_PAGE,
    followUpPage * FOLLOW_UPS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <CrmNavigationHeader
        title="Sales Leads & Deals Pipeline"
        subtitle="Track incoming prospective buyer inquiries, scheduled follow-ups, and conversion stages"
        activeCount={activeLeadsList.length}
        addLabel="New Lead"
        onAddClick={() => setIsAddModalOpen(true)}
        secondaryAction={
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'KANBAN'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title="Table Data View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        }
      />

      {/* Smart Due & Missed Follow-Up Reminders Banner */}
      {followUpCounts.total > 0 && (
        <div
          className={`p-4 md:p-5 rounded-3xl space-y-4 shadow-xs transition-all ${
            followUpCounts.missed > 0
              ? 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/5 border border-rose-300/90'
              : 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80'
          }`}
        >
          {/* Header & Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl text-white shadow-xs ${
                  followUpCounts.missed > 0 ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                }`}
              >
                {followUpCounts.missed > 0 ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bell className="w-4 h-4 animate-bounce" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-xs md:text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>Scheduled Follow-Up Reminders</span>
                  <span className="px-2 py-0.5 bg-slate-900/10 text-slate-900 rounded-full text-[10px] font-black">
                    {followUpCounts.total} Active
                  </span>
                  {followUpCounts.missed > 0 && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-black animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {followUpCounts.missed} Missed / Overdue
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-600">
                  Customers who requested a callback or message at scheduled times
                </p>
              </div>
            </div>

            {/* Filter Buttons & Date Picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setFollowUpFilter('ALL');
                  setCustomFollowUpDate('');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  followUpFilter === 'ALL' && !customFollowUpDate
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                All ({followUpCounts.total})
              </button>

              {followUpCounts.missed > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFollowUpFilter('MISSED');
                    setCustomFollowUpDate('');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    followUpFilter === 'MISSED'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Missed ({followUpCounts.missed})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setFollowUpFilter('TODAY');
                  setCustomFollowUpDate('');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  followUpFilter === 'TODAY'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                Today ({followUpCounts.today})
              </button>

              <button
                type="button"
                onClick={() => {
                  setFollowUpFilter('TOMORROW');
                  setCustomFollowUpDate('');
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  followUpFilter === 'TOMORROW'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                Tomorrow ({followUpCounts.tomorrow})
              </button>

              {/* Custom Date Input */}
              <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200/90 text-xs shadow-2xs">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="date"
                  value={customFollowUpDate}
                  onChange={(e) => {
                    setCustomFollowUpDate(e.target.value);
                    if (e.target.value) setFollowUpFilter('CUSTOM');
                  }}
                  className="bg-transparent text-slate-800 font-semibold text-xs focus:outline-none cursor-pointer"
                  title="Filter follow-ups by specific date"
                />
                {customFollowUpDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFollowUpDate('');
                      setFollowUpFilter('ALL');
                    }}
                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    title="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Follow-Up Search Input */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200/90 text-xs shadow-2xs">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={followUpSearch}
                  onChange={(e) => setFollowUpSearch(e.target.value)}
                  placeholder="খুঁজুন (নাম, ফোন, নোট)..."
                  className="bg-transparent text-slate-800 placeholder:text-slate-400 font-semibold text-xs focus:outline-none w-28 sm:w-36"
                />
                {followUpSearch && (
                  <button
                    type="button"
                    onClick={() => setFollowUpSearch('')}
                    className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredFollowUps.length === 0 ? (
            <div className="bg-white/80 p-5 rounded-2xl border border-slate-200 text-center space-y-1">
              <p className="text-xs font-bold text-slate-700">No follow-ups match this filter</p>
              <p className="text-[11px] text-slate-500">
                Switch back to "All" or pick another date to see scheduled reminders.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {paginatedFollowUps.map((lead) => {
                  const info = getFollowUpInfo(lead.nextFollowUpAt, lead.stage);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-3 rounded-2xl border shadow-2xs flex items-center justify-between gap-2 transition-all cursor-pointer group ${info.cardClasses}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {lead.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold shrink-0 border inline-flex items-center gap-1 ${info.badgeClasses}`}
                          >
                            {info.isMissed && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                            {info.isToday && !info.isMissed && <Clock className="w-2.5 h-2.5 text-amber-600" />}
                            {info.isTomorrow && <Calendar className="w-2.5 h-2.5 text-blue-600" />}
                            <span>{info.label}</span>
                          </span>
                        </div>
                        {lead.followUpNote && (
                          <p
                            className={`text-[11px] truncate mt-0.5 ${
                              info.isMissed ? 'text-rose-700/90 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {lead.followUpNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenQuickContact(lead, 'WHATSAPP')}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-all"
                          title="WhatsApp Contact"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenQuickContact(lead, 'CALL')}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                          title="Call Customer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenScheduleFollowUp(lead)}
                          className={`p-1.5 rounded-lg transition-all ${
                            info.isMissed
                              ? 'bg-rose-100/80 hover:bg-rose-200 text-rose-700 font-bold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Reschedule / Edit Time"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleClearFollowUp(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="রিমাইন্ডার মুছে ফেলুন (Remove Reminder)"
                        >
                          <span className="text-xs font-bold leading-none">✕</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Compact Pagination (Appears when items exceed 2 rows / 6 cards) */}
              {totalFollowUpPages > 1 && (
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Showing {((followUpPage - 1) * FOLLOW_UPS_PER_PAGE) + 1}–{Math.min(followUpPage * FOLLOW_UPS_PER_PAGE, filteredFollowUps.length)} of {filteredFollowUps.length} Reminders
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={followUpPage <= 1}
                      onClick={() => setFollowUpPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 text-[11px] transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalFollowUpPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setFollowUpPage(pageNum)}
                            className={`w-6 h-6 rounded-lg text-[11px] font-bold transition-all ${
                              followUpPage === pageNum
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={followUpPage >= totalFollowUpPages}
                      onClick={() => setFollowUpPage((p) => Math.min(totalFollowUpPages, p + 1))}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs flex items-center gap-1 text-[11px] transition-colors"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Main View: Kanban or Table */}
      {viewMode === 'KANBAN' ? (
        <LeadsKanbanBoard
          leads={activeLeadsList}
          onStageChange={handleStageChange}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenConvertModal={(lead) => setConvertTarget(lead)}
          onOpenQuickContact={handleOpenQuickContact}
          onOpenScheduleFollowUp={handleOpenScheduleFollowUp}
          onClearFollowUp={handleClearFollowUp}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      ) : (
        <LeadsTableView
          leads={activeLeadsList}
          onStageChange={handleStageChange}
          onOpenConvertModal={(lead) => setConvertTarget(lead)}
          onOpenQuickContact={handleOpenQuickContact}
          onOpenScheduleFollowUp={handleOpenScheduleFollowUp}
          onClearFollowUp={handleClearFollowUp}
          onSelectLead={(lead) => setSelectedLead(lead)}
        />
      )}

      {/* Lead Details Modal */}
      <LeadDetailModal
        lead={selectedLead ? (activeLeadsList.find((l) => l.id === selectedLead.id) || selectedLead) : null}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onStageChange={handleStageChange}
        onOpenConvertModal={(lead) => setConvertTarget(lead)}
        onOpenQuickContact={handleOpenQuickContact}
        onOpenScheduleFollowUp={handleOpenScheduleFollowUp}
        onLeadUpdated={handleLeadUpdated}
      />

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
