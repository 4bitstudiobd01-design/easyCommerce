'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  fallbackLabel?: string;
  triggerMaxChars?: number;
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  icon,
  size = 'md',
  fallbackLabel,
  triggerMaxChars,
}: CustomDropdownProps) {
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

  const selectedOption = useMemo(() => {
    const found = options.find((opt) => opt.value === value);
    if (found) return found;
    if (value && fallbackLabel) {
      return { value, label: fallbackLabel };
    }
    return undefined;
  }, [options, value, fallbackLabel]);

  const displayLabel = useMemo(() => {
    if (!selectedOption) return '';
    const maxChars = triggerMaxChars ?? (size === 'sm' ? 18 : undefined);
    if (maxChars && selectedOption.label.length > maxChars) {
      return selectedOption.label.slice(0, maxChars).trim() + '…';
    }
    return selectedOption.label;
  }, [selectedOption, triggerMaxChars, size]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtitle && opt.subtitle.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q)),
    );
  }, [options, searchable, search]);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = Math.min(320, options.length * 48 + (searchable ? 52 : 16));
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;
    let left = rect.left;
    let width = Math.max(rect.width, 220);

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

    if (searchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const heightClass = size === 'sm' ? 'py-1.5 px-2.5 text-xs' : 'py-2.5 px-3.5 text-xs';

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full ${heightClass} bg-slate-50 hover:bg-slate-100/80 border rounded-xl transition-all duration-150 flex items-center justify-between text-left cursor-pointer select-none group focus:outline-hidden ${
          isOpen
            ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedOption?.icon ? (
            <div className="shrink-0">{selectedOption.icon}</div>
          ) : icon ? (
            <div className="shrink-0">{icon}</div>
          ) : null}

          <div className="min-w-0 truncate">
            {selectedOption ? (
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="font-bold text-slate-900 truncate"
                  title={selectedOption.label}
                >
                  {displayLabel}
                </span>
                {selectedOption.badge && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md shrink-0 ${
                      selectedOption.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedOption.badge}
                  </span>
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
              {/* Search Bar if enabled */}
              {searchable && (
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder={searchPlaceholder}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
                {filteredOptions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((opt) => {
                    const isSelected = opt.value === value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelect(opt.value)}
                        className={`w-full px-2.5 py-2 rounded-xl text-left transition flex items-center justify-between group cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50/90 border-blue-200 text-blue-900 font-bold'
                            : 'border-transparent hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          {opt.icon && (
                            <div className="shrink-0">{opt.icon}</div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs truncate font-bold">
                                {opt.label}
                              </span>
                              {opt.badge && (
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md shrink-0 ${
                                    opt.badgeColor || 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {opt.badge}
                                </span>
                              )}
                            </div>
                            {opt.subtitle && (
                              <p className="text-[10px] text-slate-400 group-hover:text-slate-500 truncate leading-tight mt-0.5">
                                {opt.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
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
