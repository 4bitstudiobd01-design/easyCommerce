'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  X,
  Plus,
  FileCheck,
  Calendar,
  Building2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import {
  useCreateRequisitionMutation,
  type FinanceRequisitionPriority,
} from '../api/financeApi';
import { CustomDropdown } from '@/features/purchase/components/CustomDropdown';

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRequisitionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateRequisitionModalProps) {
  const [title, setTitle] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [category, setCategory] = useState('PURCHASE');
  const [requestedAmount, setRequestedAmount] = useState<number | ''>('');
  const [requestDate, setRequestDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [requiredDate, setRequiredDate] = useState('');
  const [priority, setPriority] = useState<FinanceRequisitionPriority>('NORMAL');
  const [notes, setNotes] = useState('');

  const [createRequisition, { isLoading }] = useCreateRequisitionMutation();

  const resetForm = () => {
    setTitle('');
    setSupplierName('');
    setCategory('PURCHASE');
    setRequestedAmount('');
    setRequestDate(new Date().toISOString().slice(0, 10));
    setRequiredDate('');
    setPriority('NORMAL');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a requisition title or purpose.');
      return;
    }

    if (!requestedAmount || Number(requestedAmount) <= 0) {
      toast.error('Please enter a valid requested amount greater than 0.');
      return;
    }

    try {
      await createRequisition({
        title: title.trim(),
        supplierName: supplierName.trim() || undefined,
        category,
        requestedAmount: Number(requestedAmount),
        requestDate,
        requiredDate: requiredDate || undefined,
        priority,
        notes: notes.trim() || undefined,
      }).unwrap();

      toast.success('Budget requisition created successfully!');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create requisition.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                New Budget Requisition
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Create a formal financial disbursement requisition
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Raw Material Procurement for Batch #40"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Beneficiary / Supplier
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier or vendor name"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Requested Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <CustomDropdown
                value={category}
                onChange={(val) => setCategory(val)}
                options={[
                  { value: 'PURCHASE', label: 'Purchase & Procurement' },
                  { value: 'OPERATING_EXPENSE', label: 'Operating Expense' },
                  { value: 'EQUIPMENT', label: 'Equipment / Asset' },
                  { value: 'LOGISTICS', label: 'Logistics & Shipping' },
                  { value: 'OTHER', label: 'Other Requisition' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <CustomDropdown
                value={priority}
                onChange={(val) => setPriority(val as FinanceRequisitionPriority)}
                options={[
                  { value: 'LOW', label: 'Low', badge: 'Low', badgeColor: 'bg-slate-100 text-slate-700' },
                  { value: 'NORMAL', label: 'Normal', badge: 'Normal', badgeColor: 'bg-blue-50 text-blue-700' },
                  { value: 'HIGH', label: 'High', badge: 'High', badgeColor: 'bg-amber-50 text-amber-700' },
                  { value: 'URGENT', label: 'Urgent', badge: 'Urgent', badgeColor: 'bg-rose-50 text-rose-700' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Request Date
              </label>
              <input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Required By Date
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Justification / Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide reason or context for this requisition..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition shadow-2xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'Creating...' : 'Create Requisition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
