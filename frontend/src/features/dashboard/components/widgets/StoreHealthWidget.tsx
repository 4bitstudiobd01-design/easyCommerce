import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { HeartPulse, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export function StoreHealthWidget() {
  const healthItems = [
    { label: 'Store Status', status: 'Active', isGood: true },
    { label: 'Custom Domain', status: 'Connected', isGood: true },
    { label: 'Payment Gateway', status: 'Pending Setup', isGood: false },
    { label: 'Courier Integration', status: 'Active', isGood: true },
  ];

  const goodCount = healthItems.filter(i => i.isGood).length;
  const healthScore = Math.round((goodCount / healthItems.length) * 100);

  return (
    <WidgetCard
      title="Store Health"
      subtitle="Operational readiness"
      icon={HeartPulse}
      iconBgColor="bg-blue-50/80"
      iconTextColor="text-blue-600"
      compact={true}
    >
      <div className="flex flex-col gap-2 mt-1">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <h4 className="text-xs font-extrabold text-slate-900">{healthScore} — Good Standing</h4>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {healthItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-600">{item.label}</span>
              {item.isGood ? (
                <span className="flex items-center gap-1 text-slate-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
