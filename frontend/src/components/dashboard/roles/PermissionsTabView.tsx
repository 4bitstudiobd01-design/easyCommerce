'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { PermissionsHeader } from './PermissionsHeader';
import { RolesTabsNav } from './RolesTabsNav';
import { PermissionsKpiCards } from './PermissionsKpiCards';
import { PermissionsFilterBar } from './PermissionsFilterBar';
import { PermissionsTable } from './PermissionsTable';
import { PermissionDetailsCard } from './PermissionDetailsCard';
import { PermissionUsageCard } from './PermissionUsageCard';
import { PermissionsQuickActionsCard } from './PermissionsQuickActionsCard';
import { CreatePermissionModal } from './CreatePermissionModal';
import { ImportPermissionsModal } from './ImportPermissionsModal';
import { PermissionDetailsDrawer } from './PermissionDetailsDrawer';
import { INITIAL_PERMISSIONS, PERMISSIONS_KPIS } from './permissionsMockData';
import { PermissionRecord, PermissionsFilterState, RolesTab } from './types';

interface PermissionsTabViewProps {
  onOpenMatrix?: () => void;
  onTabChange?: (tab: RolesTab) => void;
}

export function PermissionsTabView({
  onOpenMatrix,
  onTabChange,
}: PermissionsTabViewProps) {
  const [permissions, setPermissions] =
    useState<PermissionRecord[]>(INITIAL_PERMISSIONS);
  const [selectedPermission, setSelectedPermission] = useState<PermissionRecord>(
    INITIAL_PERMISSIONS[0]
  );

  const [filters, setFilters] = useState<PermissionsFilterState>({
    search: '',
    module: 'all',
    action: 'all',
    status: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter logic
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesKey = p.permissionKey.toLowerCase().includes(query);
        if (!matchesName && !matchesKey) return false;
      }

      // Module
      if (filters.module !== 'all' && p.module !== filters.module) {
        return false;
      }

      // Action
      if (filters.action !== 'all' && p.action !== filters.action) {
        return false;
      }

      // Status
      if (filters.status !== 'all' && p.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [permissions, filters]);

  // Paginated list
  const paginatedPermissions = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPermissions.slice(start, start + rowsPerPage);
  }, [filteredPermissions, currentPage, rowsPerPage]);

  const handleFilterChange = (
    key: keyof PermissionsFilterState,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      module: 'all',
      action: 'all',
      status: 'all',
    });
    setCurrentPage(1);
    toast.info('Filters reset to default');
  };

  const handleSelectPermission = (perm: PermissionRecord) => {
    setSelectedPermission(perm);
  };

  const handleAddPermission = (newPerm: Partial<PermissionRecord>) => {
    const fullPerm: PermissionRecord = {
      id: `perm-${Date.now()}`,
      name: newPerm.name || 'New Custom Permission',
      description: newPerm.description || 'Custom capability',
      permissionKey: newPerm.permissionKey || 'custom.action',
      module: newPerm.module || 'Dashboard',
      moduleIconName: newPerm.moduleIconName || 'Dashboard',
      action: newPerm.action || 'View',
      type: 'Custom',
      status: 'Active',
      createdAtDate: 'Aug 21, 2026',
      createdAtTime: '11:45 PM',
      updatedAtDate: 'Aug 21, 2026',
      updatedAtTime: '11:45 PM',
      assignedRolesCount: 1,
      assignedUsersCount: 1,
      assignedGroupsCount: 1,
    };

    setPermissions((prev) => [fullPerm, ...prev]);
    setSelectedPermission(fullPerm);
  };

  const handleDeletePermission = (perm: PermissionRecord) => {
    setPermissions((prev) => prev.filter((p) => p.id !== perm.id));
    if (selectedPermission.id === perm.id && permissions.length > 1) {
      setSelectedPermission(permissions[0]);
    }
    toast.success(`Permission "${perm.name}" removed.`);
  };

  const handleExport = () => {
    toast.info('Exporting 96 permissions as CSV...');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Action Buttons */}
      <PermissionsHeader
        onCreatePermission={() => setIsCreateModalOpen(true)}
        onExport={handleExport}
      />

      {/* 2. Navigation Tabs Bar */}
      <RolesTabsNav
        activeTab="Permissions"
        onTabChange={(tab) => onTabChange?.(tab)}
        pendingRequestsCount={3}
      />

      {/* 3. Top 4 KPI Metric Cards */}
      <PermissionsKpiCards
        kpis={PERMISSIONS_KPIS}
        onKpiClick={(type) => {
          if (type === 'system') handleFilterChange('status', 'all');
          else if (type === 'custom') handleFilterChange('status', 'all');
          else handleResetFilters();
        }}
      />

      {/* 4. Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-start">
        {/* Left Column: Filters & Permissions Data Table */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Search & Filter Toolbar */}
          <PermissionsFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            onOpenAdvancedFilters={() => toast.info('Advanced permissions filters')}
          />

          {/* Permissions Data Table */}
          <PermissionsTable
            permissions={paginatedPermissions}
            totalCount={filteredPermissions.length}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            selectedPermissionId={selectedPermission.id}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(rows) => {
              setRowsPerPage(rows);
              setCurrentPage(1);
            }}
            onSelectPermission={handleSelectPermission}
            onEditPermission={(p) => {
              setSelectedPermission(p);
              setIsDrawerOpen(true);
            }}
            onDeletePermission={handleDeletePermission}
          />
        </div>

        {/* Right Column: Permission Details, Usage, Quick Actions */}
        <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-4">
          {/* Card 1: Permission Details (Live reactive) */}
          <PermissionDetailsCard permission={selectedPermission} />

          {/* Card 2: Permission Usage */}
          <PermissionUsageCard
            permission={selectedPermission}
            onViewRoles={() => toast.info(`Viewing roles assigned to ${selectedPermission.permissionKey}`)}
            onViewUsers={() => toast.info(`Viewing users with ${selectedPermission.permissionKey}`)}
            onViewGroups={() => toast.info(`Viewing groups containing ${selectedPermission.permissionKey}`)}
          />

          {/* Card 3: Quick Actions */}
          <PermissionsQuickActionsCard
            onCreatePermission={() => setIsCreateModalOpen(true)}
            onImportPermissions={() => setIsImportModalOpen(true)}
            onViewMatrix={() => {
              if (onOpenMatrix) onOpenMatrix();
              else toast.info('Permissions Matrix modal');
            }}
          />
        </div>
      </div>

      {/* 5. Modals and Slide-over Drawers */}
      <CreatePermissionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddPermission={handleAddPermission}
      />

      <ImportPermissionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          toast.success(`Imported ${count} permissions into registry`);
        }}
      />

      <PermissionDetailsDrawer
        permission={selectedPermission}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDeletePermission={handleDeletePermission}
      />
    </div>
  );
}
