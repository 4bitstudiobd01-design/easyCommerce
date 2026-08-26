'use client';

import React from 'react';
import {
  Lock,
  Users,
  Key,
  Layers,
  CheckCircle,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { RolesTab, PermissionGroupItem, AccessRequestItem } from './types';
import { PERMISSION_GROUPS_DATA, ACCESS_REQUESTS_DATA } from './rolesMockData';

interface OtherRolesTabsProps {
  activeTab: RolesTab;
  onApproveRequest?: (req: AccessRequestItem) => void;
}

export function OtherRolesTabs({
  activeTab,
  onApproveRequest,
}: OtherRolesTabsProps) {
  if (activeTab === 'Roles') return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
      {/* 1. Permissions Tab */}
      {activeTab === 'Permissions' && (
        <div className="space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                System Permissions Catalog (96)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All platform action capabilities grouped by operational resource boundaries.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-[#008060] font-bold rounded-lg border border-emerald-200">
              96 Active Privileges
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                category: 'Merchants & Stores',
                perms: ['merchants.create', 'merchants.read', 'merchants.update', 'merchants.delete', 'merchants.verify_kyc', 'stores.suspend'],
              },
              {
                category: 'Billing & Subscriptions',
                perms: ['subscriptions.upgrade', 'subscriptions.cancel', 'invoices.generate', 'payouts.release', 'transactions.refund'],
              },
              {
                category: 'Support & Communications',
                perms: ['tickets.view', 'tickets.reply', 'tickets.assign', 'tickets.delete', 'announcements.publish'],
              },
              {
                category: 'Platform Operations & Security',
                perms: ['settings.edit_general', 'cache.purge', 'security.audit_logs', 'roles.manage', 'users.invite_admin'],
              },
            ].map((cat) => (
              <div key={cat.category} className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{cat.category}</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {cat.perms.map((p) => (
                    <span
                      key={p}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 rounded-lg text-[11px] font-mono transition-colors"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Permission Groups Tab */}
      {activeTab === 'Permission Groups' && (
        <div className="space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Permission Groups (8)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preset permission bundles mapped directly to business functional domains.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.info('New permission group modal')}
              className="px-3.5 py-1.5 bg-[#008060] text-white rounded-xl font-bold shadow-xs cursor-pointer"
            >
              + Create Group
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERMISSION_GROUPS_DATA.map((grp) => (
              <div
                key={grp.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>{grp.name}</span>
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px]">
                    {grp.assignedRolesCount} Roles Assigned
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{grp.description}</p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-100">
                  <span>{grp.permissionsCount} Granular Privileges</span>
                  <button
                    type="button"
                    onClick={() => toast.info(`Viewing details for ${grp.name}`)}
                    className="text-[#008060] hover:underline font-semibold cursor-pointer"
                  >
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Access Requests Tab */}
      {activeTab === 'Access Requests' && (
        <div className="space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pending Access Elevation Requests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve privilege upgrade submissions from team members.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 text-xs">
              3 Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {ACCESS_REQUESTS_DATA.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.userName}</span>
                    <span className="text-slate-400">({req.userEmail})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">Requests:</span>
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {req.requestedRole}
                    </span>
                    <span className="text-slate-400">| Reason: &quot;{req.reason}&quot;</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toast.error(`Rejected request from ${req.userName}`)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onApproveRequest) onApproveRequest(req);
                      toast.success(`Approved ${req.userName} for ${req.requestedRole}`);
                    }}
                    className="px-3.5 py-1.5 bg-[#008060] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Users Tab */}
      {activeTab === 'Users' && (
        <div className="space-y-4 text-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Users by Assigned Role (18)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of team members mapped to platform security credentials.
              </p>
            </div>
            <a
              href="/admin/users"
              className="text-[#008060] font-bold hover:underline"
            >
              Go to Admin Users Table →
            </a>
          </div>

          <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-emerald-600" />
            <p className="font-semibold text-slate-700">18 Platform Admin Users mapped to 6 active roles.</p>
            <p className="text-[11px] text-slate-400">All permissions are automatically enforced via JWT session tokens.</p>
          </div>
        </div>
      )}
    </div>
  );
}
