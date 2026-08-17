'use client';

import React from 'react';
import { PlaceholderPage } from '@/components/dashboard/common/PlaceholderPage';

export default function SecuritySettingsPage() {
  return (
    <PlaceholderPage
      title="Security"
      section="Security"
      description="Configure rate limiting, IP whitelisting, two-factor authentication requirements, and CSRF protection."
    />
  );
}
