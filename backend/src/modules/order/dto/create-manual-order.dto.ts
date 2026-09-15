import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsNotEmpty,
  ArrayMinSize,
} from 'class-validator';
import { PaymentMethodEnum } from '../entities/order.entity';

export class CreateManualOrderItemDto {
  /**
   * Present for a catalog-linked item; omitted for a custom/off-catalog item
   * (isCustomItem: true) — same conditional-validation shape as EditOrderItemDto,
   * kept identical so the two DTOs can share frontend item-picker logic.
   */
  @ApiPropertyOptional({ description: 'Required unless isCustomItem is true' })
  @ValidateIf((dto) => !dto.isCustomItem)
  @IsString()
  @IsNotEmpty()
  productId?: string;

  @ApiPropertyOptional({ description: 'Optional catalog variant selected for this line, when the product has variants' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ default: false, description: 'True for a merchant-entered line with no catalog product' })
  @IsOptional()
  @IsBoolean()
  isCustomItem?: boolean;

  @ApiPropertyOptional({ description: 'Required when isCustomItem is true', example: 'Gift wrapping' })
  @ValidateIf((dto) => dto.isCustomItem)
  @IsString()
  @IsNotEmpty()
  customTitle?: string;

  @ApiPropertyOptional({ description: 'Required when isCustomItem is true', example: 50 })
  @ValidateIf((dto) => dto.isCustomItem)
  @IsNumber()
  @Min(0)
  customUnitPrice?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ default: 0, description: 'Per-line discount, separate from the order-wide discount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;
}

export class CreateManualOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  area?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thana?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  division?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNote?: string;

  @ApiProperty({ enum: PaymentMethodEnum })
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountAmount: number;

  @ApiProperty({ type: [CreateManualOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateManualOrderItemDto)
  items: CreateManualOrderItemDto[];
}
