import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Megaphone, ArrowRight } from 'lucide-react';

export function AnnouncementsWidget() {
  const announcements = [
    { id: 1, title: 'New Multi-Tenant Features', date: 'Oct 24, 2026', type: 'Feature' },
    { id: 2, title: 'Scheduled Maintenance', date: 'Oct 26, 2026', type: 'System' },
    { id: 3, title: 'Billing Policy Update', date: 'Nov 1, 2026', type: 'Notice' },
  ];

  return (
    <WidgetCard
      title="Platform Announcements"
      subtitle="Updates from EasyCommerce"
      icon={Megaphone}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      compact={true}
    >
      <div className="mt-2 space-y-2">
        {announcements.map((item) => (
          <div key={item.id} className="group p-2.5 rounded-lg border border-blue-50 hover:border-blue-100 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-1.5">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                item.type === 'Feature' ? 'bg-slate-100 text-slate-700' :
                item.type === 'System' ? 'bg-slate-100 text-slate-700' :
                'bg-slate-50 text-slate-600'
              }`}>
                {item.type}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">{item.date}</span>
            </div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{item.title}</h4>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transform group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
