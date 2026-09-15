import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

/**
 * PATHAO_INTEGRATION_SPEC §6 — called before order creation to show the
 * delivery fee at checkout / in the admin "book courier" flow. `storeId` is
 * required by Pathao (the fee depends on distance from the pickup store), so
 * a store must already exist and be configured (see PathaoStoreService and
 * the `merchantStoreId` credential field) before this can be called.
 */
export class CalculatePathaoPriceDto {
  @ApiProperty({ description: 'Pathao store id (pickup point) — from Create/List Store' })
  @IsInt()
  @Min(1)
  storeId: number;

  @ApiProperty({ description: '1 = Document, 2 = Parcel', enum: [1, 2] })
  @IsInt()
  itemType: 1 | 2;

  @ApiProperty({ description: '48 = Normal Delivery, 12 = On Demand Delivery', enum: [48, 12] })
  @IsInt()
  deliveryType: 48 | 12;

  @ApiProperty({ description: 'Parcel weight in kg, 0.5–10', minimum: 0.5, maximum: 10 })
  @IsNumber()
  @Min(0.5)
  itemWeight: number;

  @ApiProperty({ description: "Recipient's Pathao city id" })
  @IsInt()
  @Min(1)
  recipientCity: number;

  @ApiProperty({ description: "Recipient's Pathao zone id" })
  @IsInt()
  @Min(1)
  recipientZone: number;
}

export class PathaoPriceDto {
  @ApiProperty()
  price: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  promoDiscount: number;

  @ApiProperty()
  planId: number;

  @ApiProperty()
  codEnabled: boolean;

  @ApiProperty()
  codPercentage: number;

  @ApiProperty()
  additionalCharge: number;

  /** What should be shown to the customer as the delivery charge. */
  @ApiProperty()
  finalPrice: number;
}
