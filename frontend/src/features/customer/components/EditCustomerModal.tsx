'use client';

import React, { useState, useEffect } from 'react';
import { Customer, useUpdateCustomerMutation, CustomerStatusType, CustomerSourceType } from '../api/customerApi';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface EditCustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
}

export function EditCustomerModal({ customer, onClose }: EditCustomerModalProps) {
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<CustomerStatusType>('ACTIVE');
  const [source, setSource] = useState<CustomerSourceType>('ONLINE_STORE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFirstName(customer.firstName || '');
      setLastName(customer.lastName || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setStatus(customer.status || 'ACTIVE');
      setSource(customer.source || 'ONLINE_STORE');
      setErrors({});
    }
  }, [customer]);

  if (!customer) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim()) errs.lastName = 'Last name is required.';
    if (!phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else if (phone.trim().length < 8) {
      errs.phone = 'Please enter a valid phone number.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateCustomer({
        id: customer.id,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          status,
          source,
        },
      }).unwrap();

      toast.success('Customer updated successfully!');
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message || 'Failed to update customer profile.';
      toast.error(typeof msg === 'string' ? msg : msg[0] || 'Validation error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Edit Customer Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update details for {customer.firstName} {customer.lastName}.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.firstName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.firstName && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  errors.lastName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
                }`}
              />
              {errors.lastName && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.phone && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                errors.email ? 'border-rose-500 bg-rose-50/30' : 'border-slate-200'
              }`}
            />
            {errors.email && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.email}</p>}
          </div>

          {/* Status & Source */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ONLINE_STORE">Online Store</option>
                <option value="MANUAL">Manual</option>
                <option value="POS">POS</option>
                <option value="IMPORT">Import</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
