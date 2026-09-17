'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Search, Check, Phone, MapPin, Mail, User } from 'lucide-react';
import type { Supplier } from '../api/purchaseApi';

interface SupplierSelectDropdownProps {
  suppliers: Supplier[];
  value: string;
  onChange: (supplierId: string, supplier?: Supplier) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function SupplierSelectDropdown({
  suppliers = [],
  value,
  onChange,
  placeholder = 'Choose a supplier...',
  disabled = false,
  className = '',
  size = 'md',
}: SupplierSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === value);
  }, [suppliers, value]);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const q = search.toLowerCase().trim();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.location && s.location.toLowerCase().includes(q)),
    );
  }, [suppliers, search]);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(340, suppliers.length * 56 + 60);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;
    let left = rect.left;
    let width = Math.max(rect.width, 280);

    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    if (left < 12) left = 12;

    setCoords({ top, left, width, placeAbove });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setSearch('');
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    document.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (s: Supplier) => {
    onChange(s.id, s);
    setIsOpen(false);
  };

  const heightClass = size === 'sm' ? 'py-1.5 px-3 text-xs' : 'py-2.5 px-3.5 text-xs';

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full ${heightClass} bg-white hover:bg-slate-50/80 border rounded-xl transition-all duration-150 flex items-center justify-between text-left cursor-pointer select-none group focus:outline-hidden ${
          isOpen
            ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              selectedSupplier
                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0 truncate">
            {selectedSupplier ? (
              <div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-slate-800 text-xs truncate">
                    {selectedSupplier.name}
                  </span>
                  {selectedSupplier.status === 'ACTIVE' && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                      Active
                    </span>
                  )}
                </div>
                {(selectedSupplier.contactPerson || selectedSupplier.phone || selectedSupplier.location) && (
                  <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                    {[selectedSupplier.contactPerson, selectedSupplier.phone, selectedSupplier.location]
                      .filter(Boolean)
                      .join(' • ')}
                  </p>
                )}
              </div>
            ) : (
              <span className="font-medium text-slate-400">{placeholder}</span>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Popover Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop Dismiss */}
            <div
              className="fixed inset-0 z-[99998] bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Card */}
            <div
              role="listbox"
              style={{
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                transform: coords.placeAbove ? 'translateY(-100%)' : 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[99999] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 select-none text-left"
            >
              {/* Search Bar */}
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search suppliers by name, phone, city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Suppliers List */}
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
                {filteredSuppliers.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400 font-medium">
                    No suppliers found matching &quot;{search}&quot;
                  </div>
                ) : (
                  filteredSuppliers.map((supplier) => {
                    const isSelected = supplier.id === value;

                    return (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => handleSelect(supplier)}
                        className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between group cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-200 text-blue-900 font-bold'
                            : 'border-transparent hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs truncate font-bold text-slate-800">
                                {supplier.name}
                              </span>
                              {supplier.status === 'ACTIVE' && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 group-hover:text-slate-500 truncate leading-tight mt-0.5">
                              {supplier.contactPerson && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <User className="w-2.5 h-2.5 shrink-0" />
                                  {supplier.contactPerson}
                                </span>
                              )}
                              {supplier.phone && (
                                <span className="flex items-center gap-0.5 shrink-0">
                                  <Phone className="w-2.5 h-2.5 shrink-0" />
                                  {supplier.phone}
                                </span>
                              )}
                              {supplier.location && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  {supplier.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
