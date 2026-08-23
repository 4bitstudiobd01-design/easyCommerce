'use client';

import React, { useState } from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { ActivityTimelineFeed } from '@/features/crm/components/activities/ActivityTimelineFeed';
import { LogActivityModal } from '@/features/crm/components/activities/LogActivityModal';
import { useGetCrmActivitiesQuery } from '@/features/crm/api/crmApi';
import { CrmActivity } from '@/features/crm/types/crm.types';
import { mockActivities } from '@/features/crm/data/crmMockData';

export default function CrmActivitiesPage() {
  const { data: serverActivities } = useGetCrmActivitiesQuery();
  const [localActivities, setLocalActivities] = useState<CrmActivity[]>(mockActivities);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const activitiesList = serverActivities && serverActivities.length > 0 ? serverActivities : localActivities;

  const handleActivityLogged = (newActivity: CrmActivity) => {
    setLocalActivities([newActivity, ...localActivities]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <CrmNavigationHeader
        title="Omnichannel Activity Timeline Hub"
        subtitle="Chronological feed of phone calls, WhatsApp messages, order deliveries, and merchant staff notes"
        activeCount={activitiesList.length}
        addLabel="Log Interaction"
        onAddClick={() => setIsLogModalOpen(true)}
      />

      {/* Timeline Feed */}
      <ActivityTimelineFeed
        activities={activitiesList}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* Log Activity Modal */}
      <LogActivityModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onActivityLogged={handleActivityLogged}
      />
    </div>
  );
}
