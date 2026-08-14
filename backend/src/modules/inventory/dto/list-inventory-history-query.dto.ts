import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsUUID,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType } from '../enums/inventory-movement-type.enum';

export class ListInventoryHistoryQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100, description: 'Page size' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: MovementType, description: 'Filter by movement type' })
  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @ApiPropertyOptional({ description: 'Filter by reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Filter by actor / user ID who performed the movement' })
  @IsOptional()
  @IsString()
  performedBy?: string;

  @ApiPropertyOptional({ description: 'Filter movements on or after this ISO date string (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter movements on or before this ISO date string (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search term for reference ID, reason, or notes' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Inventory Stock UUID' })
  @IsOptional()
  @IsUUID()
  inventoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Product UUID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by Variant UUID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ default: 'createdAt', description: 'Sort field' })
  @IsOptional()
  @IsIn(['createdAt', 'quantity', 'previousQuantity', 'newQuantity', 'type'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
