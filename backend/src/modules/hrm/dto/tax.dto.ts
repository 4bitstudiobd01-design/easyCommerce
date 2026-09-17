import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TaxSlabItemDto {
  @ApiProperty({ example: '0.00' })
  @IsNumberString()
  minAmount: string;

  @ApiPropertyOptional({ example: '350000.00', description: 'Omit for an open-ended top slab' })
  @IsOptional()
  @IsNumberString()
  maxAmount?: string;

  @ApiProperty({ example: '5', minimum: 0, maximum: 100 })
  @Type(() => Number)
  @Min(0)
  @Max(100)
  ratePercent: number;
}

export class SetTaxSlabsDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @IsNotEmpty()
  fiscalYear: string;

  @ApiProperty({ type: [TaxSlabItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaxSlabItemDto)
  slabs: TaxSlabItemDto[];
}

export class GetTaxSlabsQueryDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @IsNotEmpty()
  fiscalYear: string;
}

export class EstimateTaxQueryDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @IsNotEmpty()
  fiscalYear: string;

  @ApiProperty({ example: '600000.00' })
  @IsNumberString()
  annualIncome: string;
}
