import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';
import { PaymentGatewayStatusEnum } from '../entities/payment-gateway.entity';

export class PaymentKpiMetricDto {
  @ApiProperty({ description: 'Aggregated amount for the current period' })
  amount: number;

  @ApiProperty({ description: 'Transaction count for the current period' })
  count: number;

  @ApiProperty({ description: 'Same aggregate for the immediately preceding period' })
  previousAmount: number;

  @ApiProperty({
    description:
      'Percent change vs the previous period. Null when the previous period is zero, so the UI never renders Infinity/NaN.',
    nullable: true,
    example: 12.5,
  })
  changePercent: number | null;
}

export class PaymentTopMethodDto {
  @ApiProperty({ enum: PaymentMethodTypeEnum })
  method: PaymentMethodTypeEnum;

  @ApiProperty({ example: 'bKash' })
  label: string;

  @ApiProperty({ example: 420000 })
  amount: number;

  @ApiProperty({ example: 120 })
  count: number;

  @ApiProperty({ description: 'Share of settled volume, 0-100', example: 49.7 })
  percentage: number;
}

export class PaymentGatewaySummaryDto {
  @ApiProperty() id: string;

  @ApiProperty({ enum: PaymentGatewayEnum })
  code: PaymentGatewayEnum;

  @ApiProperty({ example: 'bKash' })
  name: string;

  @ApiProperty({ example: 'Mobile Payment' })
  kind: string;

  @ApiProperty({ enum: PaymentGatewayStatusEnum })
  status: PaymentGatewayStatusEnum;

  @ApiProperty() isEnabled: boolean;
}

export class PaymentOverviewSliceDto {
  @ApiProperty({ example: 'Paid' })
  label: string;

  @ApiProperty({ example: 720000 })
  amount: number;

  @ApiProperty({ description: 'Share of total received, 0-100', example: 85.2 })
  percentage: number;
}

export class PaymentSummaryResponseDto {
  @ApiProperty({ type: PaymentKpiMetricDto })
  totalReceived: PaymentKpiMetricDto;

  @ApiProperty({ type: PaymentKpiMetricDto })
  paid: PaymentKpiMetricDto;

  @ApiProperty({ type: PaymentKpiMetricDto })
  pending: PaymentKpiMetricDto;

  @ApiProperty({ type: PaymentKpiMetricDto })
  refunded: PaymentKpiMetricDto;

  @ApiProperty({ type: [PaymentOverviewSliceDto], description: 'Donut chart slices' })
  overview: PaymentOverviewSliceDto[];

  @ApiProperty({ type: [PaymentTopMethodDto] })
  topPaymentMethods: PaymentTopMethodDto[];

  @ApiProperty({ type: [PaymentGatewaySummaryDto] })
  gateways: PaymentGatewaySummaryDto[];

  @ApiProperty({ example: 'BDT', description: 'Dominant currency across the filtered set' })
  currency: string;

  @ApiPropertyOptional({ description: 'Resolved inclusive start of the analysed window' })
  periodStart?: Date;

  @ApiPropertyOptional({ description: 'Resolved inclusive end of the analysed window' })
  periodEnd?: Date;
}
