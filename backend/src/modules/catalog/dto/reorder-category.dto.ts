import { IsNotEmpty, IsUUID, IsOptional, IsInt, Min, IsArray, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReorderCategoryDto {
  @ApiProperty({ description: 'Category ID to move or reorder', example: 'd3b07384-d113-4a0e-9e7b-232145e69c87' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'New parent category ID (null or empty string to move to root level)',
    example: 'd3b07384-d113-4a0e-9e7b-232145e69c88',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  newParentId?: string | null;

  @ApiPropertyOptional({
    description: 'Target sort order index among siblings (starts at 0)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  newSortOrder?: number;

  @ApiPropertyOptional({
    description: 'Optional ordered list of all sibling category IDs in desired sequential order',
    example: ['id-1', 'id-2', 'id-3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetSiblingIds?: string[];
}
