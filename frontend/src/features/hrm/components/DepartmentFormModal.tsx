'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Building2 } from 'lucide-react';
import {
  Department,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from '../api/hrmApi';

interface DepartmentFormModalProps {
  isOpen: boolean;
  department: Department | null;
  onClose: () => void;
}

export function DepartmentFormModal({ isOpen, department, onClose }: DepartmentFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isOpen) {
      setName(department?.name ?? '');
      setDescription(department?.description ?? '');
    }
  }, [isOpen, department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Department name is required.');
      return;
    }

    try {
      if (department) {
        await updateDepartment({ id: department.id, name, description }).unwrap();
        toast.success('Department updated.');
      } else {
        await createDepartment({ name, description }).unwrap();
        toast.success('Department created.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save department.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={department ? 'Edit Department' : 'Add Department'}
      subtitle={department ? department.name : 'Create a new department to group employees'}
      icon={<Building2 className="w-5 h-5" />}
      size="sm"
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
            form="department-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : department ? 'Save Changes' : 'Create Department'}
          </button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Department Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Warehouse Operations"
            className="w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this department handle?"
            rows={3}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
