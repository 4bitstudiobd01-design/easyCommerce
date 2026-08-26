'use client';

import React, { useState } from 'react';
import { ROLE_DISTRIBUTION_DATA } from './usersMockData';
import { RoleDistributionSlice, AdminUserRole } from './types';

interface RoleDistributionCardProps {
  slices?: RoleDistributionSlice[];
  onFilterByRole?: (role: AdminUserRole) => void;
}

export function RoleDistributionCard({
  slices = ROLE_DISTRIBUTION_DATA,
  onFilterByRole,
}: RoleDistributionCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalUsers = 18;
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29

  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <h3 className="text-xs font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100 uppercase">
        Role Distribution
      </h3>

      {/* Donut Chart and Legend */}
      <div className="flex flex-col sm:flex-row xl:flex-row items-center gap-5">
        {/* SVG Donut */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
            {/* Background Circle */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="15"
            />

            {/* Arcs */}
            {slices.map((slice, index) => {
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += slice.percentage;

              const isHovered = hoveredIndex === index;

              return (
                <circle
                  key={slice.role}
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
                  onClick={() => onFilterByRole?.(slice.role)}
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-lg font-extrabold text-slate-900 leading-none">
              {hoveredIndex !== null ? slices[hoveredIndex].count : totalUsers}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-0.5">
              {hoveredIndex !== null ? slices[hoveredIndex].role : 'Total Users'}
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {slices.map((slice, index) => {
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={slice.role}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onFilterByRole?.(slice.role)}
                className={`flex items-center justify-between py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                  isHovered ? 'bg-slate-50 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-slate-600 text-[11px] truncate">
                    {slice.role}
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
