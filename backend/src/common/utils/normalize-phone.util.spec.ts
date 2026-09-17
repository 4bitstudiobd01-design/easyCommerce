import { normalizePhone, getPhoneLookupVariants, toBdLocalMobile } from './normalize-phone.util';

describe('normalizePhone', () => {
  it('promotes a Bangladesh local number to its +880 international form', () => {
    expect(normalizePhone('01712345678')).toBe('+8801712345678');
  });

  it('strips separators and spacing entered by the user', () => {
    expect(normalizePhone('01712-345678')).toBe('+8801712345678');
    expect(normalizePhone('+880 1712 345678')).toBe('+8801712345678');
    expect(normalizePhone('  01712 345678  ')).toBe('+8801712345678');
  });

  it('adds the missing plus to a bare 880 country code', () => {
    expect(normalizePhone('8801712345678')).toBe('+8801712345678');
  });

  it('leaves an already-normalized number unchanged', () => {
    expect(normalizePhone('+8801712345678')).toBe('+8801712345678');
  });

  it('preserves non-Bangladesh country codes', () => {
    expect(normalizePhone('+1 (509) 278-2472')).toBe('+15092782472');
  });

  it('is idempotent, so repeated normalization is safe', () => {
    const once = normalizePhone('01712-345678');
    expect(normalizePhone(once)).toBe(once);
  });
});

describe('getPhoneLookupVariants', () => {
  it('returns local, international and raw variants for Bangladesh numbers', () => {
    const variants = getPhoneLookupVariants('01886807417');
    expect(variants).toContain('01886807417');
    expect(variants).toContain('+8801886807417');
    expect(variants).toContain('8801886807417');
  });

  it('resolves variants when passed international format with plus', () => {
    const variants = getPhoneLookupVariants('+8801886807417');
    expect(variants).toContain('01886807417');
    expect(variants).toContain('+8801886807417');
  });

  it('handles empty input gracefully', () => {
    expect(getPhoneLookupVariants('')).toEqual([]);
  });
});

describe('toBdLocalMobile', () => {
  it('keeps a valid 11-digit local number', () => {
    expect(toBdLocalMobile('01712345678')).toBe('01712345678');
  });

  it('strips the +880 country code', () => {
    expect(toBdLocalMobile('+8801712345678')).toBe('01712345678');
  });

  it('strips a bare 880 country code', () => {
    expect(toBdLocalMobile('8801712345678')).toBe('01712345678');
  });

  it('strips separators and spacing', () => {
    expect(toBdLocalMobile('+880 17-1234 5678')).toBe('01712345678');
  });

  it('rejects a country-code-only string', () => {
    expect(toBdLocalMobile('+880')).toBeNull();
  });

  it('rejects a too-short number', () => {
    expect(toBdLocalMobile('01712345')).toBeNull();
  });

  it('rejects an invalid operator prefix', () => {
    expect(toBdLocalMobile('01212345678')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(toBdLocalMobile('')).toBeNull();
  });
});

