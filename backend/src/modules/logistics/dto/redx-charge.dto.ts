import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * REDX_OpenAPI_Integration_Spec.md §3.11 — query params for
 * GET /charge/charge_calculator. Call this before Create Parcel to show the
 * expected cost and sanity-check the COD amount.
 */
export class CalculateRedxChargeDto {
  @ApiProperty({ description: "Delivery area id, from GET /redx/areas" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  deliveryAreaId: number;

  @ApiProperty({ description: "Pickup area id, from GET /redx/areas" })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pickupAreaId: number;

  @ApiProperty({ description: 'Total COD amount to collect on delivery, in taka (0 if prepaid)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cashCollectionAmount: number;

  @ApiProperty({ description: 'Parcel weight in grams' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weight: number;
}

export class RedxChargeDto {
  @ApiProperty()
  deliveryCharge: number;

  @ApiProperty()
  codCharge: number;
}
