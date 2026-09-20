'use client';

import React from 'react';
import { CrmNavigationHeader } from '@/features/crm/components/CrmNavigationHeader';
import { OmnichannelChatInterface } from '@/features/crm/components/omnichannel/OmnichannelChatInterface';

export default function OmnichannelChatPage() {
  return (
    <div className="space-y-6">
      <CrmNavigationHeader
        title="Omnichannel Live Chat & Inbox"
        subtitle="Real-time multi-platform customer conversations across WhatsApp, Telegram, Facebook & Messenger, and Instagram."
      />
      <OmnichannelChatInterface />
    </div>
  );
}
