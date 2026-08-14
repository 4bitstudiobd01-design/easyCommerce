import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../enums/category-status.enum';

export const ALLOWED_CATEGORY_SORT_FIELDS = [
  'sortOrder',
  'name',
  'createdAt',
  'updatedAt',
  'status',
  'productsCount',
] as const;

export type CategorySortField = typeof ALLOWED_CATEGORY_SORT_FIELDS[number];

export class CategoryListDto {
  @ApiPropertyOptional({ description: 'Page number, starts from 1', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for category name or slug' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: CategoryStatus, description: 'Filter by category status (ACTIVE, DRAFT, ARCHIVED)' })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiPropertyOptional({ description: 'Filter by parent category ID, "root" for top-level, or "all"' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    default: 'sortOrder',
    enum: ALLOWED_CATEGORY_SORT_FIELDS,
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_CATEGORY_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_CATEGORY_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: CategorySortField = 'sortOrder';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
