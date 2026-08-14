import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentEventTypeEnum } from '../enums/payment-event-type.enum';
import { RefundStatusEnum } from '../entities/refund.entity';
import { PaymentTransactionCustomerDto } from './payment-transaction-list-response.dto';

export class PaymentTimelineEventDto {
  @ApiProperty() id: string;

  @ApiProperty({ enum: PaymentEventTypeEnum })
  type: PaymentEventTypeEnum;

  @ApiProperty({ example: 'Payment successful' })
  label: string;

  @ApiPropertyOptional() message?: string;

  @ApiProperty() createdAt: Date;
}

export class PaymentRefundSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() refundNumber: string;
  @ApiProperty() amount: number;
  @ApiProperty({ enum: RefundStatusEnum }) status: RefundStatusEnum;
  @ApiPropertyOptional() reason?: string;
  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() completedAt?: Date;
}

export class PaymentDetailsResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ example: 'TXN-10245' }) transactionNumber: string;

  @ApiPropertyOptional({ description: 'Masked gateway reference' })
  gatewayTransactionId?: string;

  @ApiProperty() orderId: string;
  @ApiProperty({ example: '#EC-1024' }) orderNumber: string;

  @ApiProperty({ type: PaymentTransactionCustomerDto })
  customer: PaymentTransactionCustomerDto;

  @ApiProperty({ enum: PaymentGatewayEnum }) gateway: PaymentGatewayEnum;
  @ApiProperty() gatewayLabel: string;

  @ApiProperty({ enum: PaymentMethodTypeEnum }) paymentMethod: PaymentMethodTypeEnum;
  @ApiProperty() paymentMethodLabel: string;

  @ApiProperty() amount: number;
  @ApiProperty() refundedAmount: number;
  @ApiProperty({ description: 'amount - refundedAmount' }) netAmount: number;
  @ApiProperty() currency: string;

  @ApiProperty({ enum: PaymentTransactionStatusEnum })
  status: PaymentTransactionStatusEnum;

  @ApiProperty() isRefundable: boolean;

  @ApiPropertyOptional() failureReason?: string;

  @ApiProperty() createdAt: Date;
  @ApiPropertyOptional() paidAt?: Date;

  @ApiProperty({ type: [PaymentRefundSummaryDto] })
  refunds: PaymentRefundSummaryDto[];

  @ApiProperty({ type: [PaymentTimelineEventDto] })
  timeline: PaymentTimelineEventDto[];
}
