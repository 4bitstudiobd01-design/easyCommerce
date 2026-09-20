'use client';

import React, { useState } from 'react';
import { PayrollRunsTable } from './PayrollRunsTable';
import { SalaryStructuresTable } from './SalaryStructuresTable';
import { TaxSlabsTable } from './TaxSlabsTable';
import { AttendanceDeductionPolicyView } from './AttendanceDeductionPolicyView';

const TABS = [
  { key: 'runs', label: 'Payroll Runs' },
  { key: 'structures', label: 'Salary Structures' },
  { key: 'tax', label: 'Tax Slabs' },
  { key: 'deductions', label: 'Salary Deductions' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function PayrollManagementView() {
  const [activeTab, setActiveTab] = useState<TabKey>('runs');

  return (
    <div className="space-y-6">
      <ul className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <li key={tab.key}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t ${
                  isActive ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>

      {activeTab === 'runs' && <PayrollRunsTable />}
      {activeTab === 'structures' && <SalaryStructuresTable />}
      {activeTab === 'tax' && <TaxSlabsTable />}
      {activeTab === 'deductions' && <AttendanceDeductionPolicyView />}
    </div>
  );
}
