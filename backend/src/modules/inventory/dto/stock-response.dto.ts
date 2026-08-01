import { ApiProperty } from '@nestjs/swagger';

export class StockResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' })
  productId: string;

  @ApiProperty({ example: "Men's Premium Cotton Shirt" })
  productTitle?: string;

  @ApiProperty({ example: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33' })
  warehouseId: string;

  @ApiProperty({ example: 'Main Dhaka Warehouse' })
  warehouseName?: string;

  @ApiProperty({ example: 50 })
  quantityOnHand: number;

  @ApiProperty({ example: 0 })
  quantityReserved: number;

  @ApiProperty({ example: 50 })
  availableQuantity: number;

  @ApiProperty({ example: 5 })
  reorderPoint: number;
}
