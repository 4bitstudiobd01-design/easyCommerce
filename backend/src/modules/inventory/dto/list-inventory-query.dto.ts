import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';
import { ProductType } from '../../catalog/enums/product-type.enum';

export enum InventorySortField {
  UPDATED_AT = 'updatedAt',
  ON_HAND = 'quantityOnHand',
  AVAILABLE = 'availableQuantity',
  NAME = 'name',
  SKU = 'sku',
}

export class ListInventoryQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term by product name, SKU, or variant' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StockStatus, description: 'Filter by canonical stock status' })
  @IsOptional()
  @IsEnum(StockStatus)
  status?: StockStatus;

  @ApiPropertyOptional({ description: 'Filter by Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ProductType, description: 'Filter by Product Type' })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ description: 'Filter by Warehouse ID' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by Branch ID — shows the branch\'s own stock instead of a warehouse\'s' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: InventorySortField, default: InventorySortField.UPDATED_AT })
  @IsOptional()
  @IsString()
  sortBy?: string = InventorySortField.UPDATED_AT;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
