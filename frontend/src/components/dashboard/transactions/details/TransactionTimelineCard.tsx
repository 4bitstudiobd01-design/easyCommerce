'use client';

import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { TransactionRecord } from '../types';
import { toast } from 'sonner';

interface TransactionTimelineCardProps {
  transaction: TransactionRecord;
}

export function TransactionTimelineCard({
  transaction,
}: TransactionTimelineCardProps) {
  const [showAll, setShowAll] = useState(false);

  const defaultTimeline = [
    { title: 'Payment Initiated', time: 'Aug 14, 2026 10:31:21 AM' },
    { title: 'Payment Authorized', time: 'Aug 14, 2026 10:31:24 AM' },
    { title: 'Payment Captured', time: 'Aug 14, 2026 10:31:27 AM' },
    { title: 'Webhook Received', time: 'Aug 14, 2026 10:31:30 AM' },
    { title: 'Marked as Success', time: 'Aug 14, 2026 10:31:32 AM' },
  ];

  const timeline = transaction.timeline || defaultTimeline;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs">
      <h3 className="font-bold text-slate-900 tracking-tight text-xs sm:text-[13px]">
        Timeline
      </h3>

      {/* Vertical Steps */}
      <div className="relative pl-5 space-y-4">
        {/* Continuous vertical line */}
        <div className="absolute left-[7px] top-1.5 bottom-1.5 w-0.5 bg-emerald-200" />

        {timeline.map((step, idx) => (
          <div key={idx} className="relative flex flex-col gap-0.5">
            {/* Dot */}
            <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />

            <span className="font-bold text-slate-900 leading-tight">
              {step.title}
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {step.time}
            </span>
          </div>
        ))}
      </div>

      {/* View Full Timeline Button */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => toast.info('Full audit log & trace details')}
          className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 text-xs shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>View Full Timeline</span>
        </button>
      </div>
    </div>
  );
}
