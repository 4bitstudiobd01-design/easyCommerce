import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CodStatusEnum,
  ConsignmentStatusEnum,
  CourierProviderEnum,
} from '../entities/consignment.entity';

export enum ShipmentSortField {
  CREATED_AT = 'createdAt',
  COD_AMOUNT = 'codAmount',
  STATUS = 'status',
  SHIPMENT_NUMBER = 'shipmentNumber',
}

/** Named relative windows offered by the dashboard date filter. */
export enum ShipmentDateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = '7d',
  LAST_30_DAYS = '30d',
  LAST_90_DAYS = '90d',
  CUSTOM = 'custom',
}

export class ListShipmentsQueryDto {
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
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Search by shipment number, order number, tracking code, customer name or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CourierProviderEnum })
  @IsOptional()
  @IsEnum(CourierProviderEnum)
  courierProvider?: CourierProviderEnum;

  @ApiPropertyOptional({ enum: ConsignmentStatusEnum })
  @IsOptional()
  @IsEnum(ConsignmentStatusEnum)
  status?: ConsignmentStatusEnum;

  @ApiPropertyOptional({ enum: CodStatusEnum })
  @IsOptional()
  @IsEnum(CodStatusEnum)
  codStatus?: CodStatusEnum;

  @ApiPropertyOptional({
    enum: ShipmentDateRangePreset,
    default: ShipmentDateRangePreset.LAST_30_DAYS,
    description: 'Relative window; use CUSTOM together with dateFrom/dateTo',
  })
  @IsOptional()
  @IsEnum(ShipmentDateRangePreset)
  dateRange?: ShipmentDateRangePreset = ShipmentDateRangePreset.LAST_30_DAYS;

  @ApiPropertyOptional({ description: 'ISO-8601 inclusive start of a custom range' })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'ISO-8601 inclusive end of a custom range' })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'IANA timezone used to resolve relative ranges',
    default: 'Asia/Dhaka',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Delivery city / area' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Minimum COD amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum COD amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ description: 'Minimum parcel weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({ description: 'Maximum parcel weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxWeight?: number;

  @ApiPropertyOptional({ enum: ShipmentSortField, default: ShipmentSortField.CREATED_AT })
  @IsOptional()
  @IsEnum(ShipmentSortField)
  sortBy?: ShipmentSortField = ShipmentSortField.CREATED_AT;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
