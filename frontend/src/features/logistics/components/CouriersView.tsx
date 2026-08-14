import React, { useState } from 'react';
import { Search, SlidersHorizontal, Settings, MoreHorizontal, Link, AlertCircle, CheckCircle2, TrendingUp, TrendingDown, Truck, Activity, ShieldCheck, PowerOff } from 'lucide-react';
import { useGetCouriersDashboardQuery, CourierDashboardItem } from '../api/logisticsApi';
import { CourierDetailsDrawer } from './CourierDetailsDrawer';
import { Skeleton } from '@/components/ui/Skeleton';
import Image from 'next/image';

export function CouriersView() {
  const { data, isLoading, isError } = useGetCouriersDashboardQuery();
  const [searchInput, setSearchInput] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<CourierDashboardItem | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Failed to load couriers dashboard
      </div>
    );
  }

  const { summary, couriers } = data;

  // Filter couriers based on search
  const filteredCouriers = couriers.filter(c => 
    c.name.toLowerCase().includes(searchInput.toLowerCase()) || 
    c.code.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Couriers */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600">Total Couriers</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.totalCouriers.count}</div>
            <p className="text-[11px] text-slate-500 mt-1">All configured couriers</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {summary.totalCouriers.change} new this month
          </div>
        </div>

        {/* Connected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600">Connected</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.connected.count}</div>
            <p className="text-[11px] text-slate-500 mt-1">Active integrations</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {summary.connected.change}% from last month
          </div>
        </div>

        {/* Disconnected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-600">Disconnected</span>
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <PowerOff className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.disconnected.count}</div>
            <p className="text-[11px] text-slate-500 mt-1">Inactive integrations</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingDown className="w-3 h-3" />
            {Math.abs(summary.disconnected.change)}% from last month
          </div>
        </div>

        {/* Active */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-600">Active</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.active.count}</div>
            <p className="text-[11px] text-slate-500 mt-1">Currently in use</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {summary.active.change}% from last month
          </div>
        </div>

        {/* API Health */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600">API Health</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{summary.apiHealth.rate}%</div>
            <p className="text-[11px] text-slate-500 mt-1">Average success rate</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
            <TrendingUp className="w-3 h-3" />
            {summary.apiHealth.change}% from last month
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="search"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search courier by name..."
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option>All Status</option>
              <option>Connected</option>
              <option>Disconnected</option>
            </select>
            <select className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option>All Types</option>
              <option>Courier Service</option>
              <option>Logistics Service</option>
            </select>
            <select className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option>COD Support</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
          <button className="h-9 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition-colors shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-5 font-bold text-slate-900">COURIER</th>
                <th className="py-3 px-5 font-bold text-slate-900">TYPE</th>
                <th className="py-3 px-5 font-bold text-slate-900">STATUS</th>
                <th className="py-3 px-5 font-bold text-slate-900">API HEALTH</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-right">SHIPMENTS</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-right">DELIVERED</th>
                <th className="py-3 px-5 font-bold text-slate-900">SUCCESS RATE</th>
                <th className="py-3 px-5 font-bold text-slate-900">COD SUPPORT</th>
                <th className="py-3 px-5 font-bold text-slate-900">LAST SYNC</th>
                <th className="py-3 px-5 font-bold text-slate-900 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredCouriers.map((courier, idx) => (
                <tr 
                  key={courier.id} 
                  className={`group border-b border-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer ${idx === filteredCouriers.length - 1 ? 'border-b-0' : ''}`}
                  onClick={() => setSelectedCourier(courier)}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {/* Map courier code to a nice colored initial or generic logo icon since we don't have actual images hosted */}
                        <span className="font-extrabold text-blue-600 text-lg">{courier.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{courier.name}</span>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-blue-600 font-medium">{courier.type}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-1.5 font-medium">
                      {courier.status === 'Connected' ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-900">Connected</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-slate-900">Disconnected</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {courier.apiHealth === 'Healthy' && <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 text-[11px]">Healthy</span>}
                    {courier.apiHealth === 'Fair' && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-bold border border-amber-100 text-[11px]">Fair</span>}
                    {courier.apiHealth === 'N/A' && <span className="text-slate-400 font-medium">N/A</span>}
                  </td>
                  <td className="py-4 px-5 text-right font-bold text-slate-900">{courier.shipments}</td>
                  <td className="py-4 px-5 text-right font-bold text-slate-900">{courier.delivered}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 w-10">{courier.successRate}%</span>
                      {courier.status === 'Connected' && (
                        <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${courier.successRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${courier.successRate}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[11px]">Yes</span>
                  </td>
                  <td className="py-4 px-5 text-slate-900 font-medium">
                    {courier.lastApiSync ? (
                      <div className="flex flex-col">
                        <span>{new Date(courier.lastApiSync).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="text-[11px] text-slate-500">{new Date(courier.lastApiSync).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-center">
                    <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                      {courier.status === 'Connected' ? (
                        <>
                          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="h-8 px-3 rounded-lg border border-blue-200 text-blue-600 font-bold text-[11px] hover:bg-blue-50 transition-colors bg-white flex items-center gap-1">
                            Connect
                          </button>
                          <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          Showing 1 to {filteredCouriers.length} of {filteredCouriers.length} results
        </div>
      </div>

      <CourierDetailsDrawer 
        courier={selectedCourier} 
        isOpen={!!selectedCourier} 
        onClose={() => setSelectedCourier(null)} 
      />
    </div>
  );
}
