'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { ActivityTimelineFeed } from '@/features/crm/components/activities/ActivityTimelineFeed';
import { LogActivityModal } from '@/features/crm/components/activities/LogActivityModal';
import { useGetCrmActivitiesQuery } from '@/features/crm/api/crmApi';
import { CrmActivity } from '@/features/crm/types/crm.types';

export default function CrmActivitiesPage() {
  const { data: activities = [], refetch } = useGetCrmActivitiesQuery();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <CrmNavigationHeader
        title="Omnichannel Activity Hub"
        subtitle="Live chronological feed of customer registrations, lead additions, orders, calls, WhatsApp messages, and staff notes"
        activeCount={activities.length}
        addLabel="Log Interaction"
        onAddClick={() => setIsLogModalOpen(true)}
      />

      {/* Timeline Feed — self-fetching, real data */}
      <ActivityTimelineFeed
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* Log Activity Modal — the mutation already invalidates the CrmActivity tag,
          so this feed and ActivityTimelineFeed's own query refetch automatically;
          we still force an explicit refetch here for immediate feedback. */}
      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onActivityLogged={() => {
          refetch();
        }}
      />
    </div>
  );
}
