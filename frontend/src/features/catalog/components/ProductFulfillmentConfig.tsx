'use client';

import React, { useState } from 'react';
import {
  ProductType,
  WeightUnit,
  DimensionUnit,
  DigitalDeliveryType,
  ServiceDeliveryType,
  ServiceDurationUnit,
  useGetShippingProfilesQuery,
  useCreateShippingProfileMutation,
} from '@/features/catalog/api/catalogApi';
import { Truck, Download, Calendar, Plus, Loader2, PackageCheck, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFulfillmentConfigProps {
  productType: ProductType;
  // Physical props
  shippingRequired: boolean;
  onShippingRequiredChange: (val: boolean) => void;
  weight: number | '';
  onWeightChange: (val: number | '') => void;
  weightUnit: WeightUnit;
  onWeightUnitChange: (val: WeightUnit) => void;
  length: number | '';
  onLengthChange: (val: number | '') => void;
  width: number | '';
  onWidthChange: (val: number | '') => void;
  height: number | '';
  onHeightChange: (val: number | '') => void;
  dimensionUnit: DimensionUnit;
  onDimensionUnitChange: (val: DimensionUnit) => void;
  shippingProfileId: string;
  onShippingProfileIdChange: (val: string) => void;
  isFragile: boolean;
  onIsFragileChange: (val: boolean) => void;
  // Digital props
  digitalDeliveryType: DigitalDeliveryType;
  onDigitalDeliveryTypeChange: (val: DigitalDeliveryType) => void;
  digitalAssetUrl: string;
  onDigitalAssetUrlChange: (val: string) => void;
  downloadLimit: number | '';
  onDownloadLimitChange: (val: number | '') => void;
  downloadExpiryDays: number | '';
  onDownloadExpiryDaysChange: (val: number | '') => void;
  // Service props
  serviceDeliveryType: ServiceDeliveryType;
  onServiceDeliveryTypeChange: (val: ServiceDeliveryType) => void;
  serviceDuration: number | '';
  onServiceDurationChange: (val: number | '') => void;
  serviceDurationUnit: ServiceDurationUnit;
  onServiceDurationUnitChange: (val: ServiceDurationUnit) => void;
}

export function ProductFulfillmentConfig({
  productType,
  shippingRequired,
  onShippingRequiredChange,
  weight,
  onWeightChange,
  weightUnit,
  onWeightUnitChange,
  length,
  onLengthChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  dimensionUnit,
  onDimensionUnitChange,
  shippingProfileId,
  onShippingProfileIdChange,
  isFragile,
  onIsFragileChange,
  digitalDeliveryType,
  onDigitalDeliveryTypeChange,
  digitalAssetUrl,
  onDigitalAssetUrlChange,
  downloadLimit,
  onDownloadLimitChange,
  downloadExpiryDays,
  onDownloadExpiryDaysChange,
  serviceDeliveryType,
  onServiceDeliveryTypeChange,
  serviceDuration,
  onServiceDurationChange,
  serviceDurationUnit,
  onServiceDurationUnitChange,
}: ProductFulfillmentConfigProps) {
  const { data: shippingProfiles = [], isLoading: isLoadingProfiles } = useGetShippingProfilesQuery();
  const [createShippingProfile, { isLoading: isCreatingProfile }] = useCreateShippingProfileMutation();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) {
      toast.error('Profile name is required');
      return;
    }

    try {
      const created = await createShippingProfile({
        name: newProfileName.trim(),
        description: newProfileDesc.trim() || undefined,
      }).unwrap();

      toast.success(`Shipping profile "${created.name}" created!`);
      onShippingProfileIdChange(created.id);
      setNewProfileName('');
      setNewProfileDesc('');
      setShowProfileModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create shipping profile.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            {productType === 'PHYSICAL' && <Truck className="w-5 h-5 text-blue-600" />}
            {productType === 'DIGITAL' && <Download className="w-5 h-5 text-blue-600" />}
            {productType === 'SERVICE' && <Calendar className="w-5 h-5 text-blue-600" />}
            <span>Shipping & Fulfillment Configuration</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fulfillment settings tailored for {productType} product delivery
          </p>
        </div>

        <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-wider">
          {productType} Mode
        </span>
      </div>

      {/* Physical Fulfillment Panel */}
      {productType === 'PHYSICAL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-900">Requires Physical Shipping</span>
              <p className="text-[11px] text-slate-400">Customer will be prompted for shipping address at checkout</p>
            </div>
            <input
              type="checkbox"
              checked={shippingRequired}
              onChange={(e) => onShippingRequiredChange(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </div>

          {shippingRequired && (
            <div className="space-y-4">
              {/* Weight Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Package Weight
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="e.g. 0.75"
                      value={weight}
                      onChange={(e) => onWeightChange(e.target.value !== '' ? Number(e.target.value) : '')}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                    />
                    <select
                      value={weightUnit}
                      onChange={(e) => onWeightUnitChange(e.target.value as WeightUnit)}
                      className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="KG">kg</option>
                      <option value="G">g</option>
                      <option value="LB">lb</option>
                      <option value="OZ">oz</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Shipping Profile</span>
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(true)}
                      className="text-blue-600 text-[11px] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> New Profile
                    </button>
                  </label>

                  {isLoadingProfiles ? (
                    <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
                  ) : (
                    <select
                      value={shippingProfileId}
                      onChange={(e) => onShippingProfileIdChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
                    >
                      <option value="">-- Default Store Shipping Profile --</option>
                      {shippingProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Dimensions Row */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Dimensions (Length &times; Width &times; Height)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Length"
                    value={length}
                    onChange={(e) => onLengthChange(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Width"
                    value={width}
                    onChange={(e) => onWidthChange(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Height"
                    value={height}
                    onChange={(e) => onHeightChange(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                  />
                  <select
                    value={dimensionUnit}
                    onChange={(e) => onDimensionUnitChange(e.target.value as DimensionUnit)}
                    className="px-2 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="CM">cm</option>
                    <option value="M">m</option>
                    <option value="IN">in</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-fragile"
                  checked={isFragile}
                  onChange={(e) => onIsFragileChange(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label htmlFor="is-fragile" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Fragile Item (Requires Special Packaging / Handling)
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Digital Delivery Panel */}
      {productType === 'DIGITAL' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            Physical shipping is disabled for Digital products. Customers will receive delivery access upon checkout.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Digital Delivery Method
              </label>
              <select
                value={digitalDeliveryType}
                onChange={(e) => onDigitalDeliveryTypeChange(e.target.value as DigitalDeliveryType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              >
                <option value="DOWNLOAD">Instant File Download</option>
                <option value="ACCESS_LINK">Secure Access Link / Portal</option>
                <option value="LICENSE_KEY">License Key / Serial Code</option>
                <option value="EXTERNAL">External Third-Party Link</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Download / Asset URL
              </label>
              <input
                type="text"
                placeholder="https://cdn.easycommerce.io/assets/product-file.zip"
                value={digitalAssetUrl}
                onChange={(e) => onDigitalAssetUrlChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Download Limit per Purchase
              </label>
              <input
                type="number"
                placeholder="e.g. 5 (Leave blank for Unlimited)"
                value={downloadLimit}
                onChange={(e) => onDownloadLimitChange(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Download Expiry (Days)
              </label>
              <input
                type="number"
                placeholder="e.g. 30 (Leave blank for Never)"
                value={downloadExpiryDays}
                onChange={(e) => onDownloadExpiryDaysChange(e.target.value !== '' ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Service Fulfillment Panel */}
      {productType === 'SERVICE' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900">
            Configure service delivery parameters. Physical shipping is not required for services.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Service Delivery Type
              </label>
              <select
                value={serviceDeliveryType}
                onChange={(e) => onServiceDeliveryTypeChange(e.target.value as ServiceDeliveryType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white"
              >
                <option value="ONLINE">Online (Zoom / Meet / Remote)</option>
                <option value="ONSITE">On-Site (At Client Location)</option>
                <option value="LOCATION">Store / Business Location</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Service Duration
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="e.g. 60"
                  value={serviceDuration}
                  onChange={(e) => onServiceDurationChange(e.target.value !== '' ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
                <select
                  value={serviceDurationUnit}
                  onChange={(e) => onServiceDurationUnitChange(e.target.value as ServiceDurationUnit)}
                  className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="MINUTES">Minutes</option>
                  <option value="HOURS">Hours</option>
                  <option value="DAYS">Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for New Shipping Profile */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Create New Shipping Profile</h3>

            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Heavy Goods Delivery"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details..."
                  value={newProfileDesc}
                  onChange={(e) => setNewProfileDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProfile}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
