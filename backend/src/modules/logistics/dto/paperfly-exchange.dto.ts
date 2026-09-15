import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * PAPERFLY_INTEGRATION_GUIDE.md §3.2 — same endpoint as Create Order
 * (new_order_v2.php) with orderType: "Exchange" plus the exchange-specific
 * fields below. Kept as its own DTO/service rather than folded into the
 * regular booking flow: an exchange isn't a shipment booking BitCommerce's
 * order→shipment flow models today (CreateShipmentDto/CreateShipmentService),
 * it's a merchant-initiated action for an already-delivered order, so it's
 * exposed as a standalone endpoint a future "create exchange" UI action can
 * call directly.
 */
export class CreatePaperflyExchangeOrderDto {
  @ApiProperty({ description: 'Your own unique order id — also the idempotency key on Paperfly’s side' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  merchantOrderReference: string;

  @ApiProperty({ description: 'Short product description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  productBrief: string;

  @ApiProperty({ description: 'COD amount / package value collected on the original delivery' })
  @IsNumberString()
  packagePrice: string;

  @ApiProperty({ description: 'Weight of the original package, in kg (e.g. "0.3")' })
  @IsNumberString()
  maxWeight: string;

  @ApiProperty({ description: 'Recipient name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({ description: 'Recipient address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  customerAddress: string;

  @ApiProperty({ description: 'Recipient phone (BD format, 01XXXXXXXXX)' })
  @IsString()
  @Matches(/^01[3-9]\d{8}$/, { message: 'customerPhone must be an 11-digit Bangladeshi mobile number' })
  customerPhone: string;

  @ApiProperty({ description: 'Description of the exchange product' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  exchangeDescription: string;

  @ApiProperty({ description: 'Exchange amount' })
  @IsNumberString()
  exchangePrice: string;

  @ApiProperty({ description: 'Weight of the exchange item, in kg' })
  @IsNumberString()
  exchangeWeight: string;

  @ApiPropertyOptional({ description: 'Store/shop name registered with Paperfly — defaults to the saved credential when omitted' })
  @IsOptional()
  @IsString()
  storeName?: string;
}

export class PaperflyExchangeOrderResultDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  trackingNumber: string;

  @ApiPropertyOptional()
  trackingBarcode?: string;
}
