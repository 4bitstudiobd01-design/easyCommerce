import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsUUID, IsInt } from 'class-validator';

export class UpdateProductVariantDto {
  @ApiProperty({ example: 'TS-BLK-S', description: 'Variant SKU', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: '8940001234501', description: 'Variant Barcode', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 1250, description: 'Variant price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 1500, description: 'Variant compare-at price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 700, description: 'Variant cost price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ example: 'image-uuid-1', description: 'Associated ProductImage ID', required: false })
  @IsOptional()
  @IsUUID()
  imageId?: string;

  @ApiProperty({ example: true, description: 'Whether variant is active and sellable', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ example: 50, description: 'Variant stock quantity on hand', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;
}
