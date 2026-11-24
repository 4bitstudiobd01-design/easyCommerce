'use client';

import React, { useState } from 'react';
import { X, Edit2, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { Employee, useGetEmployeeQuery } from '../api/hrmApi';
import { EmploymentStatusDropdown } from './EmploymentStatusDropdown';

type TabId = 'overview' | 'personal' | 'contacts' | 'career';

interface EmployeeDetailDrawerProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (employee: Employee) => void;
  onRequestTerminate?: (employee: Employee) => void;
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <span className="text-slate-400 block">{label}:</span>
      <span className="font-bold text-slate-900 mt-0.5 block">
        {value || value === 0 ? value : <span className="text-slate-300 font-normal">—</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="grid grid-cols-2 gap-4 text-xs">{children}</div>
    </div>
  );
}

export function EmployeeDetailDrawer({ employee: listEmployee, isOpen, onClose, onOpenEdit, onRequestTerminate }: EmployeeDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: fullEmployee } = useGetEmployeeQuery(listEmployee?.id ?? '', {
    skip: !isOpen || !listEmployee,
  });
  const employee = fullEmployee ?? listEmployee;

  if (!isOpen || !employee) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'personal', label: 'Personal' },
    { id: 'contacts', label: 'Emergency & Bank' },
    { id: 'career', label: `Education & Experience` },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                {employee.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black tracking-tight truncate">{employee.fullName}</h2>
                  <EmploymentStatusDropdown
                    employee={employee}
                    theme="dark"
                    className="uppercase"
                    onRequestTerminate={onRequestTerminate}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                  <span className="font-mono text-slate-400">{employee.employeeCode}</span>
                  {employee.designation && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {employee.designation}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              {onOpenEdit && (
                <button
                  onClick={() => onOpenEdit(employee)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs border border-slate-700"
                  title="Edit Employee"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-3 bg-white border-b border-slate-200/80 overflow-x-auto scrollbar-none shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <SectionCard title="Contact & Employment">
                  <Field label="Full Name" value={employee.fullName} />
                  <Field
                    label="Email"
                    value={
                      employee.email && (
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {employee.email}
                        </span>
                      )
                    }
                  />
                  <Field
                    label="Phone"
                    value={
                      employee.phone && (
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {employee.phone}
                        </span>
                      )
                    }
                  />
                  <Field label="Department" value={employee.department?.name} />
                  <Field label="Designation" value={employee.designation} />
                  <Field label="Employment Type" value={employee.employmentType.replace('_', ' ')} />
                  <Field
                    label="Date of Joining"
                    value={employee.dateOfJoining && new Date(employee.dateOfJoining).toLocaleDateString()}
                  />
                  <Field label="Reports To" value={employee.reportsTo?.fullName} />
                  <Field
                    label="Address"
                    value={
                      employee.address && (
                        <span className="flex items-center gap-1 font-bold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {employee.address}
                        </span>
                      )
                    }
                  />
                </SectionCard>

                {employee.bio && (
                  <SectionCard title="About">
                    <p className="col-span-2 text-slate-700 font-medium leading-relaxed">{employee.bio}</p>
                  </SectionCard>
                )}
              </div>
            )}

            {activeTab === 'personal' && (
              <div className="space-y-6">
                <SectionCard title="Personal Information">
                  <Field
                    label="Date of Birth"
                    value={employee.dateOfBirth && new Date(employee.dateOfBirth).toLocaleDateString()}
                  />
                  <Field label="Gender" value={employee.gender && employee.gender.charAt(0) + employee.gender.slice(1).toLowerCase()} />
                  <Field label="Nationality" value={employee.nationality} />
                  <Field label="Religion" value={employee.religion} />
                  <Field
                    label="Marital Status"
                    value={
                      employee.maritalStatus &&
                      employee.maritalStatus.charAt(0) + employee.maritalStatus.slice(1).toLowerCase()
                    }
                  />
                  <Field label="Spouse Name" value={employee.spouseName} />
                  <Field label="Spouse Employed" value={employee.spouseEmployed !== undefined ? (employee.spouseEmployed ? 'Yes' : 'No') : undefined} />
                  <Field label="No. of Children" value={employee.numberOfChildren} />
                </SectionCard>

                <SectionCard title="Identity Documents">
                  <Field label="National ID (NID)" value={employee.nationalId} />
                  <Field label="Passport No." value={employee.passportNumber} />
                  <Field
                    label="Passport Expiry"
                    value={employee.passportExpiryDate && new Date(employee.passportExpiryDate).toLocaleDateString()}
                  />
                </SectionCard>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <SectionCard title="Primary Emergency Contact">
                  <Field label="Name" value={employee.emergencyContactName} />
                  <Field label="Phone" value={employee.emergencyContactPhone} />
                  <Field label="Relation" value={employee.emergencyContactRelation} />
                </SectionCard>

                <SectionCard title="Secondary Emergency Contact">
                  <Field label="Name" value={employee.secondaryEmergencyContactName} />
                  <Field label="Phone" value={employee.secondaryEmergencyContactPhone} />
                  <Field label="Relation" value={employee.secondaryEmergencyContactRelation} />
                </SectionCard>

                <SectionCard title="Bank Information">
                  <Field label="Bank Name" value={employee.bankName} />
                  <Field label="Account Number" value={employee.bankAccountNumber} />
                  <Field label="Branch" value={employee.bankBranchName} />
                  <Field label="Routing Number" value={employee.bankRoutingNumber} />
                </SectionCard>
              </div>
            )}

            {activeTab === 'career' && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Education</h3>
                  {employee.education && employee.education.length > 0 ? (
                    <div className="space-y-3">
                      {employee.education.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="font-bold text-slate-900">{entry.degree}</div>
                          <div className="text-slate-500 mt-0.5">
                            {entry.institution}
                            {entry.fieldOfStudy ? ` · ${entry.fieldOfStudy}` : ''}
                          </div>
                          {(entry.startYear || entry.endYear) && (
                            <div className="text-slate-400 mt-0.5">
                              {entry.startYear ?? '—'} – {entry.endYear ?? 'Present'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No education records added.</p>
                  )}
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Experience</h3>
                  {employee.experience && employee.experience.length > 0 ? (
                    <div className="space-y-3">
                      {employee.experience.map((entry, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                          <div className="font-bold text-slate-900">{entry.title}</div>
                          <div className="text-slate-500 mt-0.5">{entry.company}</div>
                          {(entry.startDate || entry.endDate) && (
                            <div className="text-slate-400 mt-0.5">
                              {entry.startDate ? new Date(entry.startDate).toLocaleDateString() : '—'} –{' '}
                              {entry.endDate ? new Date(entry.endDate).toLocaleDateString() : 'Present'}
                            </div>
                          )}
                          {entry.description && <p className="text-slate-600 mt-1.5">{entry.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No experience records added.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
