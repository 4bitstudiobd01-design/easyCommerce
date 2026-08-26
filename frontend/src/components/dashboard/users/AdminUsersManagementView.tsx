'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Upload,
  MoreVertical,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Shield,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { UsersKpiCards } from './UsersKpiCards';
import { UsersFilterBar } from './UsersFilterBar';
import { UsersTable } from './UsersTable';
import { RoleDistributionCard } from './RoleDistributionCard';
import { RecentActivityCard } from './RecentActivityCard';
import { UsersQuickActionsCard } from './UsersQuickActionsCard';
import { AddAdminUserModal } from './AddAdminUserModal';
import { ImportUsersModal } from './ImportUsersModal';
import { InviteUserModal } from './InviteUserModal';
import { UserDetailsDrawer } from './UserDetailsDrawer';
import { INITIAL_ADMIN_USERS, ADMIN_USERS_KPIS } from './usersMockData';
import {
  AdminUserRecord,
  AdminUsersFilterState,
  AdminUserRole,
  AdminUserStatus,
} from './types';

export function AdminUsersManagementView() {
  const [users, setUsers] = useState<AdminUserRecord[]>(INITIAL_ADMIN_USERS);
  const [filters, setFilters] = useState<AdminUsersFilterState>({
    search: '',
    role: 'all',
    status: 'all',
    lastLogin: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);

  // Modals & Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserForDrawer, setSelectedUserForDrawer] =
    useState<AdminUserRecord | null>(null);

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      // Role
      if (filters.role !== 'all' && u.role !== filters.role) {
        return false;
      }

      // Status
      if (filters.status !== 'all' && u.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [users, filters]);

  // Paginated records
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const handleFilterChange = (
    key: keyof AdminUsersFilterState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      role: 'all',
      status: 'all',
      lastLogin: 'all',
    });
    setCurrentPage(1);
  };

  const handleKpiClick = (type: string) => {
    if (type === 'total') handleFilterChange('status', 'all');
    else if (type === 'active') handleFilterChange('status', 'Active');
    else if (type === 'inactive') handleFilterChange('status', 'Inactive');
    else if (type === 'suspended') handleFilterChange('status', 'Suspended');
  };

  const handleAddUser = (newUser: Partial<AdminUserRecord>) => {
    const fullUser: AdminUserRecord = {
      id: `usr-${Date.now()}`,
      name: newUser.name || 'New Admin',
      email: newUser.email || 'admin@easyco.com',
      role: newUser.role || 'Platform Manager',
      status: newUser.status || 'Active',
      initials: newUser.initials || 'NA',
      avatarBgColor: newUser.avatarBgColor || 'bg-emerald-600',
      lastLoginDate: 'Never',
      lastLoginTime: '—',
      twoFactorAuth: newUser.twoFactorAuth ?? true,
      createdAtDate: newUser.createdAtDate || 'Aug 21, 2026',
      createdAtTime: newUser.createdAtTime || '12:00 PM',
      phone: newUser.phone,
      department: newUser.department,
      permissionsCount: newUser.permissionsCount || 20,
    };

    setUsers((prev) => [fullUser, ...prev]);
  };

  const handleToggleStatus = (user: AdminUserRecord) => {
    const newStatus: AdminUserStatus =
      user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    );
    toast.success(`${user.name} is now ${newStatus}`);
    if (selectedUserForDrawer && selectedUserForDrawer.id === user.id) {
      setSelectedUserForDrawer((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteUser = (user: AdminUserRecord) => {
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success(`Admin user ${user.name} deleted.`);
    setSelectedUserForDrawer(null);
  };

  const handleResetPassword = (user: AdminUserRecord) => {
    toast.success(`Password reset instructions sent to ${user.email}`);
  };

  const handleChangeRole = (user: AdminUserRecord, role: AdminUserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role } : u))
    );
    toast.success(`Role for ${user.name} changed to ${role}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Admin Users
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-0.5">
            Manage platform admin users, their roles, and access.
          </p>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Primary: + Add Admin User */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#008060] hover:bg-[#006e52] active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-[#008060]/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Admin User</span>
          </button>

          {/* Secondary: Import Users */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Users</span>
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
              <span>More Actions</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isMoreActionsOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsMoreActionsOpen(false)}
                />
                <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      toast.info('Exporting all admin users to CSV...');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export to CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      setIsInviteModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invite Admin User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      toast.info('Viewing security audit logs');
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Audit Logs</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top 4 KPI Metric Cards */}
      <UsersKpiCards
        kpis={ADMIN_USERS_KPIS}
        activeFilter={filters.status}
        onKpiClick={handleKpiClick}
      />

      {/* 3. Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-start">
        {/* Left Column: Filters & Users Table (Expands to all available space) */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Search and Filters Toolbar */}
          <UsersFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenAdvancedFilters={() => toast.info('Advanced filter drawer')}
          />

          {/* Users Table */}
          <UsersTable
            users={paginatedUsers}
            totalUsersCount={filteredUsers.length}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
            }}
            onViewUser={(u) => setSelectedUserForDrawer(u)}
            onEditUser={(u) => {
              setSelectedUserForDrawer(u);
              toast.info(`Editing ${u.name}`);
            }}
            onChangeRole={handleChangeRole}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
          />
        </div>

        {/* Right Column: Role Distribution, Recent Activity, Quick Actions */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-4">
          {/* Card 1: Role Distribution Donut Chart */}
          <RoleDistributionCard
            onFilterByRole={(role) => handleFilterChange('role', role)}
          />

          {/* Card 2: Recent Activity Feed */}
          <RecentActivityCard
            onViewAll={() => toast.info('Viewing full activity logs')}
          />

          {/* Card 3: Quick Actions */}
          <UsersQuickActionsCard
            onAddUser={() => setIsAddModalOpen(true)}
            onInviteUser={() => setIsInviteModalOpen(true)}
            onBulkActions={() => toast.info('Bulk action toolbar opened')}
          />
        </div>
      </div>

      {/* 4. Modals and Slide-over Drawer */}
      <AddAdminUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddUser}
      />

      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          toast.success(`Imported ${count} users into dataset`);
        }}
      />

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <UserDetailsDrawer
        user={selectedUserForDrawer}
        isOpen={!!selectedUserForDrawer}
        onClose={() => setSelectedUserForDrawer(null)}
        onChangeRole={handleChangeRole}
        onToggleStatus={handleToggleStatus}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
