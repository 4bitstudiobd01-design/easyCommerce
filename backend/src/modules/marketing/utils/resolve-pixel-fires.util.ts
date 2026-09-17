import { matchUrlPattern } from './url-pattern.util';

export type PageScopeMode = 'ALL' | 'RULES';

export interface ResolvableRule {
  matchType: 'PAGE_TYPE' | 'URL_PATTERN';
  pageType: string | null;
  urlPattern: string | null;
  include: boolean;
}

export interface FireContext {
  /** Storefront pathname, e.g. "/product/silk-panjabi". */
  pathname: string;
  /** Resolved page type for this view (HOME, PRODUCT, ...) or null if unknown. */
  pageType: string | null;
}

/**
 * Should a pixel fire on this page?
 *
 *   pageScopeMode = ALL   -> always true
 *   pageScopeMode = RULES -> resolution order:
 *       any matching exclude (include=false) -> false
 *       else any matching include (include=true) -> true
 *       else -> false
 *
 * A rule "matches" when its matchType's target matches the context:
 *   PAGE_TYPE   -> rule.pageType === ctx.pageType (case-insensitive)
 *   URL_PATTERN -> matchUrlPattern(rule.urlPattern, ctx.pathname)
 *
 * Pure — no I/O. Used by the storefront PixelLoader (Phase 3) and the drawer's
 * "will fire on…" preview.
 */
export function resolvePixelFires(
  pageScopeMode: PageScopeMode,
  rules: ResolvableRule[],
  ctx: FireContext,
): boolean {
  if (pageScopeMode === 'ALL') return true;
  if (!rules || rules.length === 0) return false;

  const matches = (rule: ResolvableRule): boolean => {
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

  const anyExclude = rules.some((r) => !r.include && matches(r));
  if (anyExclude) return false;

  const anyInclude = rules.some((r) => r.include && matches(r));
  return anyInclude;
}
