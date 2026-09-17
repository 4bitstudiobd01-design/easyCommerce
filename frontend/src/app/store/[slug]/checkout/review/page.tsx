'use client';

import { useParams } from 'next/navigation';
import { CheckoutReviewView } from '@/features/storefront/components/CheckoutReviewView';

/**
 * Store-scoped order review page: /store/[slug]/checkout/review. Shown between
 * the checkout form and the confirmation — the order is placed here.
 */
export default function StoreCheckoutReviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  return <CheckoutReviewView storeSlugFromRoute={slug} />;
}
