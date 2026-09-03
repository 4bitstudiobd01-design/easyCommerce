import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One resolved variant row supplied at product-create time. The frontend computes
 * the Cartesian combinations locally (from the attribute options the merchant
 * picked) so a brand-new product no longer has to be saved just to attach
 * variants. The attribute/option ids come from real records created earlier via
 * the attributes endpoint.
 */
export class VariantOptionInputDto {
  @ApiProperty({ example: 'attr-uuid-1' })
  @IsString()
  attributeId: string;

  @ApiProperty({ example: 'Color' })
  @IsString()
  attributeName: string;

  @ApiProperty({ example: 'opt-uuid-1' })
  @IsString()
  optionId: string;

  @ApiProperty({ example: 'Black' })
  @IsString()
  optionLabel: string;

  @ApiProperty({ example: 'black' })
  @IsString()
  value: string;
}

export class CreateProductVariantInputDto {
  @ApiProperty({ example: 'Black / L' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'color:black|size:l', required: false })
  @IsOptional()
  @IsString()
  combinationKey?: string;

  @ApiProperty({ example: 'TS-BLK-L', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 1250, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Variant price cannot be negative' })
  price?: number;

  @ApiProperty({ example: 1500, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Variant compare-at price cannot be negative' })
  compareAtPrice?: number;

  @ApiProperty({ example: 700, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Variant cost price cannot be negative' })
  costPrice?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ type: [VariantOptionInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantOptionInputDto)
  options: VariantOptionInputDto[];
}
