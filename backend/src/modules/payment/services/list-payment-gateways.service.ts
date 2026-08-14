import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentGatewayEntity,
  PaymentGatewayStatusEnum,
} from '../entities/payment-gateway.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentGatewaySummaryDto } from '../dto/payment-summary-response.dto';
import {
  PAYMENT_GATEWAY_KINDS,
  PAYMENT_GATEWAY_LABELS,
  PaymentGatewayEnum,
} from '../enums/payment-gateway.enum';

/**
 * Lists the merchant's payment gateways for the dashboard filter dropdown and
 * the "Payment Gateways" panel. Never returns credentials — this module does
 * not store them.
 */
@Injectable()
export class ListPaymentGatewaysService {
  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private readonly gatewayRepository: Repository<PaymentGatewayEntity>,
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async execute(tenantId: string): Promise<PaymentGatewaySummaryDto[]> {
    const configured = await this.gatewayRepository.find({
      where: { tenantId },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    if (configured.length > 0) {
      return configured.map((gateway) => ({
        id: gateway.id,
        code: gateway.code,
        name: gateway.name,
        kind: gateway.kind,
        status: gateway.status,
        isEnabled: gateway.isEnabled,
      }));
    }

    // No explicit configuration yet — derive the gateway set from the tenant's
    // actual transactions so the filter still reflects real data.
    const observed = await this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .select('payment.gateway', 'code')
      .groupBy('payment.gateway')
      .orderBy('payment.gateway', 'ASC')
      .getRawMany<{ code: PaymentGatewayEnum }>();

    return observed.map((row) => ({
      id: row.code,
      code: row.code,
      name: PAYMENT_GATEWAY_LABELS[row.code] ?? row.code,
      kind: PAYMENT_GATEWAY_KINDS[row.code] ?? 'Payment Gateway',
      status: PaymentGatewayStatusEnum.CONNECTED,
      isEnabled: true,
    }));
  }
}
