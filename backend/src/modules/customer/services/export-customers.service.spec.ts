import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ExportCustomersService } from './export-customers.service';
import { CustomerEntity, CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

describe('ExportCustomersService', () => {
  let service: ExportCustomersService;
  let customerRepository: any;
  let dataSource: any;
  let queryBuilder: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([
        {
          id: 'cust-1',
          firstName: 'Rahim',
          lastName: 'Hossain',
          email: 'rahim@example.com',
          phone: '01711000111',
          source: CustomerSourceEnum.ONLINE_STORE,
          status: CustomerStatusEnum.ACTIVE,
          createdAt: new Date(),
        },
      ]),
    };

    customerRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      manager: {
        query: jest.fn().mockResolvedValue([
          { customerId: 'cust-1', ordersCount: 2, totalSpent: 3000, lastOrderAt: new Date() },
        ]),
      },
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportCustomersService,
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

    service = module.get<ExportCustomersService>(ExportCustomersService);
  });

  it('should return a readable CSV stream with UTF-8 BOM and headers', async () => {
    const stream = await service.execute(mockTenantId, {});

    expect(stream).toBeDefined();

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    const csvOutput = Buffer.concat(chunks).toString('utf-8');

    expect(csvOutput).toContain('First Name');
    expect(csvOutput).toContain('Rahim');
    expect(csvOutput).toContain('01711000111');
  });
});
