'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Edit,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronDown,
  Flag,
  Tag,
  Globe,
  Calendar,
  Clock,
  Trash2,
  GitMerge,
  Printer,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TicketRecord, TicketStatus, TicketPriority } from '../types';

interface TicketDetailsHeaderProps {
  ticket: TicketRecord;
  onEditTicket: () => void;
  onChangeStatus: (status: TicketStatus) => void;
  onPreviousTicket?: () => void;
  onNextTicket?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function TicketDetailsHeader({
  ticket,
  onEditTicket,
  onChangeStatus,
  onPreviousTicket,
  onNextTicket,
  hasPrevious = true,
  hasNext = true,
}: TicketDetailsHeaderProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>
        );
      case 'Pending Merchant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Pending Merchant
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Closed
          </span>
        );
    }
  };

  const getPriorityPill = (priority: TicketPriority) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/80 border border-rose-200/80 text-rose-700 text-xs font-bold">
            <Flag className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>High</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-700 text-xs font-bold">
            <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Medium</span>
          </div>
        );
      case 'Low':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Flag className="w-3.5 h-3.5 text-slate-400" />
            <span>Low</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link
            href="/admin/support"
            className="hover:text-emerald-700 transition-colors"
          >
            Support
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href="/admin/support"
            className="hover:text-emerald-700 transition-colors"
          >
            Tickets
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-semibold">{ticket.codeId}</span>
        </nav>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Edit Ticket Button */}
          <button
            type="button"
            onClick={onEditTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Ticket</span>
          </button>

          {/* Change Status Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Change Status</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {(['Open', 'In Progress', 'Pending Merchant', 'Resolved', 'Closed'] as TicketStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setIsStatusDropdownOpen(false);
                          onChangeStatus(status);
                        }}
                        className={`w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-50 transition-colors text-left cursor-pointer ${
                          ticket.status === status
                            ? 'font-bold text-emerald-700 bg-emerald-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'Open'
                              ? 'bg-emerald-500'
                              : status === 'In Progress'
                              ? 'bg-amber-500'
                              : status === 'Pending Merchant'
                              ? 'bg-purple-500'
                              : status === 'Resolved'
                              ? 'bg-teal-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{status}</span>
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>

          {/* More Actions Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <span>More Actions</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMoreActionsOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMoreActionsOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      toast.info('Merge ticket modal opened');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5 text-slate-400" />
                    <span>Merge Ticket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      window.print();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>Print Transcript</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      navigator.clipboard?.writeText(window.location.href);
                      toast.success('Ticket link copied to clipboard');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Ticket Link</span>
                  </button>

                  <div className="h-px bg-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      toast.error('Ticket deleted');
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Ticket</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Prev / Next Pagination Controls */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={onPreviousTicket}
              disabled={!hasPrevious}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
              title="Previous Ticket"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextTicket}
              disabled={!hasNext}
              className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-all cursor-pointer"
              title="Next Ticket"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Ticket Header Title & Metadata Bar */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {ticket.codeId}
          </h1>
          {getStatusBadge(ticket.status)}
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-800 mt-1">
          {ticket.subject}
        </p>
      </div>

      {/* 3. Metadata Pills Row (Exact layout from Screenshot) */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Priority */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Priority
            </span>
            {getPriorityPill(ticket.priority)}
          </div>

          {/* Category */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Category
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 border border-purple-200/80 text-purple-700 text-xs font-bold truncate">
              <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{ticket.categoryDetail || ticket.category}</span>
            </div>
          </div>

          {/* Channel */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Channel
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-700 text-xs font-bold">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{ticket.channel}</span>
            </div>
          </div>

          {/* Created */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Created
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold truncate">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {ticket.createdAt} {ticket.createdTime || '10:32 AM'}
              </span>
            </div>
          </div>

          {/* Last Update */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Last Update
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold truncate">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {ticket.lastUpdateDate} {ticket.lastUpdateTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
