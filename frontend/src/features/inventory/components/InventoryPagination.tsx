'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InventoryPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
}

export function InventoryPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
}: InventoryPaginationProps) {
  if (total === 0) return null;

  const start = Math.min((page - 1) * limit + 1, total);
  const end = Math.min(page * limit, total);

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push('...');
      }

      const startWindow = Math.max(2, page - 1);
      const endWindow = Math.min(totalPages - 1, page + 1);

      for (let i = startWindow; i <= endWindow; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2 border-t border-slate-100">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{start}</span> to{' '}
          <span className="font-semibold text-slate-800">{end}</span> of{' '}
          <span className="font-semibold text-slate-800">{total.toLocaleString()}</span> results
        </span>

        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === page;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 border border-blue-600'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
