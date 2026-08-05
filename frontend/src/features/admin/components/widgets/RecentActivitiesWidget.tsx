'use client';

import React from 'react';
import { Activity, UserPlus, ShieldAlert, ShoppingBag, ArrowUpRight, Lock } from 'lucide-react';
import { ActivityCard, ActivityItem } from '../core/ActivityCard';
import { StatusBadge } from '../core/StatusBadge';

export interface RecentActivitiesWidgetProps {
  items?: ActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | { message?: string } | null;
  lastUpdated?: string;
  onRefresh?: () => void;
  onViewAll?: () => void;
  className?: string;
}

const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    title: 'New Merchant Onboarded',
    subtitle: 'Urban Attire BD created a new store account (urban-attire)',
    timestamp: '2 mins ago',
    icon: UserPlus,
    badge: <StatusBadge status="active" label="Merchant" />,
  },
  {
    id: '2',
    title: 'Store Plan Upgraded',
    subtitle: 'Deshi Look upgraded to Growth Tier (৳2,490 BDT/mo)',
    timestamp: '14 mins ago',
    icon: ArrowUpRight,
    badge: <StatusBadge status="operational" label="Upgrade" />,
  },
  {
    id: '3',
    title: 'High Volume Order Spike',
    subtitle: 'Mrittika Crafts processed 50 orders in under 10 minutes',
    timestamp: '32 mins ago',
    icon: ShoppingBag,
    badge: <StatusBadge status="operational" label="Orders" />,
  },
  {
    id: '4',
    title: 'Store Account Suspended',
    subtitle: 'Replica Vault suspended due to policy violation & fraudulent orders',
    timestamp: '1 hour ago',
    icon: Lock,
    badge: <StatusBadge status="suspended" label="Suspended" />,
  },
];

export function RecentActivitiesWidget({
  items = defaultActivities,
  isLoading = false,
  isError = false,
  error,
  onRefresh,
  onViewAll,
  className = '',
}: RecentActivitiesWidgetProps) {
  return (
    <ActivityCard
      title="Recent Platform Activity Stream"
      subtitle="Realtime log of administrative and store events"
      icon={Activity}
      items={items}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRefresh={onRefresh}
      onViewAll={onViewAll}
      className={className}
    />
  );
}
