import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodEnum } from '../entities/order.entity';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, description: 'Order item quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'darucinifashon', description: 'Storefront slug' })
  @IsString()
  @IsNotEmpty()
  storeSlug: string;

  @ApiProperty({ example: 'Sumon Islam', description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+8801700000000', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'customer@example.com', required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ example: 'House 12, Road 4, Dhanmondi, Dhaka' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ example: 'Dhaka', description: 'City (Dhaka / Outside Dhaka)' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ enum: PaymentMethodEnum, example: PaymentMethodEnum.COD })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiProperty({ example: 'WELCOME10', required: false, description: 'Applied promo coupon code' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ required: false, description: 'Client-resolved marketing channel bucket; re-validated server-side' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmSource?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmMedium?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  utmCampaign?: string;

  @ApiProperty({ required: false, description: 'Referring hostname captured at storefront landing' })
  @IsOptional()
  @IsString()
  referrerHost?: string;

  @ApiProperty({ required: false, description: 'Client-generated storefront visit session id' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
