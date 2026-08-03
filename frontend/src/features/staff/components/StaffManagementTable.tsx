'use client';

import React, { useState } from 'react';
import {
  useGetStaffMembersQuery,
  useDeleteStaffMutation,
  StaffMember,
} from '../api/staffApi';
import { InviteStaffModal } from './InviteStaffModal';
import { EditStaffPermissionsModal } from './EditStaffPermissionsModal';
import {
  UserPlus,
  Users,
  ShieldCheck,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export const StaffManagementTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: staffMembers = [], isLoading, isFetching, refetch } = useGetStaffMembersQuery();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const handleCopyInviteLink = (staff: StaffMember) => {
    if (!staff.inviteToken) return;
    const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/staff-invite?token=${staff.inviteToken}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConfirm = async (staffId: string) => {
    try {
      await deleteStaff(staffId).unwrap();
      setDeletingStaffId(null);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to revoke staff access.');
    }
  };

  const filteredStaff = staffMembers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'STORE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            Store Manager
          </span>
        );
      case 'INVENTORY_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Inventory Manager
          </span>
        );
      case 'ORDER_FULFILLMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Order Fulfillment
          </span>
        );
      case 'CUSTOMER_SUPPORT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            Customer Support
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            Custom Role
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ACTIVE
          </span>
        );
      case 'PENDING_INVITE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
            PENDING
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" />
            SUSPENDED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Merchant Staff Roles & Permissions (টিম ও পারমিশন)
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-full border border-blue-200">
                {staffMembers.length} Staff
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Invite team members, assign store manager or custom role permissions, and control access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Invite Staff Member
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search staff by name, email, or role title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm text-slate-800 focus:outline-none bg-transparent"
        />
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Permissions Overview</th>
                <th className="px-6 py-4">Invited Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No staff members found.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click "Invite Staff Member" to add team managers or fulfillment staff.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const visiblePerms = staff.permissions ? staff.permissions.slice(0, 3) : [];
                  const extraPermsCount =
                    staff.permissions && staff.permissions.length > 3
                      ? staff.permissions.length - 3
                      : 0;

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition">
                      {/* Member Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-900 text-white font-extrabold text-sm rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{staff.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{staff.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-6 py-4">{getRoleBadge(staff.role)}</td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(staff.status)}</td>

                      {/* Permissions Tags */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {visiblePerms.map((perm) => (
                            <span
                              key={perm}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono border border-slate-200"
                            >
                              {perm}
                            </span>
                          ))}
                          {extraPermsCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold border border-blue-200">
                              +{extraPermsCount} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Invited Date */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1.5">
                        {staff.status === 'PENDING_INVITE' && staff.inviteToken && (
                          <button
                            onClick={() => handleCopyInviteLink(staff)}
                            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
                            title="Copy Invitation Link"
                          >
                            {copiedId === staff.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => setEditingStaff(staff)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingStaffId(staff.id)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                          title="Revoke Staff Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-sm w-full space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">Revoke Staff Access?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this staff member? They will instantly lose store access.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingStaffId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deletingStaffId)}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Revoking...' : 'Yes, Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <InviteStaffModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <EditStaffPermissionsModal
        isOpen={Boolean(editingStaff)}
        staff={editingStaff}
        onClose={() => setEditingStaff(null)}
      />
    </div>
  );
};
