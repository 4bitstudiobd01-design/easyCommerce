'use client';

import React from 'react';
import { X, Check, Minus } from 'lucide-react';
import { INITIAL_PLANS } from '../plansMockData';

interface ComparePlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComparePlansModal({
  isOpen,
  onClose,
}: ComparePlansModalProps) {
  if (!isOpen) return null;

  const comparisonRows = [
    { label: 'Monthly Price', starter: '৳1,000', growth: '৳2,500', business: '৳5,000', enterprise: '৳10,000' },
    { label: 'Staff Accounts', starter: '2', growth: '10', business: '30', enterprise: 'Unlimited' },
    { label: 'Product Limit', starter: '500', growth: '10,000', business: '50,000', enterprise: 'Unlimited' },
    { label: 'Monthly Orders', starter: '300', growth: '2,000', business: '10,000', enterprise: 'Unlimited' },
    { label: 'Cloud Storage', starter: '5 GB', growth: '50 GB', business: '200 GB', enterprise: '1 TB' },
    { label: 'Monthly Bandwidth', starter: '20 GB', growth: '200 GB', business: '1 TB', enterprise: '5 TB' },
    { label: 'Email Marketing', starter: '1,000 / mo', growth: '10,000 / mo', business: '50,000 / mo', enterprise: '200,000 / mo' },
    { label: 'Custom Domain SSL', starter: true, growth: true, business: true, enterprise: true },
    { label: 'Abandoned Cart Recovery', starter: false, growth: true, business: true, enterprise: true },
    { label: 'Multi-Location POS', starter: false, growth: true, business: true, enterprise: true },
    { label: 'Developer API & Webhooks', starter: false, growth: true, business: true, enterprise: true },
    { label: 'Dedicated Account Manager', starter: false, growth: false, business: false, enterprise: true },
  ];

  const renderCell = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Check className="w-3 h-3 stroke-[3]" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Minus className="w-3 h-3" />
        </div>
      );
    }
    return <span className="font-semibold text-slate-800 text-xs">{val}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Compare Subscription Plans</h3>
            <p className="text-xs text-slate-500">Side-by-side breakdown of quotas, limits, and capabilities</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-900">
                <th className="py-3 px-4 w-1/4">Feature / Metric</th>
                <th className="py-3 px-4 text-center">Starter</th>
                <th className="py-3 px-4 text-center bg-emerald-50/50 text-emerald-800 rounded-t-xl">Growth (Popular)</th>
                <th className="py-3 px-4 text-center">Business</th>
                <th className="py-3 px-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-medium text-slate-700">{row.label}</td>
                  <td className="py-3 px-4 text-center">{renderCell(row.starter)}</td>
                  <td className="py-3 px-4 text-center bg-emerald-50/30">{renderCell(row.growth)}</td>
                  <td className="py-3 px-4 text-center">{renderCell(row.business)}</td>
                  <td className="py-3 px-4 text-center">{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
