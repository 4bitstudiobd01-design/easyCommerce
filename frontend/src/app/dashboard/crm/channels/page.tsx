'use client';

import React from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { ChannelCredentialsManager } from '@/features/crm/components/omnichannel/ChannelCredentialsManager';

export default function OmnichannelChannelsPage() {
  return (
    <div className="space-y-6">
      <CrmNavigationHeader
        title="Channel Credentials & Integrations"
        subtitle="Manage secure API credentials, webhook endpoints, and live connections for WhatsApp, Telegram, Facebook, and Twitter."
      />
      <ChannelCredentialsManager />
    </div>
  );
}
