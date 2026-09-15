'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Plus, Store as StoreIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useListPathaoStoresQuery,
  useCreatePathaoStoreMutation,
  useGetPathaoCitiesQuery,
  useGetPathaoZonesQuery,
  useGetPathaoAreasQuery,
} from '../api/logisticsApi';

const inputClass =
  'w-full h-9 px-3 rounded-lg border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400';
const labelClass = 'block text-[11px] font-bold text-slate-600 mb-1';

/**
 * Pathao "Store" (pickup point) management, shown only inside the Pathao
 * courier's Configuration tab. Pathao requires a numeric store_id to book any
 * parcel — this lets a merchant create one and see existing ones without
 * copying an id in from Pathao's own panel.
 *
 * Fetching cities/zones/areas here only runs once credentials exist and are
 * enabled (the parent only mounts this once `courier.hasCredentials` is
 * true), matching what the backend requires to authenticate the lookup.
 */
export function PathaoStoresSection() {
  const { data: stores, isLoading: isLoadingStores } = useListPathaoStoresQuery();
  const [createStore, { isLoading: isCreating }] = useCreatePathaoStoreMutation();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [areaId, setAreaId] = useState<number | ''>('');

  const { data: cities, isLoading: isLoadingCities } = useGetPathaoCitiesQuery(undefined, {
    skip: !showForm,
  });
  const { data: zones, isLoading: isLoadingZones } = useGetPathaoZonesQuery(Number(cityId), {
    skip: !showForm || !cityId,
  });
  const { data: areas, isLoading: isLoadingAreas } = useGetPathaoAreasQuery(Number(zoneId), {
    skip: !showForm || !zoneId,
  });

  const resetForm = () => {
    setName('');
    setContactName('');
    setContactNumber('');
    setAddress('');
    setCityId('');
    setZoneId('');
    setAreaId('');
  };

  const isValid =
    name.trim().length >= 3 &&
    contactName.trim().length >= 3 &&
    /^01[3-9]\d{8}$/.test(contactNumber) &&
    address.trim().length >= 15 &&
    cityId &&
    zoneId &&
    areaId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error('Fill in every field correctly before submitting.');
      return;
    }
    try {
      const result = await createStore({
        name: name.trim(),
        contactName: contactName.trim(),
        contactNumber,
        address: address.trim(),
        cityId: Number(cityId),
        zoneId: Number(zoneId),
        areaId: Number(areaId),
      }).unwrap();
      toast.success(result.message || `"${result.storeName}" submitted to Pathao.`);
      resetForm();
      setShowForm(false);
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Could not create this store.';
      toast.error(message);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">Pathao Stores</h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Create store
          </button>
        )}
      </div>

      {/* Existing stores */}
      {isLoadingStores ? (
        <div className="h-16 rounded-xl bg-slate-50 border border-slate-100 animate-pulse" />
      ) : stores && stores.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {stores.map((store) => (
            <li
              key={store.storeId}
              className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200"
            >
              <StoreIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-bold text-slate-900 truncate">{store.storeName}</p>
                  {store.isActive && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">{store.storeAddress}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Store ID: {store.storeId}
                  {!store.isActive && ' · pending Pathao approval'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !showForm && (
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 mb-4">
            No Pathao stores yet. Create one to get a Store ID for the Store ID credential field
            above.
          </p>
        )
      )}

      {/* Create-store form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl border border-slate-200">
          <div>
            <label className={labelClass} htmlFor="pathao-store-name">Store name</label>
            <input
              id="pathao-store-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Warehouse"
              maxLength={50}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="pathao-contact-name">Contact name</label>
              <input
                id="pathao-contact-name"
                className={inputClass}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact person"
                maxLength={50}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="pathao-contact-number">Contact phone</label>
              <input
                id="pathao-contact-number"
                className={inputClass}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="pathao-address">Pickup address</label>
            <input
              id="pathao-address"
              className={inputClass}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, road, area, city"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass} htmlFor="pathao-city">City</label>
              <select
                id="pathao-city"
                className={inputClass}
                value={cityId}
                disabled={isLoadingCities}
                onChange={(e) => {
                  setCityId(e.target.value ? Number(e.target.value) : '');
                  setZoneId('');
                  setAreaId('');
                }}
              >
                <option value="">{isLoadingCities ? 'Loading…' : 'Select'}</option>
                {cities?.map((c) => (
                  <option key={c.cityId} value={c.cityId}>
                    {c.cityName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pathao-zone">Zone</label>
              <select
                id="pathao-zone"
                className={inputClass}
                value={zoneId}
                disabled={!cityId || isLoadingZones}
                onChange={(e) => {
                  setZoneId(e.target.value ? Number(e.target.value) : '');
                  setAreaId('');
                }}
              >
                <option value="">{isLoadingZones ? 'Loading…' : 'Select'}</option>
                {zones?.map((z) => (
                  <option key={z.zoneId} value={z.zoneId}>
                    {z.zoneName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="pathao-area">Area</label>
              <select
                id="pathao-area"
                className={inputClass}
                value={areaId}
                disabled={!zoneId || isLoadingAreas}
                onChange={(e) => setAreaId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">{isLoadingAreas ? 'Loading…' : 'Select'}</option>
                {areas?.map((a) => (
                  <option key={a.areaId} value={a.areaId}>
                    {a.areaName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            Pathao approves a new store before it can book parcels — this can take about an hour
            in production (sandbox stores are usually active immediately).
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isCreating || !isValid}
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Create store
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="h-9 px-4 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
