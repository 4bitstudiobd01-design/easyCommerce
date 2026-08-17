import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MovementType } from '../enums/inventory-movement-type.enum';

export class InventoryHistoryItemProductDto {
  @ApiProperty({ example: 'prod-123' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro' })
  name: string;

  @ApiProperty({ example: 'iphone-15-pro' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://img.bitcommerce.app/p1.jpg' })
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'IP15PRO-BASE' })
  sku?: string;
}

export class InventoryHistoryItemVariantDto {
  @ApiProperty({ example: 'var-456' })
  id: string;

  @ApiProperty({ example: '256GB / Natural Titanium' })
  title: string;

  @ApiPropertyOptional({ example: 'IP15PRO-256-NAT' })
  sku?: string;
}

export class InventoryHistoryItemDto {
  @ApiProperty({ example: 'm1eebc99-9c0b-4ef8-bb6d-6bb9bd380m11' })
  id: string;

  @ApiProperty({ example: 's1eebc99-9c0b-4ef8-bb6d-6bb9bd380s11' })
  inventoryStockId?: string;

  @ApiProperty({ example: 'prod-123' })
  productId: string;

  @ApiProperty({ type: InventoryHistoryItemProductDto })
  product: InventoryHistoryItemProductDto;

  @ApiPropertyOptional({ type: InventoryHistoryItemVariantDto })
  variant?: InventoryHistoryItemVariantDto;

  @ApiProperty({ enum: MovementType, example: MovementType.IN })
  type: MovementType;

  @ApiProperty({ example: 10, description: 'Quantity delta (+10, -5, etc.)' })
  quantityDelta: number;

  @ApiProperty({ example: 45, description: 'Snapshotted stock count before movement' })
  quantityBefore: number;

  @ApiProperty({ example: 55, description: 'Resulting stock count after movement' })
  quantityAfter: number;

  @ApiProperty({ example: 'New Stock Received' })
  reason: string;

  @ApiPropertyOptional({ example: 'MANUAL_ADJUSTMENT' })
  referenceType?: string;

  @ApiPropertyOptional({ example: 'PO-1024' })
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Restock shipment arrived from port' })
  note?: string;

  @ApiPropertyOptional({ example: 'user-admin-1' })
  performedBy?: string;

  @ApiProperty({ example: '2026-08-14T12:00:00Z' })
  createdAt: Date;
}

export class InventoryHistoryPaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class InventoryHistoryResponseDto {
  @ApiProperty({ type: [InventoryHistoryItemDto] })
  data: InventoryHistoryItemDto[];

  @ApiProperty({ type: InventoryHistoryPaginationMetaDto })
  meta: InventoryHistoryPaginationMetaDto;
}
