'use client';

import React, { useState, useMemo } from 'react';
import { CrmActivity, ActivityType } from '../../types/crm.types';
import { useGetCrmActivitiesQuery } from '../../api/crmApi';
import {
  PhoneCall,
  MessageCircle,
  Mail,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Search,
  Plus,
  UserPlus,
  Target,
  CheckCircle2,
  Package,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { formatCrmDate } from '../../utils/formatDate';

const TYPE_FILTERS = [
  { value: 'ALL', label: 'All Activity' },
  { value: 'CUSTOMER_CREATED', label: '🙍 New Customers' },
  { value: 'LEAD_CREATED', label: '🎯 New Leads' },
  { value: 'ORDER_PLACED', label: '🛒 Orders Placed' },
  { value: 'ORDER_DELIVERED', label: '📦 Orders Delivered' },
  { value: 'NOTE_ADDED', label: '📝 Notes' },
  { value: 'CALL', label: '📞 Calls' },
  { value: 'WHATSAPP', label: '💬 WhatsApp' },
] as const;

type FilterType = typeof TYPE_FILTERS[number]['value'];

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case 'CALL':
      return { icon: <PhoneCall className="w-4 h-4" />, bg: 'bg-blue-100 text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'WHATSAPP':
      return { icon: <MessageCircle className="w-4 h-4" />, bg: 'bg-emerald-100 text-emerald-600', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'SMS':
      return { icon: <Mail className="w-4 h-4" />, bg: 'bg-amber-100 text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'ORDER_PLACED':
    case 'ORDER':
      return { icon: <ShoppingCart className="w-4 h-4" />, bg: 'bg-violet-100 text-violet-600', border: 'border-violet-200', dot: 'bg-violet-500' };
    case 'ORDER_DELIVERED':
      return { icon: <Package className="w-4 h-4" />, bg: 'bg-teal-100 text-teal-600', border: 'border-teal-200', dot: 'bg-teal-500' };
    case 'LEAD_CREATED':
      return { icon: <Target className="w-4 h-4" />, bg: 'bg-indigo-100 text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'CUSTOMER_CREATED':
      return { icon: <UserPlus className="w-4 h-4" />, bg: 'bg-rose-100 text-rose-600', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 'STAGE_CHANGE':
    case 'LEAD_STAGE_CHANGED':
      return { icon: <Sparkles className="w-4 h-4" />, bg: 'bg-purple-100 text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'MEETING':
      return { icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-sky-100 text-sky-600', border: 'border-sky-200', dot: 'bg-sky-500' };
    case 'NOTE':
    case 'NOTE_ADDED':
    default:
      return { icon: <FileText className="w-4 h-4" />, bg: 'bg-slate-100 text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}

interface ActivityTimelineFeedProps {
  onOpenLogModal: () => void;
}

export const ActivityTimelineFeed: React.FC<ActivityTimelineFeedProps> = ({ onOpenLogModal }) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data: activities = [], isLoading, isFetching, refetch } = useGetCrmActivitiesQuery(
    undefined, // always fetch all, filter client-side for responsive UI
    { pollingInterval: 30000 }, // auto-refresh every 30s
  );

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    return activities.filter((act) => {
      const matchType =
        filterType === 'ALL' ||
        act.type === filterType ||
        (filterType === 'ORDER_PLACED' && (act.type === 'ORDER' || act.type === 'ORDER_PLACED')) ||
        (filterType === 'NOTE_ADDED' && (act.type === 'NOTE' || act.type === 'NOTE_ADDED'));

      const q = debouncedSearch.toLowerCase();
      const matchSearch =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        (act.customerName && act.customerName.toLowerCase().includes(q)) ||
        (act.leadName && act.leadName.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [activities, filterType, debouncedSearch]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: CrmActivity[] }[] = [];
    const seen = new Map<string, CrmActivity[]>();

    for (const act of filtered) {
      const d = new Date(act.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (d.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (d.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!seen.has(label)) {
        seen.set(label, []);
        groups.push({ date: label, items: seen.get(label)! });
      }
      seen.get(label)!.push(act);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        {/* Search Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, lead, order number, or notes..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenLogModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Interaction</span>
          </button>
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value as FilterType)}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap border transition-all ${
                filterType === f.value
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <span className="font-black text-slate-900">{filtered.length}</span> activities
            {filterType !== 'ALL' && <span> in selected filter</span>}
          </span>
          {(isFetching || isLoading) && (
            <span className="flex items-center gap-1.5 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Syncing live data...
            </span>
          )}
          <span className="ml-auto text-[10px]">Auto-refreshes every 30s</span>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs font-bold">Loading real activity feed from database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center space-y-2 text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-700">No activities match your search</p>
            <p className="text-xs max-w-xs mx-auto">
              Try adjusting your filter or search. New customer registrations, lead additions, and orders will automatically appear here.
            </p>
          </div>
        ) : (
          grouped.map(({ date, items }) => (
            <div key={date} className="space-y-3">
              {/* Date Label */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-2">{date}</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Activity Cards */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
                {items.map((act) => {
                  const actStyle = getActivityIcon(act.type);
                  const authorDisplay = act.authorName || act.actorName || 'System';

                  return (
                    <div
                      key={act.id}
                      className="p-4 flex items-start gap-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Icon */}
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0 ${actStyle.bg} ${actStyle.border}`}
                      >
                        {actStyle.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h4 className="font-black text-xs text-slate-900 leading-tight">{act.title}</h4>
                          {act.outcome && (
                            <span className="inline-flex px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded-md text-[10px] font-bold w-fit">
                              {act.outcome}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">{act.description}</p>

                        {/* Footer */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[10px] text-slate-400 border-t border-slate-100/80">
                          {act.customerName && (
                            <span className="font-bold text-blue-600">👤 {act.customerName}</span>
                          )}
                          {act.leadName && (
                            <span className="font-bold text-indigo-600">🎯 {act.leadName}</span>
                          )}
                          <span className="ml-auto font-medium">
                            {formatCrmDate(act.createdAt, { showTime: true })} · Logged by{' '}
                            <span className="font-bold text-slate-600">{authorDisplay}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
