'use client';

import React, { useState } from 'react';
import {
  useGetMarketingDashboardQuery,
  type ConnectedIntegration,
} from '../api/marketingApi';
import { MarketingKpiCards } from './MarketingKpiCards';
import { ConnectedIntegrations } from './ConnectedIntegrations';
import { ConnectPixelModal } from './ConnectPixelModal';
import { Plus } from 'lucide-react';

export function MarketingView() {
  const { data, isLoading } = useGetMarketingDashboardQuery();

  // Modal state
  const [selectedIntegration, setSelectedIntegration] = useState<ConnectedIntegration | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleOpenConnect = (integration?: ConnectedIntegration) => {
    if (integration) {
      setSelectedIntegration(integration);
    } else {
      // Default to first unconnected integration or Meta Pixel
      const first = data?.integrations.find((i) => i.status !== 'CONNECTED') || data?.integrations[0] || {
        id: 'new_meta',
        provider: 'META' as const,
        name: 'Meta Pixel',
        status: 'DISCONNECTED' as const,
      };
      setSelectedIntegration(first);
    }
    setIsConnectModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Marketing</h1>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">Manage your tracking pixels and marketing integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenConnect()}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-bold text-xs flex items-center gap-2 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            Add Pixel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-8 flex items-center gap-8 text-[13px] font-bold">
        <button className="py-3 border-b-2 border-blue-600 text-blue-600 -mb-[1px]">
          Pixels & Tracking
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6 animate-in fade-in duration-500">

          <MarketingKpiCards kpis={data?.kpis} isLoading={isLoading} />

          <ConnectedIntegrations
            integrations={data?.integrations}
            isLoading={isLoading}
            onConnect={handleOpenConnect}
          />
        </div>
      </div>

      {/* Modals */}
      <ConnectPixelModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        integration={selectedIntegration}
      />
    </div>
  );
}
