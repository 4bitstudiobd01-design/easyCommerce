import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetInventoryKpisService } from './get-inventory-kpis.service';
import { InventoryStockEntity } from '../entities/inventory-stock.entity';

describe('GetInventoryKpisService', () => {
  let service: GetInventoryKpisService;
  let stockRepo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({
        totalItems: '1248',
        totalUnits: '25430',
        lowStockCount: '128',
        outOfStockCount: '32',
        inStockCount: '1088',
      }),
    };

    stockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetInventoryKpisService,
        {
          provide: getRepositoryToken(InventoryStockEntity),
          useValue: stockRepo,
        },
      ],
    }).compile();

    service = module.get<GetInventoryKpisService>(GetInventoryKpisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should compute tenant-isolated aggregated inventory KPIs in a single SQL query', async () => {
    const kpis = await service.execute('tenant-1');

    expect(qb.where).toHaveBeenCalledWith('stock.tenantId = :tenantId', { tenantId: 'tenant-1' });
    expect(kpis).toEqual({
      totalItems: 1248,
      totalUnits: 25430,
      lowStockCount: 128,
      outOfStockCount: 32,
      inStockCount: 1088,
    });
  });

  it('should handle zero rows gracefully by returning 0 numbers', async () => {
    qb.getRawOne.mockResolvedValue(null);

    const kpis = await service.execute('tenant-empty');
    expect(kpis).toEqual({
      totalItems: 0,
      totalUnits: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inStockCount: 0,
    });
  });
});
