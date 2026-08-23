import { Injectable, BadRequestException } from '@nestjs/common';
import { GetOrderBalanceService } from './get-order-balance.service';
import { InitiateSslCommerzPaymentService } from './initiate-sslcommerz-payment.service';

export interface PaymentLinkResult {
  gatewayUrl: string;
  tranId: string;
  amount: number;
}

@Injectable()
export class CreatePaymentLinkForOrderService {
  constructor(
    private readonly getOrderBalanceService: GetOrderBalanceService,
    private readonly initiateSslCommerzPaymentService: InitiateSslCommerzPaymentService,
  ) {}

  /**
   * Generates a shareable SSLCommerz payment link for an existing order. `amount`
   * is optional — omitted, it defaults to the current balance due (not the full
   * order total, so a partially-paid order's link only asks for what's left).
   */
  async execute(tenantId: string, orderId: string, amount?: number): Promise<PaymentLinkResult> {
    const { balanceDue } = await this.getOrderBalanceService.execute(tenantId, orderId);

    if (balanceDue <= 0) {
      throw new BadRequestException('This order has no outstanding balance.');
    }

    const chargeAmount = amount ?? balanceDue;
    if (chargeAmount > balanceDue) {
      throw new BadRequestException(
        `Amount ৳${chargeAmount} exceeds the current balance due of ৳${balanceDue}.`,
      );
    }

    const { gatewayUrl, tranId } = await this.initiateSslCommerzPaymentService.execute(orderId, chargeAmount);

    return { gatewayUrl, tranId, amount: chargeAmount };
  }
}
