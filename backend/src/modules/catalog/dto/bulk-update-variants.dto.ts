import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, IsOptional, IsNumber, Min, IsBoolean, IsInt } from 'class-validator';

export class BulkUpdateVariantsDto {
  @ApiProperty({ example: ['variant-uuid-1', 'variant-uuid-2'], description: 'Target Variant IDs' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one variant for bulk updating' })
  @IsUUID('4', { each: true })
  variantIds: string[];

  @ApiProperty({ example: 1250, description: 'Bulk price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 1500, description: 'Bulk compare-at price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiProperty({ example: 700, description: 'Bulk cost price override', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiProperty({ example: true, description: 'Bulk enable/disable toggle', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ example: 20, description: 'Bulk stock quantity adjustment or set', required: false })
  @IsOptional()
  @IsInt()
  stockQuantity?: number;
}
