'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { UserPlus, Plus, Trash2 } from 'lucide-react';
import {
  Employee,
  EmploymentStatus,
  EmploymentType,
  EmployeeGender,
  MaritalStatus,
  EducationEntry,
  ExperienceEntry,
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
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
const MARITAL_STATUSES: MaritalStatus[] = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];

const fieldClass =
  'w-full px-3.5 h-10 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white';
const labelClass = 'block text-xs font-bold text-slate-700 mb-1.5';
const sectionTitleClass = 'sm:col-span-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 pt-2 first:pt-0';

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
  reportsToEmployeeId: '',
  nationalId: '',
  passportNumber: '',
  passportExpiryDate: '',
  nationality: '',
  religion: '',
  maritalStatus: '' as MaritalStatus | '',
  spouseName: '',
  spouseEmployed: false,
  numberOfChildren: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  secondaryEmergencyContactName: '',
  secondaryEmergencyContactPhone: '',
  secondaryEmergencyContactRelation: '',
  bankName: '',
  bankAccountNumber: '',
  bankBranchName: '',
  bankRoutingNumber: '',
  bio: '',
  education: [] as EducationEntry[],
  experience: [] as ExperienceEntry[],
};

export function EmployeeFormModal({ isOpen, employee, onClose }: EmployeeFormModalProps) {
  const [form, setForm] = useState(emptyForm);

  const { data: departments = [] } = useGetDepartmentsQuery();
  const { data: employeesData } = useGetEmployeesQuery({ limit: 100 });
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const isSaving = isCreating || isUpdating;

  const managerOptions = (employeesData?.items ?? []).filter((e) => e.id !== employee?.id);

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
        reportsToEmployeeId: employee.reportsToEmployeeId ?? '',
        nationalId: employee.nationalId ?? '',
        passportNumber: employee.passportNumber ?? '',
        passportExpiryDate: employee.passportExpiryDate?.slice(0, 10) ?? '',
        nationality: employee.nationality ?? '',
        religion: employee.religion ?? '',
        maritalStatus: employee.maritalStatus ?? '',
        spouseName: employee.spouseName ?? '',
        spouseEmployed: employee.spouseEmployed ?? false,
        numberOfChildren: employee.numberOfChildren?.toString() ?? '',
        emergencyContactName: employee.emergencyContactName ?? '',
        emergencyContactPhone: employee.emergencyContactPhone ?? '',
        emergencyContactRelation: employee.emergencyContactRelation ?? '',
        secondaryEmergencyContactName: employee.secondaryEmergencyContactName ?? '',
        secondaryEmergencyContactPhone: employee.secondaryEmergencyContactPhone ?? '',
        secondaryEmergencyContactRelation: employee.secondaryEmergencyContactRelation ?? '',
        bankName: employee.bankName ?? '',
        bankAccountNumber: employee.bankAccountNumber ?? '',
        bankBranchName: employee.bankBranchName ?? '',
        bankRoutingNumber: employee.bankRoutingNumber ?? '',
        bio: employee.bio ?? '',
        education: employee.education ?? [],
        experience: employee.experience ?? [],
      });
    } else {
      setForm(emptyForm);
    }
  }, [isOpen, employee]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addEducationRow = () =>
    setForm((prev) => ({ ...prev, education: [...prev.education, { institution: '', degree: '' }] }));
  const removeEducationRow = (idx: number) =>
    setForm((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== idx) }));
  const updateEducationRow = (idx: number, patch: Partial<EducationEntry>) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));

  const addExperienceRow = () =>
    setForm((prev) => ({ ...prev, experience: [...prev.experience, { company: '', title: '' }] }));
  const removeExperienceRow = (idx: number) =>
    setForm((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== idx) }));
  const updateExperienceRow = (idx: number, patch: Partial<ExperienceEntry>) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((row, i) => (i === idx ? { ...row, ...patch } : row)),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return toast.error('Full name is required.');
    if (!form.dateOfJoining) return toast.error('Date of joining is required.');

    const cleanEducation = form.education.filter((row) => row.institution.trim() && row.degree.trim());
    const cleanExperience = form.experience.filter((row) => row.company.trim() && row.title.trim());

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
      reportsToEmployeeId: form.reportsToEmployeeId || undefined,
      nationalId: form.nationalId || undefined,
      passportNumber: form.passportNumber || undefined,
      passportExpiryDate: form.passportExpiryDate || undefined,
      nationality: form.nationality || undefined,
      religion: form.religion || undefined,
      maritalStatus: form.maritalStatus || undefined,
      spouseName: form.spouseName || undefined,
      spouseEmployed: form.maritalStatus === 'MARRIED' ? form.spouseEmployed : undefined,
      numberOfChildren: form.numberOfChildren ? Number(form.numberOfChildren) : undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      emergencyContactRelation: form.emergencyContactRelation || undefined,
      secondaryEmergencyContactName: form.secondaryEmergencyContactName || undefined,
      secondaryEmergencyContactPhone: form.secondaryEmergencyContactPhone || undefined,
      secondaryEmergencyContactRelation: form.secondaryEmergencyContactRelation || undefined,
      bankName: form.bankName || undefined,
      bankAccountNumber: form.bankAccountNumber || undefined,
      bankBranchName: form.bankBranchName || undefined,
      bankRoutingNumber: form.bankRoutingNumber || undefined,
      bio: form.bio || undefined,
      education: cleanEducation.length > 0 ? cleanEducation : undefined,
      experience: cleanExperience.length > 0 ? cleanExperience : undefined,
    };

    try {
      if (employee) {
        await updateEmployee({
          id: employee.id,
          ...payload,
          departmentId: form.departmentId || null,
          reportsToEmployeeId: form.reportsToEmployeeId || null,
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
      <form
        id="employee-form"
        onSubmit={handleSubmit}
        className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 max-h-[70vh] overflow-y-auto"
      >
        {/* Basic Info */}
        <div className={sectionTitleClass}>Basic Info</div>
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
          <label className={labelClass}>Reports To</label>
          <select
            className={fieldClass}
            value={form.reportsToEmployeeId}
            onChange={(e) => set('reportsToEmployeeId', e.target.value)}
          >
            <option value="">No manager</option>
            {managerOptions.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.fullName} {mgr.designation ? `· ${mgr.designation}` : ''}
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

        <div className="sm:col-span-2">
          <label className={labelClass}>About / Bio</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
            rows={2}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="Short professional summary..."
          />
        </div>

        {/* Personal Info */}
        <div className={sectionTitleClass}>Personal Info</div>
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

        <div>
          <label className={labelClass}>Nationality</label>
          <input
            className={fieldClass}
            value={form.nationality}
            onChange={(e) => set('nationality', e.target.value)}
            placeholder="Bangladeshi"
          />
        </div>
        <div>
          <label className={labelClass}>Religion</label>
          <input
            className={fieldClass}
            value={form.religion}
            onChange={(e) => set('religion', e.target.value)}
            placeholder="Islam"
          />
        </div>

        <div>
          <label className={labelClass}>Marital Status</label>
          <select
            className={fieldClass}
            value={form.maritalStatus}
            onChange={(e) => set('maritalStatus', e.target.value as MaritalStatus)}
          >
            <option value="">Not specified</option>
            {MARITAL_STATUSES.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>No. of Children</label>
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={form.numberOfChildren}
            onChange={(e) => set('numberOfChildren', e.target.value)}
            placeholder="0"
          />
        </div>

        {form.maritalStatus === 'MARRIED' && (
          <>
            <div>
              <label className={labelClass}>Spouse Name</label>
              <input
                className={fieldClass}
                value={form.spouseName}
                onChange={(e) => set('spouseName', e.target.value)}
                placeholder="Rina Akter"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={form.spouseEmployed}
                  onChange={(e) => set('spouseEmployed', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
                Spouse is employed
              </label>
            </div>
          </>
        )}

        {/* Identity Documents */}
        <div className={sectionTitleClass}>Identity Documents</div>
        <div>
          <label className={labelClass}>National ID (NID)</label>
          <input
            className={fieldClass}
            value={form.nationalId}
            onChange={(e) => set('nationalId', e.target.value)}
            placeholder="1990123456789"
          />
        </div>
        <div>
          <label className={labelClass}>Passport Number</label>
          <input
            className={fieldClass}
            value={form.passportNumber}
            onChange={(e) => set('passportNumber', e.target.value)}
            placeholder="BN0123456"
          />
        </div>
        <div>
          <label className={labelClass}>Passport Expiry Date</label>
          <input
            type="date"
            className={fieldClass}
            value={form.passportExpiryDate}
            onChange={(e) => set('passportExpiryDate', e.target.value)}
          />
        </div>

        {/* Emergency Contacts */}
        <div className={sectionTitleClass}>Emergency Contacts</div>
        <div>
          <label className={labelClass}>Primary Contact Name</label>
          <input
            className={fieldClass}
            value={form.emergencyContactName}
            onChange={(e) => set('emergencyContactName', e.target.value)}
            placeholder="Karim Uddin"
          />
        </div>
        <div>
          <label className={labelClass}>Primary Contact Phone</label>
          <input
            className={fieldClass}
            value={form.emergencyContactPhone}
            onChange={(e) => set('emergencyContactPhone', e.target.value)}
            placeholder="+8801912345678"
          />
        </div>
        <div>
          <label className={labelClass}>Primary Contact Relation</label>
          <input
            className={fieldClass}
            value={form.emergencyContactRelation}
            onChange={(e) => set('emergencyContactRelation', e.target.value)}
            placeholder="Father"
          />
        </div>
        <div />

        <div>
          <label className={labelClass}>Secondary Contact Name</label>
          <input
            className={fieldClass}
            value={form.secondaryEmergencyContactName}
            onChange={(e) => set('secondaryEmergencyContactName', e.target.value)}
            placeholder="Amena Begum"
          />
        </div>
        <div>
          <label className={labelClass}>Secondary Contact Phone</label>
          <input
            className={fieldClass}
            value={form.secondaryEmergencyContactPhone}
            onChange={(e) => set('secondaryEmergencyContactPhone', e.target.value)}
            placeholder="+8801712345678"
          />
        </div>
        <div>
          <label className={labelClass}>Secondary Contact Relation</label>
          <input
            className={fieldClass}
            value={form.secondaryEmergencyContactRelation}
            onChange={(e) => set('secondaryEmergencyContactRelation', e.target.value)}
            placeholder="Mother"
          />
        </div>
        <div />

        {/* Bank Information */}
        <div className={sectionTitleClass}>Bank Information</div>
        <div>
          <label className={labelClass}>Bank Name</label>
          <input
            className={fieldClass}
            value={form.bankName}
            onChange={(e) => set('bankName', e.target.value)}
            placeholder="Dutch-Bangla Bank Ltd."
          />
        </div>
        <div>
          <label className={labelClass}>Account Number</label>
          <input
            className={fieldClass}
            value={form.bankAccountNumber}
            onChange={(e) => set('bankAccountNumber', e.target.value)}
            placeholder="1234567890123"
          />
        </div>
        <div>
          <label className={labelClass}>Branch Name</label>
          <input
            className={fieldClass}
            value={form.bankBranchName}
            onChange={(e) => set('bankBranchName', e.target.value)}
            placeholder="Gulshan Branch"
          />
        </div>
        <div>
          <label className={labelClass}>Routing Number</label>
          <input
            className={fieldClass}
            value={form.bankRoutingNumber}
            onChange={(e) => set('bankRoutingNumber', e.target.value)}
            placeholder="090261234"
          />
        </div>

        {/* Education */}
        <div className={`${sectionTitleClass} flex items-center justify-between`}>
          <span>Education</span>
          <button
            type="button"
            onClick={addEducationRow}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 normal-case tracking-normal font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {form.education.length === 0 && (
          <p className="sm:col-span-2 text-xs text-slate-400">No education entries yet.</p>
        )}
        {form.education.map((row, idx) => (
          <React.Fragment key={idx}>
            <div>
              <label className={labelClass}>Institution</label>
              <input
                className={fieldClass}
                value={row.institution}
                onChange={(e) => updateEducationRow(idx, { institution: e.target.value })}
                placeholder="University of Dhaka"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={labelClass}>Degree</label>
                <input
                  className={fieldClass}
                  value={row.degree}
                  onChange={(e) => updateEducationRow(idx, { degree: e.target.value })}
                  placeholder="B.Sc in Computer Science"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEducationRow(idx)}
                className="h-10 w-10 shrink-0 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition"
                title="Remove entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className={labelClass}>Start Year</label>
              <input
                type="number"
                className={fieldClass}
                value={row.startYear ?? ''}
                onChange={(e) => updateEducationRow(idx, { startYear: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="2016"
              />
            </div>
            <div>
              <label className={labelClass}>End Year</label>
              <input
                type="number"
                className={fieldClass}
                value={row.endYear ?? ''}
                onChange={(e) => updateEducationRow(idx, { endYear: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="2020"
              />
            </div>
          </React.Fragment>
        ))}

        {/* Experience */}
        <div className={`${sectionTitleClass} flex items-center justify-between`}>
          <span>Experience</span>
          <button
            type="button"
            onClick={addExperienceRow}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 normal-case tracking-normal font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {form.experience.length === 0 && (
          <p className="sm:col-span-2 text-xs text-slate-400">No experience entries yet.</p>
        )}
        {form.experience.map((row, idx) => (
          <React.Fragment key={idx}>
            <div>
              <label className={labelClass}>Company</label>
              <input
                className={fieldClass}
                value={row.company}
                onChange={(e) => updateExperienceRow(idx, { company: e.target.value })}
                placeholder="ACME Ltd."
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className={labelClass}>Title</label>
                <input
                  className={fieldClass}
                  value={row.title}
                  onChange={(e) => updateExperienceRow(idx, { title: e.target.value })}
                  placeholder="Software Engineer"
                />
              </div>
              <button
                type="button"
                onClick={() => removeExperienceRow(idx)}
                className="h-10 w-10 shrink-0 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition"
                title="Remove entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                className={fieldClass}
                value={row.startDate ?? ''}
                onChange={(e) => updateExperienceRow(idx, { startDate: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className={labelClass}>End Date</label>
              <input
                type="date"
                className={fieldClass}
                value={row.endDate ?? ''}
                onChange={(e) => updateExperienceRow(idx, { endDate: e.target.value || undefined })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                rows={2}
                value={row.description ?? ''}
                onChange={(e) => updateExperienceRow(idx, { description: e.target.value || undefined })}
                placeholder="Key responsibilities and achievements..."
              />
            </div>
          </React.Fragment>
        ))}
      </form>
    </Modal>
  );
}
