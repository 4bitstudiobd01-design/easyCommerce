'use client';

import { useParams } from 'next/navigation';
import { CheckoutView } from '@/features/storefront/components/CheckoutView';

/**
 * Canonical, store-scoped checkout route: /store/[slug]/checkout. The slug in the
 * URL is authoritative, so checkout keeps working across reloads and even with an
 * empty cart (unlike the legacy /checkout route, which infers the store from the
 * cart contents).
 */
export default function StoreCheckoutPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  return <CheckoutView storeSlugFromRoute={slug} />;
}
