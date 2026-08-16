'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useGetMyStoreQuery,
  useUpdateStoreMutation,
  type Store,
  type UpdateStoreRequest,
} from '@/features/tenant/api/tenantApi';

/**
 * Shared form plumbing for the settings pages backed by store columns: loads the
 * store, seeds local state from it once available, and submits only that page's
 * slice of fields so two pages can never clobber each other's values.
 */
export function useStoreSettingsForm<T extends Partial<UpdateStoreRequest>>(
  select: (store: Store) => T,
  successMessage = 'Settings saved successfully.',
) {
  const { data: store, isLoading } = useGetMyStoreQuery();
  const [updateStore, { isLoading: isSaving }] = useUpdateStoreMutation();
  const [form, setForm] = useState<T | null>(null);

  useEffect(() => {
    if (store) setForm(select(store));
    // `select` is defined inline by callers; re-running only on store changes is
    // intentional so local edits are not overwritten on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    try {
      await updateStore(form as UpdateStoreRequest).unwrap();
      toast.success(successMessage);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save settings. Please try again.');
    }
  };

  return { store, form, setField, handleSave, isLoading: isLoading || !form, isSaving };
}
