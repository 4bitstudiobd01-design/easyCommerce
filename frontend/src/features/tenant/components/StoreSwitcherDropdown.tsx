'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGetMyStoresQuery, Store } from '../api/tenantApi';
import { ChevronDown, Plus, Check, Store as StoreIcon, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface StoreSwitcherDropdownProps {
  onSelectStore?: (store: Store) => void;
  onCreateNewStore?: () => void;
}

export function StoreSwitcherDropdown({
  onSelectStore,
  onCreateNewStore,
}: StoreSwitcherDropdownProps) {
  const { data: stores = [], isLoading } = useGetMyStoresQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize active store with localStorage or default to first store
  useEffect(() => {
    if (stores.length > 0) {
      const savedStoreId = localStorage.getItem('easycommerce_active_store_id');
      const foundStore = stores.find((s) => s.id === savedStoreId);
      const selected = foundStore || stores[0];
      setActiveStore(selected);
      if (selected && (!savedStoreId || !foundStore)) {
        localStorage.setItem('easycommerce_active_store_id', selected.id);
        // If we had an invalid store ID in localStorage, we must reload the page 
        // to reset the headers in RTK Query which might have cached the old ID
        if (savedStoreId && !foundStore) {
          window.location.reload();
        }
      }
    }
  }, [stores]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStore = (store: Store) => {
    setActiveStore(store);
    localStorage.setItem('easycommerce_active_store_id', store.id);
    setIsOpen(false);
    toast.success(`Switched active store to "${store.name}"!`);

    if (onSelectStore) {
      onSelectStore(store);
    }

    // Refresh page to trigger RTK Query refetch for all endpoints with new x-store-id header
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60 animate-pulse flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-700" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-700 rounded w-24" />
          <div className="h-3 bg-slate-700/60 rounded w-32" />
        </div>
      </div>
    );
  }

  const currentStoreName = activeStore?.name || 'My Store';
  const currentDomain = activeStore?.slug
    ? `${activeStore.slug}.easycommerce.app`
    : 'easycommerce.app';
  const initialLetter = currentStoreName.charAt(0).toUpperCase();

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* ACTIVE STORE TRIGGER WIDGET (Matching user screenshot) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 rounded-2xl transition-all duration-200 text-left flex items-center justify-between group shadow-sm"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* STORE LOGO / INITIAL AVATAR BOX */}
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 font-black text-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            {activeStore?.logo ? (
              <img
                src={activeStore.logo}
                alt={currentStoreName}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span>{initialLetter}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-100 truncate tracking-tight">
              {currentStoreName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {currentDomain}
              </span>
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* DROPDOWN POPUP MENU */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 flex items-center justify-between">
            <span>Your Stores ({stores.length})</span>
            <Sparkles className="w-3 h-3 text-purple-400" />
          </div>

          {/* STORE ITEMS LIST */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {stores.map((store) => {
              const isSelected = activeStore?.id === store.id;
              const storeInitial = store.name.charAt(0).toUpperCase();

              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => handleSelectStore(store)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {storeInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate">{store.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {store.slug}.easycommerce.app
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-blue-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* CREATE NEW STORE BUTTON */}
          <div className="pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onCreateNewStore) {
                  onCreateNewStore();
                }
              }}
              className="w-full p-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Create New Store</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
