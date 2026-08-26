'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SummarySlice {
  label: string;
  count: number;
  percentage: number;
  color: string;
  hoverColor: string;
}

const SUMMARY_DATA: SummarySlice[] = [
  {
    label: 'Open',
    count: 236,
    percentage: 18.9,
    color: '#10B981', // Emerald green
    hoverColor: '#059669',
  },
  {
    label: 'In Progress',
    count: 158,
    percentage: 12.7,
    color: '#F59E0B', // Amber
    hoverColor: '#D97706',
  },
  {
    label: 'Pending Merchant',
    count: 312,
    percentage: 25.0,
    color: '#8B5CF6', // Purple
    hoverColor: '#7C3AED',
  },
  {
    label: 'Resolved',
    count: 542,
    percentage: 43.4,
    color: '#F43F5E', // Rose / Red
    hoverColor: '#E11D48',
  },
];

interface SupportTicketSummaryCardProps {
  onFilterByStatus?: (status: string) => void;
  onViewReport?: () => void;
}

export function SupportTicketSummaryCard({
  onFilterByStatus,
  onViewReport,
}: SupportTicketSummaryCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalTickets = 1248;
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  // Calculate SVG stroke dashes
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Ticket Summary
        </h3>
        <button
          type="button"
          onClick={() => {
            if (onViewReport) onViewReport();
            else toast.info('Navigating to full support analytics report...');
          }}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
        >
          View Report
        </button>
      </div>

      {/* Donut Chart & Legend */}
      <div className="pt-4 flex flex-col sm:flex-row xl:flex-row items-center gap-5">
        {/* SVG Donut Chart */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="15"
            />

            {/* Slices */}
            {SUMMARY_DATA.map((slice, index) => {
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += slice.percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={slice.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={isHovered ? slice.hoverColor : slice.color}
                  strokeWidth={isHovered ? '17' : '15'}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onFilterByStatus?.(slice.label)}
                />
              );
            })}
          </svg>

          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-extrabold text-slate-900 leading-none">
              {hoveredIndex !== null
                ? SUMMARY_DATA[hoveredIndex].count.toLocaleString()
                : totalTickets.toLocaleString()}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              {hoveredIndex !== null
                ? SUMMARY_DATA[hoveredIndex].label
                : 'Total Tickets'}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="flex-1 w-full space-y-2.5">
          {SUMMARY_DATA.map((slice, index) => {
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={slice.label}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onFilterByStatus?.(slice.label)}
                className={`flex items-center justify-between text-xs py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-600 text-[11px] truncate">
                    {slice.label}
                  </span>
                </div>

                <div className="text-slate-700 text-[11px] font-medium shrink-0">
                  <span className="font-semibold text-slate-900">{slice.count}</span>{' '}
                  <span className="text-slate-400">({slice.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
