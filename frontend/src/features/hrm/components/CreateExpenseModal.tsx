'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Receipt, Paperclip, UploadCloud } from 'lucide-react';
import {
  ExpenseCategory,
  useGetEmployeesQuery,
  useCreateExpenseMutation,
  useUploadExpenseReceiptMutation,
} from '../api/hrmApi';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: ExpenseCategory[] = ['TRAVEL', 'MEALS', 'ACCOMMODATION', 'OFFICE_SUPPLIES', 'UTILITIES', 'MEDICAL', 'OTHER'];

function categoryLabel(category: ExpenseCategory) {
  return category.replace('_', ' ').replace(/\w\S*/g, (t) => t.charAt(0) + t.slice(1).toLowerCase());
}

export function CreateExpenseModal({ isOpen, onClose }: CreateExpenseModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('TRAVEL');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: employeesPage } = useGetEmployeesQuery({ limit: 100 });
  const employees = employeesPage?.items ?? [];
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [uploadReceipt, { isLoading: isUploading }] = useUploadExpenseReceiptMutation();

  const reset = () => {
    setEmployeeId('');
    setCategory('TRAVEL');
    setAmount('');
    setExpenseDate('');
    setDescription('');
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !amount || !expenseDate) {
      toast.error('Employee, amount, and expense date are required.');
      return;
    }

    try {
      const expense = await createExpense({ employeeId, category, amount, expenseDate, description: description || undefined }).unwrap();
      if (file) {
        await uploadReceipt({ id: expense.id, file }).unwrap();
      }
      toast.success('Expense claim filed.');
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to file expense claim.');
    }
  };

  const fieldClass =
    'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title="New Expense Claim"
      icon={<Receipt className="w-5 h-5" />}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={isCreating || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isCreating || isUploading ? 'Submitting...' : 'Submit Claim'}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Employee</label>
          <select className={fieldClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select an employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} ({emp.employeeCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
            <select className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Amount (BDT)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`${fieldClass} placeholder-slate-400`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Expense Date</label>
            <input type="date" className={fieldClass} value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (optional)</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this expense for?"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Receipt (optional)</label>
          <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition">
            <UploadCloud className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 flex-1 truncate">
              {file ? (
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <Paperclip className="w-3.5 h-3.5" /> {file.name}
                </span>
              ) : (
                'Upload a photo or PDF of the receipt'
              )}
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <p className="text-[10.5px] text-slate-400 mt-1">Stored privately — only visible to HR, never a public link.</p>
        </div>
      </form>
    </Modal>
  );
}
