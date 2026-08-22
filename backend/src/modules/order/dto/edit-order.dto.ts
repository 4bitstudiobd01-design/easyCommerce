import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsArray,
  ValidateNested,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class EditOrderItemDto {
  /**
   * Present for a catalog-linked item; omitted for a custom/off-catalog item
   * (isCustomItem: true). Validated conditionally rather than as two separate DTO
   * classes so the items array stays homogeneous.
   */
  @ApiPropertyOptional({ description: 'Required unless isCustomItem is true' })
  @ValidateIf((dto) => !dto.isCustomItem)
  @IsString()
  @IsNotEmpty()
  productId?: string;

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

export class EditOrderDto {
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

  @ApiProperty()
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  discountAmount: number;

  @ApiProperty({ type: [EditOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditOrderItemDto)
  items: EditOrderItemDto[];
}
