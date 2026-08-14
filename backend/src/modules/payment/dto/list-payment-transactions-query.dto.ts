import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentTransactionStatusEnum } from '../entities/payment.entity';
import { PaymentGatewayEnum } from '../enums/payment-gateway.enum';
import { PaymentMethodTypeEnum } from '../enums/payment-method.enum';

export enum PaymentTransactionSortField {
  CREATED_AT = 'createdAt',
  AMOUNT = 'amount',
  STATUS = 'status',
  ORDER_NUMBER = 'orderNumber',
}

/** Named relative windows offered by the dashboard date filter. */
export enum PaymentDateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  CUSTOM = 'custom',
}

export class ListPaymentTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Search by transaction number, gateway transaction ID, order number, customer name or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PaymentTransactionStatusEnum })
  @IsOptional()
  @IsEnum(PaymentTransactionStatusEnum)
  status?: PaymentTransactionStatusEnum;

  @ApiPropertyOptional({ enum: PaymentGatewayEnum })
  @IsOptional()
  @IsEnum(PaymentGatewayEnum)
  gateway?: PaymentGatewayEnum;

  @ApiPropertyOptional({ enum: PaymentMethodTypeEnum })
  @IsOptional()
  @IsEnum(PaymentMethodTypeEnum)
  paymentMethod?: PaymentMethodTypeEnum;

  @ApiPropertyOptional({
    enum: PaymentDateRangePreset,
    default: PaymentDateRangePreset.LAST_30_DAYS,
    description: 'Relative window; use CUSTOM together with dateFrom/dateTo',
  })
  @IsOptional()
  @IsEnum(PaymentDateRangePreset)
  dateRange?: PaymentDateRangePreset = PaymentDateRangePreset.LAST_30_DAYS;

  @ApiPropertyOptional({ description: 'ISO-8601 inclusive start of a custom range' })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 inclusive end of a custom range' })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'IANA timezone used to resolve relative ranges', default: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Minimum transaction amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum transaction amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Filter by transaction currency, e.g. BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    enum: PaymentTransactionSortField,
    default: PaymentTransactionSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(PaymentTransactionSortField)
  sortBy?: PaymentTransactionSortField = PaymentTransactionSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
