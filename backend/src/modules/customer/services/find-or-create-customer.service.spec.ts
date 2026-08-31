import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FindOrCreateCustomerService } from './find-or-create-customer.service';
import { CustomerEntity, CustomerSourceEnum, CustomerAccountTypeEnum, CustomerStatusEnum } from '../entities/customer.entity';
import { CustomerAddressEntity } from '../entities/customer-address.entity';

const TENANT = 'tenant-1';

describe('FindOrCreateCustomerService', () => {
  let service: FindOrCreateCustomerService;
  let repo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let addressRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'new-customer', ...data })),
    };
    addressRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'new-addr', ...data })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindOrCreateCustomerService,
        { provide: getRepositoryToken(CustomerEntity), useValue: repo },
        { provide: getRepositoryToken(CustomerAddressEntity), useValue: addressRepo },
      ],
    }).compile();

    service = module.get(FindOrCreateCustomerService);
  });

  it('returns the existing customer instead of creating a duplicate', async () => {
    repo.findOne.mockResolvedValue({
      id: 'existing',
      tenantId: TENANT,
      phone: '01711000111',
      firstName: 'Rahim',
      lastName: 'Hossain',
      accountType: CustomerAccountTypeEnum.GUEST,
    });

    const result = await service.execute(TENANT, { phone: '01711000111', name: 'Rahim Hossain' });

    expect(result?.id).toBe('existing');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('creates a tenant-scoped guest customer when none exists on guest checkout', async () => {
    repo.findOne.mockResolvedValue(null);

    const result = await service.execute(TENANT, {
      phone: '01999000222',
      name: 'Nusrat Jahan',
      email: 'Nusrat@Example.COM',
      storeId: 'store-1',
      isGuest: true,
    });

    expect(result?.id).toBe('new-customer');
    expect(repo.save).toHaveBeenCalledTimes(1);

    const created = repo.create.mock.calls[0][0];
    expect(created.tenantId).toBe(TENANT);
    expect(created.firstName).toBe('Nusrat');
    expect(created.lastName).toBe('Jahan');
    expect(created.email).toBe('nusrat@example.com');
    expect(created.accountType).toBe(CustomerAccountTypeEnum.GUEST);
    expect(created.hasAccount).toBe(false);
    expect(created.source).toBe(CustomerSourceEnum.ONLINE_STORE);
  });

  it('upgrades existing guest customer to registered when user is logged in', async () => {
    const existing = {
      id: 'existing-guest',
      tenantId: TENANT,
      phone: '01886807417',
      firstName: 'Guest',
      lastName: 'Customer',
      status: CustomerStatusEnum.GUEST,
      accountType: CustomerAccountTypeEnum.GUEST,
      hasAccount: false,
    };
    repo.findOne.mockResolvedValue(existing);

    const result = await service.execute(TENANT, {
      phone: '01886807417',
      name: 'Rahat Chowdhury',
      userId: 'user-uuid-1',
      isGuest: false,
    });

    expect(result?.id).toBe('existing-guest');
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(existing.accountType).toBe(CustomerAccountTypeEnum.REGISTERED);
    expect(existing.status).toBe(CustomerStatusEnum.ACTIVE);
    expect(existing.firstName).toBe('Rahat');
    expect(existing.lastName).toBe('Chowdhury');
  });

  it('splits a single-word name without losing it', async () => {
    repo.findOne.mockResolvedValue(null);

    await service.execute(TENANT, { phone: '01555000333', name: 'Rahim' });

    const created = repo.create.mock.calls[0][0];
    expect(created.firstName).toBe('Rahim');
    expect(created.lastName).toBe('-');
  });

  it('falls back to a placeholder name when none is supplied', async () => {
    repo.findOne.mockResolvedValue(null);

    await service.execute(TENANT, { phone: '01555000444' });

    const created = repo.create.mock.calls[0][0];
    expect(created.firstName).toBe('Guest');
    expect(created.lastName).toBe('Customer');
  });

  it('returns null for a blank phone rather than creating a junk record', async () => {
    const result = await service.execute(TENANT, { phone: '   ' });

    expect(result).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('recovers the winning row when a concurrent insert wins the unique index race', async () => {
    const conflict: any = new Error('duplicate key value violates unique constraint');
    conflict.code = '23505';

    repo.findOne
      .mockResolvedValueOnce(null) // initial lookup: not there yet
      .mockResolvedValueOnce({ id: 'race-winner', tenantId: TENANT, phone: '01711000111' });
    repo.save.mockRejectedValueOnce(conflict);

    const result = await service.execute(TENANT, { phone: '01711000111', name: 'Rahim' });

    expect(result?.id).toBe('race-winner');
  });

  it('never throws into the checkout path when customer resolution fails', async () => {
    repo.findOne.mockRejectedValue(new Error('database is down'));

    await expect(service.execute(TENANT, { phone: '01711000111' })).resolves.toBeNull();
  });
});

