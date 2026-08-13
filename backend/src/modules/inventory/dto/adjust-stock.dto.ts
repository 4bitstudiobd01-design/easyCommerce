import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';

export enum StockAdjustmentAction {
  ADD = 'ADD',
  SET = 'SET',
  REMOVE = 'REMOVE',
}

export class AdjustStockDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'Product UUID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', description: 'Warehouse UUID', required: false })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ example: 50, description: 'Stock quantity adjustment' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ enum: StockAdjustmentAction, example: StockAdjustmentAction.ADD, description: 'Action type: ADD, SET, REMOVE' })
  @IsEnum(StockAdjustmentAction)
  action: StockAdjustmentAction;

  @ApiProperty({ example: 'Stock Received', description: 'Reason for adjustment', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
