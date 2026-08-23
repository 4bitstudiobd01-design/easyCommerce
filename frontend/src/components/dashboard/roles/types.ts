export type RoleType = 'System Role' | 'Custom Role';
export type RoleStatus = 'Active' | 'Inactive' | 'Draft';

export type RolesTab =
  | 'Roles'
  | 'Permissions'
  | 'Users'
  | 'Permission Groups'
  | 'Access Requests';

export type PermissionLevel =
  | 'Full Access'
  | 'Create / Edit'
  | 'View Only'
  | 'No Access'
  | 'No Permission';

export interface RoleRecord {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  usersCount: number;
  status: RoleStatus;
  createdAtDate: string;
  createdAtTime: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  isSystem?: boolean;
}

export interface RoleKpiMetric {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  periodText: string;
  type: 'roles' | 'permissions' | 'users' | 'groups';
}

export interface PermissionMatrixRow {
  id: string;
  module: string;
  iconName: string;
  superAdmin: PermissionLevel;
  platformManager: PermissionLevel;
  supportAgent: PermissionLevel;
  financeAdmin: PermissionLevel;
  contentManager: PermissionLevel;
  readOnlyAnalyst: PermissionLevel;
}

export interface PermissionSummarySlice {
  level: PermissionLevel;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
}

export interface AccessRequestItem {
  id: string;
  userName: string;
  userEmail: string;
  requestedRole: string;
  currentRole: string;
  reason: string;
  requestDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface PermissionGroupItem {
  id: string;
  name: string;
  description: string;
  permissionsCount: number;
  assignedRolesCount: number;
}

// -------------------------------------------------------------
// Granular Permissions Tab Types
// -------------------------------------------------------------

export type PermissionActionType =
  | 'View'
  | 'Create / Edit'
  | 'Delete'
  | 'Update'
  | 'Refund'
  | 'Export'
  | 'Manage';

export type PermissionCategoryType = 'System' | 'Custom';

export interface PermissionRecord {
  id: string;
  name: string;
  description: string;
  permissionKey: string;
  module: string;
  moduleIconName: string;
  action: PermissionActionType;
  type: PermissionCategoryType;
  status: 'Active' | 'Inactive';
  createdAtDate: string;
  createdAtTime: string;
  updatedAtDate: string;
  updatedAtTime: string;
  assignedRolesCount: number;
  assignedUsersCount: number;
  assignedGroupsCount: number;
}

export interface PermissionKpiMetric {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  type: 'total' | 'system' | 'custom' | 'modules';
}

export interface PermissionsFilterState {
  search: string;
  module: string;
  action: string;
  status: string;
}
