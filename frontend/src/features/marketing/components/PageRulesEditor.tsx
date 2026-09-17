'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Loader2, Check, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetPageRulesQuery,
  useReplacePageRulesMutation,
  useUpdatePixelMutation,
  type PixelPageScopeMode,
} from '../api/marketingApi';
import {
  resolvePixelFires,
  isValidUrlPattern,
  PREVIEW_PAGES,
  PAGE_TYPE_OPTIONS,
  type PreviewRule,
} from '../utils/pixelFires';

interface PageRulesEditorProps {
  pixelId: string;
  pageScopeMode: PixelPageScopeMode;
}

interface DraftRule {
  matchType: 'PAGE_TYPE' | 'URL_PATTERN';
  pageType: string;
  urlPattern: string;
  include: boolean;
}

const emptyRule = (): DraftRule => ({
  matchType: 'PAGE_TYPE',
  pageType: 'PRODUCT',
  urlPattern: '',
  include: true,
});

export function PageRulesEditor({ pixelId, pageScopeMode }: PageRulesEditorProps) {
  const { data: serverRules, isLoading } = useGetPageRulesQuery(pixelId);
  const [replaceRules, { isLoading: isSaving }] = useReplacePageRulesMutation();
  const [updatePixel, { isLoading: isSwitching }] = useUpdatePixelMutation();

  const [mode, setMode] = useState<PixelPageScopeMode>(pageScopeMode);
  const [drafts, setDrafts] = useState<DraftRule[]>([]);

  useEffect(() => setMode(pageScopeMode), [pageScopeMode]);

  useEffect(() => {
    if (!serverRules) return;
    setDrafts(
      serverRules.map((r) => ({
        matchType: r.matchType,
        pageType: r.pageType ?? 'PRODUCT',
        urlPattern: r.urlPattern ?? '',
        include: r.include,
      })),
    );
  }, [serverRules]);

  const previewRules: PreviewRule[] = useMemo(
    () =>
      drafts.map((d) => ({
        matchType: d.matchType,
        pageType: d.matchType === 'PAGE_TYPE' ? d.pageType : null,
        urlPattern: d.matchType === 'URL_PATTERN' ? d.urlPattern : null,
        include: d.include,
      })),
    [drafts],
  );

  const patternErrors = drafts
    .map((d, i) =>
      d.matchType === 'URL_PATTERN' && d.urlPattern && !isValidUrlPattern(d.urlPattern)
        ? i + 1
        : null,
    )
    .filter((x): x is number => x !== null);

  const handleModeChange = async (next: PixelPageScopeMode) => {
    setMode(next);
    try {
      await updatePixel({ id: pixelId, body: { pageScopeMode: next } }).unwrap();
    } catch {
      toast.error('Failed to switch targeting mode.');
      setMode(pageScopeMode);
    }
  };

  const handleSave = async () => {
    if (patternErrors.length > 0) {
      toast.error(`Fix the URL pattern in rule ${patternErrors.join(', ')}.`);
      return;
    }
    for (let i = 0; i < drafts.length; i += 1) {
      if (drafts[i].matchType === 'URL_PATTERN' && !drafts[i].urlPattern.trim()) {
        toast.error(`Rule ${i + 1}: enter a URL pattern.`);
        return;
      }
    }
    try {
      await replaceRules({
        pixelId,
        rules: drafts.map((d) => ({
          matchType: d.matchType,
          pageType: d.matchType === 'PAGE_TYPE' ? d.pageType : undefined,
          urlPattern: d.matchType === 'URL_PATTERN' ? d.urlPattern.trim() : undefined,
          include: d.include,
        })),
      }).unwrap();
      toast.success('Page rules saved.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save rules.');
    }
  };

  const update = (i: number, patch: Partial<DraftRule>) =>
    setDrafts((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className="pt-2 border-t border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          Page targeting
        </p>
        {isSwitching && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1.5">
        {(['ALL', 'RULES'] as PixelPageScopeMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`flex-1 h-8 rounded-lg text-[11px] font-bold border transition-colors ${
              mode === m
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {m === 'ALL' ? 'Every page' : 'Only matching rules'}
          </button>
        ))}
      </div>

      {mode === 'RULES' && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {drafts.map((d, i) => (
                <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={d.include ? 'include' : 'exclude'}
                      onChange={(e) => update(i, { include: e.target.value === 'include' })}
                      className={`h-7 px-2 rounded border text-[10px] font-bold focus:outline-none ${
                        d.include
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <option value="include">Fire on</option>
                      <option value="exclude">Never on</option>
                    </select>
                    <select
                      value={d.matchType}
                      onChange={(e) => update(i, { matchType: e.target.value as DraftRule['matchType'] })}
                      className="h-7 px-2 rounded border border-slate-200 bg-white text-[10px] font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="PAGE_TYPE">page type</option>
                      <option value="URL_PATTERN">URL pattern</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setDrafts((ds) => ds.filter((_, idx) => idx !== i))}
                      className="ml-auto p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      aria-label="Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {d.matchType === 'PAGE_TYPE' ? (
                    <select
                      value={d.pageType}
                      onChange={(e) => update(i, { pageType: e.target.value })}
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {PAGE_TYPE_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        value={d.urlPattern}
                        onChange={(e) => update(i, { urlPattern: e.target.value })}
                        placeholder="/product/clearance-*"
                        className={`w-full h-8 px-2 rounded-lg border bg-white font-mono text-[11px] font-bold focus:outline-none focus:ring-2 ${
                          d.urlPattern && !isValidUrlPattern(d.urlPattern)
                            ? 'border-red-300 focus:ring-red-500 text-red-700'
                            : 'border-slate-200 focus:ring-blue-600 text-slate-800'
                        }`}
                      />
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        <code>*</code> = one segment, <code>**</code> = any depth. Leading slash required.
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setDrafts((ds) => [...ds, emptyRule()])}
                className="w-full h-8 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-50 text-[11px] font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add rule
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save rules
              </button>
            </div>
          )}

          {/* Preview */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Will fire on
            </p>
            <div className="grid grid-cols-2 gap-1">
              {PREVIEW_PAGES.map((p) => {
                const fires = resolvePixelFires('RULES', previewRules, {
                  pathname: p.pathname,
                  pageType: p.pageType,
                });
                return (
                  <div
                    key={p.pathname}
                    className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold ${
                      fires ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {fires ? <Check className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{p.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {mode === 'ALL' && (
        <p className="text-[11px] text-slate-500">This pixel fires on every storefront page.</p>
      )}
    </div>
  );
}
