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
  Sparkles,
  SearchX,
  Loader2,
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

  const { data: segments = [], isLoading, isError } = useGetCustomerSegmentsQuery();
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

  const formatRulesSummary = (rules?: CustomerSegment['rules']) => {
    if (!rules || !rules.conditions || rules.conditions.length === 0) return 'No rules defined';
    const matchType = rules.matchType === 'ANY' ? 'OR' : 'AND';

    return rules.conditions
      .map((c) => {
        let fieldName = c.field as string;
        if (c.field === 'ordersCount') fieldName = 'Orders';
        else if (c.field === 'totalSpent') fieldName = 'Spent';
        else if (c.field === 'daysSinceLastOrder') fieldName = 'Days since last order';

        let op = c.operator as string;
        if (c.operator === 'gte') op = '≥';
        else if (c.operator === 'lte') op = '≤';
        else if (c.operator === 'eq') op = '=';

        return `${fieldName} ${op} ${c.value}`;
      })
      .join(` ${matchType} `);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="font-extrabold text-sm text-slate-900">Customer Segments & Groups</h2>
          <p className="text-xs text-slate-500 mt-0.5">Automated rule-based customer grouping and targeted filtering</p>
        </div>

        <button
          onClick={() => {
            setEditingSegment(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Create Segment
        </button>
      </div>

      {/* Segments Grid / Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-rose-600 bg-white rounded-2xl border border-rose-200">
          Unable to load customer segments.
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto my-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-slate-900 text-base">No Customer Segments Created</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create rule-based customer segments (e.g. High Value VIPs, Inactive Buyers, Repeat Customers) to organize and filter your customer base easily.
          </p>
          <button
            onClick={() => {
              setEditingSegment(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create First Segment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Segment Name</th>
                  <th className="py-3.5 px-4 text-center">Customers</th>
                  <th className="py-3.5 px-4">Rule Criteria</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {segments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Segment Name & Description */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 text-xs block hover:text-blue-600 cursor-pointer" onClick={() => onViewSegmentCustomers(seg.id)}>
                        {seg.name}
                      </span>
                      {seg.description && (
                        <span className="text-[11px] text-slate-400 block truncate">{seg.description}</span>
                      )}
                    </td>

                    {/* Customer Match Count Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                        <Users className="w-3 h-3 text-blue-600" />
                        {seg.customerCount}
                      </span>
                    </td>

                    {/* Rules Summary */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-lg text-[11px]">
                        {formatRulesSummary(seg.rules)}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(seg.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewSegmentCustomers(seg.id)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-[11px] rounded-lg border border-blue-100 transition-colors inline-flex items-center gap-1"
                          title="View Customers in Segment"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Customers
                        </button>

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

                      {deletingId === seg.id && (
                        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between gap-2 mt-2">
                          <span className="text-[11px] font-bold text-rose-800">Delete segment definition?</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-0.5 bg-white text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(seg.id)}
                              disabled={isDeleting}
                              className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-700"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
