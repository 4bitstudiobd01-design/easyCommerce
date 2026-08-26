'use client';

import React, { useState } from 'react';
import {
  X,
  Store,
  Mail,
  Phone,
  User,
  ExternalLink,
  Send,
  Lock,
  MessageSquare,
  Clock,
  ShieldCheck,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TicketRecord,
  TicketStatus,
  TicketPriority,
  TicketMessage,
} from './types';

interface TicketDetailsDrawerProps {
  ticket: TicketRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTicket: (updated: TicketRecord) => void;
}

export function TicketDetailsDrawer({
  ticket,
  isOpen,
  onClose,
  onUpdateTicket,
}: TicketDetailsDrawerProps) {
  const [replyTab, setReplyTab] = useState<'reply' | 'internal'>('reply');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleStatusChange = (newStatus: TicketStatus) => {
    const updated: TicketRecord = {
      ...ticket,
      status: newStatus,
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
    };
    onUpdateTicket(updated);
    toast.success(`Status updated to "${newStatus}"`);
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    const updated: TicketRecord = {
      ...ticket,
      priority: newPriority,
    };
    onUpdateTicket(updated);
    toast.success(`Priority updated to "${newPriority}"`);
  };

  const handleSendReply = (markResolved = false) => {
    if (!replyText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: 'Platform Admin',
      authorRole: 'Admin',
      content: replyText.trim(),
      timestamp: 'Just now',
      isInternal: replyTab === 'internal',
    };

    const newStatus = markResolved ? 'Resolved' : replyTab === 'internal' ? ticket.status : 'In Progress';

    const updated: TicketRecord = {
      ...ticket,
      status: newStatus,
      lastUpdateDate: 'Aug 14, 2026',
      lastUpdateTime: 'Just now',
      messages: [...ticket.messages, newMessage],
    };

    setTimeout(() => {
      onUpdateTicket(updated);
      setReplyText('');
      setIsSending(false);
      toast.success(
        replyTab === 'internal'
          ? 'Internal note added'
          : markResolved
          ? 'Reply sent and ticket resolved!'
          : 'Reply sent successfully'
      );
    }, 250);
  };

  const cannedResponses = [
    'We are actively investigating this issue.',
    'DNS propagation has been verified.',
    'Refund reference ARN has been dispatched.',
    'CDN cache has been cleared for your store domain.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-250 ease-out border-l border-slate-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/60 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/70 px-2 py-0.5 rounded-md">
                {ticket.codeId}
              </span>
              <span className="text-[11px] text-slate-400">
                Created on {ticket.createdAt}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                via {ticket.channel}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {ticket.subject}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Middle Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          {/* Quick Controls: Status, Priority, Category, Assigned Agent */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            {/* Status Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Status
              </label>
              <div className="relative">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  className="w-full appearance-none pl-2.5 pr-6 py-1.5 bg-white text-xs font-bold text-slate-800 rounded-lg border border-slate-200 cursor-pointer shadow-2xs focus:outline-hidden"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Merchant">Pending Merchant</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Priority
              </label>
              <div className="relative">
                <select
                  value={ticket.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                  className="w-full appearance-none pl-2.5 pr-6 py-1.5 bg-white text-xs font-bold text-slate-800 rounded-lg border border-slate-200 cursor-pointer shadow-2xs focus:outline-hidden"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Category
              </label>
              <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 truncate">
                {ticket.category}
              </div>
            </div>

            {/* Assigned Agent */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Assigned Agent
              </label>
              <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 truncate">
                {ticket.assignedAgent?.name || 'Unassigned'}
              </div>
            </div>
          </div>

          {/* Merchant Profile Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {ticket.merchant.storeName}
                  </h4>
                  <a
                    href={`https://${ticket.merchant.subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>{ticket.merchant.subdomain}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {ticket.merchant.plan} Plan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{ticket.merchant.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{ticket.merchant.email}</span>
              </div>
              {ticket.merchant.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ticket.merchant.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Conversation History ({ticket.messages.length})
              </h3>
            </div>

            <div className="space-y-3.5">
              {ticket.messages.map((msg) => {
                const isMerchant = msg.authorRole === 'Merchant';
                const isInternal = msg.isInternal;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-4 transition-all ${
                      isInternal
                        ? 'bg-amber-50/70 border border-amber-200 text-amber-900'
                        : isMerchant
                        ? 'bg-slate-50 border border-slate-200/90 text-slate-800'
                        : 'bg-emerald-50/50 border border-emerald-200/80 text-slate-800'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isInternal
                              ? 'bg-amber-200 text-amber-800'
                              : isMerchant
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isInternal ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            msg.authorName[0]
                          )}
                        </div>

                        <span className="text-xs font-bold text-slate-900">
                          {msg.authorName}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            isInternal
                              ? 'bg-amber-200/80 text-amber-800'
                              : isMerchant
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isInternal ? 'Internal Note' : msg.authorRole}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Message Content */}
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Reply Composer */}
        <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white shrink-0 space-y-3">
          {/* Tab Selector: Customer Reply vs Internal Note */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setReplyTab('reply')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  replyTab === 'reply'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Reply to Merchant</span>
              </button>

              <button
                type="button"
                onClick={() => setReplyTab('internal')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  replyTab === 'internal'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Internal Note</span>
              </button>
            </div>

            {/* AI Assistant / Canned Response Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Quick snippet:
              </span>
              <button
                type="button"
                onClick={() => setReplyText(cannedResponses[0])}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
              >
                Investigating
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                replyTab === 'internal'
                  ? 'Add private note visible only to support agents and admins...'
                  : 'Write a response to the merchant...'
              }
              className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-hidden focus:ring-2 resize-none transition-all ${
                replyTab === 'internal'
                  ? 'bg-amber-50/40 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 text-amber-950 placeholder-amber-400'
                  : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => toast.info('File attachment dialog')}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span className="text-[11px]">Attach files</span>
            </button>

            <div className="flex items-center gap-2">
              {replyTab === 'reply' && (
                <button
                  type="button"
                  disabled={isSending || !replyText.trim()}
                  onClick={() => handleSendReply(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Send & Resolve
                </button>
              )}

              <button
                type="button"
                disabled={isSending || !replyText.trim()}
                onClick={() => handleSendReply(false)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
                  replyTab === 'internal'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{replyTab === 'internal' ? 'Add Note' : 'Send Reply'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
