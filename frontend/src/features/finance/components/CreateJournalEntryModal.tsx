'use client';

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Scale,
} from 'lucide-react';
import {
  usePostJournalEntryMutation,
  useGetChartOfAccountsQuery,
  FinanceLineType,
  FinancePartyType,
} from '../api/financeApi';

interface CreateJournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JournalLineForm {
  accountId: string;
  type: FinanceLineType;
  amount: string;
  description: string;
  partyType: FinancePartyType;
  partyName: string;
}

export function CreateJournalEntryModal({ isOpen, onClose }: CreateJournalEntryModalProps) {
  const [postJournalEntry, { isLoading }] = usePostJournalEntryMutation();
  const { data: coaData } = useGetChartOfAccountsQuery();

  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [lines, setLines] = useState<JournalLineForm[]>([
    { accountId: '', type: 'DEBIT', amount: '', description: '', partyType: 'NONE', partyName: '' },
    { accountId: '', type: 'CREDIT', amount: '', description: '', partyType: 'NONE', partyName: '' },
  ]);

  if (!isOpen) return null;

  const accounts = coaData?.accounts || [];

  const handleAddLine = () => {
    setLines([
      ...lines,
      { accountId: '', type: 'DEBIT', amount: '', description: '', partyType: 'NONE', partyName: '' },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      setErrorMsg('A journal entry must have at least two line items.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof JournalLineForm, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  // Compute totals
  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const amt = parseFloat(line.amount) || 0;
    if (line.type === 'DEBIT') totalDebit += amt;
    else if (line.type === 'CREDIT') totalCredit += amt;
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;
  const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference <= 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!description.trim()) {
      setErrorMsg('Please enter a description for this journal entry.');
      return;
    }

    if (!isBalanced) {
      setErrorMsg(`Journal entry is not balanced. Difference: ৳${difference.toFixed(2)}.`);
      return;
    }

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].accountId) {
        setErrorMsg(`Please select an account for line #${i + 1}.`);
        return;
      }
      if (!lines[i].amount || parseFloat(lines[i].amount) <= 0) {
        setErrorMsg(`Please enter a valid amount for line #${i + 1}.`);
        return;
      }
    }

    try {
      await postJournalEntry({
        entryDate,
        description: description.trim(),
        sourceType: 'MANUAL',
        sourceReference: sourceReference.trim() || undefined,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          type: l.type,
          amount: parseFloat(l.amount),
          description: l.description.trim() || undefined,
          partyType: l.partyType !== 'NONE' ? l.partyType : undefined,
          partyName: l.partyName.trim() || undefined,
        })),
      }).unwrap();

      onClose();
      setDescription('');
      setSourceReference('');
      setNotes('');
      setLines([
        { accountId: '', type: 'DEBIT', amount: '', description: '', partyType: 'NONE', partyName: '' },
        { accountId: '', type: 'CREDIT', amount: '', description: '', partyType: 'NONE', partyName: '' },
      ]);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to post journal entry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">New Journal Entry</h2>
              <p className="text-xs text-slate-500 font-medium">Post a double-entry general journal transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Header fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Entry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Source Reference / Memo</label>
              <input
                type="text"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. ADJ-2026-001"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-hidden transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Month-end depreciation adjustment"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-indigo-500 outline-hidden transition"
              />
            </div>
          </div>

          {/* Journal Lines Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Journal Lines (Debits & Credits)
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Add Line
              </button>
            </div>

            <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 bg-slate-50/50 rounded-xl border border-slate-200/70"
                >
                  <span className="text-[11px] font-mono font-bold text-slate-400 w-6 text-center shrink-0">
                    #{idx + 1}
                  </span>

                  {/* Account Selector */}
                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:border-indigo-500 outline-hidden"
                    >
                      <option value="">Select Chart of Account...</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name} ({acc.accountClass})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Debit / Credit toggle */}
                  <div className="w-28 shrink-0">
                    <select
                      value={line.type}
                      onChange={(e) => handleLineChange(idx, 'type', e.target.value as FinanceLineType)}
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-bold outline-hidden ${
                        line.type === 'DEBIT'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      <option value="DEBIT">Debit (Dr)</option>
                      <option value="CREDIT">Credit (Cr)</option>
                    </select>
                  </div>

                  {/* Amount input */}
                  <div className="w-32 shrink-0">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={line.amount}
                      onChange={(e) => handleLineChange(idx, 'amount', e.target.value)}
                      placeholder="৳ 0.00"
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-right focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  {/* Line memo */}
                  <div className="flex-1 min-w-[140px]">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      placeholder="Line memo..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:border-indigo-500 outline-hidden"
                    />
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lines.length <= 2}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Balancing Card Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Total Debits: </span>
                  <span className="font-mono font-black text-blue-700">৳{totalDebit.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Total Credits: </span>
                  <span className="font-mono font-black text-purple-700">৳{totalCredit.toFixed(2)}</span>
                </div>
              </div>

              <div>
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Balanced (Debits = Credits)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                    <Scale className="w-4 h-4 text-rose-600" />
                    Out of Balance: ৳{difference.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !isBalanced}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {isLoading ? 'Posting...' : 'Post Journal Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
