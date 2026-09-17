'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Trash2, Zap, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreatePixelMutation,
  useUpdatePixelMutation,
  useDeletePixelMutation,
  useTestPixelMutation,
  PROVIDER_META,
  type MarketingPixelInstance,
  type PixelProvider,
  type PixelCredentialsInput,
} from '../api/marketingApi';
import { PageRulesEditor } from './PageRulesEditor';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface PixelFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = create mode; an instance = edit mode. */
  pixel: MarketingPixelInstance | null;
}

const PROVIDERS: PixelProvider[] = ['META', 'GOOGLE_ANALYTICS', 'GOOGLE_ADS', 'TIKTOK'];

export function PixelFormDrawer({ isOpen, onClose, pixel }: PixelFormDrawerProps) {
  const isEdit = Boolean(pixel);

  const [provider, setProvider] = useState<PixelProvider>('META');
  const [label, setLabel] = useState('');
  const [pixelId, setPixelId] = useState('');
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Animation states for smooth entrance and exit
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isRendered) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isRendered]);

  const [createPixel, { isLoading: isCreating }] = useCreatePixelMutation();
  const [updatePixel, { isLoading: isUpdating }] = useUpdatePixelMutation();
  const [deletePixel, { isLoading: isDeleting }] = useDeletePixelMutation();
  const [testPixel, { isLoading: isTesting }] = useTestPixelMutation();

  useEffect(() => {
    if (!isOpen) return;
    if (pixel) {
      setProvider(pixel.provider);
      setLabel(pixel.label ?? '');
      setPixelId(pixel.pixelId);
      setCapiEnabled(pixel.capiEnabled);
      setIsActive(pixel.isActive);
      setCreds({});
    } else {
      setProvider('META');
      setLabel('');
      setPixelId('');
      setCapiEnabled(false);
      setIsActive(true);
      setCreds({});
    }
  }, [isOpen, pixel]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const meta = PROVIDER_META[provider];

  const busy = isCreating || isUpdating;

  const buildCredentials = (): PixelCredentialsInput | undefined => {
    const entries = Object.entries(creds).filter(([, v]) => v.trim().length > 0);
    if (entries.length === 0) return undefined;
    return Object.fromEntries(entries) as PixelCredentialsInput;
  };

  const handleSave = async () => {
    if (!label.trim()) return toast.error('Give the pixel a name.');
    if (!pixelId.trim()) return toast.error(`Enter the ${meta.idLabel}.`);

    try {
      if (isEdit && pixel) {
        await updatePixel({
          id: pixel.id,
          body: {
            label: label.trim(),
            pixelId: pixelId.trim(),
            capiEnabled,
            isActive,
            credentials: buildCredentials(), // omitted -> stored secrets kept
          },
        }).unwrap();
        toast.success('Pixel updated.');
      } else {
        await createPixel({
          provider,
          label: label.trim(),
          pixelId: pixelId.trim(),
          capiEnabled,
          isActive,
          credentials: buildCredentials(),
        }).unwrap();
        toast.success('Pixel created.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save pixel.');
    }
  };

  const handleDelete = async () => {
    if (!pixel) return;
    try {
      await deletePixel(pixel.id).unwrap();
      toast.success('Pixel deleted.');
      setConfirmDeleteOpen(false);
      onClose();
    } catch {
      toast.error('Failed to delete pixel.');
    }
  };

  const handleTest = async () => {
    if (!pixel) return;
    try {
      const res = await testPixel({ id: pixel.id, eventName: 'PageView' }).unwrap();
      const transports = res.data.logs.map((l) => l.transport).join(' + ');
      toast.success(`Test fired (${transports}).`);
    } catch {
      toast.error('Test failed.');
    }
  };

  const handleToggleConnection = async () => {
    if (!pixel) return;
    const next = pixel.status === 'CONNECTED' ? 'DISCONNECTED' : 'CONNECTED';
    try {
      await updatePixel({ id: pixel.id, body: { status: next } }).unwrap();
      toast.success(next === 'DISCONNECTED' ? 'Pixel disconnected — it stops firing.' : 'Pixel reconnected.');
      onClose();
    } catch {
      toast.error('Failed to change connection.');
    }
  };

  const clearedNote = useMemo(
    () =>
      isEdit && pixel?.hasCredentials
        ? 'Leave credential fields blank to keep the stored secrets.'
        : null,
    [isEdit, pixel],
  );

  if (!isRendered || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit pixel' : 'Add pixel'}
        className={`fixed inset-y-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isVisible ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-black text-slate-900">{isEdit ? 'Edit Pixel' : 'Add Pixel'}</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {isEdit
                ? `${meta.name} · ${pixel?.label ?? ''}`
                : 'Connect an ad-platform pixel. You can add the same provider more than once.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Provider (locked in edit mode) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as PixelProvider)}
              disabled={isEdit}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
            >
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>{PROVIDER_META[p].name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Name</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Meta Pixel"
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1">Unique per provider in this store.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{meta.idLabel}</label>
            <input
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              placeholder={meta.idPlaceholder}
              className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Credentials */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Server-side credentials
            </p>
            {meta.credFields.map((f) => {
              const alreadySet = pixel?.credentialFields?.includes(f.key as string);
              return (
                <div key={f.key as string}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {f.label}
                    {alreadySet && <span className="text-emerald-600 ml-1.5">• configured</span>}
                  </label>
                  <input
                    type="password"
                    value={creds[f.key as string] ?? ''}
                    onChange={(e) => setCreds((c) => ({ ...c, [f.key as string]: e.target.value }))}
                    placeholder={alreadySet ? '•••••••• (unchanged)' : f.placeholder}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              );
            })}
            {clearedNote && <p className="text-[10px] text-slate-400">{clearedNote}</p>}
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Server-side dispatch (CAPI)</span>
              <button
                type="button"
                onClick={() => setCapiEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${capiEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${capiEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Active</span>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
              </button>
            </label>
          </div>

          {/* Page targeting — edit mode only (needs a saved pixel id) */}
          {isEdit && pixel && (
            <PageRulesEditor pixelId={pixel.id} pageScopeMode={pixel.pageScopeMode} />
          )}
          {!isEdit && (
            <p className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              Create the pixel first, then reopen it to set page-targeting rules.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center flex-wrap gap-2">
          {isEdit && pixel && (
            <>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeleting}
                className="h-9 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                type="button"
                onClick={handleToggleConnection}
                disabled={isUpdating}
                className={`h-9 px-3 rounded-xl border font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 ${
                  pixel.status === 'CONNECTED'
                    ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {pixel.status === 'CONNECTED' ? (
                  <><PowerOff className="w-3.5 h-3.5" /> Disconnect</>
                ) : (
                  <><Power className="w-3.5 h-3.5" /> Reconnect</>
                )}
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="h-9 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 ml-auto disabled:opacity-50"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create pixel'}
          </button>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this pixel?"
        message={
          <>
            <strong>{pixel?.label ?? pixel?.provider}</strong> will stop firing on your
            storefront and its page rules will be removed. Past event-log history is kept.
          </>
        }
        confirmLabel="Delete pixel"
        isDestructive
        isLoading={isDeleting}
      />
    </div>,
    document.body,
  );
}
