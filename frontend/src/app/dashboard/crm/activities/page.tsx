'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { ActivityTimelineFeed } from '@/features/crm/components/activities/ActivityTimelineFeed';
import { LogActivityModal } from '@/features/crm/components/activities/LogActivityModal';
import { useGetCrmActivitiesQuery } from '@/features/crm/api/crmApi';
import { CrmActivity } from '@/features/crm/types/crm.types';

export default function CrmActivitiesPage() {
  const { data: activities = [] } = useGetCrmActivitiesQuery();
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

      {/* Log Activity Modal */}
      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onActivityLogged={() => {}}
      />
    </div>
  );
}
