'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { SegmentsOverview } from '@/features/crm/components/segments/SegmentsOverview';
import { CreateSegmentModal } from '@/features/crm/components/segments/CreateSegmentModal';
import { useGetCrmSegmentsQuery } from '@/features/crm/api/crmApi';
import { CustomerSegment } from '@/features/crm/types/crm.types';
import { mockSegments } from '@/features/crm/data/crmMockData';

export default function CrmSegmentsPage() {
  const { data: serverSegments } = useGetCrmSegmentsQuery();
  const [localSegments, setLocalSegments] = useState<CustomerSegment[]>(mockSegments);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
      />

      {/* Create Segment Modal */}
      <CreateSegmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSegmentCreated={handleSegmentCreated}
      />
    </div>
  );
}
