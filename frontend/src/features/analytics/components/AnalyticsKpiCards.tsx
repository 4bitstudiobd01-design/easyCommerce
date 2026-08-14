import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  ShoppingBag, 
  Tag, 
  Users, 
  Target, 
  ArrowDownLeft 
} from 'lucide-react';

export function AnalyticsKpiCards() {
  const kpis = [
    {
      title: 'Total Revenue',
      value: '৳4,85,000',
      trend: '+18.6%',
      isPositive: true,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <LineChart className="w-5 h-5 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Total Orders',
      value: '384',
      trend: '+14.2%',
      isPositive: true,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <ShoppingBag className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Average Order Value',
      value: '৳1,263',
      trend: '+3.4%',
      isPositive: true,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <Tag className="w-5 h-5 text-amber-500" />,
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Total Customers',
      value: '276',
      trend: '+22.1%',
      isPositive: true,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      title: 'Conversion Rate',
      value: '3.62%',
      trend: '+6.3%',
      isPositive: true,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <Target className="w-5 h-5 text-teal-600" />,
      iconBg: 'bg-teal-50',
    },
    {
      title: 'Refunds',
      value: '৳12,450',
      trend: '-8.5%',
      isPositive: false,
      compareText: 'vs Aug 1 - Aug 7',
      icon: <ArrowDownLeft className="w-5 h-5 text-red-600" />,
      iconBg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between h-[120px]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] font-bold text-slate-900 mb-1">{kpi.title}</p>
              <h3 className="text-[22px] font-extrabold text-slate-900 tracking-tight">{kpi.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.iconBg}`}>
              {kpi.icon}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 mt-auto">
            {kpi.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            )}
            <span className={`text-[11px] font-bold ${kpi.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {kpi.trend}
            </span>
            <span className="text-[10px] text-slate-500 font-medium ml-0.5">
              {kpi.compareText}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
