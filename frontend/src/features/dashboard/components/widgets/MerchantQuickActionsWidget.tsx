import React from 'react';
import { useRouter } from 'next/navigation';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Zap, Plus, Package, Tag, Truck, MessageSquare } from 'lucide-react';

export function MerchantQuickActionsWidget() {
  const router = useRouter();

  const actions = [
    { label: 'Add Product', icon: Plus, href: '/dashboard/products/create' },
    { label: 'Manage Categories', icon: Package, href: '/dashboard/categories' },
    { label: 'Create Coupon', icon: Tag, href: '/dashboard/coupons/create' },
    { label: 'Book Courier', icon: Truck, href: '/dashboard/orders' },
    { label: 'Manage Inventory', icon: Package, href: '/dashboard/inventory' },
    { label: 'Send SMS', icon: MessageSquare, href: '/dashboard/sms' },
  ];

  return (
    <WidgetCard
      title="Quick Actions"
      subtitle="Frequently used tools"
      icon={Zap}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      compact={true}
    >
      <div className="grid grid-cols-3 gap-2 mt-1">
        {actions.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => router.push(action.href)}
            className="p-2 rounded-lg border border-slate-100 flex items-center justify-start text-left gap-2 transition-colors cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-sm bg-slate-50 hover:bg-slate-100"
          >
            <div className="p-1.5 bg-white rounded-md shadow-xs">
              <action.icon className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <span className="text-[11px] font-bold text-slate-600 leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}
