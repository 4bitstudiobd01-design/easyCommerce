'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  Trash2,
  MessageSquare,
  UserPlus,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { TicketRecord, TicketStatus, TicketPriority, TicketChannel } from './types';

interface SupportTicketsTableProps {
  tickets: TicketRecord[];
  totalTicketsCount?: number;
  onViewTicket: (ticket: TicketRecord) => void;
  onChangeStatus?: (ticket: TicketRecord, status: TicketStatus) => void;
  onDeleteTicket?: (ticket: TicketRecord) => void;
  onAssignAgent?: (ticket: TicketRecord) => void;
  onReplyTicket?: (ticket: TicketRecord) => void;
}

export function SupportTicketsTable({
  tickets,
  totalTicketsCount = 1248,
  onViewTicket,
  onChangeStatus,
  onDeleteTicket,
  onAssignAgent,
  onReplyTicket,
}: SupportTicketsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isAllSelected =
    tickets.length > 0 && selectedIds.length === tickets.length;
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < tickets.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets.map((t) => t.id));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200/60 whitespace-nowrap">
            High
          </span>
        );
      case 'Urgent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
            Urgent
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            Open
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            In Progress
          </span>
        );
      case 'Pending Merchant':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
            Pending Merchant
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50/90 text-emerald-800 border border-emerald-200/70 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            Resolved
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            Closed
          </span>
        );
    }
  };

  const getChannelPill = (channel: TicketChannel) => {
    switch (channel) {
      case 'Web':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap">
            Web
          </span>
        );
      case 'Email':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
            Email
          </span>
        );
      case 'Chat':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 whitespace-nowrap">
            Chat
          </span>
        );
      case 'Phone':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
            Phone
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {channel}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span>tickets selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Responsive Table Container with Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left border-collapse min-w-[960px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-white text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-4 sm:pl-5 pr-2 w-10 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                />
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[140px]">
                Ticket ID
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[200px]">
                Subject
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[160px]">
                Merchant / Store
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Priority
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Status
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap min-w-[120px]">
                Last Update
              </th>
              <th className="py-3.5 px-3 font-semibold text-slate-500 whitespace-nowrap">
                Channel
              </th>
              <th className="py-3.5 pr-4 sm:pr-5 pl-2 text-right font-semibold text-slate-500 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No tickets found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Try adjusting your search or filters.
                  </p>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const isSelected = selectedIds.includes(ticket.id);
                const isMenuOpen = activeMenuId === ticket.id;

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onViewTicket(ticket)}
                    className={`group hover:bg-slate-50/80 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-4 pl-4 sm:pl-5 pr-2 whitespace-nowrap"
                      onClick={(e) => handleToggleRow(ticket.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                      />
                    </td>

                    {/* Ticket ID & Created Date (Guaranteed No Wrap) */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block text-xs whitespace-nowrap group-hover:text-emerald-700 transition-colors">
                        {ticket.codeId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                        Created: {ticket.createdAt}
                      </span>
                    </td>

                    {/* Subject & Category detail */}
                    <td className="py-4 px-3 max-w-[240px]">
                      <span className="font-semibold text-slate-800 block text-xs truncate whitespace-nowrap" title={ticket.subject}>
                        {ticket.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block truncate whitespace-nowrap mt-0.5">
                        {ticket.categoryDetail || ticket.category}
                      </span>
                    </td>

                    {/* Merchant & Store Subdomain */}
                    <td className="py-4 px-3 max-w-[180px] whitespace-nowrap">
                      <span className="font-medium text-slate-700 block text-xs truncate whitespace-nowrap">
                        {ticket.merchant.storeName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block truncate whitespace-nowrap mt-0.5">
                        {ticket.merchant.subdomain}
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>

                    {/* Last Update */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block text-xs whitespace-nowrap">
                        {ticket.lastUpdateDate}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal block whitespace-nowrap mt-0.5">
                        {ticket.lastUpdateTime}
                      </span>
                    </td>

                    {/* Channel */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {getChannelPill(ticket.channel)}
                    </td>

                    {/* Actions Menu */}
                    <td
                      className="py-4 pr-4 sm:pr-5 pl-2 text-right relative whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : ticket.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-4 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewTicket(ticket);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span>View Ticket</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onReplyTicket?.(ticket);
                                onViewTicket(ticket);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              <span>Reply</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onAssignAgent?.(ticket);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                              <span>Assign Agent</span>
                            </button>

                            <div className="h-px bg-slate-100 my-1" />

                            <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase">
                              Change Status
                            </div>

                            {(['Open', 'In Progress', 'Pending Merchant', 'Resolved'] as TicketStatus[]).map(
                              (status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onChangeStatus?.(ticket, status);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3.5 py-1.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                                    ticket.status === status
                                      ? 'text-emerald-600 font-bold'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      status === 'Open'
                                        ? 'bg-emerald-500'
                                        : status === 'In Progress'
                                        ? 'bg-amber-500'
                                        : status === 'Pending Merchant'
                                        ? 'bg-purple-500'
                                        : 'bg-teal-500'
                                    }`}
                                  />
                                  <span>{status}</span>
                                </button>
                              )
                            )}

                            <div className="h-px bg-slate-100 my-1" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteTicket?.(ticket);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete Ticket</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 sm:px-5 py-3.5 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        {/* Left: Showing count */}
        <div className="text-slate-500 font-normal whitespace-nowrap">
          Showing <span className="font-semibold text-slate-700">1</span> to{' '}
          <span className="font-semibold text-slate-700">{tickets.length}</span> of{' '}
          <span className="font-semibold text-slate-700">
            {totalTicketsCount.toLocaleString()}
          </span>{' '}
          tickets
        </div>

        {/* Center: Pagination Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 1
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            1
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 2
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            2
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(3)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 3
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            3
          </button>

          <span className="px-1 text-slate-400">...</span>

          <button
            type="button"
            onClick={() => setCurrentPage(156)}
            className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer ${
              currentPage === 156
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            156
          </button>

          <button
            type="button"
            disabled={currentPage === 156}
            onClick={() => setCurrentPage((p) => Math.min(156, p + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Rows per page selector */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-slate-500 text-xs">Rows per page</span>
          <div className="relative">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 cursor-pointer shadow-2xs focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
