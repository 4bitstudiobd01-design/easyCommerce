'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Store,
  CreditCard,
  Calendar,
  Mail,
  User,
  Globe,
  DollarSign,
  ShoppingBag,
  Shield,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { StoreRecord } from './types';

interface StoreDetailsDrawerProps {
  store: StoreRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StoreDetailsDrawer({
  store,
  isOpen,
  onClose,
}: StoreDetailsDrawerProps) {
  if (!isOpen || !store) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
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
                className={`w-12 h-12 rounded-2xl ${store.avatarBg} text-white font-bold text-base flex items-center justify-center shadow-xs`}
              >
                {store.initials}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {store.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {store.codeId}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">30d Revenue</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {store.revenue30d.amount}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {store.revenue30d.trend}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl p-3.5 text-center border border-slate-100">
                <span className="text-[11px] text-slate-500 block">30d Orders</span>
                <span className="text-base font-bold text-slate-900 block mt-1">
                  {store.orders30d.count}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {store.orders30d.trend}
                </span>
              </div>
            </div>

            {/* Store Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Store Specifications
              </h4>
              <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Subdomain
                  </span>
                  <a
                    href={`https://${store.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <span>{store.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Merchant Owner
                  </span>
                  <span className="font-semibold text-slate-800">
                    {store.merchant.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Owner Email
                  </span>
                  <span className="font-semibold text-slate-800">
                    {store.merchant.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    Tier Plan
                  </span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    {store.plan}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Creation Date
                  </span>
                  <span className="font-medium text-slate-700">
                    {store.createdAt.date} at {store.createdAt.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Store Controls
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href={`https://${store.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Storefront</span>
                </a>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Configure Custom Domain</span>
                </button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Suspend / Block Store</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
