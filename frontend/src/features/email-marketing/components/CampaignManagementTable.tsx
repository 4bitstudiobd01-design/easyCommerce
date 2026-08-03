'use client';

import React, { useState } from 'react';
import {
  useGetCampaignsQuery,
  useGetSubscribersQuery,
  useSendCampaignBroadcastMutation,
  EmailCampaign,
} from '../api/emailMarketingApi';
import { CreateCampaignModal } from './CreateCampaignModal';
import {
  Mail,
  Send,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Search,
  FileText,
} from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export const CampaignManagementTable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers'>('campaigns');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: campaigns = [], isLoading: isCampaignsLoading, isFetching: isCampaignsFetching, refetch: refetchCampaigns } = useGetCampaignsQuery();
  const { data: subscribers = [], isLoading: isSubscribersLoading, refetch: refetchSubscribers } = useGetSubscribersQuery();
  const [sendBroadcast] = useSendCampaignBroadcastMutation();

  const totalSent = campaigns.reduce((acc, c) => acc + (c.totalSent || 0), 0);

  const handleSendBroadcast = async (campaign: EmailCampaign) => {
    if (!confirm(`Are you sure you want to broadcast "${campaign.title}" to target recipients now?`)) {
      return;
    }
    setSendingId(campaign.id);
    try {
      const res = await sendBroadcast(campaign.id).unwrap();
      alert(`Broadcast sent successfully to ${res.totalSent} recipients!`);
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to send campaign broadcast.');
    } finally {
      setSendingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SENT
          </span>
        );
      case 'SENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
            SENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Subscribers
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {subscribers.length}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              Storefront leads
            </span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Email Campaigns
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {campaigns.length}
            </span>
            <span className="text-[11px] text-blue-600 font-semibold block mt-1">
              Active promotional drafts
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
            <Mail className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Emails Delivered
            </span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">
              {totalSent}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              100% SMTP / SendGrid dispatched
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Control Panel Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Automated Email Marketing &amp; Newsletters (ইমেইল মার্কেটিং)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Broadcast discount offers, welcome templates, and weekly deals to store leads and buyers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchCampaigns();
              refetchSubscribers();
            }}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh lists"
          >
            <RefreshCw className={`w-4 h-4 ${isCampaignsFetching ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'campaigns'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Email Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'subscribers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Newsletter Subscribers ({subscribers.length})
        </button>
      </div>

      {/* Tab 1: Campaigns Table */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Campaign Title</th>
                  <th className="px-6 py-4">Subject Line</th>
                  <th className="px-6 py-4">Target Audience</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Total Sent</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isCampaignsLoading ? (
                  <>
                    <TableRowSkeleton columns={6} />
                    <TableRowSkeleton columns={6} />
                  </>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No email campaigns created yet.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click "Create Campaign" to compose your first promotional email broadcast.
                      </p>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{camp.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(camp.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 max-w-xs truncate">
                        {camp.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {camp.recipientType}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(camp.status)}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-900">{camp.totalSent}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleSendBroadcast(camp)}
                          disabled={sendingId === camp.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                        >
                          {sendingId === camp.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Broadcasting...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" /> 1-Click Broadcast
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Subscribers Table */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Subscriber Email</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Subscribed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isSubscribersLoading ? (
                  <>
                    <TableRowSkeleton columns={5} />
                    <TableRowSkeleton columns={5} />
                  </>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No newsletter subscribers yet.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Subscribers will appear here when buyers fill out the storefront newsletter widget.
                      </p>
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-900 font-mono text-xs">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700">{sub.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                          {sub.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUBSCRIBED
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
