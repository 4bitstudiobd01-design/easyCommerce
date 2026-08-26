'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Edit2,
  Copy,
  ChevronDown,
  ChevronRight,
  Power,
  Trash2,
  FileDown,
  Archive,
  Users,
} from 'lucide-react';
import { PlanRecord } from '../types';
import { toast } from 'sonner';

interface PlanOverviewHeaderProps {
  plan: PlanRecord;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus?: () => void;
  onExport?: () => void;
}

export function PlanOverviewHeader({
  plan,
  onBack,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onExport,
}: PlanOverviewHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-emerald-700 transition-colors cursor-pointer"
        >
          Plans
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Plan Details</span>
      </nav>

      {/* 2. Title and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title + Badge + Subtitle */}
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {plan.name} Plan
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                plan.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {plan.status}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-1 max-w-2xl">
            {plan.subtitle}
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Edit Plan Button */}
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Plan</span>
          </button>

          {/* Duplicate Plan Button */}
          <button
            type="button"
            onClick={onDuplicate}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span>Duplicate Plan</span>
          </button>

          {/* More Actions Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>More Actions</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-30 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleStatus?.();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Power className="w-3.5 h-3.5 text-slate-400" />
                  <span>{plan.status === 'Active' ? 'Deactivate Plan' : 'Activate Plan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExport?.();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export Plan Schema</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    toast.info(`Viewing all ${plan.merchantsCount} merchants on ${plan.name} plan`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Subscribers ({plan.merchantsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    toast.info(`Plan ${plan.name} archived`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  <span>Archive Plan</span>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    toast.error(`Cannot delete active plan with active subscribers`);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
