'use client';

import React from 'react';
import { Users, UserPlus, ShoppingBag, DollarSign } from 'lucide-react';
import { CustomerKpis } from '../api/customerApi';

interface CustomerKpiCardsProps {
  kpis?: CustomerKpis;
  isLoading: boolean;
}

export function CustomerKpiCards({ kpis, isLoading }: CustomerKpiCardsProps) {
  const cards = [
    {
      title: 'Total Customers',
      value: kpis ? kpis.totalCustomers.toLocaleString() : '0',
      subtitle: 'Registered store buyers',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'New Customers',
      value: kpis ? kpis.newCustomers.toLocaleString() : '0',
      subtitle: 'Joined in past 30 days',
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Avg. Orders / Customer',
      value: kpis ? kpis.avgOrdersPerCustomer.toString() : '0',
      subtitle: 'Orders per buyer',
      icon: ShoppingBag,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      title: 'Total Spent',
      value: kpis ? `৳${kpis.totalSpent.toLocaleString()}` : '৳0',
      subtitle: 'Combined customer revenue',
      icon: DollarSign,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg mt-2" />
                ) : (
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">{card.value}</h3>
                )}
                <p className="text-[11px] text-slate-400 mt-1">{card.subtitle}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
