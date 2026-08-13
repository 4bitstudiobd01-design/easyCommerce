import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ListCustomerActivitiesService } from './list-customer-activities.service';
import { CustomerActivityEntity } from '../entities/customer-activity.entity';
import { CustomerEntity } from '../entities/customer.entity';

describe('ListCustomerActivitiesService', () => {
  let service: ListCustomerActivitiesService;
  let activityRepository: any;
  let customerRepository: any;
  let dataSource: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';

  beforeEach(async () => {
    activityRepository = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'act-1',
          eventType: 'NOTE_ADDED',
          title: 'Internal Note Added',
          description: 'Customer requested delivery after 6 PM',
          actorName: 'Belal',
          createdAt: new Date(),
        },
      ]),
    };

    customerRepository = {
      findOne: jest.fn(),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCustomerActivitiesService,
        {
          provide: getRepositoryToken(CustomerActivityEntity),
          useValue: activityRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ListCustomerActivitiesService>(ListCustomerActivitiesService);
  });

  it('should return unified chronological activity timeline', async () => {
    customerRepository.findOne.mockResolvedValue({
      id: mockCustomerId,
      phone: '01711000111',
      tenantId: mockTenantId,
      source: 'ONLINE_STORE',
      createdAt: new Date(Date.now() - 86400000),
    });

    const result = await service.execute(mockCustomerId, mockTenantId);

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(2); // Recorded note activity + Customer created event
    expect(result[0].eventType).toBe('NOTE_ADDED');
  });

  it('should throw NotFoundException if customer does not exist for tenant', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(service.execute('invalid-cust', mockTenantId)).rejects.toThrow(NotFoundException);
  });
});
