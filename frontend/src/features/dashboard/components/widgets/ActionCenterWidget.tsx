import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Target, ShoppingBag, PackageCheck, Truck, MessageSquare, AlertCircle } from 'lucide-react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';

export function ActionCenterWidget() {
  const { data: orders = [], isLoading } = useGetMerchantOrdersQuery(undefined, { skip: false });

  // Compute dummy numbers based on orders if needed, or use placeholders
  const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length || 3;
  const readyToShip = 5;
  const pendingBooking = 2;
  const refundRequests = 1;

  const actions = [
    { label: 'Pending Orders', count: pendingOrders, icon: ShoppingBag, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Ready To Ship', count: readyToShip, icon: PackageCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Pending Courier', count: pendingBooking, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Refund Requests', count: refundRequests, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Pending Messages', count: 4, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  ];

  return (
    <WidgetCard
      title="Today's Action Center"
      subtitle="Prioritize these operational tasks"
      icon={Target}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      compact={true}
    >
      <div className="flex items-center gap-2 mt-1">
        {actions.map((action, idx) => (
          <div key={idx} className={`flex-1 p-2 rounded-lg border ${action.border} ${action.bg} flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer`}>
            <action.icon className={`w-3.5 h-3.5 ${action.color} mb-1`} />
            <span className="text-xl font-black text-slate-900 leading-none">{action.count}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1 leading-tight">{action.label}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
