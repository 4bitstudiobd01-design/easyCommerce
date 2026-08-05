'use client';

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface DashboardSectionProps {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardSection({
  title,
  subtitle,
  badge,
  collapsible = false,
  defaultOpen = true,
  className = '',
  children,
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-blue-50 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-blue-900 tracking-tight">{title}</h2>
            {badge}
          </div>

          <div className="flex items-center gap-2">
            {subtitle && <span className="text-xs text-blue-400 font-medium hidden sm:inline">{subtitle}</span>}
            {collapsible && (
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                aria-label={isOpen ? 'Collapse Section' : 'Expand Section'}
              >
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen && <div>{children}</div>}
    </section>
  );
}
