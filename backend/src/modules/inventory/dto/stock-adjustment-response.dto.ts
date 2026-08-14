import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockStatus } from '../../catalog/enums/stock-status.enum';
import { MovementType } from '../enums/inventory-movement-type.enum';

export class StockSnapshotDto {
  @ApiProperty({ example: 45 })
  onHand: number;

  @ApiProperty({ example: 3 })
  reserved: number;

  @ApiProperty({ example: 42 })
  available: number;
}

export class MovementSummaryDto {
  @ApiProperty({ example: 'm1eebc99-9c0b-4ef8-bb6d-6bb9bd380m11' })
  id: string;

  @ApiProperty({ enum: MovementType, example: MovementType.IN })
  type: MovementType;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({ example: 45 })
  previousQuantity: number;

  @ApiProperty({ example: 55 })
  newQuantity: number;

  @ApiProperty({ example: 'New Stock Received' })
  reason: string;

  @ApiPropertyOptional({ example: 'PO-1024' })
  referenceId?: string;

  @ApiPropertyOptional({ example: 'Restock from Dhaka primary hub' })
  note?: string;

  @ApiPropertyOptional({ example: 'user-admin-1' })
  createdBy?: string;

  @ApiProperty({ example: '2026-08-14T12:00:00Z' })
  createdAt: Date;
}

export class StockAdjustmentResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'prod-123' })
  productId: string;

  @ApiPropertyOptional({ example: 'var-456' })
  variantId?: string;

  @ApiProperty({ example: 'wh-789' })
  warehouseId: string;

  @ApiProperty({ type: StockSnapshotDto })
  before: StockSnapshotDto;

  @ApiProperty({ type: StockSnapshotDto })
  after: StockSnapshotDto;

  @ApiProperty({ example: 10 })
  delta: number;

  @ApiProperty({ enum: StockStatus, example: StockStatus.IN_STOCK })
  status: StockStatus;

  @ApiProperty({ type: MovementSummaryDto })
  movement: MovementSummaryDto;
}
