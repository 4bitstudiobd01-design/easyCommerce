'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Store,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { MerchantRecord } from './types';

interface MerchantDetailsDrawerProps {
  merchant: MerchantRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MerchantDetailsDrawer({
  merchant,
  isOpen,
  onClose,
}: MerchantDetailsDrawerProps) {
  if (!isOpen || !merchant) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl ${merchant.avatarBg} text-white font-bold text-base flex items-center justify-center shadow-xs`}
              >
                {merchant.initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {merchant.name}
                </h3>
                <a
                  href={`https://${merchant.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 mt-0.5"
                >
                  <span>{merchant.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">30d Revenue</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">
                  {merchant.revenue30d.amount}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">30d Orders</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">
                  {merchant.orders30d.amount}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">MRR</span>
                <span className="text-sm font-bold text-slate-900 block mt-1">
                  {merchant.mrr}
                </span>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Account Details
              </h4>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email
                  </span>
                  <span className="font-semibold text-slate-800">
                    {merchant.contact.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone
                  </span>
                  <span className="font-semibold text-slate-800">
                    {merchant.contact.phone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Current Plan
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    {merchant.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    Active Stores
                  </span>
                  <span className="font-semibold text-slate-800">
                    {merchant.stores} Store{merchant.stores > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined Date
                  </span>
                  <span className="font-medium text-slate-700">
                    {merchant.joinedAt.date} at {merchant.joinedAt.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Management Actions
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Impersonate / Login as Merchant</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Manage Connected Stores</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Suspend Merchant Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
