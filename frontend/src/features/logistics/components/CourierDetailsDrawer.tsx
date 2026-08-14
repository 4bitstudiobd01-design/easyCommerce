import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Activity, Settings2, Webhook, FileText, ChevronRight, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { CourierDashboardItem } from '../api/logisticsApi';

interface CourierDetailsDrawerProps {
  courier: CourierDashboardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CourierDetailsDrawer({ courier, isOpen, onClose }: CourierDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'configuration' | 'services' | 'webhooks' | 'logs'>('overview');

  // Reset tab when courier changes
  useEffect(() => {
    setActiveTab('overview');
  }, [courier?.id]);

  if (!isOpen || !courier) return null;

  const inTransit = courier.shipments - courier.delivered - Math.round(courier.shipments * 0.035) - Math.round(courier.shipments * 0.025);

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <h2 id="drawer-title" className="text-xl font-bold text-slate-900">
              {courier.name}
            </h2>
            <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1
              ${courier.status === 'Connected' 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200'}`}
            >
              {courier.status}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-100">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            {(['overview', 'configuration', 'services', 'webhooks', 'logs'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 text-[13px] font-semibold tracking-tight border-b-2 transition-colors whitespace-nowrap focus:outline-none ${
                  activeTab === tab 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Courier Information */}
              <section>
                <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">Courier Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Courier Name</span>
                    <span className="font-semibold text-slate-900">{courier.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold text-slate-900">{courier.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Status</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {courier.status}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">COD Support</span>
                    <span className="font-semibold text-emerald-600">
                      {courier.codSupport ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Coverage</span>
                    <span className="font-semibold text-slate-900">{courier.coverage}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Website</span>
                    <a href={`https://${courier.website}`} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
                      {courier.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </section>

              {/* Integration Status */}
              <section>
                <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">Integration Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">API Status</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      {courier.apiHealth !== 'N/A' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {courier.apiHealth}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">API Success Rate (30d)</span>
                    <span className="font-semibold text-slate-900">{courier.apiSuccessRate30d}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Last API Sync</span>
                    <span className="font-semibold text-slate-900">
                      {courier.lastApiSync ? new Date(courier.lastApiSync).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Last Webhook</span>
                    <span className="font-semibold text-slate-900">
                      {courier.lastWebhook ? new Date(courier.lastWebhook).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Auto Create Shipment</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      {courier.autoCreateShipment && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {courier.autoCreateShipment ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-500">Auto Update Tracking</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      {courier.autoUpdateTracking && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {courier.autoUpdateTracking ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Performance */}
              <section>
                <h3 className="text-[13px] font-bold text-slate-900 mb-4 tracking-tight">Performance (Last 30 Days)</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">Total Shipments</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{courier.shipments}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">Delivered</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{courier.delivered}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">In Transit</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{Math.max(0, inTransit)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">Returned</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{Math.round(courier.shipments * 0.035)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">Failed Delivery</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{Math.round(courier.shipments * 0.025)}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between h-[72px]">
                    <span className="text-[11px] font-medium text-slate-500 leading-none">Success Rate</span>
                    <span className="text-[15px] font-bold text-slate-900 leading-none">{courier.successRate}%</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab !== 'overview' && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Settings2 className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-sm font-bold text-slate-900">Configuration Not Available</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[250px]">
                Detailed {activeTab} settings will be available in the next integration phase.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex flex-col gap-2 bg-slate-50/50">
          <button className="w-full h-10 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[13px] rounded-xl shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200">
            <Activity className="w-4 h-4 text-slate-400" />
            Test Connection
          </button>
          <button className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            <Settings className="w-4 h-4" />
            Configure Courier
          </button>
        </div>
      </div>
    </>
  );
}
