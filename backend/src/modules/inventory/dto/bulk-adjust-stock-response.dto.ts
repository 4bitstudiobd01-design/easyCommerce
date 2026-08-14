import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export class BulkAdjustStockItemResultDto {
  @ApiProperty({ example: 's1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  inventoryId: string;

  @ApiProperty({ example: 'prod-123' })
  productId: string;

  @ApiPropertyOptional({ example: 'var-456' })
  variantId?: string;

  @ApiProperty({ example: 20, description: 'Previous on-hand stock' })
  previousQuantity: number;

  @ApiProperty({ example: 10, description: 'Quantity delta applied (+10, -5, etc.)' })
  quantityDelta: number;

  @ApiProperty({ example: 30, description: 'New on-hand stock' })
  newQuantity: number;

  @ApiProperty({ example: 27, description: 'New available stock (onHand - reserved)' })
  availableQuantity: number;

  @ApiProperty({ enum: StockStatus, example: StockStatus.IN_STOCK })
  status: StockStatus;

  @ApiProperty({ example: 'm1eebc99-9c0b-4ef8-bb6d-6bb9bd380m11', description: 'Created movement UUID' })
  movementId: string;
}

export class BulkAdjustStockResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 3, description: 'Total inventory items successfully updated' })
  affectedCount: number;

  @ApiProperty({ example: 3, description: 'Total historical movement ledger entries created' })
  movementCount: number;

  @ApiProperty({ type: [BulkAdjustStockItemResultDto] })
  items: BulkAdjustStockItemResultDto[];
}
