'use client';

import { CheckoutSuccessView } from '@/features/storefront/components/CheckoutSuccessView';

/**
 * Store-scoped payment-success page: /store/[slug]/checkout/success. The shared
 * view reads the slug from the route params, so no query param is required here.
 */
export default function StoreCheckoutSuccessPage() {
  return <CheckoutSuccessView />;
}
