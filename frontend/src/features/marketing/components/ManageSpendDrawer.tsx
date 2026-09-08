'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetAdSpendQuery,
  useUpsertAdSpendMutation,
  useDeleteAdSpendMutation,
  type AdSpendDimension,
  type AdSpendEntry,
} from '../api/marketingApi';

interface ManageSpendDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dimension: AdSpendDimension;
  dimensionValue: string;
  /** Human label for the header (e.g. "Facebook", "eid-2026"). */
  displayLabel: string;
}

/** "2026-09" -> { periodStart: "2026-09-01", periodEnd: "2026-09-30" } */
function monthToPeriod(month: string): { periodStart: string; periodEnd: string } {
  const [y, m] = month.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of this
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

/** A full-calendar-month entry shows as "September 2026"; anything else keeps raw dates. */
function periodLabel(e: AdSpendEntry): string {
  const start = new Date(e.periodStart + 'T00:00:00Z');
  const isFirst = e.periodStart.slice(8, 10) === '01';
  const nextMonthDay0 = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
  if (isFirst && e.periodEnd === nextMonthDay0) {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  return `${e.periodStart} → ${e.periodEnd}`;
}

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function ManageSpendDrawer({
  isOpen,
  onClose,
  dimension,
  dimensionValue,
  displayLabel,
}: ManageSpendDrawerProps) {
  const { data: allEntries, isLoading } = useGetAdSpendQuery({ dimension }, { skip: !isOpen });
  const [upsertAdSpend, { isLoading: isSaving }] = useUpsertAdSpendMutation();
  const [deleteAdSpend, { isLoading: isDeleting }] = useDeleteAdSpendMutation();

  const [newMonth, setNewMonth] = useState(currentMonthValue());
  const [newAmount, setNewAmount] = useState('');

  // Animation states for smooth entrance and exit
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRendered]);

  const entries = useMemo(
    () =>
      (allEntries || [])
        .filter((e) => e.dimensionValue === dimensionValue)
        .slice()
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart)),
    [allEntries, dimensionValue],
  );

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAdd = async () => {
    const amount = Number(newAmount);
    if (!newMonth) {
      toast.error('Pick a month.');
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a spend amount greater than 0.');
      return;
    }
    const { periodStart, periodEnd } = monthToPeriod(newMonth);
    try {
      await upsertAdSpend({
        dimension,
        dimensionValue,
        periodStart,
        periodEnd,
        amount,
        currency: 'BDT',
      }).unwrap();
      toast.success(`Spend for ${newMonth} saved.`);
      setNewAmount('');
    } catch {
      toast.error('Failed to save spend.');
    }
  };

  const handleDelete = async (entry: AdSpendEntry) => {
    try {
      await deleteAdSpend(entry.id).unwrap();
      toast.success('Spend entry removed.');
    } catch {
      toast.error('Failed to remove entry.');
    }
  };

  if (!isRendered || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Ad spend for ${displayLabel}`}
        className={`fixed inset-y-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black text-slate-900">Ad Spend — {displayLabel}</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Enter spend per month. The report sums the months inside whatever date range you pick.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add month */}
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Month
              </label>
              <input
                type="month"
                value={newMonth}
                onChange={(e) => setNewMonth(e.target.value)}
                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">
                Amount (BDT)
              </label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Saving a month that already has an amount overwrites it.
          </p>
        </div>

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-[11px] text-slate-400 py-8">
              No spend recorded for {displayLabel} yet.
            </p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70"
              >
                <span className="text-xs font-bold text-slate-800">{periodLabel(entry)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {entry.currency} {Math.round(entry.amount).toLocaleString('en-US')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry)}
                    disabled={isDeleting}
                    aria-label="Remove entry"
                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer total */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total recorded
          </span>
          <span className="text-sm font-black text-slate-900">
            BDT {Math.round(total).toLocaleString('en-US')}
          </span>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
