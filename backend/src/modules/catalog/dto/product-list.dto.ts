import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsIn, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { StockStatus } from '../enums/stock-status.enum';

export const ALLOWED_PRODUCT_SORT_FIELDS = [
  'createdAt',
  'name',
  'status',
  'productType',
] as const;

export type ProductSortField = typeof ALLOWED_PRODUCT_SORT_FIELDS[number];

export class ProductListDto {
  @ApiPropertyOptional({ description: 'Page number, starts from 1', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for product name, slug, SKU, or barcode' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Filter by product status (DRAFT, ACTIVE, ARCHIVED)' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ enum: ProductType, description: 'Filter by product type (PHYSICAL, DIGITAL, SERVICE)' })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ enum: StockStatus, description: 'Filter by stock availability status' })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({ description: 'Filter by Category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by Collection ID' })
  @IsOptional()
  @IsUUID()
  collectionId?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt', enum: ALLOWED_PRODUCT_SORT_FIELDS })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_PRODUCT_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_PRODUCT_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
