import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Activity, ShoppingCart, UserPlus, Star, Truck } from 'lucide-react';

export function RecentBusinessActivityWidget() {
  const activities = [
    { id: 1, type: 'order', title: 'New order #ORD-8392', time: '10 mins ago', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 2, type: 'customer', title: 'New customer signed up', time: '45 mins ago', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, type: 'review', title: '5-star review on Premium T-Shirt', time: '2 hours ago', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 4, type: 'courier', title: 'Order #ORD-8380 picked up', time: '3 hours ago', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 5, type: 'order', title: 'New order #ORD-8379', time: '5 hours ago', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <WidgetCard
      title="Recent Activity"
      subtitle="Real-time event feed"
      icon={Activity}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      compact={true}
    >
      <div className="mt-2 space-y-2">
        {activities.map((activity, idx) => (
          <div key={activity.id} className="flex gap-3 relative">
            {idx !== activities.length - 1 && (
              <div className="absolute left-3.5 top-7 bottom-[-12px] w-[2px] bg-blue-50"></div>
            )}
            <div className={`w-7 h-7 rounded-full ${activity.bg} flex items-center justify-center shrink-0 z-10`}>
              <activity.icon className={`w-3.5 h-3.5 ${activity.color}`} />
            </div>
            <div className="pt-1 pb-1">
              <p className="text-xs font-bold text-slate-900">{activity.title}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
