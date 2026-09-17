/**
 * Maps a storefront pathname to the canonical page type the pixel page-rules use.
 * The pathname passed in is the part AFTER `/store/<slug>` (the storefront root),
 * e.g. "/product/silk-panjabi" or "/" for the home page.
 */
export type StorefrontPageType =
  | 'HOME'
  | 'PRODUCT'
  | 'COLLECTION'
  | 'CATEGORY'
  | 'CART'
  | 'CHECKOUT'
  | 'THANK_YOU'
  | 'SEARCH'
  | 'BLOG'
  | 'OTHER';

export function resolvePageType(storefrontPath: string): StorefrontPageType {
  const p = (storefrontPath || '/').split(/[?#]/)[0].replace(/\/+$/, '') || '/';

  if (p === '/') return 'HOME';
  if (p.startsWith('/product')) return 'PRODUCT';
  if (p.startsWith('/collections') || p === '/shop' || p.startsWith('/shop/')) return 'COLLECTION';
  if (p.startsWith('/categories') || p.startsWith('/category')) return 'CATEGORY';
  if (p === '/cart' || p.startsWith('/cart/')) return 'CART';
  if (p === '/checkout/success' || p.startsWith('/checkout/success')) return 'THANK_YOU';
  if (p === '/checkout' || p.startsWith('/checkout')) return 'CHECKOUT';
  if (p === '/search' || p.startsWith('/search')) return 'SEARCH';
  if (p.startsWith('/blog')) return 'BLOG';
  return 'OTHER';
}

/**
 * Strips the `/store/<slug>` prefix off a Next.js pathname so the rest can be
 * matched against page rules. Returns "/" when the path is exactly the store root.
 */
export function toStorefrontPath(nextPathname: string, slug: string): string {
  const prefix = `/store/${slug}`;
  if (nextPathname === prefix) return '/';
  if (nextPathname.startsWith(prefix + '/')) return nextPathname.slice(prefix.length);
  return nextPathname || '/';
}
