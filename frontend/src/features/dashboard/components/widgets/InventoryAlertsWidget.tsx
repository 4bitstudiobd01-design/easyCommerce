import React from 'react';
import { WidgetCard } from '@/features/admin/components/core/WidgetCard';
import { AlertTriangle, PackageX, PackageMinus } from 'lucide-react';
import { useGetProductsQuery } from '@/features/catalog/api/catalogApi';

export function InventoryAlertsWidget() {
  const { data: products = [], isLoading } = useGetProductsQuery(undefined, { skip: false });

  // Use dummy logic if needed
  const outOfStock = 2;
  const lowStock = 8;
  const restockRequired = 5;

  return (
    <WidgetCard
      title="Inventory Alerts"
      subtitle="Decoupled stock monitoring"
      icon={AlertTriangle}
      iconBgColor="bg-blue-50"
      iconTextColor="text-blue-600"
      isLoading={isLoading}
      compact={true}
    >
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
              <PackageX className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Out of Stock</h4>
              <p className="text-[10px] text-slate-500 font-medium">Immediate action required</p>
            </div>
          </div>
          <span className="text-base font-black text-slate-600">{outOfStock}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg">
              <PackageMinus className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Low Stock</h4>
              <p className="text-[10px] text-slate-500 font-medium">Running low on inventory</p>
            </div>
          </div>
          <span className="text-base font-black text-slate-700">{lowStock}</span>
        </div>
        
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Restock Needed</h4>
              <p className="text-[10px] text-slate-500 font-medium">Reorder points reached</p>
            </div>
          </div>
          <span className="text-base font-black text-slate-700">{restockRequired}</span>
        </div>
      </div>
    </WidgetCard>
  );
}
