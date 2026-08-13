'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import {
  CustomerAddress,
  useCreateCustomerAddressMutation,
  useUpdateCustomerAddressMutation,
} from '../api/customerApi';
import { toast } from 'sonner';

interface AddressModalProps {
  isOpen: boolean;
  customerId: string;
  address?: CustomerAddress | null;
  onClose: () => void;
}

export function AddressModal({
  isOpen,
  customerId,
  address,
  onClose,
}: AddressModalProps) {
  const [createCustomerAddress, { isLoading: isCreating }] = useCreateCustomerAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateCustomerAddressMutation();

  const isEditing = Boolean(address);

  const [label, setLabel] = useState('Home');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (address) {
      setLabel(address.label || 'Home');
      setRecipientName(address.recipientName || '');
      setPhone(address.phone || '');
      setAddressLine1(address.addressLine1 || '');
      setAddressLine2(address.addressLine2 || '');
      setArea(address.area || '');
      setCity(address.city || 'Dhaka');
      setDistrict(address.district || 'Dhaka');
      setPostalCode(address.postalCode || '');
      setIsDefault(address.isDefault || false);
    } else {
      setLabel('Home');
      setRecipientName('');
      setPhone('');
      setAddressLine1('');
      setAddressLine2('');
      setArea('');
      setCity('Dhaka');
      setDistrict('Dhaka');
      setPostalCode('');
      setIsDefault(false);
    }
  }, [address, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim() || !phone.trim() || !addressLine1.trim()) {
      toast.error('Please fill in recipient name, phone number, and primary address.');
      return;
    }

    const payload = {
      label,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      area: area.trim() || undefined,
      city: city.trim() || 'Dhaka',
      district: district.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      country: 'Bangladesh',
      isDefault,
    };

    try {
      if (isEditing && address) {
        await updateAddress({
          customerId,
          addressId: address.id,
          data: payload,
        }).unwrap();
        toast.success('Address updated successfully');
      } else {
        await createCustomerAddress({
          customerId,
          data: payload,
        }).unwrap();
        toast.success('Address added successfully');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save address');
    }
  };

  const isLoading = isCreating || isUpdating;

  // z-80 keeps this above the customer detail drawer (z-70) it is opened from.
  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              {isEditing ? 'Edit Delivery Address' : 'Add Delivery Address'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Label selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Address Type / Label</label>
            <div className="flex items-center gap-2">
              {['Home', 'Office', 'Other'].map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => setLabel(l)}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold border text-center transition-all ${
                    label === l
                      ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Recipient Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Recipient Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Rahim Hossain"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01711000111"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Address Line 1 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g. House 12, Road 5, Block B"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Address Line 2 / Landmark (Optional)</label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="e.g. Opposite City Hospital"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Area */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Area / Thana</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Uttara / Gulshan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* City */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">City / District</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Dhaka"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Default address toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefaultCheckbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isDefaultCheckbox" className="font-bold text-slate-700 cursor-pointer">
              Set as Default Delivery Address
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Address'
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
