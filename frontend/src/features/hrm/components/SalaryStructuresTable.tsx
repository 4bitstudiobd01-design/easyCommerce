'use client';

import React, { useState } from 'react';
import { Wallet, RefreshCw, Edit2, AlertCircle } from 'lucide-react';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { Employee, SalaryStructure, useGetSalaryStructuresQuery } from '../api/hrmApi';
import { SalaryStructureModal } from './SalaryStructureModal';

function formatAmount(amount: string) {
  return `BDT ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function grossOf(s: SalaryStructure) {
  return (
    Number(s.basicSalary) + Number(s.houseRentAllowance) + Number(s.medicalAllowance) + Number(s.conveyanceAllowance) + Number(s.otherAllowance)
  );
}

export function SalaryStructuresTable() {
  const { data: rows = [], isLoading, isFetching, refetch } = useGetSalaryStructuresQuery();
  const [editing, setEditing] = useState<{ employee: Employee; salaryStructure: SalaryStructure | null } | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-600 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Salary Structures</h2>
            <p className="text-xs text-slate-500 mt-0.5">Set each employee's pay before running payroll</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          title="Refresh list"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Basic</th>
                <th className="px-6 py-4">Gross</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={5} />
                  <TableRowSkeleton columns={5} />
                </>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No active employees yet.</p>
                  </td>
                </tr>
              ) : (
                rows.map(({ employee, salaryStructure }) => (
                  <tr key={employee.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-900 text-white font-extrabold text-sm rounded-full flex items-center justify-center uppercase shrink-0 shadow-sm">
                          {employee.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{employee.fullName}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{employee.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700">
                      {salaryStructure ? formatAmount(salaryStructure.basicSalary) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {salaryStructure ? formatAmount(grossOf(salaryStructure).toFixed(2)) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {salaryStructure ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          SET
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" /> NOT SET
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setEditing({ employee, salaryStructure })}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit salary structure"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SalaryStructureModal
        isOpen={!!editing}
        employee={editing?.employee ?? null}
        salaryStructure={editing?.salaryStructure ?? null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
