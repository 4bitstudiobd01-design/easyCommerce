'use client';

import React from 'react';
import { NotificationCard, NotificationItem } from '../core/NotificationCard';

export interface NotificationsWidgetProps {
  notifications?: NotificationItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'SSLCommerz Gateway Notice',
    message: 'Scheduled maintenance announced for SSLCommerz net banking on Sunday from 2 AM to 4 AM.',
    timestamp: '10 mins ago',
    severity: 'warning',
    isRead: false,
  },
  {
    id: '2',
    title: 'PostgreSQL Auto-Vacuum Complete',
    message: 'Database storage optimization vacuum completed successfully across all tenant schemas.',
    timestamp: '45 mins ago',
    severity: 'success',
    isRead: false,
  },
  {
    id: '3',
    title: 'High API Latency Alert',
    message: 'Steadfast Courier API response latency spike detected (P99 > 850ms).',
    timestamp: '2 hours ago',
    severity: 'error',
    isRead: true,
  },
];

export function NotificationsWidget({
  notifications = defaultNotifications,
  isLoading = false,
  isError = false,
  onRefresh,
  className = '',
}: NotificationsWidgetProps) {
  return (
    <NotificationCard
      title="Platform Notifications & Security Alerts"
      notifications={notifications}
      isLoading={isLoading}
      isError={isError}
      onRefresh={onRefresh}
      className={className}
    />
  );
}
