import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { RegisterCustomerService } from './register-customer.service';
import { CustomerEntity, CustomerAccountTypeEnum, CustomerStatusEnum } from '../../entities/customer.entity';
import { CustomerSessionEntity } from '../../entities/customer-session.entity';

describe('RegisterCustomerService', () => {
  let service: RegisterCustomerService;
  let customerRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let sessionRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };

  const TENANT_ID = 'tenant-uuid-1';
  const STORE_ID = 'store-uuid-1';

  beforeEach(async () => {
    customerRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'new-cust-uuid', ...dto })),
      save: jest.fn(async (entity) => ({ id: entity.id || 'cust-uuid-1', ...entity })),
    };

    sessionRepo = {
      create: jest.fn((dto) => ({ id: 'session-uuid-1', ...dto })),
      save: jest.fn(async (session) => session),
    };

    jwtService = {
      sign: jest.fn(() => 'mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterCustomerService,
        { provide: getRepositoryToken(CustomerEntity), useValue: customerRepo },
        { provide: getRepositoryToken(CustomerSessionEntity), useValue: sessionRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(RegisterCustomerService);
  });

  it('creates a new REGISTERED customer when registering for the first time', async () => {
    customerRepo.findOne.mockResolvedValue(null);

    const result = await service.execute(TENANT_ID, STORE_ID, {
      firstName: 'Rahat',
      lastName: 'Chowdhury',
      email: 'rahat@example.com',
      phone: '01886807417',
      password: 'StrongPassword123!',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(result.user.email).toBe('rahat@example.com');
    expect(customerRepo.save).toHaveBeenCalledTimes(1);

    const created = customerRepo.create.mock.calls[0][0];
    expect(created.accountType).toBe(CustomerAccountTypeEnum.REGISTERED);
    expect(created.status).toBe(CustomerStatusEnum.ACTIVE);
    expect(created.hasAccount).toBe(true);
    expect(created.passwordHash).toBeDefined();
  });

  it('upgrades an existing GUEST customer to REGISTERED when they register with the same phone number', async () => {
    const existingGuest: any = {
      id: 'existing-guest-uuid',
      tenantId: TENANT_ID,
      phone: '+8801886807417',
      firstName: 'Guest',
      lastName: 'Customer',
      email: undefined,
      status: CustomerStatusEnum.GUEST,
      accountType: CustomerAccountTypeEnum.GUEST,
      hasAccount: false,
    };

    customerRepo.findOne.mockResolvedValue(existingGuest);

    const result = await service.execute(TENANT_ID, STORE_ID, {
      firstName: 'Rahat',
      lastName: 'Chowdhury',
      email: 'rahatchowdhury661@gmail.com',
      phone: '01886807417',
      password: 'SecretPassword99!',
    });

    expect(result.accessToken).toBe('mock-jwt-token');
    expect(customerRepo.save).toHaveBeenCalledTimes(1);
    expect(existingGuest.accountType).toBe(CustomerAccountTypeEnum.REGISTERED);
    expect(existingGuest.status).toBe(CustomerStatusEnum.ACTIVE);
    expect(existingGuest.hasAccount).toBe(true);
    expect(existingGuest.email).toBe('rahatchowdhury661@gmail.com');
    expect(existingGuest.firstName).toBe('Rahat');
    expect(existingGuest.lastName).toBe('Chowdhury');
    expect(existingGuest.passwordHash).toBeDefined();
  });

  it('throws ConflictException if the customer already has an active account', async () => {
    const registeredCustomer = {
      id: 'already-registered',
      tenantId: TENANT_ID,
      phone: '01886807417',
      hasAccount: true,
      accountType: CustomerAccountTypeEnum.REGISTERED,
    };

    customerRepo.findOne.mockResolvedValue(registeredCustomer);

    await expect(
      service.execute(TENANT_ID, STORE_ID, {
        firstName: 'Rahat',
        lastName: 'Chowdhury',
        email: 'rahat@example.com',
        phone: '01886807417',
        password: 'Password123',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
