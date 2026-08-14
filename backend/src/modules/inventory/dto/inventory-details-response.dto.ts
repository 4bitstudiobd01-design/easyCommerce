import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export class InventoryProductDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' })
  id: string;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  name: string;

  @ApiProperty({ example: 'iphone-15-pro-max' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://img.easycommerce.app/p1.jpg' })
  thumbnail?: string;

  @ApiPropertyOptional({ example: 'IP15PM-256' })
  sku?: string;

  @ApiProperty({ example: 'PHYSICAL' })
  productType: string;

  @ApiProperty({ example: true })
  trackInventory: boolean;

  @ApiProperty({ example: false })
  allowBackorder: boolean;

  @ApiPropertyOptional({
    example: { id: 'cat-1', name: 'Smartphones', slug: 'smartphones' },
  })
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export class InventoryVariantDto {
  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33' })
  id: string;

  @ApiProperty({ example: '256GB / Natural Titanium' })
  title: string;

  @ApiPropertyOptional({ example: 'IP15PM-256-NAT' })
  sku?: string;

  @ApiPropertyOptional({ example: 1199.99 })
  price?: number;

  @ApiPropertyOptional({ example: 'storage:256gb_color:natural' })
  combinationKey?: string;
}

export class InventoryWarehouseDto {
  @ApiProperty({ example: 'w1eebc99-9c0b-4ef8-bb6d-6bb9bd380w11' })
  id: string;

  @ApiProperty({ example: 'Central Dhaka Warehouse' })
  name: string;

  @ApiProperty({ example: 'DHK-CENTRAL' })
  code: string;

  @ApiPropertyOptional({ example: 'Plot 12, Tejgaon I/A, Dhaka' })
  address?: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  phone?: string;

  @ApiProperty({ example: true })
  isDefault: boolean;
}

export class InventoryDetailsResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' })
  productId: string;

  @ApiProperty({ type: InventoryProductDto })
  product: InventoryProductDto;

  @ApiPropertyOptional({ type: InventoryVariantDto })
  variant?: InventoryVariantDto;

  @ApiProperty({ type: InventoryWarehouseDto })
  warehouse: InventoryWarehouseDto;

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

  @ApiProperty({ example: '2026-08-10T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-14T12:00:00Z' })
  updatedAt: Date;
}
