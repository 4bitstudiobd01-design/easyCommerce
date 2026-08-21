'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { TicketDetailsView } from '@/components/dashboard/support/details/TicketDetailsView';

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = typeof params?.id === 'string' ? params.id : undefined;

  return <TicketDetailsView ticketId={ticketId} />;
}
