import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StockAdjustmentAction {
  ADD = 'ADD',
  SET = 'SET',
  REMOVE = 'REMOVE',
}

export enum StockAdjustmentReason {
  NEW_STOCK = 'NEW_STOCK',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
  MANUAL_CORRECTION = 'MANUAL_CORRECTION',
  INVENTORY_COUNT = 'INVENTORY_COUNT',
  RETURN = 'RETURN',
  OTHER = 'OTHER',
}

export class AdjustStockDto {
  @ApiPropertyOptional({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Product UUID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: 's0eebc99-9c0b-4ef8-bb6d-6bb9bd380s11', description: 'Inventory Stock UUID' })
  @IsOptional()
  @IsUUID()
  inventoryId?: string;

  @ApiPropertyOptional({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', description: 'Warehouse UUID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ example: 'v1eebc99-9c0b-4ef8-bb6d-6bb9bd380v11', description: 'Variant UUID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({
    enum: StockAdjustmentAction,
    example: StockAdjustmentAction.ADD,
    description: 'Adjustment action type: ADD, SET, REMOVE',
  })
  @IsEnum(StockAdjustmentAction)
  action: StockAdjustmentAction;

  @ApiProperty({ example: 10, description: 'Adjustment quantity (integer >= 0)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({
    example: 'New Stock Received',
    description: 'Reason for stock adjustment',
    default: 'Manual Adjustment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ example: 'PO-1024', description: 'Optional purchase order / audit reference' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    example: 'PURCHASE_ORDER',
    description: 'Origin of this movement (defaults to MANUAL_ADJUSTMENT)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ example: 'Restock from Dhaka primary hub', description: 'Optional audit note' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
