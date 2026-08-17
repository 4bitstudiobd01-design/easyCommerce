import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  features: string[];
  displayOrder: number;
  monthlyPriceBdt: string;
  maxStores: number | null;
  maxStaffPerStore: number | null;
}

// Mirrors the derivation in features/billing/api/billingApi.ts: NEXT_PUBLIC_API_URL
// points at a module path, so strip the trailing segment to reach the API root.
const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1/admin').replace(
  /\/(admin|stores|auth)$/,
  '',
);

async function fetchPlans(): Promise<Plan[] | null> {
  try {
    const res = await fetch(`${API_ROOT}/billing/plans`, {
      // Plans change rarely; this renders on every landing page view.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as { data?: Plan[] };
    return payload.data ?? null;
  } catch {
    return null;
  }
}

function formatPrice(monthlyPriceBdt: string): string {
  return `৳${Number(monthlyPriceBdt).toLocaleString('en-IN')}`;
}

/** Turns the plan's real limits into the first two bullet points. */
function limitBullets(plan: Plan): string[] {
  return [
    plan.maxStores === null ? 'Unlimited stores' : `${plan.maxStores} store${plan.maxStores > 1 ? 's' : ''}`,
    plan.maxStaffPerStore === null
      ? 'Unlimited staff per store'
      : `Up to ${plan.maxStaffPerStore} staff per store`,
  ];
}

export async function Pricing() {
  const plans = await fetchPlans();

  // Prices are a commercial promise — showing a stale or invented figure is
  // worse than showing none, so the section is omitted if the API is down.
  if (!plans?.length) return null;

  // The middle tier is highlighted; with three plans that is the Growth tier.
  const popularIndex = plans.length === 3 ? 1 : -1;

  return (
    <section id="pricing" className="py-20 px-6 bg-slate-50/60 scroll-mt-16">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Fair BDT Pricing
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Start Free, Upgrade When You Grow
          </h2>
          <p className="text-slate-600 text-base">
            No hidden fees. Every plan includes full checkout, courier booking, and inventory tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, index) => {
            const isPopular = index === popularIndex;
            const isFree = Number(plan.monthlyPriceBdt) <= 0;

            return (
              <div
                key={plan.id}
                className={`solid-card p-8 rounded-2xl flex flex-col justify-between relative ${
                  isPopular ? 'border-2 border-blue-600 shadow-xl' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formatPrice(plan.monthlyPriceBdt)}
                    </span>
                    <span className="text-sm font-semibold text-slate-500">
                      {isFree ? '/forever' : '/month'}
                    </span>
                  </div>

                  <ul className="space-y-3 pt-2">
                    {[...limitBullets(plan), ...plan.features].map((feat) => (
                      <li
                        key={feat}
                        className="flex items-center gap-3 text-xs text-slate-700 font-medium"
                      >
                        <div className="p-1 bg-blue-50 rounded-full text-blue-600">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    // Every plan starts with signup: this section is seen by
                    // logged-out visitors, so linking to billing settings would
                    // bounce them through the auth redirect instead.
                    href="/register"
                    className={`w-full py-3.5 px-4 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md ${
                      isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{isFree ? 'Start For Free' : `Start with ${plan.name}`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 font-medium">
          Already have a store?{' '}
          <Link href="/dashboard/settings/billing" className="text-blue-600 font-bold hover:underline">
            Manage your plan from your dashboard
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
