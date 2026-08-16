'use client';

import React, { useState } from 'react';
import { Code2, Plus, Trash2, Loader2, Copy, Check, KeyRound, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsPageShell } from '@/features/settings/components/SettingsPageShell';
import {
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useRevokeApiKeyMutation,
  type CreatedApiKey,
} from '@/features/tenant/api/tenantApi';

export default function DeveloperSettingsPage() {
  const { data: keys = [], isLoading } = useGetApiKeysQuery();
  const [createKey, { isLoading: isCreating }] = useCreateApiKeyMutation();
  const [revokeKey] = useRevokeApiKeyMutation();

  const [newKeyName, setNewKeyName] = useState('');
  const [justCreated, setJustCreated] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error('Give the key a name so you can recognise it later.');
      return;
    }

    try {
      const created = await createKey({ name: newKeyName.trim() }).unwrap();
      setJustCreated(created);
      setNewKeyName('');
      toast.success('API key generated. Copy it now — it will not be shown again.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to generate API key.');
    }
  };

  const handleCopy = async () => {
    if (!justCreated) return;
    try {
      await navigator.clipboard.writeText(justCreated.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('API key copied to clipboard.');
    } catch {
      toast.error('Could not copy automatically — select the key and copy manually.');
    }
  };

  const handleRevoke = async (id: string, name: string) => {
    try {
      await revokeKey(id).unwrap();
      toast.success(`Key "${name}" revoked.`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to revoke key.');
    }
  };

  return (
    <SettingsPageShell
      icon={Code2}
      iconBgColor="bg-blue-50"
      iconColor="text-blue-600"
      title="API / Developer"
      description="Generate API keys to access your store programmatically from your own applications."
      isLoading={isLoading}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5">
        {justCreated && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12.5px] font-extrabold text-emerald-900">
                  Copy your key now — it will never be shown again
                </p>
                <p className="text-[11.5px] font-medium text-emerald-700 mt-0.5">
                  We only store a hash of this key. If you lose it, generate a new one.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2.5 bg-white border border-emerald-200 rounded-lg text-[12px] font-mono text-slate-900 break-all select-all">
                {justCreated.key}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setJustCreated(null)}
              className="text-[11.5px] font-bold text-emerald-800 hover:underline"
            >
              I&apos;ve saved it — dismiss
            </button>
          </div>
        )}

        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl">
          <label className="block text-[11.5px] font-bold text-slate-700 mb-2">Generate a new API key</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. Inventory sync script)"
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12.5px] font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60 shrink-0 transition-colors"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Generate Key
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
            Active Keys ({keys.length})
          </h2>

          {keys.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <KeyRound className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-[13px] font-bold text-slate-900">No API keys yet</p>
              <p className="text-[11.5px] font-medium text-slate-500 mt-1">
                Generate a key above to start using the EasyCommerce API.
              </p>
            </div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-extrabold text-slate-900 truncate">{key.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {key.keyPrefix}••••••••••••
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-[11px] font-medium text-slate-400">
                    Created {new Date(key.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400">
                    {key.lastUsedAt ? `Last used ${new Date(key.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(key.id, key.name)}
                  aria-label={`Revoke ${key.name}`}
                  className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </SettingsPageShell>
  );
}
