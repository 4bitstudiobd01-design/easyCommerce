import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportCustomersDto, ImportCustomerRowDto } from './import-customer.dto';

const TAB = String.fromCharCode(9);
const NEWLINE = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

const validRow = {
  firstName: 'Rahim',
  lastName: 'Hossain',
  email: 'rahim@example.com',
  phone: '01711000111',
};

async function errorsFor(row: Partial<ImportCustomerRowDto>) {
  const dto = plainToInstance(ImportCustomerRowDto, { ...validRow, ...row });
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

/**
 * CSV is parsed client-side and posted as JSON, so this DTO is the only validation
 * boundary. These cover the payloads a hand-crafted request could send that the
 * browser importer never would.
 */
describe('ImportCustomerRowDto', () => {
  it('accepts a well-formed row', async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it('accepts Bangla names', async () => {
    expect(await errorsFor({ firstName: 'রহিম', lastName: 'হোসেন' })).toEqual([]);
  });

  it('rejects control characters that would corrupt an exported CSV', async () => {
    expect(await errorsFor({ firstName: 'Rahim' + TAB + 'X' })).toContain('firstName');
    expect(await errorsFor({ lastName: 'Hossain' + NEWLINE + 'X' })).toContain('lastName');
    expect(await errorsFor({ firstName: 'Rahim' + NUL })).toContain('firstName');
  });

  it('rejects spreadsheet formula prefixes', async () => {
    for (const prefix of ['=', '+', '-', '@']) {
      expect(await errorsFor({ firstName: `${prefix}cmd|'/C calc'!A0` })).toContain('firstName');
    }
  });

  it('rejects a phone containing letters or scripts', async () => {
    expect(await errorsFor({ phone: '<script>alert(1)</script>' })).toContain('phone');
    expect(await errorsFor({ phone: 'not-a-number' })).toContain('phone');
  });

  it('accepts common phone formatting', async () => {
    expect(await errorsFor({ phone: '+880 1711-000111' })).toEqual([]);
  });

  it('enforces field length caps', async () => {
    expect(await errorsFor({ firstName: 'a'.repeat(101) })).toContain('firstName');
    expect(await errorsFor({ email: `${'a'.repeat(250)}@example.com` })).toContain('email');
  });

  it('trims surrounding whitespace rather than rejecting it', async () => {
    const dto = plainToInstance(ImportCustomerRowDto, { ...validRow, firstName: '  Rahim  ' });
    expect(await validate(dto)).toEqual([]);
    expect(dto.firstName).toBe('Rahim');
  });
});

describe('ImportCustomersDto', () => {
  const rows = (n: number) => Array.from({ length: n }, () => ({ ...validRow }));

  it('rejects an empty batch', async () => {
    const dto = plainToInstance(ImportCustomersDto, { customers: [] });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('customers');
  });

  it('caps batch size', async () => {
    const dto = plainToInstance(ImportCustomersDto, { customers: rows(501) });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('customers');
  });

  it('accepts a batch at the cap', async () => {
    const dto = plainToInstance(ImportCustomersDto, { customers: rows(500) });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects a non-boolean overwrite flag', async () => {
    const dto = plainToInstance(ImportCustomersDto, {
      customers: rows(1),
      overwrite: 'yes-please',
    });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('overwrite');
  });
});
