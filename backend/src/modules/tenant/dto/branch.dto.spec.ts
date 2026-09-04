import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBranchDto, UpdateBranchDto } from './branch.dto';

async function errorsFor(payload: Partial<CreateBranchDto>) {
  const dto = plainToInstance(CreateBranchDto, payload);
  const errors = await validate(dto);
  return errors.map((e) => e.property);
}

describe('CreateBranchDto', () => {
  it('accepts a well-formed branch payload', async () => {
    expect(
      await errorsFor({
        name: 'Dhanmondi Outlet',
        code: 'DHN-01',
        address: 'House 12, Road 5, Dhanmondi',
        city: 'Dhaka',
        phone: '01700000000',
        email: 'dhanmondi@example.com',
        isDefault: true,
        isActive: true,
      }),
    ).toEqual([]);
  });

  it('requires name and code', async () => {
    expect(await errorsFor({})).toEqual(expect.arrayContaining(['name', 'code']));
  });

  it('rejects an invalid email', async () => {
    expect(await errorsFor({ name: 'A', code: 'A-1', email: 'not-an-email' })).toContain('email');
  });
});

describe('UpdateBranchDto', () => {
  it('accepts a partial payload with all fields optional', async () => {
    const dto = plainToInstance(UpdateBranchDto, { isActive: false });
    const errors = await validate(dto);
    expect(errors).toEqual([]);
  });
});
