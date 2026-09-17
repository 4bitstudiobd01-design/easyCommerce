/**
 * Hand-rolled path-glob matcher for pixel page rules — deliberately tiny, no new
 * dependency (see workflow locked decision #6).
 *
 * Grammar:
 *   - leading slash required (a pattern without one is invalid)
 *   - case-insensitive
 *   - `*`  matches exactly one path segment (no slashes)
 *   - `**` matches any number of segments (including zero)
 *   - a trailing slash on the pattern or path is ignored
 *   - the query string / hash on the path is ignored (compare pathname only)
 *
 * Examples:
 *   /product/*            matches /product/silk-panjabi, not /product/a/b
 *   /product/clearance-*  matches /product/clearance-2026
 *   /collections/**       matches /collections, /collections/eid, /collections/eid/men
 *   /checkout             matches /checkout and /checkout/
 */

const SEGMENT_RE = /^[A-Za-z0-9._~!$&'()+,;=:@%*-]+$/;

/** Throws with a human message if the pattern is malformed. */
export function assertValidUrlPattern(pattern: string): void {
  const p = (pattern ?? '').trim();
  if (!p.startsWith('/')) {
    throw new Error('URL pattern must start with "/".');
  }
  if (p.includes('?') || p.includes('#')) {
    throw new Error('URL pattern must not contain a query string or hash.');
  }
  if (/\*{3,}/.test(p)) {
    throw new Error('Use "*" for one segment or "**" for any depth — not "***".');
  }
  const segments = stripSlashes(p).split('/');
  for (const seg of segments) {
    if (seg === '' ) continue; // root pattern "/"
    if (seg === '*' || seg === '**') continue;
    // a literal segment (possibly with a single `*` wildcard inside it)
    const withoutStar = seg.replace(/\*/g, '');
    if (seg.includes('**')) {
      throw new Error(`"**" must be its own segment, not "${seg}".`);
    }
    if (withoutStar.length > 0 && !SEGMENT_RE.test(seg)) {
      throw new Error(`Segment "${seg}" contains characters not allowed in a URL path.`);
    }
  }
}

export function isValidUrlPattern(pattern: string): boolean {
  try {
    assertValidUrlPattern(pattern);
    return true;
  } catch {
    return false;
  }
}

/** Does `pathname` (a storefront path like "/product/x") match `pattern`? */
export function matchUrlPattern(pattern: string, pathname: string): boolean {
  const patSegs = stripSlashes(pattern.trim().toLowerCase()).split('/').filter((s) => s !== '');
  const pathSegs = stripSlashes(stripQuery(pathname).trim().toLowerCase())
    .split('/')
    .filter((s) => s !== '');
  return matchSegments(patSegs, 0, pathSegs, 0);
}

function matchSegments(pat: string[], pi: number, path: string[], si: number): boolean {
  if (pi === pat.length) {
    return si === path.length;
  }

  const token = pat[pi];

  if (token === '**') {
    // `**` consumes zero or more path segments — try each split point.
    for (let consume = 0; si + consume <= path.length; consume += 1) {
      if (matchSegments(pat, pi + 1, path, si + consume)) return true;
    }
    return false;
  }

  if (si >= path.length) return false;

  if (token === '*') {
    return matchSegments(pat, pi + 1, path, si + 1);
  }

  if (segmentMatches(token, path[si])) {
    return matchSegments(pat, pi + 1, path, si + 1);
  }

  return false;
}

/** A single segment: an in-segment `*` is a wildcard for any run of chars. */
function segmentMatches(patternSeg: string, pathSeg: string): boolean {
  if (!patternSeg.includes('*')) return patternSeg === pathSeg;
  const parts = patternSeg.split('*');
  let idx = 0;
  for (let k = 0; k < parts.length; k += 1) {
    const part = parts[k];
    if (part === '') {
      // leading/trailing/adjacent star
      if (k === parts.length - 1) return true; // trailing star matches the rest
      continue;
    }
    const found = pathSeg.indexOf(part, idx);
    if (found === -1) return false;
    if (k === 0 && found !== 0) return false; // no leading star -> must anchor at start
    idx = found + part.length;
  }
  // if the pattern had no trailing star, the whole segment must be consumed
  return patternSeg.endsWith('*') || idx === pathSeg.length;
}

function stripSlashes(s: string): string {
  return s.replace(/^\/+/, '').replace(/\/+$/, '');
}

function stripQuery(s: string): string {
  const q = s.search(/[?#]/);
  return q === -1 ? s : s.slice(0, q);
}
