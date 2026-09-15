import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PaymentEntity,
  PaymentTransactionStatusEnum,
} from '../entities/payment.entity';
import { RefundEntity, RefundStatusEnum } from '../entities/refund.entity';
import { PaymentEventEntity } from '../entities/payment-event.entity';
import {
  PaymentGatewayEntity,
  PaymentGatewayStatusEnum,
} from '../entities/payment-gateway.entity';
import {
  OrderEntity,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '../../order/entities/order.entity';
import { PaymentGatewayEnum, PAYMENT_GATEWAY_KINDS, PAYMENT_GATEWAY_LABELS } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';
import { SeedPaymentDemoDataResponseDto } from '../dto/seed-payment-demo-data-response.dto';

interface DemoCustomer {
  name: string;
  phone: string;
}

const DEMO_CUSTOMERS: DemoCustomer[] = [
  { name: 'Rahim Hossain', phone: '+8801712345678' },
  { name: 'Karim Ahmed', phone: '+8801812345678' },
  { name: 'Hasan Mahmud', phone: '+8801912345678' },
  { name: 'Mim Aktar', phone: '+8801523456789' },
  { name: 'Sabbir Islam', phone: '+8801634567890' },
  { name: 'Tanvir Rahman', phone: '+8801723456789' },
  { name: 'Jahid Hasan', phone: '+8801934567890' },
  { name: 'Afsana Ferdous', phone: '+8801576543210' },
  { name: 'Nusrat Jahan', phone: '+8801687654321' },
  { name: 'Imran Kabir', phone: '+8801798765432' },
];

/** Gateway/method pairs that actually occur — a gateway constrains its methods. */
const DEMO_GATEWAY_METHODS: Array<{
  gateway: PaymentGatewayEnum;
  method: PaymentMethodTypeEnum;
  weight: number;
}> = [
  { gateway: PaymentGatewayEnum.BKASH, method: PaymentMethodTypeEnum.BKASH, weight: 28 },
  { gateway: PaymentGatewayEnum.COD, method: PaymentMethodTypeEnum.COD, weight: 24 },
  { gateway: PaymentGatewayEnum.SSLCOMMERZ, method: PaymentMethodTypeEnum.BKASH, weight: 12 },
  { gateway: PaymentGatewayEnum.SSLCOMMERZ, method: PaymentMethodTypeEnum.ROCKET, weight: 8 },
  { gateway: PaymentGatewayEnum.SSLCOMMERZ, method: PaymentMethodTypeEnum.UPAY, weight: 6 },
  { gateway: PaymentGatewayEnum.NAGAD, method: PaymentMethodTypeEnum.NAGAD, weight: 14 },
  { gateway: PaymentGatewayEnum.STRIPE, method: PaymentMethodTypeEnum.CARD, weight: 8 },
];

const DEMO_GATEWAYS: PaymentGatewayEnum[] = [
  PaymentGatewayEnum.BKASH,
  PaymentGatewayEnum.NAGAD,
  PaymentGatewayEnum.SSLCOMMERZ,
  PaymentGatewayEnum.STRIPE,
];

const TOTAL_DEMO_PAYMENTS = 60;

/**
 * Seeds realistic payment demo data for a merchant so the Payments dashboard
 * can be exercised end-to-end. Demo data always originates here — never
 * hardcoded inside React components.
 */
@Injectable()
export class SeedPaymentDemoDataService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    @InjectRepository(RefundEntity)
    private readonly refundRepository: Repository<RefundEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepository: Repository<PaymentEventEntity>,
    @InjectRepository(PaymentGatewayEntity)
    private readonly gatewayRepository: Repository<PaymentGatewayEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    tenantId: string,
    storeSlug = 'demo-store',
  ): Promise<SeedPaymentDemoDataResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Demo payment seeder is strictly disabled in production environments.',
      );
    }

    let gatewaysCreated = 0;
    let ordersCreated = 0;
    let paymentsCreated = 0;
    let refundsCreated = 0;
    let eventsCreated = 0;

    await this.dataSource.transaction(async (manager) => {
      // 1. Connected gateways for this tenant.
      for (let i = 0; i < DEMO_GATEWAYS.length; i++) {
        const code = DEMO_GATEWAYS[i];
        const existing = await manager.findOne(PaymentGatewayEntity, {
          where: { tenantId, code },
        });
        if (existing) continue;

        await manager.save(
          manager.create(PaymentGatewayEntity, {
            tenantId,
            code,
            name: PAYMENT_GATEWAY_LABELS[code],
            kind: PAYMENT_GATEWAY_KINDS[code],
            status: PaymentGatewayStatusEnum.CONNECTED,
            isEnabled: true,
            sortOrder: i,
          }),
        );
        gatewaysCreated++;
      }

      // Continue numbering after whatever the tenant already has.
      const existingCount = await manager.count(PaymentEntity, { where: { tenantId } });
      const stamp = Date.now().toString().slice(-6);

      for (let i = 0; i < TOTAL_DEMO_PAYMENTS; i++) {
        const seq = existingCount + i + 1;
        const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
        const pair = this.pickGatewayMethod(i);
        const status = this.pickStatus(i);

        // Spread across ~75 days so 7/30/90-day windows all have data and the
        // previous-period comparison is meaningful.
        const daysAgo = (i * 74) / TOTAL_DEMO_PAYMENTS;
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const amount = this.pickAmount(i);
        const orderNumber = `EC-${stamp}-${String(seq).padStart(4, '0')}`;

        // 2. Order backing the payment.
        const order = await manager.save(
          manager.create(OrderEntity, {
            orderNumber,
            customerName: customer.name,
            customerPhone: customer.phone,
            shippingAddress: 'House 12, Road 5, Block B, Dhaka',
            city: 'Dhaka',
            deliveryFee: 60,
            subtotal: amount - 60,
            discountAmount: 0,
            grandTotal: amount,
            paymentMethod: this.toOrderPaymentMethod(pair.gateway),
            paymentStatus: this.toOrderPaymentStatus(status),
            orderStatus:
              status === PaymentTransactionStatusEnum.COMPLETED
                ? OrderStatusEnum.CONFIRMED
                : OrderStatusEnum.PENDING,
            storeSlug,
            tenantId,
            createdAt,
            updatedAt: createdAt,
          }),
        );
        ordersCreated++;

        // 3. Payment transaction.
        const isSettled =
          status === PaymentTransactionStatusEnum.COMPLETED ||
          status === PaymentTransactionStatusEnum.PARTIALLY_REFUNDED ||
          status === PaymentTransactionStatusEnum.REFUNDED;

        let refundedAmount = 0;
        if (status === PaymentTransactionStatusEnum.REFUNDED) {
          refundedAmount = amount;
        } else if (status === PaymentTransactionStatusEnum.PARTIALLY_REFUNDED) {
          refundedAmount = Math.round(amount * 0.4 * 100) / 100;
        }

        const payment = await manager.save(
          manager.create(PaymentEntity, {
            tenantId,
            orderId: order.id,
            orderNumber,
            customerId: order.customerId,
            transactionNumber: `TXN-${10000 + seq}`,
            tranId: `${pair.gateway}-${stamp}-${seq}`,
            bankTranId: isSettled ? this.buildGatewayReference(pair.gateway, seq) : undefined,
            amount,
            refundedAmount,
            currency: 'BDT',
            gateway: pair.gateway,
            paymentMethod: pair.method,
            cardType: pair.method,
            status,
            paidAt: isSettled ? createdAt : undefined,
            failureReason:
              status === PaymentTransactionStatusEnum.FAILED
                ? 'Insufficient balance reported by gateway'
                : undefined,
            createdAt,
            updatedAt: createdAt,
          }),
        );
        paymentsCreated++;

        // 4. Timeline events reflecting what actually happened.
        const events: Array<{ type: PaymentEventTypeEnum; message: string; offsetMs: number }> = [
          {
            type: PaymentEventTypeEnum.PAYMENT_INITIATED,
            message: `Payment initiated via ${PAYMENT_GATEWAY_LABELS[pair.gateway]}`,
            offsetMs: 0,
          },
          {
            type: PaymentEventTypeEnum.GATEWAY_PROCESSING,
            message: 'Gateway processing the transaction',
            offsetMs: 15000,
          },
        ];

        if (isSettled) {
          events.push(
            {
              type: PaymentEventTypeEnum.WEBHOOK_RECEIVED,
              message: 'Gateway webhook received',
              offsetMs: 40000,
            },
            {
              type: PaymentEventTypeEnum.PAYMENT_VERIFIED,
              message: 'Payment verified against gateway validation API',
              offsetMs: 45000,
            },
            {
              type: PaymentEventTypeEnum.PAYMENT_SUCCEEDED,
              message: `Payment of ৳${amount.toLocaleString('en-BD')} captured`,
              offsetMs: 50000,
            },
            {
              type: PaymentEventTypeEnum.ORDER_UPDATED,
              message: `Order ${orderNumber} marked as paid`,
              offsetMs: 55000,
            },
          );
        } else if (status === PaymentTransactionStatusEnum.FAILED) {
          events.push({
            type: PaymentEventTypeEnum.PAYMENT_FAILED,
            message: 'Payment declined by gateway',
            offsetMs: 40000,
          });
        }

        // 5. Refunds — the refund rows and the payment's refundedAmount agree,
        //    so refunded totals are consistent and never double-counted.
        if (refundedAmount > 0) {
          await manager.save(
            manager.create(RefundEntity, {
              tenantId,
              refundNumber: `RFN-${stamp}-${seq}`,
              orderId: order.id,
              paymentId: payment.id,
              amount: refundedAmount,
              currency: 'BDT',
              method: pair.method,
              status: RefundStatusEnum.COMPLETED,
              reason: 'Customer returned the item',
              createdAt: new Date(createdAt.getTime() + 2 * 24 * 60 * 60 * 1000),
              completedAt: new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
            }),
          );
          refundsCreated++;

          events.push(
            {
              type: PaymentEventTypeEnum.REFUND_INITIATED,
              message: `Refund of ৳${refundedAmount.toLocaleString('en-BD')} initiated`,
              offsetMs: 2 * 24 * 60 * 60 * 1000,
            },
            {
              type: PaymentEventTypeEnum.REFUND_COMPLETED,
              message: 'Refund completed by gateway',
              offsetMs: 3 * 24 * 60 * 60 * 1000,
            },
          );
        }

        for (const event of events) {
          await manager.save(
            manager.create(PaymentEventEntity, {
              tenantId,
              paymentId: payment.id,
              type: event.type,
              message: event.message,
              createdAt: new Date(createdAt.getTime() + event.offsetMs),
            }),
          );
          eventsCreated++;
        }
      }
    });

    return {
      success: true,
      message: 'Successfully seeded realistic payment demo records.',
      gatewaysCreated,
      ordersCreated,
      paymentsCreated,
      refundsCreated,
      eventsCreated,
    };
  }

  /** Deterministic weighted pick so seeded distributions look realistic. */
  private pickGatewayMethod(index: number) {
    const totalWeight = DEMO_GATEWAY_METHODS.reduce((sum, g) => sum + g.weight, 0);
    let cursor = (index * 37) % totalWeight;
    for (const entry of DEMO_GATEWAY_METHODS) {
      if (cursor < entry.weight) return entry;
      cursor -= entry.weight;
    }
    return DEMO_GATEWAY_METHODS[0];
  }

  /** Covers every status the dashboard must render, including refund states. */
  private pickStatus(index: number): PaymentTransactionStatusEnum {
    const slot = index % 20;
    if (slot === 3 || slot === 14) return PaymentTransactionStatusEnum.PENDING;
    if (slot === 7) return PaymentTransactionStatusEnum.FAILED;
    if (slot === 11) return PaymentTransactionStatusEnum.REFUNDED;
    if (slot === 17) return PaymentTransactionStatusEnum.PARTIALLY_REFUNDED;
    if (slot === 19) return PaymentTransactionStatusEnum.CANCELLED;
    return PaymentTransactionStatusEnum.COMPLETED;
  }

  private pickAmount(index: number): number {
    const amounts = [4500, 2100, 1850, 3200, 2650, 2750, 4050, 1320, 5600, 980, 7400, 1650];
    return amounts[index % amounts.length];
  }

  private buildGatewayReference(gateway: PaymentGatewayEnum, seq: number): string {
    const prefixes: Record<PaymentGatewayEnum, string> = {
      [PaymentGatewayEnum.SSLCOMMERZ]: 'SSLCZ',
      [PaymentGatewayEnum.BKASH]: 'BK',
      [PaymentGatewayEnum.NAGAD]: 'NAG',
      [PaymentGatewayEnum.STRIPE]: 'pi_3NL8',
      [PaymentGatewayEnum.PAYPAL]: 'PAYPAL',
      [PaymentGatewayEnum.COD]: 'COD',
      [PaymentGatewayEnum.MANUAL]: 'MAN',
    };
    return `${prefixes[gateway]}-${(seq * 7919).toString(16).toUpperCase()}`;
  }

  private toOrderPaymentMethod(gateway: PaymentGatewayEnum): PaymentMethodEnum {
    switch (gateway) {
      case PaymentGatewayEnum.BKASH:
        return PaymentMethodEnum.BKASH;
      case PaymentGatewayEnum.NAGAD:
        return PaymentMethodEnum.NAGAD;
      case PaymentGatewayEnum.COD:
        return PaymentMethodEnum.COD;
      default:
        return PaymentMethodEnum.SSLCOMMERZ;
    }
  }

  private toOrderPaymentStatus(status: PaymentTransactionStatusEnum): PaymentStatusEnum {
    switch (status) {
      case PaymentTransactionStatusEnum.COMPLETED:
      case PaymentTransactionStatusEnum.PARTIALLY_REFUNDED:
        return PaymentStatusEnum.PAID;
      case PaymentTransactionStatusEnum.REFUNDED:
        return PaymentStatusEnum.REFUNDED;
      case PaymentTransactionStatusEnum.FAILED:
        return PaymentStatusEnum.FAILED;
      default:
        return PaymentStatusEnum.UNPAID;
    }
  }
}
