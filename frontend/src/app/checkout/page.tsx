'use client';

import { CheckoutView } from '@/features/storefront/components/CheckoutView';

/**
 * Legacy /checkout route. The store-scoped route (/store/[slug]/checkout) is the
 * canonical URL; this stays so older links and in-flight carts keep working — the
 * store is recovered from the cart contents.
 */
export default function CheckoutPage() {
  return <CheckoutView />;
}
