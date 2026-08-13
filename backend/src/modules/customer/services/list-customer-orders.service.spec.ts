import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ListCustomerOrdersService } from './list-customer-orders.service';
import { CustomerEntity } from '../entities/customer.entity';
import { OrderEntity } from '../../order/entities/order.entity';

describe('ListCustomerOrdersService', () => {
  let service: ListCustomerOrdersService;
  let customerRepository: any;
  let orderRepository: any;
  let dataSource: any;
  let queryBuilder: any;

  const mockTenantId = 'tenant-1';
  const mockCustomerId = 'cust-1';

  beforeEach(async () => {
    customerRepository = {
      findOne: jest.fn(),
    };

    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'order-1',
            orderNumber: '#EC-1024',
            createdAt: new Date(),
            grandTotal: 4500,
            subtotal: 4440,
            deliveryFee: 60,
            paymentMethod: 'COD',
            paymentStatus: 'UNPAID',
            orderStatus: 'PROCESSING',
            customerName: 'Rahim Hossain',
            customerPhone: '01711000111',
          },
        ],
        1,
      ]),
    };

    orderRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };

    dataSource = {
      query: jest.fn().mockResolvedValue([{ orderId: 'order-1', itemsCount: 3 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListCustomerOrdersService,
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: orderRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ListCustomerOrdersService>(ListCustomerOrdersService);
  });

  it('should return paginated order history for customer with items count', async () => {
    customerRepository.findOne.mockResolvedValue({
      id: mockCustomerId,
      phone: '01711000111',
      tenantId: mockTenantId,
    });

    const result = await service.execute(mockCustomerId, mockTenantId, { page: 1, limit: 10 });

    expect(result).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].orderNumber).toBe('#EC-1024');
    expect(result.data[0].itemsCount).toBe(3);
    expect(result.data[0].grandTotal).toBe(4500);
    expect(result.meta.total).toBe(1);
  });

  it('should throw NotFoundException if customer does not exist or tenant mismatch occurs', async () => {
    customerRepository.findOne.mockResolvedValue(null);

    await expect(
      service.execute('invalid-cust', mockTenantId, { page: 1, limit: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should handle customer with 0 orders gracefully', async () => {
    customerRepository.findOne.mockResolvedValue({
      id: 'cust-2',
      phone: '01900000000',
      tenantId: mockTenantId,
    });

    queryBuilder.getManyAndCount.mockResolvedValueOnce([[], 0]);

    const result = await service.execute('cust-2', mockTenantId, { page: 1, limit: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});
