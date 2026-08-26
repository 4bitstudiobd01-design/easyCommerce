'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X, Warehouse as WarehouseIcon, Loader2 } from 'lucide-react';
import {
  Warehouse,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
} from '../api/inventoryApi';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse?: Warehouse | null;
}

export function WarehouseFormModal({ isOpen, onClose, warehouse }: WarehouseFormModalProps) {
  const isEditMode = Boolean(warehouse);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();
  const isBusy = isCreating || isUpdating;

  useEffect(() => {
    if (!isOpen) return;
    setName(warehouse?.name || '');
    setCode(warehouse?.code || '');
    setAddress(warehouse?.address || '');
    setPhone(warehouse?.phone || '');
    setIsDefault(warehouse?.isDefault || false);
  }, [isOpen, warehouse]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Warehouse name and code are required.');
      return;
    }

    try {
      if (isEditMode && warehouse) {
        await updateWarehouse({
          id: warehouse.id,
          name: name.trim(),
          code: code.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          isDefault,
        }).unwrap();
        toast.success('Warehouse updated successfully.');
      } else {
        await createWarehouse({
          name: name.trim(),
          code: code.trim(),
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          isDefault,
        }).unwrap();
        toast.success('Warehouse created successfully.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save warehouse. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <WarehouseIcon className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {isEditMode ? 'Edit Warehouse' : 'New Warehouse'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Warehouse Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Dhaka Warehouse"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Warehouse Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. WH-DHAKA-01"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">A unique short code used to identify this warehouse.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. House 12, Road 5, Dhanmondi, Dhaka"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +8801700000000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Set as default fulfillment warehouse</span>
          </label>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isEditMode ? 'Save Changes' : 'Create Warehouse'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
