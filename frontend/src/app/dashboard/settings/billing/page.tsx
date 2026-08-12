'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useInitiatePlanRenewalMutation,
  PlanCode,
} from '@/features/billing/api/billingApi';
import {
  ArrowLeft,
  Check,
  Wallet,
  AlertTriangle,
  Loader2,
  CreditCard,
} from 'lucide-react';

export default function BillingSettingsPage() {
  const router = useRouter();
  const { data: plans = [], isLoading: isLoadingPlans } = useGetPlansQuery();
  const { data: snapshot, isLoading: isLoadingSubscription, refetch } = useGetMySubscriptionQuery();
  const [initiateRenewal, { isLoading: isInitiating }] = useInitiatePlanRenewalMutation();
  const [upgradingPlan, setUpgradingPlan] = useState<PlanCode | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get('payment');

    if (paymentResult === 'success') {
      toast.success('Subscription updated! Your new plan is now active.');
      refetch();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentResult === 'failed' || paymentResult === 'cancelled') {
      toast.error(`Payment ${paymentResult}. Your plan was not changed.`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetch]);

  const handleUpgrade = async (planCode: PlanCode) => {
    setUpgradingPlan(planCode);
    try {
      const res = await initiateRenewal({ planCode }).unwrap();
      if (res.gatewayUrl) {
        window.location.href = res.gatewayUrl;
        return;
      }
      toast.success(res.message || 'Plan updated.');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to start plan upgrade payment.');
    } finally {
      setUpgradingPlan(null);
    }
  };

  const isLoading = isLoadingPlans || isLoadingSubscription;
  const currentPlanCode = snapshot?.plan?.code;
  const status = snapshot?.subscription?.status;

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push('/dashboard/settings')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Settings</span>
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Plan</h1>
        <p className="text-xs text-slate-500 font-normal">
          View your current plan and usage, or upgrade for more stores and staff seats.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Current plan summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Plan
                  </span>
                  <h3 className="font-extrabold text-lg text-slate-900">{snapshot?.plan.name}</h3>
                </div>
              </div>

              {status === 'PAST_DUE' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Payment Overdue</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Store Limit</span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {snapshot?.plan.maxStores === null ? 'Unlimited' : `Up to ${snapshot?.plan.maxStores}`}
                </span>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Staff per Store</span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {snapshot?.plan.maxStaffPerStore === null ? 'Unlimited' : `Up to ${snapshot?.plan.maxStaffPerStore}`}
                </span>
              </div>
            </div>

            {snapshot?.plan.monthlyPriceBdt !== undefined && Number(snapshot.plan.monthlyPriceBdt) > 0 && (
              <p className="text-[11px] text-slate-400 font-medium">
                Renews on{' '}
                {new Date(snapshot.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Plan comparison / upgrade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const isCurrent = plan.code === currentPlanCode;
              const isPaid = Number(plan.monthlyPriceBdt) > 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl border p-6 shadow-sm space-y-5 flex flex-col justify-between ${
                    isCurrent ? 'border-2 border-blue-600' : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-base text-slate-900">{plan.name}</h3>
                      {isCurrent && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full border border-blue-200">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">
                        ৳{Number(plan.monthlyPriceBdt).toLocaleString()}
                      </span>
                      {isPaid && <span className="text-xs font-semibold text-slate-500">/month</span>}
                    </div>

                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{plan.maxStores === null ? 'Unlimited stores' : `Up to ${plan.maxStores} store(s)`}</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          {plan.maxStaffPerStore === null
                            ? 'Unlimited staff per store'
                            : `Up to ${plan.maxStaffPerStore} staff per store`}
                        </span>
                      </li>
                    </ul>
                  </div>

                  {!isCurrent && isPaid && (
                    <button
                      onClick={() => handleUpgrade(plan.code)}
                      disabled={isInitiating}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20"
                    >
                      {upgradingPlan === plan.code && isInitiating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      <span>Upgrade to {plan.name}</span>
                    </button>
                  )}

                  {!isCurrent && !isPaid && (
                    <div className="text-center text-[11px] text-slate-400 font-medium py-2">
                      Downgrade happens automatically if your paid plan expires.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
