'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Dedicated /dashboard/products/[id]/edit route.
 *
 * The product form is a single ~1100-line component covering identity, pricing, tax,
 * inventory, media, fulfillment and attributes. Copying it here would leave two forms
 * to keep in sync, so this route hands off to that same form in edit mode instead.
 */
export default function EditProductRoute() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      router.replace(`/dashboard/products/create?edit=${productId}`);
    }
  }, [productId, router]);

  return (
    <div className="p-12 flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs font-semibold">Opening product editor…</span>
      </div>
    </div>
  );
}
