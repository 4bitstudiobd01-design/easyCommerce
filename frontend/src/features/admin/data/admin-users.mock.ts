/**
 * Static demo data for the platform Admin Users page. There is no backend
 * "platform admin roles" module yet (only SUPER_ADMIN exists today) — this
 * mirrors the target design so the UI can be wired to a real endpoint later.
 */

export type AdminRole = 'Super Admin' | 'Platform Manager' | 'Support Agent' | 'Finance Admin';
export type AdminUserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminUserStatus;
  lastLoginDate: string;
  lastLoginTime: string;
  twoFactorEnabled: boolean;
  createdDate: string;
  createdTime: string;
}

export const ADMIN_USER_STATS = {
  total: { value: 18, trendPercent: 12 },
  active: { value: 16, trendPercent: 6 },
  inactive: { value: 2, trendPercent: -33 },
  suspended: { value: 0, trendPercent: 0 },
};

export const ROLE_DISTRIBUTION: Array<{ role: AdminRole | 'Others'; count: number; percent: number; color: string }> = [
  { role: 'Super Admin', count: 1, percent: 5.6, color: '#6366F1' },
  { role: 'Platform Manager', count: 4, percent: 22.2, color: '#2563EB' },
  { role: 'Support Agent', count: 7, percent: 38.9, color: '#F59E0B' },
  { role: 'Finance Admin', count: 3, percent: 16.7, color: '#10B981' },
  { role: 'Others', count: 3, percent: 16.7, color: '#94A3B8' },
];

export const ADMIN_USERS: AdminUserRow[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'superadmin@easyco.com',
    role: 'Super Admin',
    status: 'Active',
    lastLoginDate: 'Aug 14, 2026',
    lastLoginTime: '10:32 AM',
    twoFactorEnabled: true,
    createdDate: 'Jan 10, 2024',
    createdTime: '09:15 AM',
  },
  {
    id: '2',
    name: 'Platform Manager',
    email: 'pmanager@easyco.com',
    role: 'Platform Manager',
    status: 'Active',
    lastLoginDate: 'Aug 14, 2026',
    lastLoginTime: '09:18 AM',
    twoFactorEnabled: true,
    createdDate: 'Feb 02, 2024',
    createdTime: '11:20 AM',
  },
  {
    id: '3',
    name: 'Rahim Hossain',
    email: 'rahim.hossain@easyco.com',
    role: 'Platform Manager',
    status: 'Active',
    lastLoginDate: 'Aug 13, 2026',
    lastLoginTime: '06:45 AM',
    twoFactorEnabled: true,
    createdDate: 'Feb 15, 2024',
    createdTime: '02:30 PM',
  },
  {
    id: '4',
    name: 'Sadia Ahmed',
    email: 'sadia.ahmed@easyco.com',
    role: 'Support Agent',
    status: 'Active',
    lastLoginDate: 'Aug 13, 2026',
    lastLoginTime: '03:10 PM',
    twoFactorEnabled: true,
    createdDate: 'Mar 05, 2024',
    createdTime: '10:05 AM',
  },
  {
    id: '5',
    name: 'Fahim Ahmed',
    email: 'fahim.ahmed@easyco.com',
    role: 'Finance Admin',
    status: 'Active',
    lastLoginDate: 'Aug 12, 2026',
    lastLoginTime: '11:05 AM',
    twoFactorEnabled: false,
    createdDate: 'Mar 20, 2024',
    createdTime: '01:40 PM',
  },
  {
    id: '6',
    name: 'Jannatul Ferdous',
    email: 'jannat.ferdous@easyco.com',
    role: 'Support Agent',
    status: 'Inactive',
    lastLoginDate: 'Jul 28, 2026',
    lastLoginTime: '04:22 PM',
    twoFactorEnabled: true,
    createdDate: 'Apr 10, 2024',
    createdTime: '09:30 AM',
  },
  {
    id: '7',
    name: 'Nahid Hasan',
    email: 'nahid.hasan@easyco.com',
    role: 'Platform Manager',
    status: 'Inactive',
    lastLoginDate: 'Jul 15, 2026',
    lastLoginTime: '10:11 AM',
    twoFactorEnabled: false,
    createdDate: 'Apr 18, 2024',
    createdTime: '11:45 AM',
  },
  {
    id: '8',
    name: 'Aminur Rahman',
    email: 'aminur.rahman@easyco.com',
    role: 'Finance Admin',
    status: 'Active',
    lastLoginDate: 'Aug 14, 2026',
    lastLoginTime: '08:15 AM',
    twoFactorEnabled: true,
    createdDate: 'May 01, 2024',
    createdTime: '02:20 PM',
  },
  {
    id: '9',
    name: 'Mithila Khan',
    email: 'mithila.khan@easyco.com',
    role: 'Support Agent',
    status: 'Active',
    lastLoginDate: 'Aug 11, 2026',
    lastLoginTime: '05:45 PM',
    twoFactorEnabled: true,
    createdDate: 'May 18, 2024',
    createdTime: '03:10 PM',
  },
  {
    id: '10',
    name: 'Tanvir Shuvo',
    email: 'tanvir.shuvo@easyco.com',
    role: 'Support Agent',
    status: 'Active',
    lastLoginDate: 'Aug 10, 2026',
    lastLoginTime: '09:22 AM',
    twoFactorEnabled: false,
    createdDate: 'Jun 02, 2024',
    createdTime: '09:50 AM',
  },
];

export const ADMIN_USERS_TOTAL_COUNT = 18;
