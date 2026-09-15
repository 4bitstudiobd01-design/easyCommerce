/**
 * Client mirror of the backend
 * `modules/marketing/utils/{url-pattern,resolve-pixel-fires}.util.ts`.
 * Keep the two in sync — the backend is the source of truth at fire time; this
 * copy only powers the drawer's "will fire on…" preview.
 */

export type PageScopeMode = 'ALL' | 'RULES';

export interface PreviewRule {
  matchType: 'PAGE_TYPE' | 'URL_PATTERN';
  pageType: string | null;
  urlPattern: string | null;
  include: boolean;
}

const SEGMENT_RE = /^[A-Za-z0-9._~!$&'()+,;=:@%*-]+$/;

export function isValidUrlPattern(pattern: string): boolean {
  const p = (pattern ?? '').trim();
  if (!p.startsWith('/')) return false;
  if (p.includes('?') || p.includes('#')) return false;
  if (/\*{3,}/.test(p)) return false;
  const segments = stripSlashes(p).split('/');
  for (const seg of segments) {
    if (seg === '') continue;
    if (seg === '*' || seg === '**') continue;
    if (seg.includes('**')) return false;
    const withoutStar = seg.replace(/\*/g, '');
    if (withoutStar.length > 0 && !SEGMENT_RE.test(seg)) return false;
  }
  return true;
}

export function matchUrlPattern(pattern: string, pathname: string): boolean {
  const patSegs = stripSlashes(pattern.trim().toLowerCase()).split('/').filter((s) => s !== '');
  const pathSegs = stripSlashes(stripQuery(pathname).trim().toLowerCase())
    .split('/')
    .filter((s) => s !== '');
  return matchSegments(patSegs, 0, pathSegs, 0);
}

function matchSegments(pat: string[], pi: number, path: string[], si: number): boolean {
  if (pi === pat.length) return si === path.length;
  const token = pat[pi];
  if (token === '**') {
    for (let c = 0; si + c <= path.length; c += 1) {
      if (matchSegments(pat, pi + 1, path, si + c)) return true;
    }
    return false;
  }
  if (si >= path.length) return false;
  if (token === '*') return matchSegments(pat, pi + 1, path, si + 1);
  if (segmentMatches(token, path[si])) return matchSegments(pat, pi + 1, path, si + 1);
  return false;
}

function segmentMatches(patternSeg: string, pathSeg: string): boolean {
  if (!patternSeg.includes('*')) return patternSeg === pathSeg;
  const parts = patternSeg.split('*');
  let idx = 0;
  for (let k = 0; k < parts.length; k += 1) {
    const part = parts[k];
    if (part === '') {
      if (k === parts.length - 1) return true;
      continue;
    }
    const found = pathSeg.indexOf(part, idx);
    if (found === -1) return false;
    if (k === 0 && found !== 0) return false;
    idx = found + part.length;
  }
  return patternSeg.endsWith('*') || idx === pathSeg.length;
}

function stripSlashes(s: string): string {
  return s.replace(/^\/+/, '').replace(/\/+$/, '');
}
function stripQuery(s: string): string {
  const q = s.search(/[?#]/);
  return q === -1 ? s : s.slice(0, q);
}

export function resolvePixelFires(
  pageScopeMode: PageScopeMode,
  rules: PreviewRule[],
  ctx: { pathname: string; pageType: string | null },
): boolean {
  if (pageScopeMode === 'ALL') return true;
  if (!rules || rules.length === 0) return false;

  const matches = (rule: PreviewRule): boolean => {
    if (rule.matchType === 'PAGE_TYPE') {
      if (!rule.pageType || !ctx.pageType) return false;
      return rule.pageType.toUpperCase() === ctx.pageType.toUpperCase();
    }
    if (rule.matchType === 'URL_PATTERN') {
      if (!rule.urlPattern) return false;
      return matchUrlPattern(rule.urlPattern, ctx.pathname);
    }
    return false;
  };

  if (rules.some((r) => !r.include && matches(r))) return false;
  return rules.some((r) => r.include && matches(r));
}

/** Representative storefront pages the preview checks against. */
export const PREVIEW_PAGES: { label: string; pathname: string; pageType: string }[] = [
  { label: 'Home', pathname: '/', pageType: 'HOME' },
  { label: 'Product page', pathname: '/product/silk-panjabi', pageType: 'PRODUCT' },
  { label: 'Clearance product', pathname: '/product/clearance-2026', pageType: 'PRODUCT' },
  { label: 'Collection', pathname: '/collections/eid', pageType: 'COLLECTION' },
  { label: 'Category', pathname: '/categories/men', pageType: 'CATEGORY' },
  { label: 'Cart', pathname: '/cart', pageType: 'CART' },
  { label: 'Checkout', pathname: '/checkout', pageType: 'CHECKOUT' },
  { label: 'Thank-you', pathname: '/checkout/success', pageType: 'THANK_YOU' },
  { label: 'Search', pathname: '/search', pageType: 'SEARCH' },
  { label: 'Blog', pathname: '/blog/eid-guide', pageType: 'BLOG' },
];

export const PAGE_TYPE_OPTIONS = [
  'HOME',
  'PRODUCT',
  'COLLECTION',
  'CATEGORY',
  'CART',
  'CHECKOUT',
  'THANK_YOU',
  'SEARCH',
  'BLOG',
  'OTHER',
] as const;
