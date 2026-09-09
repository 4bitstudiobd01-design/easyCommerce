import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetShipmentSummaryService } from './get-shipment-summary.service';
import { ShipmentDomainService } from './shipment-domain.service';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import { ConsignmentEntity, CourierProviderEnum } from '../entities/consignment.entity';
import { ListShipmentsQueryDto } from '../dto/list-shipments-query.dto';

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('GetShipmentSummaryService', () => {
  let service: GetShipmentSummaryService;
  let repo: any;
  let queryBuilders: any[];

  /**
   * Each createQueryBuilder call returns a fresh recording stub. The service
   * issues, in order: current aggregate, previous aggregate, courier
   * performance, then the COD month summary.
   */
  const makeQueryBuilder = () => {
    const qb: any = {
      calls: { where: [] as any[][], andWhere: [] as any[][] },
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn((...args: any[]) => {
        qb.calls.where.push(args);
        return qb;
      }),
      andWhere: jest.fn((...args: any[]) => {
        qb.calls.andWhere.push(args);
        return qb;
      }),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({}),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    queryBuilders.push(qb);
    return qb;
  };

  const buildRegistry = () => {
    const makeAdapter = (provider: CourierProviderEnum, displayName: string) =>
      ({ provider, displayName }) as any;
    return new CourierProviderRegistry(
      makeAdapter(CourierProviderEnum.STEADFAST, 'Steadfast'),
      makeAdapter(CourierProviderEnum.PATHAO, 'Pathao'),
      makeAdapter(CourierProviderEnum.PAPERFLY, 'Paperfly'),
      makeAdapter(CourierProviderEnum.REDX, 'RedX'),
      makeAdapter(CourierProviderEnum.CARRYBEE, 'Carrybee'),
    );
  };

  beforeEach(async () => {
    queryBuilders = [];
    repo = { createQueryBuilder: jest.fn(() => makeQueryBuilder()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetShipmentSummaryService,
        ShipmentDomainService,
        { provide: CourierProviderRegistry, useValue: buildRegistry() },
        { provide: getRepositoryToken(ConsignmentEntity), useValue: repo },
      ],
    }).compile();

    service = module.get(GetShipmentSummaryService);
  });

  it('scopes every aggregate query to the calling merchant', async () => {
    await service.execute(TENANT_A, new ListShipmentsQueryDto());

    expect(queryBuilders.length).toBeGreaterThan(0);
    queryBuilders.forEach((qb) => {
      expect(qb.calls.where).toContainEqual([
        'consignment.tenantId = :tenantId',
        { tenantId: TENANT_A },
      ]);
    });
  });

  it('computes KPI counts and change against the previous period', async () => {
    // Current period, then previous period.
    queryBuilders.length = 0;
    repo.createQueryBuilder = jest.fn(() => makeQueryBuilder());

    const current = {
      totalShipments: '1256',
      pending: '132',
      inTransit: '624',
      delivered: '456',
      returned: '28',
      failed: '16',
      codCollected: '980000',
      codPending: '210000',
    };
    const previous = {
      totalShipments: '1058',
      pending: '117',
      inTransit: '537',
      delivered: '373',
      returned: '29',
      failed: '12',
      codCollected: '818000',
      codPending: '229000',
    };

    let call = 0;
    repo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne = jest.fn().mockImplementation(async () => {
        call += 1;
        if (call === 1) return current;
        if (call === 2) return previous;
        return {};
      });
      return qb;
    });

    const summary = await service.execute(TENANT_A, new ListShipmentsQueryDto());

    expect(summary.totalShipments.count).toBe(1256);
    expect(summary.pending.count).toBe(132);
    expect(summary.inTransit.count).toBe(624);
    expect(summary.delivered.count).toBe(456);
    expect(summary.returned.count).toBe(28);
    expect(summary.codCollected.amount).toBe(980000);
    expect(summary.codPending.amount).toBe(210000);

    // (1256 - 1058) / 1058 = 18.7%
    expect(summary.totalShipments.changePercent).toBe(18.7);
    // Returned fell, so the delta is negative.
    expect(summary.returned.changePercent).toBeLessThan(0);
  });

  it('partitions the donut over the same shipment set the KPIs count', async () => {
    let call = 0;
    repo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawOne = jest.fn().mockImplementation(async () => {
        call += 1;
        if (call === 1) {
          return {
            totalShipments: '1256',
            pending: '132',
            inTransit: '624',
            delivered: '456',
            returned: '28',
            failed: '16',
            codCollected: '0',
            codPending: '0',
          };
        }
        return {};
      });
      return qb;
    });

    const summary = await service.execute(TENANT_A, new ListShipmentsQueryDto());

    expect(summary.overviewTotal).toBe(1256);
    const sliceTotal = summary.overview.reduce((sum, slice) => sum + slice.count, 0);
    expect(sliceTotal).toBe(1256);

    const delivered = summary.overview.find((s) => s.label === 'Delivered');
    expect(delivered?.percentage).toBe(36.3);
  });

  it('reports zeroes and null deltas for a merchant with no shipments', async () => {
    const summary = await service.execute(TENANT_A, new ListShipmentsQueryDto());

    expect(summary.totalShipments.count).toBe(0);
    // No baseline to compare against — never NaN or Infinity.
    expect(summary.totalShipments.changePercent).toBeNull();
    expect(summary.overview.every((slice) => slice.percentage === 0)).toBe(true);
    expect(summary.codSummary.total).toBe(0);
  });

  it('rates courier success over concluded parcels, not those still in flight', async () => {
    repo.createQueryBuilder = jest.fn(() => {
      const qb = makeQueryBuilder();
      qb.getRawMany = jest.fn().mockResolvedValue([
        // 100 handled, 60 concluded, 54 delivered => 90%, not 54%.
        {
          provider: CourierProviderEnum.STEADFAST,
          deliveries: '100',
          delivered: '54',
          concluded: '60',
        },
      ]);
      return qb;
    });

    const summary = await service.execute(TENANT_A, new ListShipmentsQueryDto());

    expect(summary.courierPerformance).toHaveLength(1);
    expect(summary.courierPerformance[0].name).toBe('Steadfast');
    expect(summary.courierPerformance[0].deliveries).toBe(100);
    expect(summary.courierPerformance[0].successRate).toBe(90);
  });

  it('keeps the KPI row unfiltered by status so the split stays visible', async () => {
    const query = new ListShipmentsQueryDto();
    query.status = 'DELIVERED' as any;
    query.codStatus = 'SETTLED' as any;

    await service.execute(TENANT_A, query);

    const allClauses = queryBuilders.flatMap((qb) =>
      qb.calls.andWhere.map(([sql]: any[]) => String(sql)),
    );
    expect(allClauses.some((sql) => sql.includes('consignment.status ='))).toBe(false);
    expect(allClauses.some((sql) => sql.includes('consignment."codStatus" ='))).toBe(false);
  });

  it('still applies the courier filter to the KPI row', async () => {
    const query = new ListShipmentsQueryDto();
    query.courierProvider = CourierProviderEnum.PATHAO;

    await service.execute(TENANT_A, query);

    const allClauses = queryBuilders.flatMap((qb) =>
      qb.calls.andWhere.map(([sql]: any[]) => String(sql)),
    );
    expect(allClauses.some((sql) => sql.includes('consignment."courierProvider" ='))).toBe(true);
  });
});
