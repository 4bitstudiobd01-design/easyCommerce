'use client';

import React from 'react';
import { CustomerSegment, Customer360 } from '../../types/crm.types';
import { useGetSegmentCustomersQuery } from '../../api/crmApi';
import { formatCrmDate } from '../../utils/formatDate';
import {
  X,
  Users,
  MessageCircle,
  PhoneCall,
  ShoppingBag,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface SegmentCustomersModalProps {
  segment: CustomerSegment | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer?: (customer: Customer360) => void;
}

export const SegmentCustomersModal: React.FC<SegmentCustomersModalProps> = ({
  segment,
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const { data: customers = [], isLoading } = useGetSegmentCustomersQuery(segment?.id || '', {
    skip: !segment?.id || !isOpen,
  });

  if (!isOpen || !segment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-start gap-3.5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs shrink-0 mt-0.5"
              style={{ backgroundColor: segment.color || '#3B82F6' }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{segment.name}</h3>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full text-[10px] font-black uppercase">
                  {segment.type} Segment
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                {segment.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metrics Summary Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Matching Profiles</span>
              <p className="font-extrabold text-slate-900 text-sm">{customers.length} Real Customers</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Average Spend</span>
              <p className="font-extrabold text-emerald-600 text-sm">
                ৳{(segment.avgSpend || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <Link
            href={`/dashboard/crm/customers?segment=${segment.id}`}
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs shadow-2xs"
          >
            <span>Open in Customer Directory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Customer List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              <p className="text-xs font-bold">Loading real segment customers from database...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-sm text-slate-700">No customers currently match this segment</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                As real customers place orders and reach the criteria, they will be automatically categorized here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {customers.map((cust) => (
                <div
                  key={cust.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {cust.fullName || `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Valued Customer'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cust.status === 'GUEST'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cust.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span>📞 {cust.phone}</span>
                      {cust.email && <span>✉️ {cust.email}</span>}
                      {cust.lastOrderAt && (
                        <span>🕒 Last order: {formatCrmDate(cust.lastOrderAt)}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Metrics & Contact */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Spent</span>
                      <span className="font-black text-slate-900 text-sm">
                        ৳{Number(cust.totalSpent || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {cust.ordersCount || 0} Orders
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/88${cust.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${cust.phone}`}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all"
                        title="Direct Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-slate-500 font-medium">
            Real dynamic customer data powered by BitCommerce PostgreSQL CRM engine.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
