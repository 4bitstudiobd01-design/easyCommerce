import { ApiProperty } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export class InventoryListItemDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' })
  productId: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  productName: string;

  @ApiProperty({ example: 'iphone-15-pro-max' })
  productSlug: string;

  @ApiProperty({ example: 'https://img.easycommerce.app/p1.jpg', nullable: true })
  productThumbnail?: string;

  @ApiProperty({ example: 'Smartphones', nullable: true })
  categoryName?: string;

  @ApiProperty({ example: 'PHYSICAL' })
  productType: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', nullable: true })
  variantId?: string;

  @ApiProperty({ example: '256GB / Natural Titanium', nullable: true })
  variantTitle?: string;

  @ApiProperty({ example: 'IP15PM-256-NAT', nullable: true })
  sku?: string;

  @ApiProperty({ example: 'w1eebc99-9c0b-4ef8-bb6d-6bb9bd380w11' })
  warehouseId: string;

  @ApiProperty({ example: 'Central Dhaka Warehouse' })
  warehouseName: string;

  @ApiProperty({ example: 45 })
  quantityOnHand: number;

  @ApiProperty({ example: 3 })
  quantityReserved: number;

  @ApiProperty({ example: 42 })
  availableQuantity: number;

  @ApiProperty({ example: 10 })
  lowStockThreshold: number;

  @ApiProperty({ example: true })
  trackInventory: boolean;

  @ApiProperty({ example: false })
  allowBackorder: boolean;

  @ApiProperty({ enum: StockStatus, example: StockStatus.IN_STOCK })
  status: StockStatus;

  @ApiProperty({ example: '2026-08-14T12:00:00Z' })
  updatedAt: Date;
}

export class InventoryListPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1248 })
  total: number;

  @ApiProperty({ example: 125 })
  totalPages: number;
}

export class InventoryListResponseDto {
  @ApiProperty({ type: [InventoryListItemDto] })
  data: InventoryListItemDto[];

  @ApiProperty({ type: InventoryListPaginationMetaDto })
  meta: InventoryListPaginationMetaDto;
}
