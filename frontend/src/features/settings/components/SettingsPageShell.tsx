'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, LucideIcon } from 'lucide-react';

interface SettingsPageShellProps {
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  /** Omit to render a read-only page with no save bar. */
  onSave?: (e: React.FormEvent) => void;
  isSaving?: boolean;
  isLoading?: boolean;
  saveLabel?: string;
  maxWidth?: string;
}

/**
 * Shared chrome for every settings sub-page: back link, gradient header, card
 * body and a sticky save bar. Keeping this in one place is what makes the
 * settings area feel like a single product rather than a dozen separate forms.
 */
export function SettingsPageShell({
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  title,
  description,
  children,
  onSave,
  isSaving = false,
  isLoading = false,
  saveLabel = 'Save Changes',
  maxWidth = 'max-w-4xl',
}: SettingsPageShellProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
      </div>
    );
  }

  const body = (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-7 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl ${iconBgColor} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-tight">{title}</h1>
              <p className="text-[12.5px] font-medium text-slate-500 mt-1 leading-relaxed">{description}</p>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-7">{children}</div>

        {onSave && (
          <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[12.5px] rounded-xl shadow-sm shadow-blue-600/25 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : saveLabel}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`${maxWidth} mx-auto space-y-5 pb-12 animate-in fade-in duration-200`}>
      <button
        type="button"
        onClick={() => router.push('/dashboard/settings')}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store Settings</span>
      </button>

      {onSave ? <form onSubmit={onSave}>{body}</form> : body}
    </div>
  );
}
