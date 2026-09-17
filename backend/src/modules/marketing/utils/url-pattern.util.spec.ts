import { assertValidUrlPattern, isValidUrlPattern, matchUrlPattern } from './url-pattern.util';

describe('assertValidUrlPattern', () => {
  it('accepts a leading-slash literal path', () => {
    expect(() => assertValidUrlPattern('/checkout')).not.toThrow();
    expect(() => assertValidUrlPattern('/')).not.toThrow();
  });

  it('accepts single- and any-depth wildcards', () => {
    expect(() => assertValidUrlPattern('/product/*')).not.toThrow();
    expect(() => assertValidUrlPattern('/collections/**')).not.toThrow();
    expect(() => assertValidUrlPattern('/product/clearance-*')).not.toThrow();
  });

  it('rejects a pattern without a leading slash', () => {
    expect(() => assertValidUrlPattern('product/*')).toThrow(/start with/);
  });

  it('rejects a query string or hash', () => {
    expect(() => assertValidUrlPattern('/x?y=1')).toThrow(/query string/);
    expect(() => assertValidUrlPattern('/x#frag')).toThrow(/query string/);
  });

  it('rejects triple-star and mixed **-in-segment', () => {
    expect(() => assertValidUrlPattern('/a/***')).toThrow(/\*\*\*/);
    expect(() => assertValidUrlPattern('/a/x**y')).toThrow(/its own segment/);
  });

  it('isValidUrlPattern mirrors the assertion', () => {
    expect(isValidUrlPattern('/product/*')).toBe(true);
    expect(isValidUrlPattern('bad')).toBe(false);
  });
});

describe('matchUrlPattern', () => {
  it('matches an exact path, ignoring a trailing slash on either side', () => {
    expect(matchUrlPattern('/checkout', '/checkout')).toBe(true);
    expect(matchUrlPattern('/checkout', '/checkout/')).toBe(true);
    expect(matchUrlPattern('/checkout/', '/checkout')).toBe(true);
    expect(matchUrlPattern('/checkout', '/checkout/review')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(matchUrlPattern('/Product/SILK', '/product/silk')).toBe(true);
  });

  it('* matches exactly one segment', () => {
    expect(matchUrlPattern('/product/*', '/product/silk-panjabi')).toBe(true);
    expect(matchUrlPattern('/product/*', '/product/a/b')).toBe(false);
    expect(matchUrlPattern('/product/*', '/product')).toBe(false);
  });

  it('** matches any depth including zero', () => {
    expect(matchUrlPattern('/collections/**', '/collections')).toBe(true);
    expect(matchUrlPattern('/collections/**', '/collections/eid')).toBe(true);
    expect(matchUrlPattern('/collections/**', '/collections/eid/men')).toBe(true);
    expect(matchUrlPattern('/collections/**', '/shop/eid')).toBe(false);
  });

  it('an in-segment wildcard anchors correctly', () => {
    expect(matchUrlPattern('/product/clearance-*', '/product/clearance-2026')).toBe(true);
    expect(matchUrlPattern('/product/clearance-*', '/product/new-arrivals')).toBe(false);
    expect(matchUrlPattern('/product/*-sale', '/product/eid-sale')).toBe(true);
    expect(matchUrlPattern('/product/*-sale', '/product/eid-sale-2026')).toBe(false);
  });

  it('ignores the query string / hash on the path', () => {
    expect(matchUrlPattern('/product/*', '/product/silk?ref=fb')).toBe(true);
    expect(matchUrlPattern('/checkout', '/checkout#step2')).toBe(true);
  });

  it('bare "/" only matches the site root', () => {
    expect(matchUrlPattern('/', '/')).toBe(true);
    expect(matchUrlPattern('/', '/shop')).toBe(false);
  });
});
