'use client';

import React from 'react';
import { TrackingEvent, useToggleEventMutation } from '../api/marketingApi';
import { Settings, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

interface TrackingEventsTableProps {
  events?: TrackingEvent[];
  isLoading?: boolean;
  onTestEvent?: (eventName: string) => void;
}

export function TrackingEventsTable({
  events,
  isLoading,
  onTestEvent,
}: TrackingEventsTableProps) {
  const [toggleEvent] = useToggleEventMutation();

  if (isLoading || !events) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Tracking Events</h2>
            <p className="text-xs text-slate-500 mt-1">Monitor and manage events sent to your pixels</p>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  const handleToggle = async (eventName: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      await toggleEvent({ eventName, isActive: nextStatus }).unwrap();
      toast.success(`Event '${eventName}' ${nextStatus ? 'enabled' : 'paused'} successfully.`);
    } catch {
      toast.error(`Failed to update ${eventName} status.`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Tracking Events</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Monitor and manage events sent to your pixels</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-left text-xs text-slate-900">
              <th className="py-2.5 px-4 font-bold w-1/4">Event Name</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Status</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Events Today</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Last Triggered</th>
              <th className="py-2.5 px-4 font-bold w-1/6">Success Rate</th>
              <th className="py-2.5 px-4 font-bold w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {events.map((event, idx) => (
              <tr 
                key={event.id} 
                className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${idx === events.length - 1 ? 'border-b-0' : ''}`}
              >
                <td className="py-2.5 px-4">
                  <div className="font-bold text-slate-900">{event.eventName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{event.description}</div>
                </td>
                <td className="py-2.5 px-4">
                  <button 
                    type="button"
                    onClick={() => handleToggle(event.eventName, event.isActive)}
                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                      event.isActive ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        event.isActive ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </td>
                <td className="py-2.5 px-4 font-bold text-slate-900">{event.eventsToday.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-slate-600 font-medium">
                  {event.eventName === 'PageView' ? '2 min ago' : 
                   event.eventName === 'ViewContent' ? '5 min ago' :
                   event.eventName === 'AddToCart' ? '6 min ago' :
                   event.eventName === 'InitiateCheckout' ? '8 min ago' :
                   '10 min ago'}
                </td>
                <td className="py-2.5 px-4">
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[10px]">
                    {event.successRate}%
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onTestEvent && onTestEvent(event.eventName)}
                      className="h-7 px-2.5 rounded border border-slate-200 text-slate-600 font-bold text-[10px] hover:bg-slate-50 transition-colors bg-white"
                    >
                      Test
                    </button>
                    <button
                      type="button"
                      onClick={() => onTestEvent && onTestEvent(event.eventName)}
                      className="h-7 px-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white flex items-center justify-center"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onTestEvent && onTestEvent('PageView')}
          className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Configure Events
        </button>
      </div>
    </div>
  );
}
