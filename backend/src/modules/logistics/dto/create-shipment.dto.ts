import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CourierProviderEnum } from '../entities/consignment.entity';

export class ShipmentItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateShipmentDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: CourierProviderEnum, example: CourierProviderEnum.STEADFAST })
  @IsEnum(CourierProviderEnum)
  @IsNotEmpty()
  courierProvider: CourierProviderEnum;

  @ApiPropertyOptional({
    description: 'Defaults to the store address when omitted',
    example: 'Warehouse 3, Tejgaon I/A, Dhaka',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pickupAddress?: string;

  @ApiPropertyOptional({
    description: 'Defaults to the order shipping address when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'Defaults to the order customer phone when omitted',
    example: '+8801712345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Parcel weight in kilograms', example: 0.5, default: 0.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(100)
  parcelWeight?: number;

  @ApiPropertyOptional({ example: 'PARCEL', default: 'PARCEL' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  parcelType?: string;

  @ApiPropertyOptional({ description: 'LxWxH in centimetres', example: '20x15x10' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,3}\s*[xX*]\s*\d{1,3}\s*[xX*]\s*\d{1,3}$/, {
    message: 'parcelDimensions must look like 20x15x10 (LxWxH in cm)',
  })
  parcelDimensions?: string;

  @ApiPropertyOptional({
    description:
      'Cash to collect on delivery. Defaults to the order balance due; ignored for prepaid orders.',
    example: 2500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  codAmount?: number;

  @ApiPropertyOptional({
    description:
      "RedX's delivery_area_id (from GET /logistics/redx/areas). Required for RedX bookings — RedX has no free-text address resolver, so the merchant must pick an area.",
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  redxDeliveryAreaId?: number;

  @ApiPropertyOptional({ example: 'Call before delivery' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryNote?: string;

  @ApiPropertyOptional({ example: 'Fragile — handle with care' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  specialInstructions?: string;

  /**
   * Supplied by the client so a retried or double-clicked submission resolves to
   * the shipment already created rather than booking a second parcel.
   */
  @ApiPropertyOptional({
    description: 'Client-generated key making shipment creation idempotent',
    example: '8f14e45f-ea0b-4f2b-9c2a-3d5b7e1a9c44',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;

  @ApiPropertyOptional({
    description:
      'Which order items (and quantities) to ship in this parcel. Omitted means the whole order ships, matching prior behavior — this is how most bookings still work.',
    type: [ShipmentItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipmentItemDto)
  items?: ShipmentItemDto[];
}
