import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CategoryStatus } from '../enums/category-status.enum';

export class BulkUpdateCategoryStatusDto {
  @ApiProperty({ example: ['cat-uuid-1', 'cat-uuid-2'], description: 'Category IDs to update' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one category to update status' })
  @ArrayMaxSize(500, { message: 'Cannot update more than 500 categories at once' })
  @IsUUID('4', { each: true, message: 'Each category ID must be a valid UUID' })
  categoryIds: string[];

  @ApiProperty({ enum: CategoryStatus, example: CategoryStatus.ACTIVE, description: 'Target category publication status' })
  @IsEnum(CategoryStatus, { message: 'Invalid category status' })
  status: CategoryStatus;
}
