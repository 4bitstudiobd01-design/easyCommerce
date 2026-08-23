'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { RolesHeader } from './RolesHeader';
import { RolesTabsNav } from './RolesTabsNav';
import { RolesKpiCards } from './RolesKpiCards';
import { RolesTable } from './RolesTable';
import { PermissionsMatrixCard } from './PermissionsMatrixCard';
import { RoleDetailsCard } from './RoleDetailsCard';
import { PermissionsSummaryCard } from './PermissionsSummaryCard';
import { RolesQuickActionsCard } from './RolesQuickActionsCard';
import { RolesHelpGuideCard } from './RolesHelpGuideCard';
import { PermissionsTabView } from './PermissionsTabView';
import { OtherRolesTabs } from './OtherRolesTabs';
import { CreateRoleModal } from './CreateRoleModal';
import { CopyRoleModal } from './CopyRoleModal';
import { EditRoleModal } from './EditRoleModal';
import { FullPermissionsMatrixModal } from './FullPermissionsMatrixModal';
import { AccessRequestsDrawer } from './AccessRequestsDrawer';
import { INITIAL_ROLES, ROLES_KPIS } from './rolesMockData';
import { RoleRecord, RolesTab } from './types';

export function RolesManagementView() {
  const [activeTab, setActiveTab] = useState<RolesTab>('Roles');
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState<RoleRecord>(INITIAL_ROLES[0]);

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFullMatrixOpen, setIsFullMatrixOpen] = useState(false);
  const [isAccessRequestsDrawerOpen, setIsAccessRequestsDrawerOpen] = useState(false);

  const [roleToCopy, setRoleToCopy] = useState<RoleRecord | null>(null);
  const [roleToEdit, setRoleToEdit] = useState<RoleRecord | null>(null);

  const handleSelectRole = (role: RoleRecord) => {
    setSelectedRole(role);
  };

  const handleAddRole = (newRoleData: Partial<RoleRecord>) => {
    const fullRole: RoleRecord = {
      id: `role-${Date.now()}`,
      name: newRoleData.name || 'Custom Role',
      type: newRoleData.type || 'Custom Role',
      description: newRoleData.description || 'Custom platform role with assigned permissions.',
      usersCount: 0,
      status: 'Active',
      createdAtDate: newRoleData.createdAtDate || 'Aug 21, 2026',
      createdAtTime: newRoleData.createdAtTime || '08:45 PM',
      lastUpdatedDate: newRoleData.lastUpdatedDate || 'Aug 21, 2026',
      lastUpdatedTime: newRoleData.lastUpdatedTime || '08:45 PM',
      isSystem: false,
    };

    setRoles((prev) => [...prev, fullRole]);
    setSelectedRole(fullRole);
  };

  const handleUpdateRole = (updated: RoleRecord) => {
    setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRole.id === updated.id) {
      setSelectedRole(updated);
    }
  };

  const handleDeleteRole = (role: RoleRecord) => {
    if (role.isSystem) {
      toast.error('System roles cannot be deleted.');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    if (selectedRole.id === role.id && roles.length > 1) {
      setSelectedRole(roles[0]);
    }
    toast.success(`Role "${role.name}" deleted.`);
  };

  const handleOpenCopyModal = (role?: RoleRecord) => {
    setRoleToCopy(role || selectedRole);
    setIsCopyModalOpen(true);
  };

  const handleOpenEditModal = (role?: RoleRecord) => {
    setRoleToEdit(role || selectedRole);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* If Tab is "Permissions", render dedicated Permissions tab view */}
      {activeTab === 'Permissions' ? (
        <PermissionsTabView
          onOpenMatrix={() => setIsFullMatrixOpen(true)}
          onTabChange={setActiveTab}
        />
      ) : (
        /* Otherwise render Roles or other secondary tabs */
        <>
          {/* 1. Header with Title and Action Buttons */}
          <RolesHeader
            onCreateRole={() => setIsCreateModalOpen(true)}
            onExportMatrix={() => setIsFullMatrixOpen(true)}
          />

          {/* 2. Horizontal Navigation Tabs Bar */}
          <RolesTabsNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingRequestsCount={3}
          />

          {/* 3. Top 4 KPI Metric Cards */}
          <RolesKpiCards
            kpis={ROLES_KPIS}
            onKpiClick={(type) => {
              if (type === 'roles') setActiveTab('Roles');
              else if (type === 'permissions') setActiveTab('Permissions');
              else if (type === 'users') setActiveTab('Users');
              else if (type === 'groups') setActiveTab('Permission Groups');
            }}
          />

          {/* 4. Main Two-Column Layout */}
          <div className="flex flex-col xl:flex-row gap-5 xl:gap-6 items-start">
            {/* Left Column: Roles Table & Permissions Matrix Card */}
            <div className="flex-1 min-w-0 space-y-6 w-full">
              {activeTab === 'Roles' ? (
                <>
                  {/* Roles Table */}
                  <RolesTable
                    roles={roles}
                    selectedRoleId={selectedRole.id}
                    onSelectRole={handleSelectRole}
                    onEditRole={handleOpenEditModal}
                    onCopyRole={handleOpenCopyModal}
                    onDeleteRole={handleDeleteRole}
                    onViewPermissions={() => setIsFullMatrixOpen(true)}
                  />

                  {/* Permissions Matrix (Preview) */}
                  <PermissionsMatrixCard
                    onOpenFullMatrix={() => setIsFullMatrixOpen(true)}
                  />
                </>
              ) : (
                <OtherRolesTabs
                  activeTab={activeTab}
                  onApproveRequest={(req) => {
                    toast.success(`Approved ${req.userName} for ${req.requestedRole}`);
                  }}
                />
              )}
            </div>

            {/* Right Column: Role Details, Permissions Summary, Quick Actions, Help */}
            <div className="w-full xl:w-[320px] 2xl:w-[340px] shrink-0 space-y-4">
              {/* Card 1: Active Role Details */}
              <RoleDetailsCard
                role={selectedRole}
                onViewUsers={(r) => {
                  toast.info(`Viewing all ${r.usersCount} users assigned to ${r.name}`);
                }}
              />

              {/* Card 2: Permissions Summary (Donut Chart) */}
              <PermissionsSummaryCard />

              {/* Card 3: Quick Actions */}
              <RolesQuickActionsCard
                onCreateRole={() => setIsCreateModalOpen(true)}
                onCopyRole={() => handleOpenCopyModal()}
                onManageGroups={() => setActiveTab('Permission Groups')}
                onReviewAccessRequests={() => setIsAccessRequestsDrawerOpen(true)}
                pendingRequestsCount={3}
              />

              {/* Card 4: Help & Guide */}
              <RolesHelpGuideCard />
            </div>
          </div>
        </>
      )}

      {/* 5. Modals and Slide-over Drawers */}
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddRole={handleAddRole}
        existingRoles={roles}
      />

      <CopyRoleModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceRole={roleToCopy}
        onCopyComplete={handleAddRole}
      />

      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        role={roleToEdit}
        onUpdateRole={handleUpdateRole}
      />

      <FullPermissionsMatrixModal
        isOpen={isFullMatrixOpen}
        onClose={() => setIsFullMatrixOpen(false)}
      />

      <AccessRequestsDrawer
        isOpen={isAccessRequestsDrawerOpen}
        onClose={() => setIsAccessRequestsDrawerOpen(false)}
      />
    </div>
  );
}
