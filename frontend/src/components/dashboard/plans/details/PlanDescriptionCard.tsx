'use client';

import React from 'react';
import { PlanRecord } from '../types';

interface PlanDescriptionCardProps {
  plan: PlanRecord;
}

export function PlanDescriptionCard({ plan }: PlanDescriptionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
      <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
        Plan Description
      </h3>
      <div className="text-xs text-slate-600 leading-relaxed space-y-2">
        <p>
          The {plan.name} plan is perfect for growing businesses. It includes advanced features, higher limits, and priority support to help you scale faster.
        </p>
        <p>
          Ideal for businesses that are expanding their operations and need more power.
        </p>
      </div>
    </div>
  );
}
