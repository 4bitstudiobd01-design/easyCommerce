'use client';

import React, { useState } from 'react';
import { CrmActivity, ActivityType } from '../../types/crm.types';
import {
  Activity,
  PhoneCall,
  MessageCircle,
  Mail,
  FileText,
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Plus,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';

interface ActivityTimelineFeedProps {
  activities: CrmActivity[];
  onOpenLogModal: () => void;
}

export const ActivityTimelineFeed: React.FC<ActivityTimelineFeedProps> = ({
  activities,
  onOpenLogModal,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | ActivityType>('ALL');
  const [search, setSearch] = useState('');

  const filtered = activities.filter((act) => {
    const matchType = filterType === 'ALL' || act.type === filterType;
    const matchSearch =
      act.title.toLowerCase().includes(search.toLowerCase()) ||
      act.description.toLowerCase().includes(search.toLowerCase()) ||
      (act.customerName && act.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (act.leadName && act.leadName.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-blue-600" />;
      case 'WHATSAPP':
        return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'ORDER':
        return <ShoppingBag className="w-4 h-4 text-purple-600" />;
      case 'SMS':
        return <Mail className="w-4 h-4 text-amber-600" />;
      case 'STAGE_CHANGE':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'NOTE':
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getActivityBg = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return 'bg-blue-50 border-blue-200';
      case 'WHATSAPP':
        return 'bg-emerald-50 border-emerald-200';
      case 'ORDER':
        return 'bg-purple-50 border-purple-200';
      case 'SMS':
        return 'bg-amber-50 border-amber-200';
      case 'STAGE_CHANGE':
        return 'bg-indigo-50 border-indigo-200';
      case 'NOTE':
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities by customer, notes, or outcome..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Interaction Types</option>
            <option value="WHATSAPP">WhatsApp Conversations</option>
            <option value="CALL">Phone Calls</option>
            <option value="ORDER">Orders & Deliveries</option>
            <option value="STAGE_CHANGE">Lead Stage Changes</option>
            <option value="NOTE">Internal Notes</option>
          </select>

          <button
            onClick={onOpenLogModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Interaction</span>
          </button>
        </div>
      </div>

      {/* Timeline Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 relative before:absolute before:left-10 before:top-8 before:bottom-8 before:w-0.5 before:bg-slate-200">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold">No activities matching your filters</p>
          </div>
        ) : (
          filtered.map((act) => (
            <div key={act.id} className="relative pl-12 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group">
              {/* Icon Marker */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center border absolute -left-0.5 top-0 shadow-xs ${getActivityBg(
                  act.type
                )}`}
              >
                {getActivityIcon(act.type)}
              </div>

              {/* Content Box */}
              <div className="flex-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 group-hover:border-blue-300 group-hover:bg-blue-50/20 transition-all space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs text-slate-900">{act.title}</h4>
                    {act.outcome && (
                      <span className="px-2 py-0.2 bg-white text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold">
                        {act.outcome}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatCrmDate(act.createdAt, { showTime: true })}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {act.description}
                </p>

                {/* Footer attribution */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    {act.customerName && (
                      <span className="font-bold text-blue-600">👤 {act.customerName}</span>
                    )}
                    {act.leadName && (
                      <span className="font-bold text-indigo-600">🎯 {act.leadName}</span>
                    )}
                  </div>
                  <span>Logged by {act.authorName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
