'use client';

import React from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  GitMerge,
  ChevronDown,
  UserCheck,
  Flag,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TicketRecord,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../types';

interface TicketInfoSidebarProps {
  ticket: TicketRecord;
  onUpdateStatus: (status: TicketStatus) => void;
  onUpdatePriority: (priority: TicketPriority) => void;
  onUpdateCategory: (category: TicketCategory) => void;
  onReassignAgent: () => void;
  onMergeTicket: () => void;
}

export function TicketInfoSidebar({
  ticket,
  onUpdateStatus,
  onUpdatePriority,
  onUpdateCategory,
  onReassignAgent,
  onMergeTicket,
}: TicketInfoSidebarProps) {
  return (
    <div className="space-y-5">
      {/* ======================================================== */}
      {/* CARD 1: TICKET INFORMATION */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
          Ticket Information
        </h3>

        <div className="space-y-3 text-xs">
          {/* Ticket ID */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Ticket ID</span>
            <span className="font-mono font-bold text-slate-900">
              {ticket.codeId}
            </span>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Status</span>
            <div className="relative">
              <select
                value={ticket.status}
                onChange={(e) => onUpdateStatus(e.target.value as TicketStatus)}
                className="appearance-none pl-6 pr-7 py-1 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 rounded-lg border border-slate-200 shadow-2xs focus:outline-hidden cursor-pointer"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Merchant">Pending Merchant</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <span
                className={`w-2 h-2 rounded-full absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                  ticket.status === 'Open'
                    ? 'bg-emerald-500'
                    : ticket.status === 'In Progress'
                    ? 'bg-amber-500'
                    : ticket.status === 'Pending Merchant'
                    ? 'bg-purple-500'
                    : ticket.status === 'Resolved'
                    ? 'bg-teal-500'
                    : 'bg-slate-400'
                }`}
              />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Priority</span>
            <div className="relative">
              <select
                value={ticket.priority}
                onChange={(e) =>
                  onUpdatePriority(e.target.value as TicketPriority)
                }
                className="appearance-none pl-6 pr-7 py-1 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 rounded-lg border border-slate-200 shadow-2xs focus:outline-hidden cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
              <Flag
                className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                  ticket.priority === 'High' || ticket.priority === 'Urgent'
                    ? 'text-rose-500 fill-rose-500'
                    : ticket.priority === 'Medium'
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-400'
                }`}
              />
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Category</span>
            <div className="relative">
              <select
                value={ticket.category}
                onChange={(e) =>
                  onUpdateCategory(e.target.value as TicketCategory)
                }
                className="appearance-none pl-2.5 pr-6 py-1 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 rounded-lg border border-slate-200 shadow-2xs focus:outline-hidden cursor-pointer max-w-[140px] truncate"
              >
                <option value="Plan & Billing">Plan & Billing</option>
                <option value="Billing & Payments">Billing & Payments</option>
                <option value="Account & Access">Account & Access</option>
                <option value="Technical Issues">Technical Issues</option>
                <option value="Store Management">Store Management</option>
                <option value="Feature Requests">Feature Requests</option>
                <option value="Domain & SSL">Domain & SSL</option>
                <option value="Product Management">Product Management</option>
                <option value="Refund & Payout">Refund & Payout</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sub Category */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Sub Category</span>
            <span className="text-xs font-semibold text-slate-800">
              {ticket.subCategory || 'Plan Upgrade Issue'}
            </span>
          </div>

          {/* Channel */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Channel</span>
            <span className="text-xs font-semibold text-slate-800">
              {ticket.channel}
            </span>
          </div>

          {/* Source IP */}
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Source IP</span>
            <span className="font-mono text-xs font-medium text-slate-700">
              {ticket.sourceIP || '103.86.XXX.XXX'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 2: MERCHANT INFORMATION */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
            Merchant Information
          </h3>
          <Link
            href={`/admin/merchants`}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View Merchant
          </Link>
        </div>

        {/* Merchant Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0">
            {ticket.merchant.initials || 'U'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {ticket.merchant.storeName}
            </h4>
            <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
              {ticket.merchant.merchantCode || 'ID: MRC-2026-000112'}
            </span>
          </div>
        </div>

        {/* Details List */}
        <div className="pt-1 space-y-2.5 text-xs text-slate-600">
          {/* Subdomain */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <a
              href={`https://${ticket.merchant.subdomain}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:underline flex items-center gap-1 truncate"
            >
              <span>{ticket.merchant.subdomain}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Email */}
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{ticket.merchant.email}</span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{ticket.merchant.phone || '+880 1712-345678'}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{ticket.merchant.location || 'Dhaka, Bangladesh'}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 3: ASSIGNED TO */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight uppercase">
            Assigned To
          </h3>
          <button
            type="button"
            onClick={onReassignAgent}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-0.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Reassign
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            {ticket.assignedAgent?.initials || 'SA'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">
              {ticket.assignedAgent?.name || 'Sadia Ahmed'}
            </h4>
            <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
              {ticket.assignedAgent?.role || 'Support Agent'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 4: SLA INFORMATION */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
          SLA Information
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Response Time</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {ticket.sla?.responseTime || 'Within 2h'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">First Response</span>
            <span className="font-bold text-emerald-600">
              {ticket.sla?.firstResponse || '32m (Met)'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Resolution Time</span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {ticket.sla?.resolutionTime || 'Within 24h'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Time Remaining</span>
            <div className="flex items-center gap-1 font-bold text-emerald-600">
              <Clock className="w-3.5 h-3.5" />
              <span>{ticket.sla?.timeRemaining || '18h 42m'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CARD 5: QUICK ACTIONS */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
          Quick Actions
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Action: Mark as Pending */}
          <button
            type="button"
            onClick={() => onUpdateStatus('Pending Merchant')}
            className="flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Mark as Pending</span>
          </button>

          {/* Action: Mark as Resolved */}
          <button
            type="button"
            onClick={() => onUpdateStatus('Resolved')}
            className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark as Resolved</span>
          </button>

          {/* Action: Close Ticket */}
          <button
            type="button"
            onClick={() => onUpdateStatus('Closed')}
            className="flex items-center justify-center gap-2 p-2.5 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Close Ticket</span>
          </button>

          {/* Action: Merge Ticket */}
          <button
            type="button"
            onClick={onMergeTicket}
            className="flex items-center justify-center gap-2 p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-purple-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <GitMerge className="w-3.5 h-3.5 text-purple-600" />
            <span>Merge Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
