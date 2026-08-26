'use client';

import React from 'react';
import {
  CreditCard,
  UserCheck,
  Cpu,
  Store,
  Lightbulb,
} from 'lucide-react';
import { CategorySummary, TicketCategory } from './types';
import { TOP_CATEGORIES } from './supportMockData';

interface SupportTopCategoriesCardProps {
  categories?: CategorySummary[];
  activeCategory?: string;
  onSelectCategory?: (cat: TicketCategory) => void;
  onViewAll?: () => void;
}

export function SupportTopCategoriesCard({
  categories = TOP_CATEGORIES,
  activeCategory,
  onSelectCategory,
  onViewAll,
}: SupportTopCategoriesCardProps) {
  const getCategoryIcon = (iconName: string, color: string) => {
    const iconClass = 'w-4 h-4';
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className={iconClass} style={{ color }} />;
      case 'UserCheck':
        return <UserCheck className={iconClass} style={{ color }} />;
      case 'Cpu':
        return <Cpu className={iconClass} style={{ color }} />;
      case 'Store':
        return <Store className={iconClass} style={{ color }} />;
      case 'Lightbulb':
        return <Lightbulb className={iconClass} style={{ color }} />;
      default:
        return <CreditCard className={iconClass} style={{ color }} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Top Categories
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* Categories List */}
      <div className="pt-3 space-y-2">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.name;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory?.(cat.name)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer hover:bg-slate-50 ${
                isSelected
                  ? 'bg-emerald-50/80 border border-emerald-200 font-bold'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.bgColor }}
                >
                  {getCategoryIcon(cat.iconName, cat.color)}
                </div>
                <span className="text-xs font-medium text-slate-700 truncate">
                  {cat.name}
                </span>
              </div>

              <span className="text-xs font-bold text-slate-900 ml-2">
                {cat.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
