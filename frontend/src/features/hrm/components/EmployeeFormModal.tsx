'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { UserPlus } from 'lucide-react';
import {
  Employee,
  EmploymentStatus,
  EmploymentType,
  EmployeeGender,
  useGetDepartmentsQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} from '../api/hrmApi';

interface EmployeeFormModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'];
const GENDERS: EmployeeGender[] = ['MALE', 'FEMALE', 'OTHER'];

const fieldClass =
  'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  departmentId: '',
  designation: '',
  employmentType: 'FULL_TIME' as EmploymentType,
  employmentStatus: 'ACTIVE' as EmploymentStatus,
  dateOfJoining: '',
  dateOfBirth: '',
  gender: '' as EmployeeGender | '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export function EmployeeFormModal({ isOpen, employee, onClose }: EmployeeFormModalProps) {
  const [form, setForm] = useState(emptyForm);

  const { data: departments = [] } = useGetDepartmentsQuery();
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    if (employee) {
      setForm({
        fullName: employee.fullName,
        email: employee.email ?? '',
        phone: employee.phone ?? '',
        departmentId: employee.departmentId ?? '',
        designation: employee.designation ?? '',
        employmentType: employee.employmentType,
        employmentStatus: employee.employmentStatus,
        dateOfJoining: employee.dateOfJoining?.slice(0, 10) ?? '',
        dateOfBirth: employee.dateOfBirth?.slice(0, 10) ?? '',
        gender: employee.gender ?? '',
        address: employee.address ?? '',
        emergencyContactName: employee.emergencyContactName ?? '',
        emergencyContactPhone: employee.emergencyContactPhone ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, employee]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Full name is required.');
    if (!form.dateOfJoining) return toast.error('Date of joining is required.');

    const payload = {
      fullName: form.fullName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      departmentId: form.departmentId || undefined,
      designation: form.designation || undefined,
      employmentType: form.employmentType,
      dateOfJoining: form.dateOfJoining,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      address: form.address || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
    };

    try {
      if (employee) {
        await updateEmployee({
          id: employee.id,
          ...payload,
          departmentId: form.departmentId || null,
          employmentStatus: form.employmentStatus,
        }).unwrap();
        toast.success('Employee updated.');
      } else {
        await createEmployee(payload).unwrap();
        toast.success('Employee added.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save employee.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Employee' : 'Add Employee'}
      subtitle={employee ? `${employee.employeeCode} · ${employee.fullName}` : 'Add a new employee record'}
      icon={<UserPlus className="w-5 h-5" />}
      size="xl"
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
            form="employee-form"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : employee ? 'Save Changes' : 'Add Employee'}
          </button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            className={fieldClass}
            value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Rahim Uddin"
          />
        </div>
        <div>
          <label className={labelClass}>Designation</label>
          <input
            className={fieldClass}
            value={form.designation}
            onChange={(e) => set('designation', e.target.value)}
            placeholder="Warehouse Associate"
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={fieldClass}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="rahim@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input
            className={fieldClass}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+8801812345678"
          />
        </div>

        <div>
          <label className={labelClass}>Department</label>
          <select
            className={fieldClass}
            value={form.departmentId}
            onChange={(e) => set('departmentId', e.target.value)}
          >
            <option value="">Unassigned</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Employment Type</label>
          <select
            className={fieldClass}
            value={form.employmentType}
            onChange={(e) => set('employmentType', e.target.value as EmploymentType)}
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Date of Joining *</label>
          <input
            type="date"
            className={fieldClass}
            value={form.dateOfJoining}
            onChange={(e) => set('dateOfJoining', e.target.value)}
          />
        </div>
        {employee && (
          <div>
            <label className={labelClass}>Employment Status</label>
            <select
              className={fieldClass}
              value={form.employmentStatus}
              onChange={(e) => set('employmentStatus', e.target.value as EmploymentStatus)}
            >
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Date of Birth</label>
          <input
            type="date"
            className={fieldClass}
            value={form.dateOfBirth}
            onChange={(e) => set('dateOfBirth', e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Gender</label>
          <select
            className={fieldClass}
            value={form.gender}
            onChange={(e) => set('gender', e.target.value as EmployeeGender)}
          >
            <option value="">Prefer not to say</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Address</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={2}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="House 12, Road 4, Dhanmondi, Dhaka"
          />
        </div>

        <div>
          <label className={labelClass}>Emergency Contact Name</label>
          <input
            className={fieldClass}
            value={form.emergencyContactName}
            onChange={(e) => set('emergencyContactName', e.target.value)}
            placeholder="Karim Uddin"
          />
        </div>
        <div>
          <label className={labelClass}>Emergency Contact Phone</label>
          <input
            className={fieldClass}
            value={form.emergencyContactPhone}
            onChange={(e) => set('emergencyContactPhone', e.target.value)}
            placeholder="+8801912345678"
          />
        </div>
      </form>
    </Modal>
  );
}
