import { hashEmail, hashPhone, hashText, buildHashedUserData } from './pii-hash.util';

describe('hashEmail', () => {
  it('lowercases + trims before hashing and is deterministic', () => {
    const a = hashEmail('  Rahim@Example.com ');
    const b = hashEmail('rahim@example.com');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
  it('returns undefined for empty / non-email input', () => {
    expect(hashEmail('')).toBeUndefined();
    expect(hashEmail(null)).toBeUndefined();
    expect(hashEmail('not-an-email')).toBeUndefined();
  });
});

describe('hashPhone', () => {
  it('normalises a BD local number to 880… before hashing', () => {
    expect(hashPhone('01712-345678')).toBe(hashPhone('8801712345678'));
    expect(hashPhone('+880 1712 345678')).toBe(hashPhone('8801712345678'));
  });
  it('returns a 64-char hex digest', () => {
    expect(hashPhone('01712345678')).toMatch(/^[a-f0-9]{64}$/);
  });
  it('returns undefined for empty input', () => {
    expect(hashPhone('')).toBeUndefined();
    expect(hashPhone(null)).toBeUndefined();
  });
});

describe('hashText', () => {
  it('collapses whitespace + lowercases', () => {
    expect(hashText('  Dhaka  City ')).toBe(hashText('dhaka city'));
  });
  it('undefined for empty', () => {
    expect(hashText('')).toBeUndefined();
  });
});

describe('buildHashedUserData', () => {
  it('includes only the fields that were supplied', () => {
    const out = buildHashedUserData({ email: 'a@b.com', phone: '01712345678' });
    expect(Object.keys(out).sort()).toEqual(['em', 'ph']);
    expect(out.em).toMatch(/^[a-f0-9]{64}$/);
    expect(out.fn).toBeUndefined();
  });
  it('maps all fields when present', () => {
    const out = buildHashedUserData({
      email: 'a@b.com',
      phone: '01712345678',
      firstName: 'Rahim',
      lastName: 'Ahmed',
      city: 'Dhaka',
      state: 'Dhaka',
      country: 'BD',
    });
    expect(Object.keys(out).sort()).toEqual(['country', 'ct', 'em', 'fn', 'ln', 'ph', 'st']);
  });
});
