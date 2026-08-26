'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface CrmPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const CrmPagination: React.FC<CrmPaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel = 'customers',
}) => {
  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate pagination window with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const startWindow = Math.max(2, currentPage - 1);
    const endWindow = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startWindow; i <= endWindow; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
      {/* Left: Summary & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3.5">
        <span className="text-slate-500 font-medium">
          Showing <strong className="text-slate-900 font-bold">{startItem}</strong> to{' '}
          <strong className="text-slate-900 font-bold">{endItem}</strong> of{' '}
          <strong className="text-slate-900 font-bold">{totalItems}</strong> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
          <span className="text-[11px] text-slate-400 font-medium">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer transition-all shadow-2xs"
            aria-label="Select number of items per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-2xs flex items-center gap-1"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-bold">First</span>
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-2xs"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 font-bold select-none text-xs"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-black shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-2xs"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-600 transition-colors shadow-2xs flex items-center gap-1"
          title="Last Page"
          aria-label="Last Page"
        >
          <span className="hidden sm:inline text-[11px] font-bold">Last</span>
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
