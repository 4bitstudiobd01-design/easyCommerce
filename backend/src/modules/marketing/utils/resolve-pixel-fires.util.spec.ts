import { resolvePixelFires, ResolvableRule } from './resolve-pixel-fires.util';

const rule = (r: Partial<ResolvableRule>): ResolvableRule => ({
  matchType: 'PAGE_TYPE',
  pageType: null,
  urlPattern: null,
  include: true,
  ...r,
});

describe('resolvePixelFires', () => {
  it('ALL mode always fires, rules ignored', () => {
    expect(resolvePixelFires('ALL', [], { pathname: '/x', pageType: 'HOME' })).toBe(true);
    expect(
      resolvePixelFires('ALL', [rule({ matchType: 'URL_PATTERN', urlPattern: '/never', include: false })], {
        pathname: '/never',
        pageType: null,
      }),
    ).toBe(true);
  });

  it('RULES mode with no rules never fires', () => {
    expect(resolvePixelFires('RULES', [], { pathname: '/x', pageType: 'PRODUCT' })).toBe(false);
  });

  it('fires when a PAGE_TYPE include rule matches', () => {
    const rules = [rule({ matchType: 'PAGE_TYPE', pageType: 'PRODUCT' })];
    expect(resolvePixelFires('RULES', rules, { pathname: '/product/a', pageType: 'PRODUCT' })).toBe(true);
    expect(resolvePixelFires('RULES', rules, { pathname: '/cart', pageType: 'CART' })).toBe(false);
  });

  it('PAGE_TYPE match is case-insensitive', () => {
    const rules = [rule({ matchType: 'PAGE_TYPE', pageType: 'product' })];
    expect(resolvePixelFires('RULES', rules, { pathname: '/p', pageType: 'PRODUCT' })).toBe(true);
  });

  it('fires when a URL_PATTERN include rule matches', () => {
    const rules = [rule({ matchType: 'URL_PATTERN', urlPattern: '/product/**' })];
    expect(resolvePixelFires('RULES', rules, { pathname: '/product/silk/x', pageType: null })).toBe(true);
    expect(resolvePixelFires('RULES', rules, { pathname: '/shop', pageType: null })).toBe(false);
  });

  it('an exclude rule overrides a matching include', () => {
    const rules = [
      rule({ matchType: 'PAGE_TYPE', pageType: 'PRODUCT', include: true }),
      rule({ matchType: 'URL_PATTERN', urlPattern: '/product/clearance-*', include: false }),
    ];
    expect(
      resolvePixelFires('RULES', rules, { pathname: '/product/silk', pageType: 'PRODUCT' }),
    ).toBe(true);
    expect(
      resolvePixelFires('RULES', rules, { pathname: '/product/clearance-2026', pageType: 'PRODUCT' }),
    ).toBe(false);
  });

  it('an exclude that matches but no include still does not fire', () => {
    const rules = [rule({ matchType: 'PAGE_TYPE', pageType: 'CART', include: false })];
    expect(resolvePixelFires('RULES', rules, { pathname: '/cart', pageType: 'CART' })).toBe(false);
  });

  it('ignores rules whose target field is null', () => {
    const rules = [
      rule({ matchType: 'PAGE_TYPE', pageType: null }),
      rule({ matchType: 'URL_PATTERN', urlPattern: null }),
    ];
    expect(resolvePixelFires('RULES', rules, { pathname: '/x', pageType: 'HOME' })).toBe(false);
  });
});
