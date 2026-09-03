import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class BulkDeleteVariantsDto {
  @ApiProperty({ example: ['variant-uuid-1', 'variant-uuid-2'], description: 'Variant IDs to delete' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one variant to delete' })
  @IsUUID('4', { each: true })
  variantIds: string[];
}
