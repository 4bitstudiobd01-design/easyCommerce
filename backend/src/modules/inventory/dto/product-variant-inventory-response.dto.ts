import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export class ProductVariantInventoryItemDto {
  @ApiPropertyOptional({ example: 'inv-123-uuid' })
  inventoryStockId?: string;

  @ApiProperty({ example: 'var-456-uuid' })
  variantId: string;

  @ApiProperty({ example: '256GB / Natural Titanium' })
  variantTitle: string;

  @ApiPropertyOptional({ example: 'IP15PM-256-NT' })
  sku?: string;

  @ApiPropertyOptional({ example: 'https://img.easycommerce.app/var-1.jpg' })
  imageUrl?: string;

  @ApiProperty({ example: 45, description: 'Physical units on hand in warehouse' })
  quantityOnHand: number;

  @ApiProperty({ example: 3, description: 'Reserved units for active checkouts/orders' })
  quantityReserved: number;

  @ApiProperty({ example: 42, description: 'Sellable available inventory (onHand - reserved)' })
  availableQuantity: number;

  @ApiProperty({ example: 10, description: 'Reorder / Low stock threshold' })
  lowStockThreshold: number;

  @ApiProperty({ enum: StockStatus, example: StockStatus.IN_STOCK })
  status: StockStatus;

  @ApiPropertyOptional({ example: 'Central Warehouse' })
  warehouseName?: string;

  @ApiPropertyOptional({ example: 'wh-123-uuid' })
  warehouseId?: string;

  @ApiProperty({ example: true, description: 'Whether an inventory stock record is initialized' })
  isInitialized: boolean;

  @ApiPropertyOptional({ example: '2026-08-14T12:00:00Z' })
  updatedAt?: Date;
}

export class ProductVariantInventorySummaryDto {
  @ApiProperty({ example: 4 })
  totalVariants: number;

  @ApiProperty({ example: 75 })
  totalOnHand: number;

  @ApiProperty({ example: 4 })
  totalReserved: number;

  @ApiProperty({ example: 71 })
  totalAvailable: number;

  @ApiProperty({ example: 1 })
  lowStockVariants: number;

  @ApiProperty({ example: 1 })
  outOfStockVariants: number;

  @ApiProperty({ example: 2 })
  inStockVariants: number;
}

export class ProductVariantInventoryPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class ProductVariantInventoryProductContextDto {
  @ApiProperty({ example: 'prod-123-uuid' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @ApiProperty({ example: 'iphone-15-pro-max' })
  slug: string;

  @ApiPropertyOptional({ example: 'IP15PM' })
  sku?: string;

  @ApiPropertyOptional({ example: 'Mobiles & Tablets' })
  categoryName?: string;

  @ApiPropertyOptional({ example: 'https://img.easycommerce.app/p1.jpg' })
  thumbnail?: string;

  @ApiProperty({ example: true })
  trackInventory: boolean;

  @ApiProperty({ example: false })
  hasVariants: boolean;
}

export class ProductVariantInventoryResponseDto {
  @ApiProperty({ type: ProductVariantInventoryProductContextDto })
  product: ProductVariantInventoryProductContextDto;

  @ApiProperty({ type: ProductVariantInventorySummaryDto })
  summary: ProductVariantInventorySummaryDto;

  @ApiProperty({ type: [ProductVariantInventoryItemDto] })
  data: ProductVariantInventoryItemDto[];

  @ApiProperty({ type: ProductVariantInventoryPaginationMetaDto })
  meta: ProductVariantInventoryPaginationMetaDto;
}
