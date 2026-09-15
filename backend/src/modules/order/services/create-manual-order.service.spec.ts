import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { CreateManualOrderService } from './create-manual-order.service';
import { OrderEntity, PaymentMethodEnum } from '../entities/order.entity';
import { ProductEntity } from '../../catalog/entities/product.entity';
import { LeadEntity } from '../../customer/entities/lead.entity';
import { AdjustStockService } from '../../inventory/services/adjust-stock.service';
import { ApplyCouponService } from '../../coupon/services/apply-coupon.service';
import { FindOrCreateCustomerService } from '../../customer/services/find-or-create-customer.service';
import { GenerateOrderNumberService } from './generate-order-number.service';
import { OrderCalculationService } from './order-calculation.service';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { CreateManualOrderDto } from '../dto/create-manual-order.dto';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

/**
 * Covers Phase 4 (Order <-> Branch attribution): CreateManualOrderService must
 * persist an admin-selected branchId onto the saved order, and must leave it
 * null when the manual order isn't attributed to a branch — a plain manual/
 * phone order with no outlet selected must never accidentally get branch-tagged.
 */
describe('CreateManualOrderService', () => {
  let service: CreateManualOrderService;
  let savedOrder: OrderEntity | undefined;

  const store = { id: 'store-1', slug: 'demo-store', tenantId: TENANT_ID, name: 'Demo Store' } as StoreEntity;

  const baseDto: CreateManualOrderDto = {
    customerName: 'Rahim Uddin',
    customerPhone: '01700000000',
    shippingAddress: 'House 1, Road 2',
    city: 'Dhaka',
    paymentMethod: PaymentMethodEnum.COD,
    deliveryFee: 60,
    discountAmount: 0,
    items: [
      {
        isCustomItem: true,
        customTitle: 'Gift wrapping',
        customUnitPrice: 50,
        quantity: 1,
      },
    ],
  };

  beforeEach(async () => {
    savedOrder = undefined;

    const orderRepositoryStub = {
      create: (plain: Partial<OrderEntity>) => plain as OrderEntity,
    };

    const managerStub = {
      // save() is called twice per order — once for the order itself, once for
      // its OrderStatusHistoryEntity row — so only capture the first (order) call.
      save: jest.fn(async (entity: Partial<OrderEntity>) => {
        if (savedOrder === undefined) {
          savedOrder = { ...entity, id: 'order-1' } as OrderEntity;
          return savedOrder;
        }
        return { ...entity, id: 'history-1' };
      }),
      create: (_entity: unknown, plain: unknown) => plain,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateManualOrderService,
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepositoryStub },
        { provide: getRepositoryToken(ProductEntity), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(LeadEntity), useValue: { find: jest.fn(async () => []), save: jest.fn() } },
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => cb(managerStub)),
          },
        },
        { provide: AdjustStockService, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
        { provide: ApplyCouponService, useValue: { execute: jest.fn() } },
        {
          provide: FindOrCreateCustomerService,
          useValue: { execute: jest.fn(async () => ({ id: 'customer-1' })) },
        },
        {
          provide: GenerateOrderNumberService,
          useValue: { execute: jest.fn(async () => 'ORD-000001') },
        },
        { provide: OrderCalculationService, useValue: new OrderCalculationService() },
      ],
    }).compile();

    service = module.get(CreateManualOrderService);
  });

  it('persists the provided branchId onto the created order', async () => {
    const dto: CreateManualOrderDto = { ...baseDto, branchId: 'branch-1' };

    const result = await service.execute(TENANT_ID, USER_ID, store, dto);

    expect(result.branchId).toBe('branch-1');
    expect(savedOrder?.branchId).toBe('branch-1');
  });

  it('leaves branchId undefined/null when no branch is selected (online/non-outlet order)', async () => {
    const result = await service.execute(TENANT_ID, USER_ID, store, baseDto);

    expect(result.branchId).toBeUndefined();
    expect(savedOrder?.branchId).toBeUndefined();
  });
});
