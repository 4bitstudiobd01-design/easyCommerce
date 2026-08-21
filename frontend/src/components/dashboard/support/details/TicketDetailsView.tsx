'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TicketDetailsHeader } from './TicketDetailsHeader';
import { TicketConversationThread } from './TicketConversationThread';
import { TicketReplyComposer } from './TicketReplyComposer';
import { TicketInfoSidebar } from './TicketInfoSidebar';
import { EditTicketModal } from './EditTicketModal';
import { ReassignAgentModal } from './ReassignAgentModal';
import { MergeTicketModal } from './MergeTicketModal';
import { INITIAL_TICKETS } from '../supportMockData';
import {
  TicketRecord,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketMessage,
} from '../types';

interface TicketDetailsViewProps {
  ticketId?: string;
}

export function TicketDetailsView({ ticketId }: TicketDetailsViewProps) {
  const router = useRouter();

  // Find initial ticket by ID or code ID or fallback to first
  const initialIndex = INITIAL_TICKETS.findIndex(
    (t) => t.id === ticketId || t.codeId.toLowerCase() === ticketId?.toLowerCase()
  );

  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const [ticketsList, setTicketsList] = useState<TicketRecord[]>(INITIAL_TICKETS);

  const currentTicket = ticketsList[currentIndex] || INITIAL_TICKETS[0];

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  // Update current ticket in state
  const handleUpdateCurrentTicket = (updated: TicketRecord) => {
    setTicketsList((prev) =>
      prev.map((t, idx) => (idx === currentIndex ? updated : t))
    );
  };

  // Status Change
  const handleStatusChange = (status: TicketStatus) => {
    const updated: TicketRecord = {
      ...currentTicket,
      status,
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: `Status Changed to ${status}`,
          actor: 'Sadia Ahmed (Agent)',
          timestamp: 'Just now',
          details: `Manual status transition to ${status}`,
        },
        ...(currentTicket.activityLogs || []),
      ],
    };
    handleUpdateCurrentTicket(updated);
    toast.success(`Ticket status updated to "${status}"`);
  };

  // Priority Change
  const handlePriorityChange = (priority: TicketPriority) => {
    const updated: TicketRecord = {
      ...currentTicket,
      priority,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: `Priority Changed to ${priority}`,
          actor: 'Sadia Ahmed (Agent)',
          timestamp: 'Just now',
        },
        ...(currentTicket.activityLogs || []),
      ],
    };
    handleUpdateCurrentTicket(updated);
    toast.success(`Priority updated to "${priority}"`);
  };

  // Category Change
  const handleCategoryChange = (category: TicketCategory) => {
    const updated: TicketRecord = {
      ...currentTicket,
      category,
      categoryDetail: category,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: `Category Changed to ${category}`,
          actor: 'Sadia Ahmed (Agent)',
          timestamp: 'Just now',
        },
        ...(currentTicket.activityLogs || []),
      ],
    };
    handleUpdateCurrentTicket(updated);
    toast.success(`Category updated to "${category}"`);
  };

  // Reply Sender
  const handleSendReply = (
    text: string,
    isInternal: boolean,
    newStatus?: TicketStatus
  ) => {
    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: isInternal ? 'Sadia Ahmed' : 'Sadia Ahmed (Agent)',
      authorRole: 'Agent',
      authorSubtitle: isInternal ? undefined : 'EasyCommerce Support',
      authorInitials: 'SA',
      isCurrentUser: true,
      content: text,
      timestamp: 'Just now',
      isInternal,
    };

    let updatedMessages = currentTicket.messages;
    let updatedInternalNotes = currentTicket.internalNotes || [];

    if (isInternal) {
      updatedInternalNotes = [...updatedInternalNotes, newMessage];
    } else {
      updatedMessages = [...updatedMessages, newMessage];
    }

    const nextStatus = newStatus || (isInternal ? currentTicket.status : 'In Progress');

    const updated: TicketRecord = {
      ...currentTicket,
      status: nextStatus,
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
      messages: updatedMessages,
      internalNotes: updatedInternalNotes,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: isInternal ? 'Internal Note Added' : 'Agent Reply Sent',
          actor: 'Sadia Ahmed (Agent)',
          timestamp: 'Just now',
        },
        ...(currentTicket.activityLogs || []),
      ],
    };

    handleUpdateCurrentTicket(updated);
    toast.success(
      isInternal
        ? 'Internal note saved'
        : nextStatus === 'Resolved'
        ? 'Reply sent and ticket resolved!'
        : 'Reply sent to merchant!'
    );
  };

  // Reassign Agent
  const handleReassignAgent = (agent: {
    name: string;
    role: string;
    email: string;
    initials: string;
  }) => {
    const updated: TicketRecord = {
      ...currentTicket,
      assignedAgent: agent,
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: `Reassigned to ${agent.name}`,
          actor: 'Platform Admin',
          timestamp: 'Just now',
        },
        ...(currentTicket.activityLogs || []),
      ],
    };
    handleUpdateCurrentTicket(updated);
  };

  // Merge Ticket
  const handleMergeTicket = (targetCodeId: string) => {
    const updated: TicketRecord = {
      ...currentTicket,
      status: 'Closed',
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          action: `Merged into ${targetCodeId}`,
          actor: 'Sadia Ahmed (Agent)',
          timestamp: 'Just now',
        },
        ...(currentTicket.activityLogs || []),
      ],
    };
    handleUpdateCurrentTicket(updated);
  };

  // Pagination navigation
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < ticketsList.length - 1) {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs, Actions, Title, Metadata Pills */}
      <TicketDetailsHeader
        ticket={currentTicket}
        onEditTicket={() => setIsEditModalOpen(true)}
        onChangeStatus={handleStatusChange}
        onPreviousTicket={handlePrevious}
        onNextTicket={handleNext}
        hasPrevious={currentIndex > 0}
        hasNext={currentIndex < ticketsList.length - 1}
      />

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Thread & Reply Composer (8 of 12 cols) */}
        <div className="xl:col-span-8 space-y-6 min-w-0">
          {/* Conversation Thread & Tabs */}
          <TicketConversationThread ticket={currentTicket} />

          {/* Reply Composer Box */}
          <TicketReplyComposer onSendReply={handleSendReply} />
        </div>

        {/* Right Column: Info Cards (4 of 12 cols) */}
        <div className="xl:col-span-4 space-y-5 min-w-0">
          <TicketInfoSidebar
            ticket={currentTicket}
            onUpdateStatus={handleStatusChange}
            onUpdatePriority={handlePriorityChange}
            onUpdateCategory={handleCategoryChange}
            onReassignAgent={() => setIsReassignModalOpen(true)}
            onMergeTicket={() => setIsMergeModalOpen(true)}
          />
        </div>
      </div>

      {/* 3. Modals */}
      <EditTicketModal
        ticket={currentTicket}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateCurrentTicket}
      />

      <ReassignAgentModal
        ticket={currentTicket}
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onReassign={handleReassignAgent}
      />

      <MergeTicketModal
        ticket={currentTicket}
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onMerge={handleMergeTicket}
      />
    </div>
  );
}
