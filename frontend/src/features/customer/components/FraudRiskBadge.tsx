'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ShieldCheck, ShieldQuestion, Loader2, X, RefreshCw, Truck } from 'lucide-react';
import {
  useLazyGetFraudCheckForCustomerQuery,
  useLazyGetFraudCheckByPhoneQuery,
  FraudCheckResult,
} from '../api/customerApi';

interface FraudRiskBadgeProps {
  /** Preferred lookup key when a resolved CustomerEntity id is known (customer page). */
  customerId?: string;
  /** Fallback lookup key for surfaces that only carry a phone number (order table rows). */
  phone?: string;
  customerLabel?: string;
}

type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export function getOverallRisk(data?: FraudCheckResult): RiskLevel {
  if (!data) return 'unknown';
  if (data.totalOrders === 0) return 'unknown';
  if (data.cancelRate >= 40) return 'high';
  if (data.cancelRate >= 15) return 'medium';
  return 'low';
}

export function riskBadgeClasses(level: RiskLevel, hasData: boolean): string {
  if (!hasData) return 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100';
  switch (level) {
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
}

/**
 * Click-to-check FraudBD risk badge. Deliberately lazy/on-demand rather than
 * fetched for every row on mount — FraudBD is rate-limited (60 req/min) and
 * the backend already caches per-customer for 24h, so repeat opens are cheap
 * but a full customer/order table auto-checking every row would not be.
 */
export function FraudRiskBadge({ customerId, phone, customerLabel }: FraudRiskBadgeProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [triggerByCustomer, byCustomerState] = useLazyGetFraudCheckForCustomerQuery();
  const [triggerByPhone, byPhoneState] = useLazyGetFraudCheckByPhoneQuery();

  const { data, isFetching, isError, error } = customerId ? byCustomerState : byPhoneState;

  const runCheck = (refresh = false) => {
    if (customerId) {
      triggerByCustomer({ customerId, refresh });
    } else if (phone) {
      triggerByPhone({ phone, refresh });
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDetailOpen(true);
    if (!data) runCheck(false);
  };

  const riskLevel = getOverallRisk(data);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${riskBadgeClasses(riskLevel, Boolean(data))}`}
        title="Check FraudBD courier delivery history"
      >
        {isFetching ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : riskLevel === 'high' ? (
          <ShieldAlert className="w-3 h-3" />
        ) : riskLevel === 'low' ? (
          <ShieldCheck className="w-3 h-3" />
        ) : (
          <ShieldQuestion className="w-3 h-3" />
        )}
        <span>{data ? `${data.successRate.toFixed(0)}% success` : 'Fraud Check'}</span>
      </button>

      {isDetailOpen &&
        createPortal(
          <>
            <div
              onClick={() => setIsDetailOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-[80] bg-slate-900/40 backdrop-blur-[1px]"
            />
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Courier Fraud Check</h3>
                    {customerLabel && <p className="text-xs text-slate-400 font-medium mt-0.5">{customerLabel}</p>}
                  </div>
                  <button
                    onClick={() => setIsDetailOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  <FraudCheckPanel
                    data={data}
                    isFetching={isFetching}
                    isError={isError}
                    errorMessage={(error as any)?.data?.message}
                    onRefresh={() => runCheck(true)}
                  />
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

/**
 * The result body (summary tiles + per-courier breakdown), with no modal
 * chrome — reused by FraudRiskBadge's popup modal and by the drawer's
 * standalone Fraud Check tab.
 */
export function FraudCheckPanel({
  data,
  isFetching,
  isError,
  errorMessage,
  onRefresh,
}: {
  data?: FraudCheckResult;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onRefresh: () => void;
}) {
  const riskLevel = getOverallRisk(data);
  const courierEntries = data ? Object.entries(data.summaries || {}) : [];

  if (isFetching && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs font-semibold">Checking FraudBD…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold text-center">
        {errorMessage || 'Unable to fetch fraud check data right now.'}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-slate-900 mt-0.5">{data.totalOrders}</p>
        </div>
        <div className="border-x border-slate-200/80">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success</p>
          <p className="text-lg font-black text-emerald-700 mt-0.5">{data.successOrders}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cancel</p>
          <p className="text-lg font-black text-rose-600 mt-0.5">{data.cancelOrders}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex-1 p-3 rounded-2xl border text-center ${riskBadgeClasses(riskLevel, true)}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Success Rate</p>
          <p className="text-base font-black mt-0.5">{data.successRate.toFixed(1)}%</p>
        </div>
        <div className="flex-1 p-3 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Cancel Rate</p>
          <p className="text-base font-black mt-0.5">{data.cancelRate.toFixed(1)}%</p>
        </div>
      </div>

      {courierEntries.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
            By Courier
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {courierEntries.map(([courier, summary]) => (
              <div key={courier} className="p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-900">{courier}</span>
                </div>
                {summary.data_type === 'rating' && summary.customer_rating ? (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px] uppercase">
                    {summary.customer_rating.replace(/_/g, ' ')}
                  </span>
                ) : (
                  <span className="text-slate-500 font-semibold">
                    {summary.success}/{summary.total} delivered
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400 font-medium">
          {data.cached ? 'Cached result' : 'Just checked'} · {new Date(data.checkedAt).toLocaleString()}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
