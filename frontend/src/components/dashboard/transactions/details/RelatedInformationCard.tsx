'use client';

import React, { useState } from 'react';
import { ExternalLink, Plus, Tag } from 'lucide-react';
import { TransactionRecord } from '../types';
import { toast } from 'sonner';

interface RelatedInformationCardProps {
  transaction: TransactionRecord;
}

export function RelatedInformationCard({
  transaction,
}: RelatedInformationCardProps) {
  const [tags, setTags] = useState<string[]>(
    transaction.tags || ['VIP Merchant', 'Auto-renew']
  );
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagText.trim()) {
      setTags([...tags, newTagText.trim()]);
      setNewTagText('');
      setIsAddingTag(false);
      toast.success(`Added tag "${newTagText.trim()}"`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4 text-xs">
      {/* Top Part: Related Information */}
      <div>
        <h3 className="font-bold text-slate-900 tracking-tight text-xs sm:text-[13px] mb-3.5">
          Related Information
        </h3>

        <div className="space-y-3">
          {/* Plan */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Plan</span>
            <span className="font-bold text-emerald-600 hover:underline cursor-pointer">
              {transaction.planName || 'Growth Plan (Monthly)'}
            </span>
          </div>

          {/* Plan Amount */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Plan Amount</span>
            <span className="font-semibold text-slate-800">
              {transaction.planAmount || '৳5,000.00 / month'}
            </span>
          </div>

          {/* Billing Cycle */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Billing Cycle</span>
            <span className="font-semibold text-slate-800">
              {transaction.billingCycle || 'Monthly'}
            </span>
          </div>

          {/* Next Billing Date */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Next Billing Date</span>
            <span className="font-semibold text-slate-800">
              {transaction.nextBillingDate || 'Sep 14, 2026'}
            </span>
          </div>

          {/* Merchant */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Merchant</span>
            <a
              href="/admin/merchants"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <span>{transaction.merchant.name}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Store */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Store</span>
            <a
              href={`https://${transaction.merchant.domain}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <span>{transaction.merchant.domain}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Customer */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 font-medium">Customer</span>
            <a
              href={`mailto:${transaction.customer?.email || 'rahim.hossain@email.com'}`}
              className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <span>{transaction.customer?.name || 'Rahim Hossain'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Part: Tags */}
      <div className="pt-3 border-t border-slate-100">
        <h4 className="font-bold text-slate-900 tracking-tight text-xs mb-2.5">
          Tags
        </h4>

        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tg, idx) => (
            <span
              key={idx}
              className="bg-slate-100 text-slate-700 font-medium text-[11px] px-2.5 py-1 rounded-lg border border-slate-200"
            >
              {tg}
            </span>
          ))}

          {isAddingTag ? (
            <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
              <input
                type="text"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="Tag name"
                autoFocus
                className="w-24 px-2 py-0.5 bg-white border border-emerald-500 rounded-lg text-xs outline-none"
              />
              <button
                type="submit"
                className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
              >
                Add
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingTag(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-dashed border-slate-300 text-slate-600 hover:text-slate-900 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Tag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
