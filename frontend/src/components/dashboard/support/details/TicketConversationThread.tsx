'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Lock,
  Paperclip,
  Activity,
  Ticket,
  MoreHorizontal,
  Download,
  FileText,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TicketRecord,
  TicketMessage,
  TicketAttachment,
  TicketActivityLog,
  RelatedTicket,
} from '../types';

interface TicketConversationThreadProps {
  ticket: TicketRecord;
}

export function TicketConversationThread({ ticket }: TicketConversationThreadProps) {
  const [activeTab, setActiveTab] = useState<
    'conversation' | 'internalNotes' | 'attachments' | 'activityLog' | 'relatedTickets'
  >('conversation');

  const internalNotesCount = ticket.internalNotes?.length || 2;
  const attachmentsCount = ticket.attachments?.length || 3;
  const relatedTicketsCount = ticket.relatedTickets?.length || 1;

  const getAttachmentIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-600" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-rose-600" />;
    return <FileCode className="w-5 h-5 text-amber-600" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      {/* 1. Tab Navigation Bar (Pixel-perfect matching screenshot) */}
      <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-2 border-b border-slate-200/80 overflow-x-auto scrollbar-none">
        {/* Tab: Conversation */}
        <button
          type="button"
          onClick={() => setActiveTab('conversation')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'conversation'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Conversation</span>
        </button>

        {/* Tab: Internal Notes */}
        <button
          type="button"
          onClick={() => setActiveTab('internalNotes')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'internalNotes'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Internal Notes</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {internalNotesCount}
          </span>
        </button>

        {/* Tab: Attachments */}
        <button
          type="button"
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attachments'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Attachments</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {attachmentsCount}
          </span>
        </button>

        {/* Tab: Activity Log */}
        <button
          type="button"
          onClick={() => setActiveTab('activityLog')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'activityLog'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Activity Log</span>
        </button>

        {/* Tab: Related Tickets */}
        <button
          type="button"
          onClick={() => setActiveTab('relatedTickets')}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'relatedTickets'
              ? 'border-emerald-600 text-emerald-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Related Tickets</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {relatedTicketsCount}
          </span>
        </button>
      </div>

      {/* 2. Tab Content Body */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: CONVERSATION STREAM */}
        {/* ======================================================== */}
        {activeTab === 'conversation' && (
          <div className="space-y-6">
            {ticket.messages.map((msg, index) => {
              const isMerchant = msg.authorRole === 'Merchant';
              const isAgent = msg.authorRole === 'Agent' || msg.authorRole === 'Admin';
              const initials =
                msg.authorInitials || (isMerchant ? 'RH' : 'SA');

              // Insert Date Divider before message 2 if present
              const showDateDivider = index === 1;

              return (
                <React.Fragment key={msg.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="h-px bg-slate-100 flex-1" />
                      <span className="px-3 py-1 bg-slate-50 text-[11px] font-semibold text-slate-400 rounded-full border border-slate-200/80">
                        Aug 14, 2026
                      </span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                  )}

                  <div
                    className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border transition-all ${
                      isMerchant
                        ? 'bg-slate-50/40 border-slate-200/80 hover:bg-slate-50/70'
                        : 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/40'
                    }`}
                  >
                    {/* Avatar Icon */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        isMerchant
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {initials}
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 min-w-0">
                      {/* Message Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                            {msg.authorName}
                          </span>

                          {msg.isCurrentUser && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              You
                            </span>
                          )}

                          {msg.authorSubtitle && (
                            <span className="text-[11px] text-slate-400 font-normal">
                              {msg.authorSubtitle}
                            </span>
                          )}
                        </div>

                        {/* Timestamp & Context Menu */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-medium">
                            {msg.timestamp}
                          </span>
                          <button
                            type="button"
                            onClick={() => toast.info('Message options')}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Message Body */}
                      <div className="text-xs sm:text-[13px] text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: INTERNAL NOTES */}
        {/* ======================================================== */}
        {activeTab === 'internalNotes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-slate-900">
                  Private Internal Notes (Visible only to Support Staff)
                </h4>
              </div>
            </div>

            <div className="space-y-3">
              {(ticket.internalNotes || []).map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                        {note.authorInitials || 'A'}
                      </div>
                      <span className="font-bold text-slate-900">
                        {note.authorName}
                      </span>
                      <span className="px-1.5 py-0.2 bg-amber-200/60 text-amber-800 rounded text-[10px] font-semibold">
                        Internal Note
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {note.timestamp}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ATTACHMENTS */}
        {/* ======================================================== */}
        {activeTab === 'attachments' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900">
              Attached Files & Proofs ({ticket.attachments?.length || 0})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(ticket.attachments || []).map((att) => (
                <div
                  key={att.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all flex items-start justify-between shadow-2xs group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-white transition-colors">
                      {getAttachmentIcon(att.type)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                        {att.name}
                      </h5>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {att.size} • by {att.uploadedBy}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {att.uploadedAt}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toast.success(`Downloading ${att.name}`)}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ACTIVITY LOG */}
        {/* ======================================================== */}
        {activeTab === 'activityLog' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900">
              Ticket Timeline & Audit History
            </h4>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {(ticket.activityLogs || []).map((log) => (
                <div key={log.id} className="relative">
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {log.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        by {log.actor}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium ml-auto">
                        {log.timestamp}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-600 mt-0.5 font-normal">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: RELATED TICKETS */}
        {/* ======================================================== */}
        {activeTab === 'relatedTickets' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900">
              Related Merchant Tickets ({ticket.relatedTickets?.length || 0})
            </h4>

            <div className="space-y-2.5">
              {(ticket.relatedTickets || []).map((rel) => (
                <div
                  key={rel.id}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex items-center justify-between cursor-pointer"
                  onClick={() => toast.info(`Viewing related ticket ${rel.codeId}`)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {rel.codeId}
                      </span>
                      <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {rel.status}
                      </span>
                      <span className="px-2 py-0.2 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {rel.priority}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate mt-1">
                      {rel.subject}
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium shrink-0 ml-3">
                    {rel.createdAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
