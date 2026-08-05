import { AdminRole } from './dashboard.permissions';

export interface RolePresetConfig {
  role: AdminRole;
  defaultWidgetIds: string[];
  hiddenWidgetIds: string[];
  pinnedWidgetIds: string[];
}

export const ROLE_PRESETS: Record<AdminRole, RolePresetConfig> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    defaultWidgetIds: ['platform-health', 'revenue-kpis', 'merchant-overview', 'store-overview', 'recent-activities', 'quick-actions'],
    hiddenWidgetIds: [],
    pinnedWidgetIds: ['platform-health', 'revenue-kpis'],
  },
  FINANCE_ADMIN: {
    role: 'FINANCE_ADMIN',
    defaultWidgetIds: ['revenue-kpis', 'subscription-overview', 'payments-overview'],
    hiddenWidgetIds: ['infrastructure-status', 'error-monitoring'],
    pinnedWidgetIds: ['revenue-kpis'],
  },
  SUPPORT_ADMIN: {
    role: 'SUPPORT_ADMIN',
    defaultWidgetIds: ['merchant-overview', 'store-overview', 'orders-overview', 'quick-actions'],
    hiddenWidgetIds: ['revenue-kpis', 'infrastructure-status'],
    pinnedWidgetIds: ['store-overview'],
  },
  OPERATIONS_ADMIN: {
    role: 'OPERATIONS_ADMIN',
    defaultWidgetIds: ['merchant-overview', 'orders-overview', 'courier-overview', 'quick-actions'],
    hiddenWidgetIds: ['infrastructure-status'],
    pinnedWidgetIds: ['orders-overview'],
  },
  DEVOPS_ADMIN: {
    role: 'DEVOPS_ADMIN',
    defaultWidgetIds: ['platform-health', 'infrastructure-status', 'error-monitoring', 'audit-logs'],
    hiddenWidgetIds: ['revenue-kpis', 'subscription-overview'],
    pinnedWidgetIds: ['platform-health', 'infrastructure-status'],
  },
  READ_ONLY_AUDITOR: {
    role: 'READ_ONLY_AUDITOR',
    defaultWidgetIds: ['platform-health', 'merchant-overview', 'audit-logs'],
    hiddenWidgetIds: ['quick-actions'],
    pinnedWidgetIds: [],
  },
};
