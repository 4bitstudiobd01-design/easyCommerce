'use client';

import React from 'react';
import { PlaceholderPage } from '@/components/dashboard/common/PlaceholderPage';

export default function BackgroundJobsPage() {
  return (
    <PlaceholderPage
      title="Background Jobs"
      section="System"
      description="Inspect BullMQ job queues, recurring synchronization cron jobs, dead letter queues, and retries."
    />
  );
}
