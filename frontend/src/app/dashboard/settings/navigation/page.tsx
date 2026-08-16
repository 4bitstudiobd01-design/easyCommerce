'use client';

import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import { FieldGroup } from '@/features/settings/components/SettingsFields';
import {
  useGetMyStoreQuery,
  useUpdateStoreMutation,
  type NavigationLink,
} from '@/features/tenant/api/tenantApi';

const LOCATIONS: { key: NavigationLink['location']; title: string; description: string }[] = [
  { key: 'HEADER', title: 'Header Menu', description: 'Links shown in the top navigation bar of your storefront.' },
  { key: 'FOOTER', title: 'Footer Menu', description: 'Links shown in the footer, typically policies and support pages.' },
];

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `nav-${Date.now()}`;

export default function NavigationSettingsPage() {
  const { data: store, isLoading } = useGetMyStoreQuery();
  const [updateStore, { isLoading: isSaving }] = useUpdateStoreMutation();
  const [links, setLinks] = useState<NavigationLink[] | null>(null);

  useEffect(() => {
    if (store) setLinks(store.navigationLinks || []);
  }, [store]);

  const addLink = (location: NavigationLink['location']) => {
    setLinks((prev) => [
      ...(prev || []),
      { id: makeId(), label: '', url: '', location, sortOrder: (prev || []).length },
    ]);
  };

  const updateLink = (id: string, patch: Partial<NavigationLink>) => {
    setLinks((prev) => (prev || []).map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLink = (id: string) => {
    setLinks((prev) => (prev || []).filter((l) => l.id !== id));
  };

  /** Moves a link within its own location group, leaving the other group untouched. */
  const moveLink = (id: string, direction: -1 | 1) => {
    setLinks((prev) => {
      if (!prev) return prev;
      const link = prev.find((l) => l.id === id);
      if (!link) return prev;

      const group = prev.filter((l) => l.location === link.location);
      const index = group.findIndex((l) => l.id === id);
      const target = index + direction;
      if (target < 0 || target >= group.length) return prev;

      [group[index], group[target]] = [group[target], group[index]];
      const reordered = group.map((l, i) => ({ ...l, sortOrder: i }));

      return prev
        .filter((l) => l.location !== link.location)
        .concat(reordered);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!links) return;

    const cleaned = links
      .map((l) => ({ ...l, label: l.label.trim(), url: l.url.trim() }))
      .filter((l) => l.label && l.url);

    if (cleaned.length !== links.length) {
      toast.error('Every menu link needs both a label and a URL.');
      return;
    }

    try {
      await updateStore({ navigationLinks: cleaned }).unwrap();
      toast.success('Navigation menu saved.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to save navigation.');
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12.5px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all';

  return (
    <SettingsPageShell
      icon={LayoutTemplate}
      iconBgColor="bg-blue-50"
      iconColor="text-blue-600"
      title="Navigation"
      description="Build the header and footer menus that appear across your storefront."
      onSave={handleSave}
      isLoading={isLoading || !links}
      isSaving={isSaving}
      saveLabel="Save Navigation"
      maxWidth="max-w-5xl"
    >
      {links &&
        LOCATIONS.map(({ key, title, description }) => {
          const group = links
            .filter((l) => l.location === key)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          return (
            <FieldGroup key={key} title={title} description={description}>
              {group.length === 0 ? (
                <p className="text-[12px] font-medium text-slate-400 py-4 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  No links yet. Add your first {title.toLowerCase()} link below.
                </p>
              ) : (
                <div className="space-y-2">
                  {group.map((link, index) => (
                    <div
                      key={link.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl"
                    >
                      <input
                        value={link.label}
                        onChange={(e) => updateLink(link.id, { label: e.target.value })}
                        placeholder="Label (e.g. About Us)"
                        className={`${inputClass} sm:max-w-[220px]`}
                      />
                      <input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, { url: e.target.value })}
                        placeholder="/about  or  https://example.com"
                        className={`${inputClass} flex-1`}
                      />

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveLink(link.id, -1)}
                          disabled={index === 0}
                          aria-label="Move link up"
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLink(link.id, 1)}
                          disabled={index === group.length - 1}
                          aria-label="Move link down"
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLink(link.id)}
                          aria-label="Remove link"
                          className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => addLink(key)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {key === 'HEADER' ? 'Header' : 'Footer'} Link
              </button>
            </FieldGroup>
          );
        })}
    </SettingsPageShell>
  );
}
