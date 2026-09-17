import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConvertLeadToCustomerService } from './convert-lead-to-customer.service';
import { LeadEntity, LeadStageEnum } from '../entities/lead.entity';
import { CustomerEntity, CustomerStatusEnum, CustomerAccountTypeEnum } from '../entities/customer.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { OrderItemEntity } from '../../order/entities/order-item.entity';
import { RecordCustomerActivityService } from './record-customer-activity.service';

describe('ConvertLeadToCustomerService', () => {
  let service: ConvertLeadToCustomerService;
  let leadRepository: any;
  let customerRepository: any;
  let orderRepository: any;
  let orderItemRepository: any;
  let recordCustomerActivityService: any;

  const mockTenantId = 'tenant-1';

  beforeEach(async () => {
    leadRepository = {
      findOne: jest.fn(),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    customerRepository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ id: 'cust-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'cust-1', ...entity })),
    };

    orderRepository = {
      create: jest.fn((dto) => ({ id: 'order-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve({ id: 'order-1', ...entity })),
    };

    orderItemRepository = {
      create: jest.fn((dto) => ({ id: 'item-1', ...dto })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    recordCustomerActivityService = {
      execute: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConvertLeadToCustomerService,
        {
          provide: getRepositoryToken(LeadEntity),
          useValue: leadRepository,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customerRepository,
        },
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(OrderItemEntity),
          useValue: orderItemRepository,
        },
        {
          provide: RecordCustomerActivityService,
          useValue: recordCustomerActivityService,
        },
      ],
    }).compile();

    service = module.get<ConvertLeadToCustomerService>(ConvertLeadToCustomerService);
  });

  it('should convert lead to customer and save purchased product items', async () => {
    leadRepository.findOne.mockResolvedValue({
      id: 'lead-1',
      tenantId: mockTenantId,
      name: 'Rahat Chowdhury',
      phone: '01811223344',
      stage: LeadStageEnum.QUALIFIED,
      estimatedValue: 10000,
    });

    customerRepository.findOne.mockResolvedValue(null);

    const items = [
      {
        productId: 'p-1',
        productTitle: 'Silk Jamdani Saree',
        quantity: 2,
        unitPrice: 8500,
        totalPrice: 17000,
      },
      {
        productTitle: 'Gift Box Packaging',
        quantity: 1,
        unitPrice: 500,
        totalPrice: 500,
      },
    ];

    const customer = await service.execute(
      'lead-1',
      mockTenantId,
      'store-1',
      17500,
      true,
      'BKASH',
      items,
    );

    expect(customer).toBeDefined();
    expect(customer.status).toBe(CustomerStatusEnum.ACTIVE);
    expect(customer.accountType).toBe(CustomerAccountTypeEnum.REGISTERED);

    // Assert order creation with total
    expect(orderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 17500,
        grandTotal: 17500,
        paymentMethod: 'BKASH',
      })
    );

    // Assert order items creation
    expect(orderItemRepository.save).toHaveBeenCalled();
  });
});
