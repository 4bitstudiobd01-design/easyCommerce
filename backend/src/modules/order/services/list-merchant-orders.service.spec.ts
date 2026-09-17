import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ListMerchantOrdersService } from './list-merchant-orders.service';
import { OrderEntity } from '../entities/order.entity';
import { ConsignmentEntity } from '../../logistics/entities/consignment.entity';
import { OrderListDto } from '../dto/order-list.dto';

const TENANT_ID = 'tenant-1';

/**
 * Covers Phase 4 (Order <-> Branch attribution): the merchant order list must
 * accept an optional branchId filter, applied as a plain tenant-scoped
 * andWhere alongside status/paymentStatus/courier, and must not filter by
 * branch at all when branchId is omitted.
 */
describe('ListMerchantOrdersService', () => {
  let service: ListMerchantOrdersService;
  let andWhereSpy: jest.Mock;
  let queryBuilderStub: Record<string, jest.Mock>;

  beforeEach(async () => {
    andWhereSpy = jest.fn().mockReturnThis();

    queryBuilderStub = {
      where: jest.fn().mockReturnThis(),
      andWhere: andWhereSpy,
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(async () => [[], 0]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListMerchantOrdersService,
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: { createQueryBuilder: jest.fn(() => queryBuilderStub) },
        },
        {
          provide: getRepositoryToken(ConsignmentEntity),
          useValue: { find: jest.fn(async () => []) },
        },
      ],
    }).compile();

    service = module.get(ListMerchantOrdersService);
  });

  it('applies a branchId filter when provided', async () => {
    const dto: OrderListDto = { branchId: 'branch-1' } as OrderListDto;

    await service.execute(TENANT_ID, dto);

    expect(andWhereSpy).toHaveBeenCalledWith('order.branchId = :branchId', { branchId: 'branch-1' });
  });

  it('does not apply a branchId filter when omitted', async () => {
    const dto: OrderListDto = {} as OrderListDto;

    await service.execute(TENANT_ID, dto);

    const branchCalls = andWhereSpy.mock.calls.filter(([clause]) => String(clause).includes('branchId'));
    expect(branchCalls).toHaveLength(0);
  });
});
