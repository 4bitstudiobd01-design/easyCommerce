'use client';

import React from 'react';
import { toast } from 'sonner';
import { UserPlus, PlusCircle, Bell, ShieldAlert, FileText, Settings } from 'lucide-react';
import { QuickActionCard, QuickActionItem } from '../core/QuickActionCard';

export interface QuickActionsWidgetProps {
  actions?: QuickActionItem[];
  isLoading?: boolean;
  className?: string;
}

const defaultActions: QuickActionItem[] = [
  {
    id: 'create-merchant',
    label: 'Onboard Merchant',
    description: 'Manually register new tenant',
    icon: UserPlus,
    onClick: () => toast.info('Merchant onboarding is coming soon.'),
    variant: 'primary',
  },
  {
    id: 'broadcast-notice',
    label: 'Broadcast Notice',
    description: 'Send global system announcement',
    icon: Bell,
    onClick: () => toast.info('Broadcast notices are coming soon.'),
    variant: 'secondary',
  },
  {
    id: 'maintenance-mode',
    label: 'Maintenance Mode',
    description: 'Toggle platform maintenance banner',
    icon: ShieldAlert,
    onClick: () => toast.info('Maintenance mode toggle is coming soon.'),
    variant: 'danger',
  },
  {
    id: 'audit-logs',
    label: 'View Audit Logs',
    description: 'Inspect administrative audit trails',
    icon: FileText,
    onClick: () => toast.info('Audit logs viewer is coming soon.'),
    variant: 'secondary',
  },
];

export function QuickActionsWidget({
  actions = defaultActions,
  isLoading = false,
  className = '',
}: QuickActionsWidgetProps) {
  return (
    <QuickActionCard
      title="Platform Operations Shortcuts"
      subtitle="Frequently executed administrative controls"
      actions={actions}
      isLoading={isLoading}
      className={className}
    />
  );
}
