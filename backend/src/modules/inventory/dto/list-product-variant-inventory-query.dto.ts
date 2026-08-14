import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { StockStatus } from '../../catalog/enums/stock-status.enum';

export class ListProductVariantInventoryQueryDto {
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

  @ApiPropertyOptional({ description: 'Search term for variant title or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: StockStatus, description: 'Filter by canonical stock status' })
  @IsOptional()
  @IsEnum(StockStatus)
  status?: StockStatus;

  @ApiPropertyOptional({
    default: 'title',
    description: 'Sort field (title, sku, available, onHand, updatedAt)',
  })
  @IsOptional()
  @IsIn(['title', 'sku', 'available', 'onHand', 'updatedAt'])
  sortBy?: string = 'title';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC', description: 'Sort direction' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
