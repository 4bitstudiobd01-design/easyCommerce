'use client';

import React, { useState } from 'react';
import {
  useGetMarketingDashboardQuery,
  useTestAllPixelsMutation,
  useSeedMarketingDemoDataMutation,
  type ConnectedIntegration,
  type EventLogItem,
} from '../api/marketingApi';
import { MarketingKpiCards } from './MarketingKpiCards';
import { ConnectedIntegrations } from './ConnectedIntegrations';
import { TrackingEventsTable } from './TrackingEventsTable';
import { EventLogsTable } from './EventLogsTable';
import { ConnectPixelModal } from './ConnectPixelModal';
import { TestEventModal } from './TestEventModal';
import { EventPayloadDrawer } from './EventPayloadDrawer';
import { Plus, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';

export function MarketingView() {
  const { data, isLoading } = useGetMarketingDashboardQuery();
  const [testAllPixels, { isLoading: isTestingAll }] = useTestAllPixelsMutation();
  const [seedMarketingDemoData, { isLoading: isSeeding }] = useSeedMarketingDemoDataMutation();

  // The demo-data seeder is a development aid only — never exposed in production.
  const isDev = process.env.NODE_ENV !== 'production';

  // Modal / Drawer state
  const [selectedIntegration, setSelectedIntegration] = useState<ConnectedIntegration | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEventDefault, setTestEventDefault] = useState('PageView');
  const [inspectedLog, setInspectedLog] = useState<EventLogItem | null>(null);

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

  const handleOpenTest = (eventName?: string) => {
    setTestEventDefault(eventName || 'PageView');
    setIsTestModalOpen(true);
  };

  const handleTestAll = async () => {
    try {
      const res = await testAllPixels().unwrap();
      toast.success(res.message || 'All connected tracking pixels verified successfully!');
    } catch {
      toast.error('Failed to test pixels.');
    }
  };

  const handleSeedDemoData = async () => {
    try {
      const res = await seedMarketingDemoData().unwrap();
      toast.success(
        res.pixelsCreated > 0
          ? `Seeded ${res.pixelsCreated} pixels and ${res.eventLogsCreated} event logs.`
          : res.message,
      );
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to seed marketing demo data.');
    }
  };

  const hasConnectedIntegration = (data?.integrations || []).some((i) => i.status === 'CONNECTED');
  // Only worth offering when nothing is connected yet — and only in dev.
  const showSeedAction = isDev && !isLoading && !hasConnectedIntegration;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Marketing</h1>
          <p className="text-[13px] text-slate-500 mt-1 font-medium">Manage your tracking pixels and marketing integrations</p>
        </div>
        <div className="flex items-center gap-3">
          {showSeedAction && (
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="h-9 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-bold text-xs flex items-center gap-2 disabled:opacity-50"
              title="Seed demo pixels and event logs (development only)"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Database className="w-3.5 h-3.5 text-blue-600" />
              )}
              {isSeeding ? 'Seeding…' : 'Load Demo Data'}
            </button>
          )}
          <button
            type="button"
            onClick={handleTestAll}
            disabled={isTestingAll}
            className="h-9 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-bold text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {isTestingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            )}
            {isTestingAll ? 'Testing Pixels...' : 'Test All Pixels'}
          </button>
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
            onTest={() => handleOpenTest('PageView')}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
            <TrackingEventsTable
              events={data?.trackingEvents}
              isLoading={isLoading}
              onTestEvent={handleOpenTest}
            />
            <EventLogsTable
              onViewPayload={(log) => setInspectedLog(log)}
            />
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <AlertCircleIcon />
              Learn more about setting up pixels and tracking events in our <a href="#" className="text-blue-600 hover:underline">documentation</a>.
            </div>
            <div className="ml-auto">
              Need help? <a href="#" className="text-blue-600 hover:underline">View Tracking Guide <svg className="w-3 h-3 inline-block ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ConnectPixelModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        integration={selectedIntegration}
      />

      <TestEventModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        defaultEventName={testEventDefault}
      />

      <EventPayloadDrawer
        isOpen={Boolean(inspectedLog)}
        onClose={() => setInspectedLog(null)}
        log={inspectedLog}
      />
    </div>
  );
}

function AlertCircleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
