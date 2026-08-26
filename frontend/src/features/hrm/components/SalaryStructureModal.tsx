'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Wallet } from 'lucide-react';
import { Employee, SalaryStructure, useSetSalaryStructureMutation } from '../api/hrmApi';

interface SalaryStructureModalProps {
  isOpen: boolean;
  employee: Employee | null;
  salaryStructure: SalaryStructure | null;
  onClose: () => void;
}

export function SalaryStructureModal({ isOpen, employee, salaryStructure, onClose }: SalaryStructureModalProps) {
  const [basicSalary, setBasicSalary] = useState('');
  const [houseRentAllowance, setHouseRentAllowance] = useState('');
  const [medicalAllowance, setMedicalAllowance] = useState('');
  const [conveyanceAllowance, setConveyanceAllowance] = useState('');
  const [otherAllowance, setOtherAllowance] = useState('');
  const [providentFundDeduction, setProvidentFundDeduction] = useState('');

  const [setSalaryStructure, { isLoading: isSaving }] = useSetSalaryStructureMutation();

  useEffect(() => {
    if (isOpen) {
      setBasicSalary(salaryStructure?.basicSalary ?? '');
      setHouseRentAllowance(salaryStructure?.houseRentAllowance ?? '0');
      setMedicalAllowance(salaryStructure?.medicalAllowance ?? '0');
      setConveyanceAllowance(salaryStructure?.conveyanceAllowance ?? '0');
      setOtherAllowance(salaryStructure?.otherAllowance ?? '0');
      setProvidentFundDeduction(salaryStructure?.providentFundDeduction ?? '0');
    }
  }, [isOpen, salaryStructure]);

  const gross =
    (Number(basicSalary) || 0) +
    (Number(houseRentAllowance) || 0) +
    (Number(medicalAllowance) || 0) +
    (Number(conveyanceAllowance) || 0) +
    (Number(otherAllowance) || 0);
  const net = gross - (Number(providentFundDeduction) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !basicSalary) {
      toast.error('Basic salary is required.');
      return;
    }

    try {
      await setSalaryStructure({
        employeeId: employee.id,
        basicSalary,
        houseRentAllowance,
        medicalAllowance,
        conveyanceAllowance,
        otherAllowance,
        providentFundDeduction,
      }).unwrap();
      toast.success('Salary structure saved.');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save salary structure.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Salary Structure — ${employee?.fullName ?? ''}`}
      icon={<Wallet className="w-5 h-5" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="salary-structure-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Structure'}
          </button>
        </>
      }
    >
      <form id="salary-structure-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Basic Salary (BDT)</label>
            <input type="number" min="0" step="0.01" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} className={fieldClass} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">House Rent Allowance</label>
            <input type="number" min="0" step="0.01" value={houseRentAllowance} onChange={(e) => setHouseRentAllowance(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Medical Allowance</label>
            <input type="number" min="0" step="0.01" value={medicalAllowance} onChange={(e) => setMedicalAllowance(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Conveyance Allowance</label>
            <input type="number" min="0" step="0.01" value={conveyanceAllowance} onChange={(e) => setConveyanceAllowance(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Other Allowance</label>
            <input type="number" min="0" step="0.01" value={otherAllowance} onChange={(e) => setOtherAllowance(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Provident Fund Deduction</label>
            <input type="number" min="0" step="0.01" value={providentFundDeduction} onChange={(e) => setProvidentFundDeduction(e.target.value)} className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Salary</div>
            <div className="text-lg font-extrabold text-slate-900 font-mono">BDT {gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Salary</div>
            <div className="text-lg font-extrabold text-emerald-700 font-mono">BDT {net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <p className="text-[10.5px] text-slate-400">
          Tax is not deducted here — Bangladesh tax calculation is handled separately once that module is available.
        </p>
      </form>
    </Modal>
  );
}
