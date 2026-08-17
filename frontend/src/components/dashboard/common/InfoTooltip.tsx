'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content?: string;
  className?: string;
}

export function InfoTooltip({ content = 'View metric details and calculations', className = '' }: InfoTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="Information"
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-100"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-50 px-2.5 py-1 text-[11px] font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none transition-all">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
