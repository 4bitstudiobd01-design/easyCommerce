import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class BulkAdjustStockDto {
  @ApiProperty({
    description: 'Array of target Inventory Stock UUIDs to adjust in bulk',
    example: ['s1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 's2eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one inventory item must be selected for bulk adjustment.' })
  @ArrayMaxSize(100, { message: 'Maximum 100 inventory items can be adjusted in a single bulk operation.' })
  @IsUUID('4', { each: true, message: 'Each inventory ID must be a valid UUID v4.' })
  inventoryIds: string[];

  @ApiProperty({
    enum: ['ADD', 'REMOVE', 'SET'],
    description: 'Adjustment operation type to apply across all selected items',
    example: 'ADD',
  })
  @IsEnum(['ADD', 'REMOVE', 'SET'], {
    message: 'Operation must be one of ADD, REMOVE, or SET.',
  })
  action: 'ADD' | 'REMOVE' | 'SET';

  @ApiProperty({
    description: 'Quantity value for adjustment (units to add/remove or absolute target quantity)',
    example: 10,
    minimum: 0,
    maximum: 1000000,
  })
  @IsInt({ message: 'Quantity must be an integer.' })
  @Min(0, { message: 'Quantity cannot be negative.' })
  @Max(1000000, { message: 'Quantity cannot exceed 1,000,000 units.' })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Business reason for bulk adjustment',
    example: 'Inventory Audit / Count',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Audit remarks and notes explaining the bulk operation',
    example: 'Q3 Physical warehouse inventory reconciliation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({
    description: 'Reference identifier (PO number, cycle count batch ID, etc.)',
    example: 'BATCH-2026-Q3-01',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  referenceId?: string;
}
