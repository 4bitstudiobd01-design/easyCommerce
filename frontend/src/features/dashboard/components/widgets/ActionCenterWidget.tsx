import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { Target, ShoppingBag, PackageCheck, Truck } from 'lucide-react';
import { useGetMerchantOrdersQuery } from '@/features/order/api/orderApi';
import { useGetMerchantConsignmentsQuery } from '@/features/logistics/api/logisticsApi';

export function ActionCenterWidget() {
  const { data: response, isLoading: isOrdersLoading } = useGetMerchantOrdersQuery();
  const orders = response?.data || [];
  const { data: consignments = [], isLoading: isConsignmentsLoading } = useGetMerchantConsignmentsQuery();
  const isLoading = isOrdersLoading || isConsignmentsLoading;

  const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING').length;

  const bookedOrderIds = new Set(consignments.map((c) => c.orderId));
  const confirmedOrders = orders.filter((o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING');
  const readyToShip = confirmedOrders.filter((o) => !bookedOrderIds.has(o.id)).length;
  const inTransit = consignments.filter((c) => c.status === 'BOOKED' || c.status === 'IN_TRANSIT').length;

  const actions = [
    { label: 'Pending Orders', count: pendingOrders, icon: ShoppingBag, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Ready To Ship', count: readyToShip, icon: PackageCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'In Transit', count: inTransit, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
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
