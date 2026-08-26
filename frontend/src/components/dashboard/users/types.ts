export type AdminUserRole =
  | 'Super Admin'
  | 'Platform Manager'
  | 'Support Agent'
  | 'Finance Admin'
  | 'Security Admin'
  | 'Others';

export type AdminUserStatus = 'Active' | 'Inactive' | 'Suspended' | 'Pending';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  avatarBgColor?: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  lastLoginDate: string; // e.g. "Aug 14, 2026"
  lastLoginTime: string; // e.g. "10:32 AM"
  twoFactorAuth: boolean;
  createdAtDate: string; // e.g. "Jan 10, 2024"
  createdAtTime: string; // e.g. "09:15 AM"
  phone?: string;
  department?: string;
  permissionsCount?: number;
}

export interface AdminUserKpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  isNeutral?: boolean;
  periodText: string;
  type: 'total' | 'active' | 'inactive' | 'suspended';
}

export interface AdminUsersFilterState {
  search: string;
  role: string;
  status: string;
  lastLogin: string;
}

export interface RoleDistributionSlice {
  role: AdminUserRole;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
}

export interface UserActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'add' | 'update' | 'deactivate' | 'reset' | '2fa';
}
