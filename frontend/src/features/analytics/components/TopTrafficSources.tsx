import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

const sources = [
  { source: 'Direct', sessions: '12,542', users: '9,842', orders: '184', revenue: '৳2,15,400', conv: '3.46%', trend: '+12.4%', isPositive: true },
  { source: 'Organic Search', sessions: '8,965', users: '6,783', orders: '128', revenue: '৳1,48,200', conv: '3.21%', trend: '+9.3%', isPositive: true },
  { source: 'Social Media', sessions: '4,521', users: '3,210', orders: '42', revenue: '৳67,800', conv: '2.15%', trend: '+6.8%', isPositive: true },
  { source: 'Referral', sessions: '2,145', users: '1,782', orders: '18', revenue: '৳32,600', conv: '1.78%', trend: '+4.2%', isPositive: true },
  { source: 'Email', sessions: '1,245', users: '982', orders: '12', revenue: '৳21,000', conv: '0.96%', trend: '-2.1%', isPositive: false },
];

export function TopTrafficSources() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-full min-h-[350px]">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">Top Traffic Sources</h3>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Source</th>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Sessions</th>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Users</th>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Orders</th>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100">Revenue</th>
              <th className="px-5 py-4 text-[11px] font-bold text-slate-500 border-b border-slate-100 text-right">Conversion Rate</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5 text-[12px] font-bold text-slate-900 border-b border-slate-50">{row.source}</td>
                <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">{row.sessions}</td>
                <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">{row.users}</td>
                <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50">{row.orders}</td>
                <td className="px-5 py-3.5 text-[12px] font-bold text-slate-900 border-b border-slate-50">{row.revenue}</td>
                <td className="px-5 py-3.5 text-[12px] font-medium text-slate-600 border-b border-slate-50 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span>{row.conv}</span>
                    <div className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${row.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {row.isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                      {row.trend}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-center mt-auto">
        <button className="h-9 px-6 rounded-lg border border-slate-200 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-50 transition-colors">
          View Full Report
        </button>
      </div>
    </div>
  );
}
