import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetPublicPlatformStatsService } from './get-public-platform-stats.service';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { OrderEntity } from '../../order/entities/order.entity';

describe('GetPublicPlatformStatsService', () => {
  let service: GetPublicPlatformStatsService;

  const mockStoreRepository = {
    count: jest.fn(),
  };

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockOrderRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPublicPlatformStatsService,
        { provide: getRepositoryToken(StoreEntity), useValue: mockStoreRepository },
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<GetPublicPlatformStatsService>(GetPublicPlatformStatsService);
  });

  it('returns aggregated public figures', async () => {
    mockStoreRepository.count.mockResolvedValue(12);
    mockOrderRepository.count.mockResolvedValue(438);
    mockQueryBuilder.getRawOne.mockResolvedValue({ sum: '245000.50' });

    const result = await service.execute();

    expect(result).toEqual({
      activeStoresCount: 12,
      totalOrdersCount: 438,
      totalOrderValue: 245000.5,
      modulesShipped: 19,
    });
  });

  it('counts only active stores', async () => {
    mockStoreRepository.count.mockResolvedValue(0);
    mockOrderRepository.count.mockResolvedValue(0);
    mockQueryBuilder.getRawOne.mockResolvedValue({ sum: '0' });

    await service.execute();

    expect(mockStoreRepository.count).toHaveBeenCalledWith({ where: { isActive: true } });
  });

  it('returns zero order value when there are no orders', async () => {
    mockStoreRepository.count.mockResolvedValue(3);
    mockOrderRepository.count.mockResolvedValue(0);
    mockQueryBuilder.getRawOne.mockResolvedValue({ sum: null });

    const result = await service.execute();

    expect(result.totalOrderValue).toBe(0);
  });

  it('survives an empty aggregate row', async () => {
    mockStoreRepository.count.mockResolvedValue(1);
    mockOrderRepository.count.mockResolvedValue(0);
    mockQueryBuilder.getRawOne.mockResolvedValue(undefined);

    const result = await service.execute();

    expect(result.totalOrderValue).toBe(0);
  });

  it('aggregates in SQL rather than loading every order', async () => {
    mockStoreRepository.count.mockResolvedValue(2);
    mockOrderRepository.count.mockResolvedValue(5);
    mockQueryBuilder.getRawOne.mockResolvedValue({ sum: '100' });

    await service.execute();

    expect(mockOrderRepository.createQueryBuilder).toHaveBeenCalled();
    expect((mockOrderRepository as unknown as { find?: unknown }).find).toBeUndefined();
  });
});
