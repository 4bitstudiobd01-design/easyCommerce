'use client';

import { CheckoutSuccessView } from '@/features/storefront/components/CheckoutSuccessView';

/**
 * Legacy /checkout/success route. The store-scoped route
 * (/store/[slug]/checkout/success) is canonical; this stays for older links,
 * recovering the store from the ?storeSlug= query param.
 */
export default function CheckoutSuccessPage() {
  return <CheckoutSuccessView />;
}
