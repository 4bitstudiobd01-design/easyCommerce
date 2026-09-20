'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Receipt,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  FinanceCardDrilldown,
  AccountMonthlyBreakdownItem,
  FinanceCardDrilldownAccount,
} from '../api/financeApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cardKey: string | null;
  cardData?: FinanceCardDrilldown;
  allAccountsBreakdown?: AccountMonthlyBreakdownItem[];
  selectedMonth?: number;
  selectedYear?: number;
  selectedAccountId?: string | null;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMoney(amount: number | string | undefined | null) {
  const val = Number(amount || 0);
  return `৳${val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function FinanceCardDetailModal({
  isOpen,
  onClose,
  cardKey,
  cardData,
  allAccountsBreakdown = [],
  selectedMonth,
  selectedYear,
  selectedAccountId,
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'TRANSACTIONS'>('ACCOUNTS');

  if (!isOpen || !cardKey) return null;

  const currentMonthIdx = selectedMonth && selectedMonth > 0 ? selectedMonth - 1 : new Date().getMonth();
  const monthName = MONTH_NAMES[currentMonthIdx];
  const lastMonthName = MONTH_NAMES[(currentMonthIdx + 11) % 12];
  const year = selectedYear || new Date().getFullYear();

  // If a specific account was clicked from the Financial Accounts widget
  const singleAccount = selectedAccountId
    ? allAccountsBreakdown.find((a) => a.accountId === selectedAccountId)
    : null;

  // Derive accounts list depending on whether this is an account breakdown or a card metric
  const accountsToDisplay: (FinanceCardDrilldownAccount | AccountMonthlyBreakdownItem)[] = useMemo(() => {
    if (singleAccount) {
      return [singleAccount];
    }

    if (cardKey === 'CASH_BANK' || cardKey === 'ACCOUNTS') {
      return allAccountsBreakdown;
    }

    if (cardData?.byAccount && cardData.byAccount.length > 0) {
      return cardData.byAccount;
    }

    // Fallback: If cardData has no specific account breakdown (e.g. general cost center), return accounts that had activity
    return allAccountsBreakdown.filter((a) => a.thisMonthDebit > 0 || a.thisMonthCredit > 0);
  }, [singleAccount, cardKey, cardData, allAccountsBreakdown]);

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accountsToDisplay;
    const q = searchTerm.toLowerCase();
    return accountsToDisplay.filter((acc) => {
      const name = acc.accountName.toLowerCase();
      const num = acc.accountNumber?.toLowerCase() || '';
      const bank = acc.bankOrProviderName?.toLowerCase() || '';
      return name.includes(q) || num.includes(q) || bank.includes(q);
    });
  }, [accountsToDisplay, searchTerm]);

  // Summary figures
  const isRevenue = cardData?.isRevenueType ?? (cardKey === 'REVENUE' || cardKey === 'GROSS_PROFIT');

  const totalThisMonthDebit = useMemo(() => {
    return accountsToDisplay.reduce((sum, a) => sum + Number(a.thisMonthDebit || 0), 0);
  }, [accountsToDisplay]);

  const totalThisMonthCredit = useMemo(() => {
    return accountsToDisplay.reduce((sum, a) => sum + Number(a.thisMonthCredit || 0), 0);
  }, [accountsToDisplay]);

  const totalLastMonthAmount = useMemo(() => {
    if (singleAccount) {
      return singleAccount.lastMonthBalance;
    }
    if (cardData?.lastMonthTotal !== undefined) {
      return cardData.lastMonthTotal;
    }
    return accountsToDisplay.reduce((sum, a) => {
      const lastAmt = 'lastMonthAmount' in a ? a.lastMonthAmount : a.lastMonthBalance;
      return sum + Number(lastAmt || 0);
    }, 0);
  }, [singleAccount, cardData, accountsToDisplay]);

  const totalThisMonthAmount = useMemo(() => {
    if (singleAccount) {
      return singleAccount.currentBalance;
    }
    if (cardData?.thisMonthTotal !== undefined) {
      return cardData.thisMonthTotal;
    }
    return isRevenue ? totalThisMonthCredit : totalThisMonthDebit;
  }, [singleAccount, cardData, isRevenue, totalThisMonthCredit, totalThisMonthDebit]);

  const growthPercent = totalLastMonthAmount > 0
    ? ((totalThisMonthAmount - totalLastMonthAmount) / totalLastMonthAmount) * 100
    : 0;

  const displayTitle = singleAccount
    ? `${singleAccount.accountName} - Monthly Audit`
    : cardData?.title || cardKey.replace(/_/g, ' ');

  const displaySubtitle = singleAccount
    ? `${singleAccount.bankOrProviderName || singleAccount.accountType} • Account Number: ${singleAccount.accountNumber || 'N/A'}`
    : cardData?.subtitle || `Detailed debits, credits and last month comparisons across all bank & cash accounts`;

  const getAccountIcon = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('BANK')) return <Landmark className="w-4 h-4 text-blue-600" />;
    if (t.includes('CASH')) return <Banknote className="w-4 h-4 text-emerald-600" />;
    if (t.includes('WALLET')) return <Smartphone className="w-4 h-4 text-pink-600" />;
    return <CreditCard className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>{monthName} {year}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                vs {lastMonthName} {year}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2">
              {displayTitle}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">
              {displaySubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Metric Highlights Row */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* This Month Total */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {singleAccount ? 'বর্তমান ব্যালেন্স (Current)' : 'এই মাসে মোট (This Month)'}
            </span>
            <p className="text-lg font-black text-slate-900 font-mono tracking-tight mt-0.5">
              {formatMoney(totalThisMonthAmount)}
            </p>
            <span className="text-[10px] font-semibold text-slate-500">
              For {monthName}
            </span>
          </div>

          {/* Last Month Total */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {singleAccount ? 'গত মাসের ব্যালেন্স' : 'গত মাসে ছিল (Last Month)'}
              </span>
            </div>
            <p className="text-lg font-black text-slate-700 font-mono tracking-tight mt-0.5">
              {formatMoney(totalLastMonthAmount)}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              {growthPercent !== 0 && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    growthPercent > 0
                      ? isRevenue ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      : isRevenue ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {growthPercent > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {growthPercent > 0 ? '+' : ''}{growthPercent.toFixed(1)}%
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-medium">vs {lastMonthName}</span>
            </div>
          </div>

          {/* This Month Total Credit */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                মোট Credit (+ Inflow)
              </span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-lg font-black text-emerald-700 font-mono tracking-tight mt-0.5">
              +{formatMoney(totalThisMonthCredit)}
            </p>
            <span className="text-[10px] font-semibold text-emerald-600">একাউন্টে যোগ হয়েছে</span>
          </div>

          {/* This Month Total Debit */}
          <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider block">
                মোট Debit (- Outflow)
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-lg font-black text-rose-700 font-mono tracking-tight mt-0.5">
              -{formatMoney(totalThisMonthDebit)}
            </p>
            <span className="text-[10px] font-semibold text-rose-600">একাউন্ট থেকে খরচ/কাটা</span>
          </div>
        </div>

        {/* Toolbar: Search + Tab Switcher */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>একাউন্ট হিসাব (Accounts Breakdown)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20">
                {accountsToDisplay.length}
              </span>
            </button>

            {cardData?.recentTxns && cardData.recentTxns.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('TRANSACTIONS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'TRANSACTIONS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>সাম্প্রতিক লেনদেন ({cardData.recentTxns.length})</span>
              </button>
            )}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search account name, number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'ACCOUNTS' ? (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                <span>
                  কোন একাউন্টে এই মাসে কত টাকা Debit / Credit হয়েছে এবং গত মাসে কত ছিল:
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Showing {filteredAccounts.length} of {accountsToDisplay.length} Accounts
                </span>
              </div>

              {filteredAccounts.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  কোনো একাউন্ট পাওয়া যায়নি।
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                      <tr>
                        <th className="px-4 py-3">Account Name &amp; Details</th>
                        <th className="px-4 py-3 text-right">Credit (+ Inflow)</th>
                        <th className="px-4 py-3 text-right">Debit (- Outflow)</th>
                        <th className="px-4 py-3 text-right">Net Activity</th>
                        <th className="px-4 py-3 text-right">
                          গত মাসে ছিল ({lastMonthName})
                        </th>
                        <th className="px-4 py-3 text-right">
                          বর্তমান ব্যালেন্স
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAccounts.map((acc, idx) => {
                        const accDebit = Number(acc.thisMonthDebit || 0);
                        const accCredit = Number(acc.thisMonthCredit || 0);
                        const netActivity = accCredit - accDebit;

                        const lastMonthVal = 'lastMonthBalance' in acc && acc.lastMonthBalance !== undefined
                          ? Number(acc.lastMonthBalance || 0)
                          : 'lastMonthAmount' in acc
                          ? Number(acc.lastMonthAmount || 0)
                          : 0;

                        const curBal = 'currentBalance' in acc && acc.currentBalance !== undefined
                          ? Number(acc.currentBalance || 0)
                          : undefined;

                        return (
                          <tr key={acc.accountId || idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                  {getAccountIcon(acc.accountType)}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block leading-tight">
                                    {acc.accountName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                    {acc.accountNumber ? `A/C: ${acc.accountNumber}` : acc.bankOrProviderName || acc.accountType}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* This Month Credit (+ In) */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              {accCredit > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono">
                                  +{formatMoney(accCredit)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">৳0.00</span>
                              )}
                            </td>

                            {/* This Month Debit (- Out) */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              {accDebit > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80 font-mono">
                                  -{formatMoney(accDebit)}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-xs">৳0.00</span>
                              )}
                            </td>

                            {/* Net Activity */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono font-bold">
                              <span className={netActivity > 0 ? 'text-emerald-600' : netActivity < 0 ? 'text-rose-600' : 'text-slate-400'}>
                                {netActivity > 0 ? '+' : ''}{formatMoney(netActivity)}
                              </span>
                            </td>

                            {/* Last Month Amount */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-slate-700">
                                  {formatMoney(lastMonthVal)}
                                </span>
                                {lastMonthVal > 0 && curBal !== undefined && (
                                  <span className={`text-[10px] font-semibold ${curBal >= lastMonthVal ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {curBal >= lastMonthVal ? '▲' : '▼'} {formatMoney(Math.abs(curBal - lastMonthVal))}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Current Balance */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono">
                              <span className="font-black text-slate-900 text-xs">
                                {curBal !== undefined ? formatMoney(curBal) : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Recent Contributing Transactions */
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
                <span>এই হিসাবের সাথে সম্পর্কিত সাম্প্রতিক লেনদেনসমূহ:</span>
                <span className="text-[11px] font-bold text-slate-400">
                  {cardData?.recentTxns?.length || 0} Transactions
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Txn #</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {cardData?.recentTxns?.map((txn) => {
                      const isCredit = !txn.isDebit;

                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {txn.transactionDate}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-[10px] whitespace-nowrap">
                            {txn.transactionNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">
                              {txn.description}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {txn.accountName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                            <span className={`font-black text-xs ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {isCredit ? '+' : '-'}{formatMoney(txn.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Educational Note */}
          <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/80 flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-bold">Accounting Principle:</span> Credit (+ Inflow) নির্দেশ করে যখন টাকা ব্যাংক বা ডিজিটাল ওয়ালেটে জমা হয়েছে। Debit (- Outflow) নির্দেশ করে যখন একাউন্ট থেকে টাকা কাটা বা প্রদান করা হয়েছে।
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            BitCommerce Finance Audit Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-2xs"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
