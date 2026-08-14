import React from 'react';
import { ArrowUp, TrendingUp, Store, ShoppingCart, ChevronRight } from 'lucide-react';

const insights = [
  {
    title: 'Revenue is up 18.6% compared to the previous 7 days.',
    subtitle: 'Great job! Keep up the momentum.',
    icon: <ArrowUp className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-emerald-50',
  },
  {
    title: 'Organic search traffic increased by 22.4%.',
    subtitle: 'Your SEO efforts are working well.',
    icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
    iconBg: 'bg-blue-50',
  },
  {
    title: 'Smart Watch Series 8 is your top selling product.',
    subtitle: 'Consider promoting more similar products.',
    icon: <Store className="w-4 h-4 text-amber-500" />,
    iconBg: 'bg-amber-50',
  },
  {
    title: 'Abandoned cart rate is 68.3%.',
    subtitle: 'Consider optimizing your checkout process.',
    icon: <ShoppingCart className="w-4 h-4 text-purple-600" />,
    iconBg: 'bg-purple-50',
  },
];

export function InsightsList() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-900">Insights</h3>
        <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">
          View All
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-between">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${insight.iconBg}`}>
              {insight.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-slate-900 truncate">{insight.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{insight.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
