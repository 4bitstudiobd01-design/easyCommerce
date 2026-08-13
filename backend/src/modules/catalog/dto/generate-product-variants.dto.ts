import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class VariantDimensionSelectionDto {
  @ApiProperty({ example: 'attr-color-uuid', description: 'AttributeDefinition ID (must have isVariantOption=true)' })
  @IsUUID()
  @IsNotEmpty()
  attributeId: string;

  @ApiProperty({ example: ['opt-black-uuid', 'opt-white-uuid'], description: 'Selected AttributeOption IDs' })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one option must be selected per variant dimension' })
  @IsUUID('4', { each: true })
  optionIds: string[];
}

export class GenerateProductVariantsDto {
  @ApiProperty({ type: [VariantDimensionSelectionDto], description: 'Selected variant dimensions' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one variant dimension' })
  @ValidateNested({ each: true })
  @Type(() => VariantDimensionSelectionDto)
  dimensions: VariantDimensionSelectionDto[];
}
