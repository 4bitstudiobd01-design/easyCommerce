'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Landmark,
  Wallet,
  CreditCard,
  Globe,
  ChevronDown,
  Search,
  Check,
  Ban,
  Coins,
} from 'lucide-react';
import { FinanceAccount, FinanceAccountType } from '../api/financeApi';

interface AccountSelectDropdownProps {
  accounts: FinanceAccount[];
  value: string; // accountId or '' for unassigned
  onChange: (accountId: string, account?: FinanceAccount) => void;
  allowUnassigned?: boolean;
  unassignedLabel?: string;
  unassignedSubtitle?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function formatBalance(amount: string | number | undefined): string {
  const num = Number(amount || 0);
  return '৳' + num.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AccountSelectDropdown({
  accounts = [],
  value,
  onChange,
  allowUnassigned = true,
  unassignedLabel = 'Direct / Unassigned',
  unassignedSubtitle = 'Record payment without depositing into a specific ledger account',
  placeholder = 'Select receiving account...',
  disabled = false,
  className = '',
}: AccountSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    placeAbove: false,
  });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === value);
  }, [accounts, value]);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = placeAbove ? rect.top - 6 : rect.bottom + 6;
    let left = rect.left;
    let width = rect.width;

    if (width < 320) width = 320;
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    if (left < 12) left = 12;

    setCoords({
      top,
      left,
      width,
      placeAbove,
    });
  };

  const handleToggle = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
    } else {
      calculatePosition();
      setSearchQuery('');
      setSelectedTypeFilter('ALL');
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

    // Auto focus search input on open
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

  const getAccountIcon = (type?: FinanceAccountType) => {
    switch (type) {
      case 'BANK':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'CASH':
        return <Landmark className="w-4 h-4 text-slate-700" />;
      case 'DIGITAL_WALLET':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-slate-700" />;
      case 'PAYMENT_GATEWAY':
        return <Globe className="w-4 h-4 text-blue-600" />;
      default:
        return <Coins className="w-4 h-4 text-slate-600" />;
    }
  };

  const getAccountTypeLabel = (type?: FinanceAccountType) => {
    switch (type) {
      case 'BANK':
        return 'Bank';
      case 'CASH':
        return 'Cash';
      case 'DIGITAL_WALLET':
        return 'Mobile Wallet';
      case 'CARD':
        return 'Card';
      case 'PAYMENT_GATEWAY':
        return 'Gateway';
      default:
        return type || 'Account';
    }
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        (acc.accountNumber && acc.accountNumber.toLowerCase().includes(q)) ||
        (acc.bankOrProviderName && acc.bankOrProviderName.toLowerCase().includes(q)) ||
        acc.type.toLowerCase().includes(q);

      const matchesType =
        selectedTypeFilter === 'ALL' ||
        acc.type === selectedTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchQuery, selectedTypeFilter]);

  const handleSelectAccount = (acc?: FinanceAccount) => {
    if (acc) {
      onChange(acc.id, acc);
    } else {
      onChange('', undefined);
    }
    setIsOpen(false);
  };

  const accountTypes: { label: string; value: string }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Bank', value: 'BANK' },
    { label: 'Cash', value: 'CASH' },
    { label: 'Wallet', value: 'DIGITAL_WALLET' },
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 border rounded-xl transition-all duration-150 flex items-center justify-between text-left cursor-pointer select-none group focus:outline-hidden ${
          isOpen
            ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* Account Icon */}
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0">
            {selectedAccount ? (
              getAccountIcon(selectedAccount.type)
            ) : value === '' ? (
              <Ban className="w-4 h-4 text-slate-400" />
            ) : (
              <Coins className="w-4 h-4 text-slate-400" />
            )}
          </div>

          {/* Account Info */}
          <div className="min-w-0">
            {selectedAccount ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 truncate">
                    {selectedAccount.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200/70 text-slate-700 rounded-md shrink-0">
                    {getAccountTypeLabel(selectedAccount.type)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {selectedAccount.accountNumber
                    ? `A/C: ${selectedAccount.accountNumber}`
                    : selectedAccount.bankOrProviderName || 'Active Ledger Account'}
                </p>
              </div>
            ) : value === '' ? (
              <div>
                <p className="text-xs font-bold text-slate-700 truncate">
                  {unassignedLabel}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  Direct ledger / no specific account
                </p>
              </div>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Balance Badge & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedAccount && (
            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-1 rounded-lg">
              {formatBalance(selectedAccount.currentBalance)}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Menu Portal */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop Dismiss */}
            <div
              className="fixed inset-0 z-[99998] bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Container */}
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
              {/* Search Bar Header */}
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search accounts by name or number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1">
                  {accountTypes.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedTypeFilter(t.value)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer ${
                        selectedTypeFilter === t.value
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 divide-y-0">
                {/* 1. Direct / Unassigned Option */}
                {allowUnassigned && selectedTypeFilter === 'ALL' && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSelectAccount(undefined)}
                    className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between group cursor-pointer border ${
                      value === ''
                        ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                        : 'border-transparent hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        <Ban className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight text-slate-800">
                          {unassignedLabel}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {unassignedSubtitle}
                        </p>
                      </div>
                    </div>
                    {value === '' && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                )}

                {/* 2. Account Options */}
                {filteredAccounts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    No accounts match &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  filteredAccounts.map((acc) => {
                    const isSelected = value === acc.id;

                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccount(acc)}
                        className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between group cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                            : 'border-transparent hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-blue-100/60 border-blue-200'
                                : 'bg-slate-100 border-slate-200'
                            }`}
                          >
                            {getAccountIcon(acc.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900 truncate">
                                {acc.name}
                              </span>
                              {acc.isDefault && (
                                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-md">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              {getAccountTypeLabel(acc.type)}
                              {acc.accountNumber ? ` • ${acc.accountNumber}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs font-black text-slate-800">
                            {formatBalance(acc.currentBalance)}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer info */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                <span>{accounts.length} Total Accounts</span>
                <span className="text-blue-600 font-bold">BitCommerce Finance</span>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
