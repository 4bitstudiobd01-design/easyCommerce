'use client';

import { CheckoutReviewView } from '@/features/storefront/components/CheckoutReviewView';

/**
 * Legacy /checkout/review route. The store-scoped route
 * (/store/[slug]/checkout/review) is canonical; this recovers the store from the
 * saved draft / cart.
 */
export default function CheckoutReviewPage() {
  return <CheckoutReviewView />;
}
