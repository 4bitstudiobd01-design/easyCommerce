import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  CodStatusEnum,
  ConsignmentEntity,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';
import { ConsignmentEventEntity } from '../entities/consignment-event.entity';
import {
  OrderEntity,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '../../order/entities/order.entity';
import { SeedShipmentDemoDataResponseDto } from '../dto/seed-shipment-demo-data-response.dto';

interface DemoCustomer {
  name: string;
  phone: string;
  address: string;
  city: string;
}

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: 'Rahim Hossain', phone: '+8801712345678', address: 'House 12, Road 5, Dhanmondi', city: 'Dhaka' },
  { name: 'Karim Ahmed', phone: '+8801612345678', address: 'Flat 4B, Green Road', city: 'Dhaka' },
  { name: 'Hasan Mahmud', phone: '+8801812345678', address: 'House 33, Sector 7, Uttara', city: 'Dhaka' },
  { name: 'Mim Aktar', phone: '+8801523456789', address: 'Zindabazar Main Road', city: 'Sylhet' },
  { name: 'Sabbir Islam', phone: '+8801912345678', address: 'GEC Circle, Nasirabad', city: 'Chattogram' },
  { name: 'Tanvir Rahman', phone: '+8801723456789', address: 'House 8, Block C, Bashundhara', city: 'Dhaka' },
  { name: 'Jahid Hasan', phone: '+8801934567890', address: 'Station Road, Kotwali', city: 'Chattogram' },
  { name: 'Afsana Ferdous', phone: '+8801576543210', address: 'House 45, Shaheb Bazar', city: 'Rajshahi' },
  { name: 'Nusrat Jahan', phone: '+8801645678901', address: 'Boyra Main Road', city: 'Khulna' },
  { name: 'Hridoy Paul', phone: '+8801734567899', address: 'House 21, Mirpur DOHS', city: 'Dhaka' },
  { name: 'Sadia Islam', phone: '+8801812340987', address: 'College Road, Sadar', city: 'Barishal' },
  { name: 'Rakib Hasan', phone: '+8801998765432', address: 'House 7, Banani', city: 'Dhaka' },
];

/**
 * Status mix that mirrors a healthy merchant's parcel flow: mostly delivered,
 * a solid in-transit tail, and small pending/failed/returned slices. Weights
 * are counts out of 100.
 */
const STATUS_MIX: Array<{ status: ConsignmentStatusEnum; weight: number }> = [
  { status: ConsignmentStatusEnum.DELIVERED, weight: 36 },
  { status: ConsignmentStatusEnum.IN_TRANSIT, weight: 22 },
  { status: ConsignmentStatusEnum.OUT_FOR_DELIVERY, weight: 10 },
  { status: ConsignmentStatusEnum.PICKED_UP, weight: 8 },
  { status: ConsignmentStatusEnum.BOOKED, weight: 8 },
  { status: ConsignmentStatusEnum.PENDING, weight: 6 },
  { status: ConsignmentStatusEnum.DELIVERY_FAILED, weight: 4 },
  { status: ConsignmentStatusEnum.RETURNED, weight: 3 },
  { status: ConsignmentStatusEnum.RETURNING, weight: 2 },
  { status: ConsignmentStatusEnum.CANCELLED, weight: 1 },
];

const COURIER_MIX: Array<{ provider: CourierProviderEnum; weight: number }> = [
  { provider: CourierProviderEnum.STEADFAST, weight: 40 },
  { provider: CourierProviderEnum.PATHAO, weight: 30 },
  { provider: CourierProviderEnum.REDX, weight: 18 },
  { provider: CourierProviderEnum.PAPERFLY, weight: 12 },
];

const TRACKING_PREFIXES: Record<CourierProviderEnum, string> = {
  [CourierProviderEnum.STEADFAST]: 'SF',
  [CourierProviderEnum.PATHAO]: 'PTH',
  [CourierProviderEnum.REDX]: 'REDX',
  [CourierProviderEnum.PAPERFLY]: 'PF',
};

const COD_AMOUNTS = [2500, 1200, 1850, 3200, 2650, 2750, 4050, 1320, 1950, 2300, 5600, 980];
const PARCEL_WEIGHTS = [0.5, 0.75, 1, 1.5, 2, 0.25, 3, 1.25];

const TOTAL_DEMO_SHIPMENTS = 120;
/** Spread across ~75 days so 7/30/90-day windows and the previous-period
 *  comparison all have meaningful data. */
const SPREAD_DAYS = 75;

/**
 * Seeds realistic shipment demo data for a merchant so the Courier → Shipments
 * dashboard can be exercised end-to-end. Demo data always originates here —
 * never hardcoded inside React components.
 */
@Injectable()
export class SeedShipmentDemoDataService {
  constructor(
    @InjectRepository(ConsignmentEntity)
    private readonly consignmentRepository: Repository<ConsignmentEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeSlug = 'demo-store',
    storeAddress?: string,
  ): Promise<SeedShipmentDemoDataResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Demo shipment seeder is strictly disabled in production environments.',
      );
    }

    let ordersCreated = 0;
    let shipmentsCreated = 0;
    let eventsCreated = 0;

    const pickupAddress = storeAddress || 'Warehouse 3, Tejgaon I/A, Dhaka 1208';

    await this.dataSource.transaction(async (manager) => {
      // Continue numbering after whatever the tenant already has, so seeding
      // twice never collides on shipment or order numbers.
      const existingCount = await manager.count(ConsignmentEntity, { where: { tenantId } });
      const startSeq = await this.resolveStartingNumber(manager, tenantId);
      const stamp = Date.now().toString().slice(-6);
      // Tracking codes are unique across the whole platform, not per tenant, so
      // they are seeded from a global counter rather than the tenant sequence —
      // otherwise seeding a second store collides with the first.
      const trackingBase = await this.resolveTrackingBase(manager);

      for (let i = 0; i < TOTAL_DEMO_SHIPMENTS; i++) {
        const seq = existingCount + i + 1;
        const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
        const status = this.pickStatus(i);
        const provider = this.pickCourier(i);
        const codAmount = COD_AMOUNTS[i % COD_AMOUNTS.length];
        const parcelWeight = PARCEL_WEIGHTS[i % PARCEL_WEIGHTS.length];

        // Newest first: i = 0 is the most recent shipment.
        const daysAgo = (i * SPREAD_DAYS) / TOTAL_DEMO_SHIPMENTS;
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // Every 9th parcel is prepaid, so the dashboard shows a realistic mix of
        // COD and non-COD shipments rather than assuming all parcels carry cash.
        const isPrepaid = i % 9 === 0;
        const { codStatus, codCollectedAt, codSettledAt } = this.resolveCod(
          status,
          isPrepaid,
          createdAt,
          i,
        );

        // Short, merchant-readable order numbers (EC-1024) — the suffix keeps
        // them unique across repeated seeds without bloating the table cell.
        const orderNumber = `EC-${1000 + seq}${stamp.slice(-2)}`;
        const deliveryFee = 60;

        const order = await manager.save(
          manager.create(OrderEntity, {
            orderNumber,
            customerName: customer.name,
            customerPhone: customer.phone,
            shippingAddress: `${customer.address}, ${customer.city}`,
            city: customer.city,
            deliveryFee,
            subtotal: codAmount - deliveryFee,
            discountAmount: 0,
            grandTotal: codAmount,
            paymentMethod: isPrepaid ? PaymentMethodEnum.BKASH : PaymentMethodEnum.COD,
            paymentStatus: this.resolveOrderPaymentStatus(isPrepaid, codStatus),
            orderStatus: this.resolveOrderStatus(status),
            storeSlug,
            tenantId,
            createdAt,
            updatedAt: createdAt,
          }),
        );
        ordersCreated++;

        // A PENDING parcel has not been accepted by a courier, so it genuinely
        // has no tracking code — the UI renders "Not Assigned" for these.
        const trackingCode =
          status === ConsignmentStatusEnum.PENDING
            ? null
            : `${TRACKING_PREFIXES[provider]}${trackingBase + i}`;

        const consignment = await manager.save(
          manager.create(ConsignmentEntity, {
            shipmentNumber: `SHP-${startSeq + i}`,
            trackingCode,
            orderId: order.id,
            orderNumber,
            customerId: order.customerId ?? null,
            courierProvider: provider,
            recipientName: customer.name,
            recipientPhone: customer.phone,
            recipientAddress: `${customer.address}, ${customer.city}`,
            city: customer.city,
            pickupAddress,
            codAmount: isPrepaid ? 0 : codAmount,
            codStatus,
            codCollectedAt,
            codSettledAt,
            deliveryCharge: deliveryFee,
            parcelWeight,
            parcelType: 'PARCEL',
            parcelDimensions: `${20 + (i % 10)}x${15 + (i % 5)}x${10 + (i % 4)}`,
            deliveryNote: i % 5 === 0 ? 'Call the customer before delivery.' : null,
            specialInstructions: i % 7 === 0 ? 'Fragile — handle with care.' : null,
            status,
            tenantId,
            createdAt,
            updatedAt: createdAt,
            lastSyncAt: trackingCode ? createdAt : null,
          }),
        );
        shipmentsCreated++;

        // Real timeline: only the events the parcel actually passed through.
        const events = this.buildTimeline(status, createdAt, provider);
        for (const event of events) {
          await manager.save(
            manager.create(ConsignmentEventEntity, {
              consignmentId: consignment.id,
              status: event.status,
              eventTimestamp: event.timestamp,
              location: event.location,
              description: event.description,
            }),
          );
          eventsCreated++;
        }
      }
    });

    return {
      success: true,
      message: 'Successfully seeded realistic shipment demo records.',
      ordersCreated,
      shipmentsCreated,
      eventsCreated,
    };
  }

  /** Next shipment number for the tenant, continuing any existing sequence. */
  private async resolveStartingNumber(
    manager: EntityManager,
    tenantId: string,
  ): Promise<number> {
    const row = await manager
      .createQueryBuilder(ConsignmentEntity, 'consignment')
      .select(
        `MAX(CAST(NULLIF(REGEXP_REPLACE(consignment."shipmentNumber", '\\D', '', 'g'), '') AS BIGINT))`,
        'maxNumber',
      )
      .where('consignment."tenantId" = :tenantId', { tenantId })
      .getRawOne<{ maxNumber: string | null }>();

    return Math.max(10000, Number(row?.maxNumber ?? 0)) + 1;
  }

  /**
   * Starting point for seeded tracking codes.
   *
   * Tracking codes are unique platform-wide (a courier issues one per parcel),
   * so this is derived from the highest existing seeded code across every
   * tenant — not from a row count, which would repeat for a second store seeded
   * in the same run.
   */
  private async resolveTrackingBase(manager: EntityManager): Promise<number> {
    const row = await manager
      .createQueryBuilder(ConsignmentEntity, 'consignment')
      .select(
        `MAX(CAST(NULLIF(REGEXP_REPLACE(consignment."trackingCode", '\\D', '', 'g'), '') AS BIGINT))`,
        'maxCode',
      )
      .getRawOne<{ maxCode: string | null }>();

    return Math.max(100000000, Number(row?.maxCode ?? 0)) + 1;
  }

  /** Deterministic weighted pick so seeded distributions look realistic. */
  private pickStatus(index: number): ConsignmentStatusEnum {
    const total = STATUS_MIX.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = (index * 37) % total;
    for (const entry of STATUS_MIX) {
      if (cursor < entry.weight) return entry.status;
      cursor -= entry.weight;
    }
    return ConsignmentStatusEnum.DELIVERED;
  }

  private pickCourier(index: number): CourierProviderEnum {
    const total = COURIER_MIX.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = (index * 29) % total;
    for (const entry of COURIER_MIX) {
      if (cursor < entry.weight) return entry.provider;
      cursor -= entry.weight;
    }
    return CourierProviderEnum.STEADFAST;
  }

  /**
   * COD state consistent with where the parcel actually got to. Cash is only
   * ever collected on delivery, and only some of it has been remitted yet — so
   * "COD Collected" and "Pending Settlement" are both non-empty.
   */
  private resolveCod(
    status: ConsignmentStatusEnum,
    isPrepaid: boolean,
    createdAt: Date,
    index: number,
  ): { codStatus: CodStatusEnum; codCollectedAt: Date | null; codSettledAt: Date | null } {
    if (isPrepaid) {
      return {
        codStatus: CodStatusEnum.NOT_APPLICABLE,
        codCollectedAt: null,
        codSettledAt: null,
      };
    }

    if (status === ConsignmentStatusEnum.DELIVERED) {
      const collectedAt = new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000);
      // Roughly two thirds of collected cash has been remitted to the merchant.
      const isSettled = index % 3 !== 0;
      return {
        codStatus: isSettled ? CodStatusEnum.SETTLED : CodStatusEnum.COLLECTED,
        codCollectedAt: collectedAt,
        codSettledAt: isSettled
          ? new Date(collectedAt.getTime() + 3 * 24 * 60 * 60 * 1000)
          : null,
      };
    }

    if (
      status === ConsignmentStatusEnum.RETURNED ||
      status === ConsignmentStatusEnum.CANCELLED
    ) {
      return { codStatus: CodStatusEnum.RETURNED, codCollectedAt: null, codSettledAt: null };
    }

    return { codStatus: CodStatusEnum.PENDING, codCollectedAt: null, codSettledAt: null };
  }

  /** Order fulfilment state implied by where the parcel got to. */
  private resolveOrderStatus(status: ConsignmentStatusEnum): OrderStatusEnum {
    switch (status) {
      case ConsignmentStatusEnum.DELIVERED:
        return OrderStatusEnum.DELIVERED;
      case ConsignmentStatusEnum.RETURNED:
        return OrderStatusEnum.RETURNED;
      case ConsignmentStatusEnum.CANCELLED:
        return OrderStatusEnum.CANCELLED;
      case ConsignmentStatusEnum.PENDING:
      case ConsignmentStatusEnum.BOOKED:
        return OrderStatusEnum.READY_TO_SHIP;
      default:
        return OrderStatusEnum.SHIPPED;
    }
  }

  private resolveOrderPaymentStatus(
    isPrepaid: boolean,
    codStatus: CodStatusEnum,
  ): PaymentStatusEnum {
    if (isPrepaid) return PaymentStatusEnum.PAID;
    if (codStatus === CodStatusEnum.COLLECTED || codStatus === CodStatusEnum.SETTLED) {
      return PaymentStatusEnum.COD_COLLECTED;
    }
    return PaymentStatusEnum.COD_PENDING;
  }

  /**
   * The events a parcel in `status` genuinely passed through — never a full
   * fabricated delivery history for a parcel that is still in transit.
   */
  private buildTimeline(
    status: ConsignmentStatusEnum,
    createdAt: Date,
    provider: CourierProviderEnum,
  ): Array<{
    status: ConsignmentStatusEnum;
    timestamp: Date;
    location?: string;
    description?: string;
  }> {
    const hour = 60 * 60 * 1000;
    const events: Array<{
      status: ConsignmentStatusEnum;
      timestamp: Date;
      location?: string;
      description?: string;
    }> = [];

    const at = (hours: number) => new Date(createdAt.getTime() + hours * hour);

    if (status === ConsignmentStatusEnum.PENDING) {
      return [
        {
          status: ConsignmentStatusEnum.PENDING,
          timestamp: createdAt,
          description: 'Shipment created. Awaiting courier booking confirmation.',
        },
      ];
    }

    events.push({
      status: ConsignmentStatusEnum.BOOKED,
      timestamp: createdAt,
      location: 'Merchant Warehouse',
      description: `Booking accepted by ${provider}.`,
    });

    if (status === ConsignmentStatusEnum.BOOKED) return events;

    if (status === ConsignmentStatusEnum.CANCELLED) {
      events.push({
        status: ConsignmentStatusEnum.CANCELLED,
        timestamp: at(3),
        description: 'Shipment cancelled by merchant before pickup.',
      });
      return events;
    }

    events.push({
      status: ConsignmentStatusEnum.PICKED_UP,
      timestamp: at(6),
      location: 'Merchant Warehouse',
      description: 'Parcel collected by the delivery rider.',
    });
    if (status === ConsignmentStatusEnum.PICKED_UP) return events;

    events.push({
      status: ConsignmentStatusEnum.IN_TRANSIT,
      timestamp: at(18),
      location: 'Sorting Hub, Dhaka',
      description: 'Parcel arrived at the sorting hub.',
    });
    if (status === ConsignmentStatusEnum.IN_TRANSIT) return events;

    if (
      status === ConsignmentStatusEnum.RETURNING ||
      status === ConsignmentStatusEnum.RETURNED
    ) {
      events.push({
        status: ConsignmentStatusEnum.RETURNING,
        timestamp: at(40),
        location: 'Return Hub',
        description: 'Customer refused the parcel. Returning to the merchant.',
      });
      if (status === ConsignmentStatusEnum.RETURNED) {
        events.push({
          status: ConsignmentStatusEnum.RETURNED,
          timestamp: at(64),
          location: 'Merchant Warehouse',
          description: 'Parcel returned to the merchant.',
        });
      }
      return events;
    }

    events.push({
      status: ConsignmentStatusEnum.OUT_FOR_DELIVERY,
      timestamp: at(30),
      location: 'Destination Area',
      description: 'Rider is out for delivery.',
    });
    if (status === ConsignmentStatusEnum.OUT_FOR_DELIVERY) return events;

    if (status === ConsignmentStatusEnum.DELIVERY_FAILED) {
      events.push({
        status: ConsignmentStatusEnum.DELIVERY_FAILED,
        timestamp: at(34),
        location: 'Destination Area',
        description: 'Delivery attempt failed — customer unreachable.',
      });
      return events;
    }

    events.push({
      status: ConsignmentStatusEnum.DELIVERED,
      timestamp: at(36),
      location: 'Customer Address',
      description: 'Parcel delivered successfully.',
    });
    return events;
  }
}
