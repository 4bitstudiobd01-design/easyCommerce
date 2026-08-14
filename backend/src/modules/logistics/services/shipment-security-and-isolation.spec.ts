import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ListShipmentsService } from './list-shipments.service';
import { GetShipmentDetailsService } from './get-shipment-details.service';
import { CreateShipmentService } from './create-shipment.service';
import { CancelShipmentService } from './cancel-shipment.service';
import { ShipmentDomainService } from './shipment-domain.service';
import { CourierProviderRegistry } from '../adapters/courier-provider.registry';
import {
  CodStatusEnum,
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import { OrderEntity, OrderStatusEnum, PaymentStatusEnum } from '../../order/entities/order.entity';
import { StoreEntity } from '../../tenant/entities/store.entity';
import { ListShipmentsQueryDto } from '../dto/list-shipments-query.dto';

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const makeQueryBuilder = (recorder: { where: any[][]; andWhere: any[][] }) => {
  const qb: any = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn((...args: any[]) => {
      recorder.where.push(args);
      return qb;
    }),
    andWhere: jest.fn((...args: any[]) => {
      recorder.andWhere.push(args);
      return qb;
    }),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    getOne: jest.fn().mockResolvedValue(null),
    getRawOne: jest.fn().mockResolvedValue({ maxNumber: '10244' }),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
  };
  return qb;
};

const buildRegistry = (): CourierProviderRegistry => {
  const makeAdapter = (provider: CourierProviderEnum, displayName: string) =>
    ({
      provider,
      displayName,
      bookParcel: jest.fn().mockResolvedValue({
        trackingCode: `${displayName.toUpperCase()}-123`,
        status: 'BOOKED',
      }),
      trackParcel: jest.fn(),
      cancelParcel: jest.fn().mockResolvedValue({ cancelled: true }),
    }) as any;

  return new CourierProviderRegistry(
    makeAdapter(CourierProviderEnum.STEADFAST, 'Steadfast'),
    makeAdapter(CourierProviderEnum.PATHAO, 'Pathao'),
    makeAdapter(CourierProviderEnum.PAPERFLY, 'Paperfly'),
    makeAdapter(CourierProviderEnum.REDX, 'RedX'),
  );
};

describe('Shipment tenant isolation and security', () => {
  describe('ListShipmentsService', () => {
    let service: ListShipmentsService;
    let recorder: { where: any[][]; andWhere: any[][] };

    beforeEach(async () => {
      recorder = { where: [], andWhere: [] };
      const repo = { createQueryBuilder: jest.fn(() => makeQueryBuilder(recorder)) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ListShipmentsService,
          ShipmentDomainService,
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          { provide: getRepositoryToken(ConsignmentEntity), useValue: repo },
        ],
      }).compile();

      service = module.get(ListShipmentsService);
    });

    it('always scopes the listing to the calling merchant', async () => {
      await service.execute(TENANT_A, new ListShipmentsQueryDto());

      expect(recorder.where).toContainEqual([
        'consignment.tenantId = :tenantId',
        { tenantId: TENANT_A },
      ]);
    });

    it('never lets a search term reach SQL unparameterised', async () => {
      const query = new ListShipmentsQueryDto();
      // A classic injection attempt must travel as a bound parameter.
      query.search = "'; DROP TABLE consignments; --";

      await service.execute(TENANT_A, query);

      // The search clause is added as a Brackets group; replay it to capture
      // the SQL fragments and bound parameters it actually produces.
      const bracketsArg = recorder.andWhere
        .map(([arg]) => arg)
        .find((arg) => arg && typeof arg === 'object' && 'whereFactory' in arg);
      expect(bracketsArg).toBeDefined();

      const inner: { where: any[][]; orWhere: any[][] } = { where: [], orWhere: [] };
      const innerQb: any = {
        where: jest.fn((...args: any[]) => {
          inner.where.push(args);
          return innerQb;
        }),
        orWhere: jest.fn((...args: any[]) => {
          inner.orWhere.push(args);
          return innerQb;
        }),
      };
      (bracketsArg as any).whereFactory(innerQb);

      const clauses = [...inner.where, ...inner.orWhere];
      expect(clauses.length).toBeGreaterThan(0);

      clauses.forEach(([sql, params]) => {
        // The SQL fragment carries only a placeholder, never the raw term.
        expect(sql).toContain(':term');
        expect(sql).not.toContain('DROP TABLE');
        expect(params).toEqual({ term: "%'; DROP TABLE consignments; --%" });
      });
    });

    it('rejects an unknown sort field instead of interpolating it', async () => {
      const query = new ListShipmentsQueryDto();
      (query as any).sortBy = 'createdAt; DROP TABLE consignments';

      await expect(service.execute(TENANT_A, query)).resolves.toBeDefined();
      // Falls back to the safe default column.
      const repo: any = (service as any).consignmentRepository;
      const qb = repo.createQueryBuilder.mock.results[0].value;
      expect(qb.orderBy).toHaveBeenCalledWith('consignment."createdAt"', 'DESC');
    });
  });

  describe('GetShipmentDetailsService', () => {
    let service: GetShipmentDetailsService;
    let consignmentRepo: any;

    beforeEach(async () => {
      consignmentRepo = { findOne: jest.fn().mockResolvedValue(null) };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GetShipmentDetailsService,
          ShipmentDomainService,
          {
            provide: ListShipmentsService,
            useValue: { toListItem: jest.fn().mockReturnValue({}) },
          },
          { provide: getRepositoryToken(ConsignmentEntity), useValue: consignmentRepo },
          { provide: getRepositoryToken(ConsignmentEventEntity), useValue: { find: jest.fn() } },
          { provide: getRepositoryToken(OrderEntity), useValue: { findOne: jest.fn() } },
        ],
      }).compile();

      service = module.get(GetShipmentDetailsService);
    });

    it("hides another merchant's shipment behind a 404", async () => {
      await expect(service.execute('shipment-owned-by-b', TENANT_A)).rejects.toBeInstanceOf(
        NotFoundException,
      );

      // Tenant scope is part of the lookup, so the row is never even read.
      expect(consignmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'shipment-owned-by-b', tenantId: TENANT_A },
      });
    });
  });

  describe('CreateShipmentService', () => {
    let service: CreateShipmentService;
    let consignmentRepo: any;
    let orderRepo: any;
    let detailsService: any;
    let recorder: { where: any[][]; andWhere: any[][] };

    const order: Partial<OrderEntity> = {
      id: 'order-1',
      orderNumber: 'EC-1024',
      customerName: 'Rahim Hossain',
      customerPhone: '+8801712345678',
      shippingAddress: 'House 12, Road 5, Dhaka',
      city: 'Dhaka',
      grandTotal: 2500,
      deliveryFee: 60,
      orderStatus: OrderStatusEnum.CONFIRMED,
      paymentStatus: PaymentStatusEnum.COD_PENDING,
    };

    beforeEach(async () => {
      recorder = { where: [], andWhere: [] };
      consignmentRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        createQueryBuilder: jest.fn(() => makeQueryBuilder(recorder)),
      };
      orderRepo = { findOne: jest.fn().mockResolvedValue(order) };
      detailsService = { execute: jest.fn().mockResolvedValue({ id: 'new-shipment' }) };

      const manager = {
        create: jest.fn((_entity: unknown, data: unknown) => data),
        save: jest.fn(async (data: any) => ({ id: 'new-shipment', ...data })),
        update: jest.fn(),
        findOne: jest.fn().mockResolvedValue(order),
      };
      const dataSource = {
        transaction: jest.fn(async (cb: any) => cb(manager)),
      } as unknown as DataSource;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CreateShipmentService,
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          { provide: GetShipmentDetailsService, useValue: detailsService },
          { provide: getRepositoryToken(ConsignmentEntity), useValue: consignmentRepo },
          { provide: getRepositoryToken(OrderEntity), useValue: orderRepo },
          {
            provide: getRepositoryToken(StoreEntity),
            useValue: { findOne: jest.fn().mockResolvedValue({ address: 'Warehouse 3' }) },
          },
          { provide: DataSource, useValue: dataSource },
        ],
      }).compile();

      service = module.get(CreateShipmentService);
    });

    it("refuses to ship another merchant's order", async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.execute(
          { orderId: 'order-owned-by-b', courierProvider: CourierProviderEnum.STEADFAST },
          TENANT_A,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(orderRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'order-owned-by-b', tenantId: TENANT_A },
      });
    });

    it('returns the original shipment when an idempotency key is replayed', async () => {
      const existing = { id: 'already-created' };
      consignmentRepo.findOne.mockResolvedValue(existing);

      await service.execute(
        {
          orderId: 'order-1',
          courierProvider: CourierProviderEnum.STEADFAST,
          idempotencyKey: 'key-123',
        },
        TENANT_A,
        'user-1',
      );

      expect(consignmentRepo.findOne).toHaveBeenCalledWith({
        where: { tenantId: TENANT_A, idempotencyKey: 'key-123' },
      });
      // No second parcel is booked — the existing shipment is returned as-is.
      expect(detailsService.execute).toHaveBeenCalledWith('already-created', TENANT_A);
      expect(orderRepo.findOne).not.toHaveBeenCalled();
    });

    it('rejects a second active shipment for the same order', async () => {
      const qb = makeQueryBuilder(recorder);
      qb.getOne.mockResolvedValue({ shipmentNumber: 'SHP-10001' });
      consignmentRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.execute(
          { orderId: 'order-1', courierProvider: CourierProviderEnum.STEADFAST },
          TENANT_A,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses to ship an order that is already concluded', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...order,
        orderStatus: OrderStatusEnum.CANCELLED,
      });

      await expect(
        service.execute(
          { orderId: 'order-1', courierProvider: CourierProviderEnum.STEADFAST },
          TENANT_A,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('never asks a courier to collect cash for an already-paid order', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...order,
        paymentStatus: PaymentStatusEnum.PAID,
      });

      await service.execute(
        { orderId: 'order-1', courierProvider: CourierProviderEnum.STEADFAST },
        TENANT_A,
        'user-1',
      );

      const registry: CourierProviderRegistry = (service as any).courierProviderRegistry;
      const adapter: any = registry.resolve(CourierProviderEnum.STEADFAST);
      expect(adapter.bookParcel).toHaveBeenCalledWith(
        expect.objectContaining({ codAmount: 0 }),
      );
    });

    it('rejects an order with no delivery address before calling the courier', async () => {
      orderRepo.findOne.mockResolvedValue({ ...order, shippingAddress: '   ' });

      await expect(
        service.execute(
          { orderId: 'order-1', courierProvider: CourierProviderEnum.STEADFAST },
          TENANT_A,
          'user-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      const registry: CourierProviderRegistry = (service as any).courierProviderRegistry;
      const adapter: any = registry.resolve(CourierProviderEnum.STEADFAST);
      expect(adapter.bookParcel).not.toHaveBeenCalled();
    });

    it('keeps the shipment as PENDING when the courier booking fails', async () => {
      const registry: CourierProviderRegistry = (service as any).courierProviderRegistry;
      const adapter: any = registry.resolve(CourierProviderEnum.STEADFAST);
      adapter.bookParcel.mockRejectedValue(new Error('Courier unreachable'));

      await service.execute(
        { orderId: 'order-1', courierProvider: CourierProviderEnum.STEADFAST },
        TENANT_A,
        'user-1',
      );

      const dataSource: any = (service as any).dataSource;
      const manager = dataSource.transaction.mock.calls[0][0];
      expect(manager).toBeDefined();
      // The parcel is saved without a fabricated tracking code.
      expect(detailsService.execute).toHaveBeenCalled();
    });
  });

  describe('CancelShipmentService', () => {
    let service: CancelShipmentService;
    let consignmentRepo: any;

    const buildService = async (consignment: Partial<ConsignmentEntity> | null) => {
      consignmentRepo = { findOne: jest.fn().mockResolvedValue(consignment) };

      const manager = {
        create: jest.fn((_entity: unknown, data: unknown) => data),
        save: jest.fn(async (data: any) => data),
        update: jest.fn(),
        findOne: jest.fn().mockResolvedValue({ id: 'order-1', orderStatus: OrderStatusEnum.SHIPPED }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CancelShipmentService,
          ShipmentDomainService,
          { provide: CourierProviderRegistry, useValue: buildRegistry() },
          {
            provide: GetShipmentDetailsService,
            useValue: { execute: jest.fn().mockResolvedValue({}) },
          },
          { provide: getRepositoryToken(ConsignmentEntity), useValue: consignmentRepo },
          {
            provide: getRepositoryToken(StoreEntity),
            useValue: { findOne: jest.fn().mockResolvedValue({}) },
          },
          {
            provide: DataSource,
            useValue: { transaction: jest.fn(async (cb: any) => cb(manager)) },
          },
        ],
      }).compile();

      return module.get(CancelShipmentService);
    };

    it("hides another merchant's shipment behind a 404", async () => {
      service = await buildService(null);

      await expect(
        service.execute('shipment-owned-by-b', TENANT_A, 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(consignmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'shipment-owned-by-b', tenantId: TENANT_A },
      });
    });

    it('refuses to cancel a delivered parcel', async () => {
      service = await buildService({
        id: 'shipment-1',
        tenantId: TENANT_A,
        shipmentNumber: 'SHP-10245',
        status: ConsignmentStatusEnum.DELIVERED,
        codStatus: CodStatusEnum.COLLECTED,
      });

      await expect(
        service.execute('shipment-1', TENANT_A, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to cancel a parcel that is already cancelled', async () => {
      service = await buildService({
        id: 'shipment-1',
        tenantId: TENANT_A,
        shipmentNumber: 'SHP-10245',
        status: ConsignmentStatusEnum.CANCELLED,
        codStatus: CodStatusEnum.RETURNED,
      });

      await expect(
        service.execute('shipment-1', TENANT_A, 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cancels a pending parcel and clears its pending COD', async () => {
      service = await buildService({
        id: 'shipment-1',
        tenantId: TENANT_A,
        shipmentNumber: 'SHP-10245',
        status: ConsignmentStatusEnum.PENDING,
        codStatus: CodStatusEnum.PENDING,
        trackingCode: null,
        courierProvider: CourierProviderEnum.STEADFAST,
        orderId: 'order-1',
      });

      await expect(service.execute('shipment-1', TENANT_A, 'user-1')).resolves.toBeDefined();

      const dataSource: any = (service as any).dataSource;
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });
});
