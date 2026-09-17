'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, Layers } from 'lucide-react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { SegmentsOverview } from '@/features/crm/components/segments/SegmentsOverview';
import { CreateSegmentModal } from '@/features/crm/components/segments/CreateSegmentModal';
import { SegmentCustomersModal } from '@/features/crm/components/segments/SegmentCustomersModal';
import { DeleteSegmentModal } from '@/features/crm/components/segments/DeleteSegmentModal';
import { useGetCrmSegmentsQuery, useSeedCrmSegmentsMutation } from '@/features/crm/api/crmApi';
import { CustomerSegment } from '@/features/crm/types/crm.types';

export default function CrmSegmentsPage() {
  const { data: serverSegments, isLoading } = useGetCrmSegmentsQuery();
  const [seedSegments, { isLoading: isSeeding }] = useSeedCrmSegmentsMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [deletingSegment, setDeletingSegment] = useState<CustomerSegment | null>(null);

  const segmentsList = serverSegments || [];

  const handleSeedSegments = async () => {
    try {
      await seedSegments().unwrap();
      toast.success('Starter segments loaded successfully!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to load starter segments.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CrmNavigationHeader
        title="Audience Segmentation & RFM"
        subtitle="Group store customers dynamically by monetary lifetime spend, order frequency, and recency"
        activeCount={segmentsList.length}
        addLabel="New Segment"
        onAddClick={() => setIsCreateModalOpen(true)}
      />

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
          <p className="text-xs font-bold">Loading audience segments...</p>
        </div>
      ) : segmentsList.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-slate-900 text-sm">No audience segments yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Load a set of ready-made starter segments, or build your own from scratch using custom rules.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleSeedSegments}
              disabled={isSeeding}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Load Starter Segments</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-bold rounded-xl transition-all"
            >
              Create Your Own
            </button>
          </div>
        </div>
      ) : (
        <SegmentsOverview
          segments={segmentsList}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onSelectSegment={(segment) => setSelectedSegment(segment)}
          onEditSegment={(segment) => setEditingSegment(segment)}
          onDeleteSegment={(segment) => setDeletingSegment(segment)}
        />
      )}

      {/* Create Segment Modal */}
      <CreateSegmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Segment Modal */}
      <CreateSegmentModal
        isOpen={Boolean(editingSegment)}
        onClose={() => setEditingSegment(null)}
        segment={editingSegment}
      />

      {/* Delete Segment Confirmation */}
      <DeleteSegmentModal
        segment={deletingSegment}
        isOpen={Boolean(deletingSegment)}
        onClose={() => setDeletingSegment(null)}
      />

      {/* View Segment Real Customers Modal */}
      <SegmentCustomersModal
        segment={selectedSegment}
        isOpen={Boolean(selectedSegment)}
        onClose={() => setSelectedSegment(null)}
      />
    </div>
  );
}
