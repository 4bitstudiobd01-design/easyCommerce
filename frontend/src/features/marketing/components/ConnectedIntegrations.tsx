import React from 'react';
import { ConnectedIntegration } from '../api/marketingApi';
import { Settings, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface ConnectedIntegrationsProps {
  integrations?: ConnectedIntegration[];
  isLoading?: boolean;
  onConnect?: (integration: ConnectedIntegration) => void;
}

export function ConnectedIntegrations({
  integrations,
  isLoading,
  onConnect,
}: ConnectedIntegrationsProps) {
  if (isLoading || !integrations) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Connected Integrations</h2>
            <p className="text-xs text-slate-500 mt-1">Manage and monitor your marketing pixels</p>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Icons for providers matching the design
  const renderProviderIcon = (provider: string) => {
    switch (provider) {
      case 'META':
        return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-extrabold text-blue-600 font-serif">∞</div>;
      case 'GOOGLE_ANALYTICS':
        return <div className="w-8 h-8 rounded-full bg-amber-100 flex flex-col justify-end items-center px-1 pb-1 gap-[2px]"><div className="w-full h-1/2 bg-amber-500 rounded-sm"></div></div>;
      case 'GOOGLE_ADS':
        return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-500">G</div>;
      case 'TIKTOK':
        return <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white">d</div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{provider[0]}</div>;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Connected Integrations</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage and monitor your marketing pixels</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const firstUnconnected = integrations.find((i) => i.status !== 'CONNECTED');
            if (firstUnconnected && onConnect) {
              onConnect(firstUnconnected);
            }
          }}
          className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center shadow-2xs transition-colors"
        >
          View All Integrations
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[180px]">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {renderProviderIcon(integration.provider)}
                  <span className="text-sm font-bold text-slate-900">{integration.name}</span>
                </div>
                {integration.status === 'CONNECTED' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 text-[10px] tracking-wide">
                    Connected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-bold border border-slate-200 text-[10px] tracking-wide">
                    Not Connected
                  </span>
                )}
              </div>

              {integration.status === 'CONNECTED' ? (
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">{integration.provider === 'GOOGLE_ANALYTICS' ? 'Measurement ID' : 'Pixel ID'}</p>
                    <p className="text-[11px] font-bold text-slate-900">{integration.pixelId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Events Today</p>
                    <p className="text-[11px] font-bold text-slate-900">{integration.eventsToday?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">Last Event</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <p className="text-[11px] font-bold text-slate-900">
                        {integration.lastEventAt ? '2 min ago' : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-5">
                  <p className="text-xs text-slate-500 leading-relaxed pr-4">
                    {integration.description}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-auto">
              {integration.status === 'CONNECTED' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onConnect && onConnect(integration)}
                    className="flex-1 h-8 px-3 rounded-lg border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-50 transition-colors bg-white flex items-center justify-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure
                  </button>
                  <button
                    type="button"
                    onClick={() => onConnect && onConnect(integration)}
                    className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white flex items-center justify-center shrink-0"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onConnect && onConnect(integration)}
                  className="w-full h-8 px-3 rounded-lg border border-blue-200 text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-colors bg-white flex items-center justify-center gap-1.5"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
