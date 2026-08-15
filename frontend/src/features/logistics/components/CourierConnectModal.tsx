'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, Plug, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  useUpsertCourierIntegrationMutation,
  type CourierDashboardItem,
} from '../api/logisticsApi';

interface CourierConnectModalProps {
  courier: CourierDashboardItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

const labelClass = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1';

/**
 * Credential entry for one courier.
 *
 * The form is generated from the provider's `credentialFields`, so a courier
 * with a different auth shape needs no change here. Secrets are pre-filled with
 * the server's mask rather than a real value; a field left at its mask is sent
 * back unchanged and the server understands that as "keep the stored secret".
 */
export const CourierConnectModal = ({ courier, isOpen, onClose }: CourierConnectModalProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sandbox, setSandbox] = useState(false);

  const [upsertIntegration, { isLoading: isSaving }] = useUpsertCourierIntegrationMutation();

  const fields = useMemo(() => courier?.credentialFields ?? [], [courier]);

  // Reload from the server's masked values whenever a different courier opens,
  // so an abandoned edit never leaks into the next provider's form.
  useEffect(() => {
    if (!courier) return;
    setValues({ ...courier.maskedCredentials });
    setSandbox(courier.sandbox);
    setRevealed({});
    setErrors({});
  }, [courier]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !courier) return null;

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (!field.required) return;
      const value = (values[field.key] ?? '').trim();
      if (!value) nextErrors[field.key] = `${field.label} is required.`;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      await upsertIntegration({
        provider: courier.code,
        credentials: values,
        // Saving from this modal is the merchant connecting the provider.
        isEnabled: true,
        sandbox,
      }).unwrap();

      toast.success(`${courier.name} connected.`);
      onClose();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        `Could not connect ${courier.name}.`;
      toast.error(message);
    }
  };

  const isReconnect = courier.hasCredentials;

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="courier-connect-title"
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col"
        >
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h2
                id="courier-connect-title"
                className="text-lg font-extrabold text-slate-900 tracking-tight"
              >
                {isReconnect ? 'Update' : 'Connect'} {courier.name}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-1">
                {courier.coverage} · {courier.type}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] font-medium text-blue-900 leading-relaxed">
                  Credentials are encrypted before they are stored and are never shown again in
                  full — only the last few characters.
                </p>
              </div>

              {fields.map((field) => {
                const isSecret = field.secret && !revealed[field.key];
                return (
                  <div key={field.key}>
                    <label className={labelClass} htmlFor={`courier-field-${field.key}`}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        id={`courier-field-${field.key}`}
                        type={isSecret ? 'password' : 'text'}
                        value={values[field.key] ?? ''}
                        onChange={(e) => {
                          setValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                          setErrors((prev) => ({ ...prev, [field.key]: '' }));
                        }}
                        placeholder={field.placeholder}
                        autoComplete="off"
                        aria-invalid={Boolean(errors[field.key])}
                        className={`${inputClass} ${field.secret ? 'pr-9' : ''} ${
                          errors[field.key] ? 'border-red-300' : ''
                        }`}
                      />
                      {field.secret && (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealed((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                          }
                          aria-label={revealed[field.key] ? 'Hide value' : 'Show value'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          {revealed[field.key] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {errors[field.key] ? (
                      <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" aria-hidden="true" />
                        {errors[field.key]}
                      </p>
                    ) : (
                      field.helpText && (
                        <p className="mt-1 text-[11px] text-slate-500">{field.helpText}</p>
                      )
                    )}
                  </div>
                );
              })}

              <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sandbox}
                  onChange={(e) => setSandbox(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Sandbox mode
                  <span className="block text-[11px] font-medium text-slate-500">
                    Test bookings without sending parcels to the live courier.
                  </span>
                </span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Plug className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {isSaving ? 'Saving...' : isReconnect ? 'Save Changes' : 'Connect Courier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
