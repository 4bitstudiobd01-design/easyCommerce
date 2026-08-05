import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardFacadeService } from './dashboard-facade.service';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { OrderEntity } from '../../order/entities/order.entity';
import { UserEntity } from '../../user/entities/user.entity';

describe('DashboardFacadeService', () => {
  let service: DashboardFacadeService;

  const mockStoreRepository = {
    find: jest.fn().mockResolvedValue([
      { id: 'store-1', name: 'Urban Attire', slug: 'urban-attire', isActive: true },
      { id: 'store-2', name: 'Deshi Look', slug: 'deshi-look', isActive: true },
    ]),
  };

  const mockOrderRepository = {
    find: jest.fn().mockResolvedValue([
      { id: 'ord-1', orderNumber: '1001', grandTotal: 1500, orderStatus: 'COMPLETED' },
    ]),
  };

  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([
      { id: 'user-1', email: 'admin@easycommerce.com', role: 'SUPER_ADMIN', isActive: true },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardFacadeService,
        { provide: getRepositoryToken(StoreEntity), useValue: mockStoreRepository },
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrderRepository },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<DashboardFacadeService>(DashboardFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return summary data correctly', async () => {
    const result = await service.getSummary({});
    expect(result).toHaveProperty('platformHealthSnapshot');
    expect(result).toHaveProperty('kpis');
    expect(result.kpis.totalRevenueBdt).toBe(1500);
    expect(result.storeSummary.totalStores).toBe(2);
  });

  it('should return analytics data correctly', async () => {
    const result = await service.getAnalytics({});
    expect(result).toHaveProperty('revenueTrend');
    expect(result).toHaveProperty('merchantGrowth');
    expect(result).toHaveProperty('paymentMethodsShare');
  });

  it('should return operations data correctly', async () => {
    const result = await service.getOperations({ limit: 5 });
    expect(result).toHaveProperty('recentActivities');
    expect(result).toHaveProperty('topMerchants');
  });

  it('should return infrastructure telemetry correctly', async () => {
    const result = await service.getInfrastructure();
    expect(result.overallStatus).toBe('operational');
    expect(result.microservices.length).toBeGreaterThan(0);
  });
});
