'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { SegmentsOverview } from '@/features/crm/components/segments/SegmentsOverview';
import { CreateSegmentModal } from '@/features/crm/components/segments/CreateSegmentModal';
import { SegmentCustomersModal } from '@/features/crm/components/segments/SegmentCustomersModal';
import { useGetCrmSegmentsQuery } from '@/features/crm/api/crmApi';
import { CustomerSegment } from '@/features/crm/types/crm.types';

export default function CrmSegmentsPage() {
  const { data: serverSegments } = useGetCrmSegmentsQuery();
  const [localSegments, setLocalSegments] = useState<CustomerSegment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);

  const segmentsList = serverSegments && serverSegments.length > 0 ? serverSegments : localSegments;

  const handleSegmentCreated = (newSegment: CustomerSegment) => {
    setLocalSegments([newSegment, ...localSegments]);
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

      {/* Main Segments Grid */}
      <SegmentsOverview
        segments={segmentsList}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSelectSegment={(segment) => setSelectedSegment(segment)}
      />

      {/* Create Segment Modal */}
      <CreateSegmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSegmentCreated={handleSegmentCreated}
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

