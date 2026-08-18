'use client';

import React from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Upload,
  MoreHorizontal,
  Users,
  ShieldCheck,
  UserX,
  Ban,
  UserPlus,
  Pencil,
  UserMinus,
  KeyRound,
  Mail,
  Layers,
} from 'lucide-react';
import { MetricCard } from '@/features/admin/components/core/MetricCard';
import { ActivityCard } from '@/features/admin/components/core/ActivityCard';
import { RoleDistributionCard } from '@/features/admin/components/users/RoleDistributionCard';
import { AdminUsersTable } from '@/features/admin/components/users/AdminUsersTable';
import { PlatformQuickActions } from '@/features/admin/components/users/PlatformQuickActions';
import { ADMIN_USER_STATS } from '@/features/admin/data/admin-users.mock';

const RECENT_ACTIVITY = [
  {
    id: '1',
    title: 'New user added',
    subtitle: 'Fahim Ahmed was added as Finance Admin',
    timestamp: 'Aug 14, 2026 10:20 AM',
    icon: UserPlus,
  },
  {
    id: '2',
    title: 'Role updated',
    subtitle: "Mithila Khan's role changed to Support Agent",
    timestamp: 'Aug 13, 2026 04:35 PM',
    icon: Pencil,
  },
  {
    id: '3',
    title: 'User deactivated',
    subtitle: 'Jannatul Ferdous was deactivated',
    timestamp: 'Aug 13, 2026 11:10 AM',
    icon: UserMinus,
  },
  {
    id: '4',
    title: 'Password reset',
    subtitle: 'Password reset for Nahid Hasan',
    timestamp: 'Aug 12, 2026 09:25 AM',
    icon: KeyRound,
  },
  {
    id: '5',
    title: '2FA enabled',
    subtitle: 'Aminur Rahman enabled Two-Factor Auth',
    timestamp: 'Aug 12, 2026 08:15 AM',
    icon: ShieldCheck,
  },
];

export default function AdminUsersPage() {
  const notImplemented = (action: string) => () => toast.info(`${action} is not wired up yet.`);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Admin Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage platform admin users, their roles, and access.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={notImplemented('Add Admin User')}
            className="h-10 px-4 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin User</span>
          </button>
          <button
            type="button"
            onClick={notImplemented('Import Users')}
            className="h-10 px-4 flex items-center gap-1.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Import Users</span>
          </button>
          <button
            type="button"
            onClick={notImplemented('More Actions')}
            className="h-10 px-3 flex items-center gap-1 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Admins"
              value={ADMIN_USER_STATS.total.value}
              trendPercent={ADMIN_USER_STATS.total.trendPercent}
              trendLabel="vs last 30 days"
              icon={Users}
              iconBgColor="bg-teal-50"
              iconTextColor="text-teal-600"
            />
            <MetricCard
              label="Active Users"
              value={ADMIN_USER_STATS.active.value}
              trendPercent={ADMIN_USER_STATS.active.trendPercent}
              trendLabel="vs last 30 days"
              icon={ShieldCheck}
              iconBgColor="bg-indigo-50"
              iconTextColor="text-indigo-600"
            />
            <MetricCard
              label="Inactive"
              value={ADMIN_USER_STATS.inactive.value}
              trendPercent={ADMIN_USER_STATS.inactive.trendPercent}
              trendLabel="vs last 30 days"
              icon={UserX}
              iconBgColor="bg-amber-50"
              iconTextColor="text-amber-600"
            />
            <MetricCard
              label="Suspended"
              value={ADMIN_USER_STATS.suspended.value}
              trendPercent={ADMIN_USER_STATS.suspended.trendPercent}
              trendLabel="vs last 30 days"
              icon={Ban}
              iconBgColor="bg-red-50"
              iconTextColor="text-red-600"
            />
          </div>

          {/* Table */}
          <AdminUsersTable />
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <RoleDistributionCard />

          <ActivityCard
            title="Recent Activity"
            items={RECENT_ACTIVITY}
            onViewAll={notImplemented('View All Activity')}
          />

          <PlatformQuickActions
            actions={[
              {
                id: 'add-admin',
                label: 'Add Admin User',
                description: 'Create a new platform admin user',
                icon: UserPlus,
                iconBgColor: 'bg-blue-50',
                iconTextColor: 'text-blue-600',
                onClick: notImplemented('Add Admin User'),
              },
              {
                id: 'invite-users',
                label: 'Invite Users',
                description: 'Invite users via email',
                icon: Mail,
                iconBgColor: 'bg-teal-50',
                iconTextColor: 'text-teal-600',
                onClick: notImplemented('Invite Users'),
              },
              {
                id: 'bulk-actions',
                label: 'Bulk Actions',
                description: 'Perform actions on multiple users',
                icon: Layers,
                iconBgColor: 'bg-indigo-50',
                iconTextColor: 'text-indigo-600',
                onClick: notImplemented('Bulk Actions'),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
