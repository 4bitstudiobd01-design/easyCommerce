'use client';

import React, { useState } from 'react';
import { Calendar, Download, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

interface OverviewHeaderProps {
  title?: string;
  subtitle?: string;
  onExport?: () => void;
}

export function OverviewHeader({
  title = 'Dashboard Overview',
  subtitle = 'Real-time overview of your EasyCommerce platform',
  onExport,
}: OverviewHeaderProps) {
  const [selectedRange, setSelectedRange] = useState('Aug 8 - Aug 14, 2026');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const ranges = [
    'Today (Aug 14, 2026)',
    'Yesterday (Aug 13, 2026)',
    'Aug 8 - Aug 14, 2026',
    'Last 30 Days',
    'This Month (August 2026)',
    'Last Quarter',
  ];

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast.success('Exporting platform report (PDF/CSV)...', {
        description: 'Your report download will begin in a moment.',
      });
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* Date Range Picker Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50/80"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{selectedRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
          </button>

          {isDatePickerOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsDatePickerOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Select Date Range
                </div>
                {ranges.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => {
                      setSelectedRange(range);
                      setIsDatePickerOpen(false);
                      toast.info(`Filtered data: ${range}`);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 hover:text-emerald-700 transition-colors ${
                      selectedRange === range
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-gray-700'
                    }`}
                  >
                    <span>{range}</span>
                    {selectedRange === range && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export Report Button */}
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all hover:shadow"
        >
          <Download className="w-3.5 h-3.5 text-white" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}
