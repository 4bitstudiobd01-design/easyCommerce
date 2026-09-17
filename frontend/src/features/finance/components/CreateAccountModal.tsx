'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  Landmark,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { FinanceAccountType, useCreateAccountMutation } from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const BD_BANKS = [
  'City Bank Ltd',
  'BRAC Bank PLC',
  'Dutch-Bangla Bank Ltd (DBBL)',
  'Eastern Bank Ltd (EBL)',
  'Islami Bank Bangladesh Ltd',
  'Mutual Trust Bank (MTB)',
  'Prime Bank Ltd',
  'Southeast Bank Ltd',
  'Standard Chartered Bangladesh',
  'Sonali Bank Ltd',
  'Dhaka Bank Ltd',
  'UCB (United Commercial Bank)',
  'Other Commercial Bank',
];

const DIGITAL_WALLETS = [
  { name: 'bKash Merchant', provider: 'bKash', color: 'text-pink-600 border-pink-200 bg-pink-50' },
  { name: 'bKash Personal', provider: 'bKash', color: 'text-pink-600 border-pink-200 bg-pink-50' },
  { name: 'Nagad Merchant', provider: 'Nagad', color: 'text-orange-600 border-orange-200 bg-orange-50' },
  { name: 'Nagad Personal', provider: 'Nagad', color: 'text-orange-600 border-orange-200 bg-orange-50' },
  { name: 'Rocket (DBBL)', provider: 'Rocket', color: 'text-purple-600 border-purple-200 bg-purple-50' },
  { name: 'Upay', provider: 'Upay', color: 'text-blue-600 border-blue-200 bg-blue-50' },
];

const PAYMENT_GATEWAYS = [
  'SSLCommerz',
  'Shurjopay',
  'AamarPay',
  'PortPOS',
  'Foster Payments',
  'Stripe',
  'PayPal',
];

export function CreateAccountModal({ isOpen, onClose }: Props) {
  const [type, setType] = useState<FinanceAccountType>('BANK');
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankOrProviderName, setBankOrProviderName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [walletType, setWalletType] = useState('MERCHANT');
  const [startingBalance, setStartingBalance] = useState('0');
  const [isDefault, setIsDefault] = useState(false);
  const [notes, setNotes] = useState('');

  const [createAccount, { isLoading }] = useCreateAccountMutation();

  const handleSelectType = (selectedType: FinanceAccountType) => {
    setType(selectedType);
    if (selectedType === 'CASH' && !name) {
      setName('Main Cash Drawer');
      setBankOrProviderName('Cash in Hand');
    } else if (selectedType === 'DIGITAL_WALLET' && !bankOrProviderName) {
      setBankOrProviderName('bKash');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter an account name.');
      return;
    }

    let resolvedAccountNumber = accountNumber.trim();
    let resolvedProviderName = bankOrProviderName.trim();
    const notesParts: string[] = [];

    if (notes.trim()) notesParts.push(notes.trim());

    if (type === 'CARD') {
      if (cardLast4) {
        resolvedAccountNumber = `•••• •••• •••• ${cardLast4}`;
      }
      if (cardHolder) notesParts.push(`Cardholder: ${cardHolder}`);
    } else if (type === 'BANK' && branchName) {
      notesParts.push(`Branch: ${branchName}`);
    } else if (type === 'DIGITAL_WALLET') {
      notesParts.push(`Wallet Type: ${walletType}`);
    }

    try {
      await createAccount({
        name: name.trim(),
        type,
        accountNumber: resolvedAccountNumber || undefined,
        bankOrProviderName: resolvedProviderName || undefined,
        startingBalance: Number(startingBalance) || 0,
        currency: 'BDT',
        isDefault,
        notes: notesParts.length > 0 ? notesParts.join(' | ') : undefined,
      }).unwrap();

      toast.success('Account created successfully.');
      onClose();

      // Reset form
      setName('');
      setType('BANK');
      setAccountNumber('');
      setBankOrProviderName('');
      setBranchName('');
      setCardHolder('');
      setCardLast4('');
      setWalletType('MERCHANT');
      setStartingBalance('0');
      setIsDefault(false);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Financial Account"
      subtitle="Create bank account, corporate card, cash counter, or mobile gateway"
      icon={<Landmark className="w-5 h-5 text-blue-600" />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Account Type Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Account Type *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'BANK', label: 'Bank Account', icon: Landmark, color: 'text-blue-600 bg-blue-50 border-blue-200' },
              { id: 'CARD', label: 'Credit / Card', icon: CreditCard, color: 'text-purple-600 bg-purple-50 border-purple-200' },
              { id: 'CASH', label: 'Cash Drawer', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
              { id: 'DIGITAL_WALLET', label: 'Mobile Wallet', icon: Smartphone, color: 'text-pink-600 bg-pink-50 border-pink-200' },
              { id: 'PAYMENT_GATEWAY', label: 'Online Gateway', icon: Globe, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = type === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectType(item.id as FinanceAccountType)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields Based On Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Account Display Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                type === 'BANK'
                  ? 'e.g. City Bank - Corporate A/C'
                  : type === 'CARD'
                  ? 'e.g. Corporate Expense Card'
                  : type === 'CASH'
                  ? 'e.g. Petty Cash / Sales Counter'
                  : type === 'DIGITAL_WALLET'
                  ? 'e.g. Main bKash Merchant'
                  : 'e.g. SSLCommerz Gateway'
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Provider / Bank Name */}
          {type === 'BANK' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                list="bd-banks-list"
                required
                value={bankOrProviderName}
                onChange={(e) => setBankOrProviderName(e.target.value)}
                placeholder="Select or enter bank name..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <datalist id="bd-banks-list">
                {BD_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          )}

          {type === 'CARD' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Card Brand / Issuing Bank *
              </label>
              <input
                type="text"
                required
                value={bankOrProviderName}
                onChange={(e) => setBankOrProviderName(e.target.value)}
                placeholder="e.g. Visa - City Bank, Mastercard - BRAC"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          {type === 'DIGITAL_WALLET' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Wallet Provider *
              </label>
              <select
                value={bankOrProviderName}
                onChange={(e) => setBankOrProviderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket (DBBL)</option>
                <option value="Upay">Upay</option>
                <option value="Cellfin">Cellfin (IBBL)</option>
                <option value="SureCash">SureCash</option>
                <option value="Other MFS">Other Wallet</option>
              </select>
            </div>
          )}

          {type === 'PAYMENT_GATEWAY' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Gateway Provider *
              </label>
              <input
                type="text"
                list="gateways-list"
                required
                value={bankOrProviderName}
                onChange={(e) => setBankOrProviderName(e.target.value)}
                placeholder="Select or enter gateway..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <datalist id="gateways-list">
                {PAYMENT_GATEWAYS.map((gw) => (
                  <option key={gw} value={gw} />
                ))}
              </datalist>
            </div>
          )}

          {type === 'CASH' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Cash Custodian / Location
              </label>
              <input
                type="text"
                value={bankOrProviderName}
                onChange={(e) => setBankOrProviderName(e.target.value)}
                placeholder="e.g. Head Office Cashier, Store Outlet 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Row 2 of Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {type === 'BANK' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1102938472901"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Branch Name & Routing
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Gulshan Branch / Routing: 22526"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {type === 'CARD' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Last 4 Digits of Card *
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4021"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Name embossed on card"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {type === 'DIGITAL_WALLET' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Wallet Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Wallet Type
                </label>
                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="MERCHANT">Merchant Account</option>
                  <option value="PERSONAL">Personal Account</option>
                  <option value="AGENT">Agent Account</option>
                </select>
              </div>
            </>
          )}

          {type === 'PAYMENT_GATEWAY' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Store / Merchant ID
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. easycomerz_live"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {type === 'CASH' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Register Code / Tag
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. POS-COUNTER-01"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Starting Balance (BDT)
            </label>
            <input
              type="number"
              step="0.01"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Set as Primary Default Checkbox */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Set as Default Primary Account
              </span>
              <span className="text-xs text-slate-500 block">
                Automatic incoming payments and settlements will route to this account by default.
              </span>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Notes / Internal Remarks
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Branch details, authorized personnel, or internal notes..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
