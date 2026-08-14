import React from 'react';
import { Headphones, Watch, Footprints, Backpack, Glasses } from 'lucide-react';

const products = [
  { name: 'Wireless Headphones', revenue: 49400, max: 52850, icon: <Headphones className="w-4 h-4 text-slate-600" /> },
  { name: 'Smart Watch Series 8', revenue: 25200, max: 52850, icon: <Watch className="w-4 h-4 text-slate-600" /> },
  { name: 'Running Shoes', revenue: 52850, max: 52850, icon: <Footprints className="w-4 h-4 text-slate-600" /> },
  { name: 'Backpack Travel 30L', revenue: 48700, max: 52850, icon: <Backpack className="w-4 h-4 text-slate-600" /> },
  { name: 'Sunglasses Polarized', revenue: 36650, max: 52850, icon: <Glasses className="w-4 h-4 text-slate-600" /> },
];

export function TopPerformingProducts() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Top Performing Products</h3>
        <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
          View All
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {products.map((product, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  {product.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{product.name}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-900">৳{product.revenue.toLocaleString()}</span>
            </div>
            <div className="ml-11 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${(product.revenue / product.max) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
