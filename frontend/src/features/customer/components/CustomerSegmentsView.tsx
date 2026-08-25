'use client';

import React, { useState } from 'react';
import {
  useGetCustomerSegmentsQuery,
  useDeleteCustomerSegmentMutation,
  CustomerSegment,
} from '../api/customerApi';
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  Globe,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { SegmentModal } from './SegmentModal';
import { toast } from 'sonner';

interface CustomerSegmentsViewProps {
  onViewSegmentCustomers: (segmentId: string) => void;
}

export function CustomerSegmentsView({ onViewSegmentCustomers }: CustomerSegmentsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: segments = [], isLoading, isError, refetch } = useGetCustomerSegmentsQuery();
  const [deleteSegment, { isLoading: isDeleting }] = useDeleteCustomerSegmentMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteSegment(id).unwrap();
      toast.success('Customer segment deleted successfully');
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete segment');
    }
  };

  const getConditionLabel = (c: { field: string; operator: string; value: any }) => {
    let fieldName = c.field as string;
    let icon = <Filter className="w-3 h-3 text-slate-500" />;

    if (c.field === 'ordersCount') {
      fieldName = 'Orders';
      icon = <ShoppingBag className="w-3 h-3 text-blue-500" />;
    } else if (c.field === 'totalSpent') {
      fieldName = 'Spent';
      icon = <DollarSign className="w-3 h-3 text-emerald-500" />;
    } else if (c.field === 'daysSinceLastOrder') {
      fieldName = 'Days inactive';
      icon = <Clock className="w-3 h-3 text-amber-500" />;
    } else if (c.field === 'origin') {
      fieldName = 'Origin';
      icon = <Globe className="w-3 h-3 text-indigo-500" />;
    } else if (c.field === 'status') {
      fieldName = 'Status';
      icon = <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
    }

    let op = c.operator as string;
    if (c.operator === 'gte') op = '≥';
    else if (c.operator === 'lte') op = '≤';
    else if (c.operator === 'eq') op = '=';
    else if (c.operator === 'neq') op = '≠';
    else if (c.operator === 'gt') op = '>';
    else if (c.operator === 'lt') op = '<';

    let displayVal = c.value;
    if (c.field === 'totalSpent') displayVal = `৳${Number(c.value).toLocaleString()}`;

    return { fieldName, op, displayVal, icon };
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Customer Segments & Audience Groups</h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter, group, and target your customer base with dynamic rule criteria</p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingSegment(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Segment
        </button>
      </div>

      {/* Segments Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 space-y-3 max-w-md mx-auto my-6 shadow-sm">
          <p className="text-xs font-bold text-rose-700">Unable to load customer segments.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300/80 rounded-3xl p-12 text-center space-y-3.5 max-w-md mx-auto my-6 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-500 rounded-3xl flex items-center justify-center mx-auto border border-slate-200/80 shadow-2xs">
            <Layers className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">No Customer Segments Created</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Create rule-based audience segments (e.g., VIP Buyers, Frequent Shoppers, Inactive Customers) to organize and filter your customer base easily.
          </p>
          <button
            onClick={() => {
              setEditingSegment(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => {
            const matchType = seg.rules?.matchType === 'ANY' ? 'Match ANY' : 'Match ALL';
            return (
              <div
                key={seg.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top: Name & Quick Action Icons */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h3
                        onClick={() => onViewSegmentCustomers(seg.id)}
                        className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
                        title={seg.name}
                      >
                        {seg.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingSegment(seg);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit segment"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(seg.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete segment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {seg.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pl-10.5">
                      {seg.description}
                    </p>
                  )}
                </div>

                {/* Middle: Conditions Pill List */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span>Criteria</span>
                    <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {matchType}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {seg.rules?.conditions?.map((c, i) => {
                      const { fieldName, op, displayVal, icon } = getConditionLabel(c);
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] font-bold text-slate-700"
                        >
                          {icon}
                          <span>{fieldName} {op} <strong className="text-slate-900">{displayVal}</strong></span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom: Match Count & CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-extrabold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{seg.customerCount} {seg.customerCount === 1 ? 'Customer' : 'Customers'}</span>
                  </div>

                  <button
                    onClick={() => onViewSegmentCustomers(seg.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-2xs transition-all inline-flex items-center gap-1.5 active:scale-95"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Deletion Confirmation */}
                {deletingId === seg.id && (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-rose-800">Delete this segment?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 bg-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(seg.id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700 disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Segment Create / Edit Modal */}
      <SegmentModal
        isOpen={isModalOpen}
        segment={editingSegment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSegment(null);
        }}
      />
    </div>
  );
}

