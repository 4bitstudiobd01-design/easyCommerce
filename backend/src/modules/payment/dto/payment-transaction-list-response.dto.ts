import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';

export class PaymentTransactionCustomerDto {
  @ApiPropertyOptional()
  id?: string;

  @ApiProperty({ example: 'Rahim Hossain' })
  name: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  phone?: string;
}

export class PaymentTransactionListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'TXN-10245' })
  transactionNumber: string;

  /**
   * Masked gateway transaction reference. Never the raw credential —
   * only enough to reconcile against the gateway dashboard.
   */
  @ApiPropertyOptional({ example: 'SSLCZ-8F92...' })
  gatewayTransactionId?: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ example: '#EC-1024' })
  orderNumber: string;

  @ApiProperty({ type: PaymentTransactionCustomerDto })
  customer: PaymentTransactionCustomerDto;

  @ApiProperty({ enum: PaymentGatewayEnum })
  gateway: PaymentGatewayEnum;

  @ApiProperty({ example: 'SSLCommerz' })
  gatewayLabel: string;

  @ApiProperty({ enum: PaymentMethodTypeEnum })
  paymentMethod: PaymentMethodTypeEnum;

  @ApiProperty({ example: 'bKash' })
  paymentMethodLabel: string;

  @ApiProperty({ example: 4500 })
  amount: number;

  @ApiProperty({ example: 0 })
  refundedAmount: number;

  @ApiProperty({ example: 'BDT' })
  currency: string;

  @ApiProperty({ enum: PaymentTransactionStatusEnum })
  status: PaymentTransactionStatusEnum;

  @ApiProperty({ description: 'True when a refund may legitimately be initiated' })
  isRefundable: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  paidAt?: Date;
}

export class PaymentPaginationMetaDto {
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() total: number;
  @ApiProperty() totalPages: number;
}

export class PaymentTransactionListResponseDto {
  @ApiProperty({ type: [PaymentTransactionListItemDto] })
  data: PaymentTransactionListItemDto[];

  @ApiProperty({ type: PaymentPaginationMetaDto })
  meta: PaymentPaginationMetaDto;
}
