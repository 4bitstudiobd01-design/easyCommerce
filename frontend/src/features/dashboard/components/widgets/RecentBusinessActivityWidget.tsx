import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Activity, ShoppingCart } from 'lucide-react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function RecentBusinessActivityWidget() {
  const { data: orders = [], isLoading } = useGetMerchantOrdersQuery();

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <WidgetCard
      title="Recent Activity"
      subtitle="Latest orders on your store"
      icon={Activity}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      isEmpty={recentOrders.length === 0}
      compact={true}
    >
      <div className="mt-2 space-y-2">
        {recentOrders.map((order, idx) => (
          <div key={order.id} className="flex gap-3 relative">
            {idx !== recentOrders.length - 1 && (
              <div className="absolute left-3.5 top-7 bottom-[-12px] w-[2px] bg-blue-50"></div>
            )}
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 z-10">
              <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="pt-1 pb-1">
              <p className="text-xs font-bold text-slate-900">New order #{order.orderNumber}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5">{timeAgo(order.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
