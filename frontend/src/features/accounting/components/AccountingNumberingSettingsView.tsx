'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Bookmark,
  Save,
  ChevronRight,
  BookOpen,
  Receipt,
  FileMinus,
  FilePlus,
} from 'lucide-react';
import {
  useGetNumberingRulesQuery,
  useUpdateNumberingRuleMutation,
  NumberingRule,
  NumberingDocType,
} from '../api/accountingApi';

const DOC_TYPE_LABELS: Record<NumberingDocType, string> = {
  JOURNAL_ENTRY: 'Journal Entry',
  EXPENSE: 'Expense Voucher',
  DEBIT_NOTE: 'Debit Note',
  CREDIT_NOTE: 'Credit Note',
};

function renderIcon(docType: NumberingDocType) {
  switch (docType) {
    case 'JOURNAL_ENTRY':
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4" />
        </div>
      );
    case 'EXPENSE':
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
          <Receipt className="w-4 h-4" />
        </div>
      );
    case 'DEBIT_NOTE':
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
          <FileMinus className="w-4 h-4" />
        </div>
      );
    case 'CREDIT_NOTE':
    default:
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <FilePlus className="w-4 h-4" />
        </div>
      );
  }
}

interface RowDraft {
  prefix: string;
  suffix: string;
  includeYear: boolean;
  padWidth: number;
  nextSequence: number;
}

function toDraft(rule: NumberingRule): RowDraft {
  return {
    prefix: rule.prefix,
    suffix: rule.suffix,
    includeYear: rule.includeYear,
    padWidth: rule.padWidth,
    nextSequence: rule.nextSequence,
  };
}

/** Client-side preview mirroring the backend `sample` format. */
function previewFor(draft: RowDraft): string {
  const yearSegment = draft.includeYear ? `${new Date().getFullYear()}-` : '';
  const padded = String(Math.max(1, draft.nextSequence || 1)).padStart(
    Math.min(10, Math.max(1, draft.padWidth || 1)),
    '0',
  );
  return `${draft.prefix}${yearSegment}${padded}${draft.suffix}`;
}

export function AccountingNumberingSettingsView() {
  const { data: rules, isLoading } = useGetNumberingRulesQuery();
  const [updateRule] = useUpdateNumberingRuleMutation();

  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [savingType, setSavingType] = useState<NumberingDocType | null>(null);

  useEffect(() => {
    if (!rules) return;
    setDrafts((prev) => {
      const next = { ...prev };
      rules.forEach((r) => {
        if (!next[r.docType]) next[r.docType] = toDraft(r);
      });
      return next;
    });
  }, [rules]);

  const ruleByType = useMemo(() => {
    const map = new Map<NumberingDocType, NumberingRule>();
    (rules ?? []).forEach((r) => map.set(r.docType, r));
    return map;
  }, [rules]);

  const patchDraft = (docType: NumberingDocType, patch: Partial<RowDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [docType]: { ...prev[docType], ...patch },
    }));
  };

  const isDirty = (docType: NumberingDocType): boolean => {
    const rule = ruleByType.get(docType);
    const draft = drafts[docType];
    if (!rule || !draft) return false;
    return (
      rule.prefix !== draft.prefix ||
      rule.suffix !== draft.suffix ||
      rule.includeYear !== draft.includeYear ||
      rule.padWidth !== draft.padWidth ||
      rule.nextSequence !== draft.nextSequence
    );
  };

  const handleSave = async (docType: NumberingDocType) => {
    const rule = ruleByType.get(docType);
    const draft = drafts[docType];
    if (!rule || !draft) return;

    const nextSequence = Math.max(1, Math.floor(draft.nextSequence || 1));
    const padWidth = Math.min(10, Math.max(1, Math.floor(draft.padWidth || 1)));
    const loweredSequence = nextSequence < rule.nextSequence;

    setSavingType(docType);
    try {
      await updateRule({
        docType,
        prefix: draft.prefix,
        suffix: draft.suffix,
        includeYear: draft.includeYear,
        padWidth,
        nextSequence,
      }).unwrap();
      toast.success(`${DOC_TYPE_LABELS[docType]} numbering saved.`);
      if (loweredSequence) {
        toast('Lowering the next number may cause duplicate document numbers.', {
          icon: '⚠️',
        });
      }
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Failed to save numbering rule.';
      toast.error(message);
    } finally {
      setSavingType(null);
    }
  };

  const orderedRules = rules ?? [];

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
            <Link href="/dashboard/accounting/settings/general" className="text-blue-600 hover:underline">
              Settings
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">Numbering</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Numbering</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure auto-generated numbers for your accounting documents.
          </p>
        </div>
      </div>

      {/* Top Summary Banner Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">About Numbering</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                Set prefix, suffix, year segment and pad width for each document family. The next
                number is auto-incremented on every document you post.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div>
              <span className="text-xs font-medium text-slate-400 block">Document Families</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                {orderedRules.length}
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400 block">Base Currency Docs</span>
              <div className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
                {orderedRules.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 font-bold">DOCUMENT TYPE</th>
                <th className="px-6 py-3.5 font-bold">PREFIX</th>
                <th className="px-6 py-3.5 font-bold">SUFFIX</th>
                <th className="px-6 py-3.5 font-bold">INCLUDE YEAR</th>
                <th className="px-6 py-3.5 font-bold">DIGITS</th>
                <th className="px-6 py-3.5 font-bold">NEXT SEQUENCE</th>
                <th className="px-6 py-3.5 font-bold">SAMPLE PREVIEW</th>
                <th className="px-6 py-3.5 font-bold text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading || !rules ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-8 w-full bg-slate-100 rounded-lg animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                orderedRules.map((rule) => {
                  const draft = drafts[rule.docType] ?? toDraft(rule);
                  const dirty = isDirty(rule.docType);
                  const preview = previewFor(draft);
                  return (
                    <tr key={rule.docType} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {renderIcon(rule.docType)}
                          <span className="font-semibold text-slate-900">
                            {DOC_TYPE_LABELS[rule.docType]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          maxLength={12}
                          value={draft.prefix}
                          onChange={(e) =>
                            patchDraft(rule.docType, { prefix: e.target.value })
                          }
                          className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          maxLength={12}
                          value={draft.suffix}
                          onChange={(e) =>
                            patchDraft(rule.docType, { suffix: e.target.value })
                          }
                          className="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={draft.includeYear}
                          onChange={(e) =>
                            patchDraft(rule.docType, { includeYear: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={draft.padWidth}
                          onChange={(e) =>
                            patchDraft(rule.docType, {
                              padWidth: Number(e.target.value),
                            })
                          }
                          className="w-16 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          min={1}
                          value={draft.nextSequence}
                          onChange={(e) =>
                            patchDraft(rule.docType, {
                              nextSequence: Number(e.target.value),
                            })
                          }
                          className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {preview}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSave(rule.docType)}
                          disabled={!dirty || savingType === rule.docType}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-600/20 transition disabled:opacity-40"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>
                            {savingType === rule.docType ? 'Saving...' : 'Save'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
