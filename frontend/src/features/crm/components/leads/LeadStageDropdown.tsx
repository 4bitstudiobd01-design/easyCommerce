'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LeadStageType } from '../../types/crm.types';
import { ChevronDown, Check } from 'lucide-react';

interface LeadStageDropdownProps {
  currentStage: LeadStageType;
  onStageChange: (newStage: LeadStageType) => void;
}

const STAGE_OPTIONS: { id: LeadStageType; label: string; dotColor: string; activeBg: string }[] = [
  { id: 'NEW', label: 'New Inquiry', dotColor: 'bg-blue-500', activeBg: 'bg-blue-50 text-blue-700' },
  { id: 'CONTACTED', label: 'Contacted', dotColor: 'bg-indigo-500', activeBg: 'bg-indigo-50 text-indigo-700' },
  { id: 'QUALIFIED', label: 'Qualified Lead', dotColor: 'bg-purple-500', activeBg: 'bg-purple-50 text-purple-700' },
  { id: 'PROPOSAL_SENT', label: 'Proposal Sent', dotColor: 'bg-amber-500', activeBg: 'bg-amber-50 text-amber-700' },
  { id: 'WON', label: 'Won / Converted', dotColor: 'bg-emerald-500', activeBg: 'bg-emerald-50 text-emerald-700' },
  { id: 'LOST', label: 'Lost / Closed', dotColor: 'bg-slate-400', activeBg: 'bg-slate-100 text-slate-700' },
];

export const LeadStageDropdown: React.FC<LeadStageDropdownProps> = ({
  currentStage,
  onStageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = STAGE_OPTIONS.find((s) => s.id === currentStage) || STAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Custom Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/90 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200/90 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95"
      >
        <span className={`w-2 h-2 rounded-full ${currentOption.dotColor}`} />
        <span className="truncate max-w-[80px]">{currentOption.label.split(' ')[0]}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Menu Popover (Opens Downwards) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Move to Stage
          </div>
          {STAGE_OPTIONS.map((opt) => {
            const isSelected = opt.id === currentStage;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onStageChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  isSelected
                    ? `${opt.activeBg} font-bold`
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-slate-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
