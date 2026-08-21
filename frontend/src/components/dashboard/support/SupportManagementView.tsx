'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SupportKpiCards } from './SupportKpiCards';
import { SupportFilterBar } from './SupportFilterBar';
import { SupportTicketsTable } from './SupportTicketsTable';
import { SupportTicketSummaryCard } from './SupportTicketSummaryCard';
import { SupportTopCategoriesCard } from './SupportTopCategoriesCard';
import { SupportSlaCard } from './SupportSlaCard';
import { SupportQuickActionsCard } from './SupportQuickActionsCard';
import { NewTicketModal } from './NewTicketModal';
import { TicketDetailsDrawer } from './TicketDetailsDrawer';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { INITIAL_TICKETS, SUPPORT_KPIS, TOP_CATEGORIES, SLA_METRICS } from './supportMockData';
import {
  TicketRecord,
  SupportFilterState,
  TicketStatus,
  TicketCategory,
} from './types';

export function SupportManagementView() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRecord[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const [filters, setFilters] = useState<SupportFilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    channel: 'all',
  });

  const handleFilterChange = (key: keyof SupportFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      category: 'all',
      channel: 'all',
    });
    toast.info('Filters reset to default');
  };

  // Filtered tickets logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // 1. Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesCode = t.codeId.toLowerCase().includes(q);
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesMerchant = t.merchant.name.toLowerCase().includes(q);
        const matchesStore = t.merchant.storeName.toLowerCase().includes(q);
        const matchesSubdomain = t.merchant.subdomain.toLowerCase().includes(q);
        const matchesEmail = t.merchant.email.toLowerCase().includes(q);
        if (
          !matchesCode &&
          !matchesSubject &&
          !matchesMerchant &&
          !matchesStore &&
          !matchesSubdomain &&
          !matchesEmail
        ) {
          return false;
        }
      }

      // 2. Status filter
      if (filters.status !== 'all' && t.status !== filters.status) {
        return false;
      }

      // 3. Priority filter
      if (filters.priority !== 'all' && t.priority !== filters.priority) {
        return false;
      }

      // 4. Category filter
      if (filters.category !== 'all' && t.category !== filters.category) {
        return false;
      }

      // 5. Channel filter
      if (filters.channel !== 'all' && t.channel !== filters.channel) {
        return false;
      }

      return true;
    });
  }, [tickets, filters]);

  // Handlers
  const handleOpenTicketDetails = (ticket: TicketRecord) => {
    router.push(`/admin/support/${ticket.id}`);
  };

  const handleUpdateTicket = (updated: TicketRecord) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
  };

  const handleAddTicket = (newTicket: Partial<TicketRecord>) => {
    setTickets((prev) => [newTicket as TicketRecord, ...prev]);
  };

  const handleDeleteTicket = (ticket: TicketRecord) => {
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    if (selectedTicket?.id === ticket.id) {
      setIsDetailsOpen(false);
    }
    toast.success(`Ticket ${ticket.codeId} deleted`);
  };

  const handleChangeStatus = (ticket: TicketRecord, status: TicketStatus) => {
    const updated = { ...ticket, status, lastUpdateTime: 'Just now' };
    handleUpdateTicket(updated);
    toast.success(`Ticket ${ticket.codeId} status changed to ${status}`);
  };

  const handleKpiClick = (type: string) => {
    switch (type) {
      case 'total':
        handleFilterChange('status', 'all');
        break;
      case 'open':
        handleFilterChange('status', 'Open');
        break;
      case 'in_progress':
        handleFilterChange('status', 'In Progress');
        break;
      case 'pending':
        handleFilterChange('status', 'Pending Merchant');
        break;
      case 'resolved':
        handleFilterChange('status', 'Resolved');
        break;
      default:
        break;
    }
  };

  const handleCategorySelect = (cat: TicketCategory) => {
    if (filters.category === cat) {
      handleFilterChange('category', 'all');
    } else {
      handleFilterChange('category', cat);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Support
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Manage and respond to merchant support requests.
          </p>
        </div>

        {/* Right: + New Ticket Primary Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewTicketModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Top 5 KPI Summary Cards */}
      <SupportKpiCards
        kpis={SUPPORT_KPIS}
        activeFilter={filters.status}
        onKpiClick={handleKpiClick}
      />

      {/* 3. Main Two-Column Layout with Optimized Widths */}
      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-start">
        {/* Left Column: Filters & Tickets Data Table (Takes all available space) */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Search and Filters Toolbar */}
          <SupportFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenAdvancedFilters={() => toast.info('Filter drawer opened')}
            onToggleColumns={() => toast.info('Column layout customizer')}
          />

          {/* Tickets Data Table */}
          <SupportTicketsTable
            tickets={filteredTickets}
            totalTicketsCount={1248}
            onViewTicket={handleOpenTicketDetails}
            onChangeStatus={handleChangeStatus}
            onDeleteTicket={handleDeleteTicket}
            onAssignAgent={(t) => {
              handleOpenTicketDetails(t);
              toast.info(`Assign agent for ${t.codeId}`);
            }}
            onReplyTicket={(t) => handleOpenTicketDetails(t)}
          />
        </div>

        {/* Right Column: Ticket Summary, Categories, SLA, Quick Actions (Clean compact fixed width) */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-4">
          {/* Card 1: Ticket Summary (Donut Chart) */}
          <SupportTicketSummaryCard
            onFilterByStatus={(status) => handleFilterChange('status', status)}
            onViewReport={() => toast.info('Support performance report')}
          />

          {/* Card 2: Top Categories */}
          <SupportTopCategoriesCard
            categories={TOP_CATEGORIES}
            activeCategory={filters.category}
            onSelectCategory={handleCategorySelect}
            onViewAll={() => toast.info('All 14 categories')}
          />

          {/* Card 3: SLA Performance */}
          <SupportSlaCard metrics={SLA_METRICS} />

          {/* Card 4: Quick Actions */}
          <SupportQuickActionsCard
            onCreateAnnouncement={() => setIsAnnouncementModalOpen(true)}
            onOpenHelpCenter={() => toast.info('Opening Admin Help Center documentation')}
          />
        </div>
      </div>

      {/* 4. Modals & Slide-over Drawer */}
      <NewTicketModal
        isOpen={isNewTicketModalOpen}
        onClose={() => setIsNewTicketModalOpen(false)}
        onAddTicket={handleAddTicket}
      />

      <CreateAnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
      />

      <TicketDetailsDrawer
        ticket={selectedTicket}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdateTicket={handleUpdateTicket}
      />
    </div>
  );
}
