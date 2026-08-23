'use client';

import React, { useState } from 'react';
import { CustomerSegment } from '../../types/crm.types';
import {
  Layers,
  Users,
  Sparkles,
  TrendingUp,
  DollarSign,
  Plus,
  Send,
  MoreVertical,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

interface SegmentsOverviewProps {
  segments: CustomerSegment[];
  onOpenCreateModal: () => void;
  onSelectSegment?: (segment: CustomerSegment) => void;
}

export const SegmentsOverview: React.FC<SegmentsOverviewProps> = ({
  segments,
  onOpenCreateModal,
  onSelectSegment,
}) => {
  const handleLaunchCampaign = (segName: string) => {
    toast.success(`Targeted SMS / WhatsApp campaign queued for segment: ${segName}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 relative z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-extrabold uppercase">
              Smart Audience Engine
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Customer Segments & Targeting</h2>
          <p className="text-xs text-slate-300">
            Automatically categorize your customers by purchase behavior, lifetime spend, and recency to send targeted WhatsApp & SMS campaigns.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 relative z-10 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Segment</span>
        </button>
      </div>

      {/* Segments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 group"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs"
                    style={{ backgroundColor: seg.color || '#3B82F6' }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {seg.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {seg.type} Segment
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium mt-3 leading-relaxed">
                {seg.description}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Profiles</span>
                <span className="font-black text-slate-900 block mt-0.5 text-sm">
                  {seg.customerCount} Customers
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg. Spend</span>
                <span className="font-black text-emerald-700 block mt-0.5 text-sm">
                  ৳{seg.avgSpend.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Criteria summary */}
            {seg.criteria && (
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {seg.criteria.minSpend && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md font-bold">
                    Spend &gt; ৳{seg.criteria.minSpend.toLocaleString()}
                  </span>
                )}
                {seg.criteria.minOrders && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold">
                    Orders &gt;= {seg.criteria.minOrders}
                  </span>
                )}
                {seg.criteria.daysSinceLastOrder && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold">
                    Inactive &gt;= {seg.criteria.daysSinceLastOrder}d
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => onSelectSegment && onSelectSegment(seg)}
                className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <span>View Customers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleLaunchCampaign(seg.name)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              >
                <Send className="w-3 h-3 text-blue-400" />
                <span>Broadcast</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
