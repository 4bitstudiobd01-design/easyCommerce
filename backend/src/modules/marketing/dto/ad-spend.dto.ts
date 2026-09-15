import {
  IsEnum,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdSpendDimensionEnum } from '../entities/marketing-ad-spend.entity';

export class UpsertAdSpendDto {
  @ApiPropertyOptional({
    description: 'Existing entry id to update; omit to create a new entry',
    format: 'uuid',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({ enum: AdSpendDimensionEnum, example: AdSpendDimensionEnum.SOURCE })
  @IsEnum(AdSpendDimensionEnum)
  dimension: AdSpendDimensionEnum;

  @ApiProperty({ example: 'facebook', description: 'Concrete value: channel bucket, UTM source, or UTM campaign' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  dimensionValue: string;

  @ApiProperty({ example: '2026-09-01', description: 'Spend period start (ISO date)' })
  @IsISO8601()
  periodStart: string;

  @ApiProperty({ example: '2026-09-30', description: 'Spend period end (ISO date)' })
  @IsISO8601()
  periodEnd: string;

  @ApiProperty({ example: 90000, description: 'Spend amount in the given currency' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'BDT', description: 'ISO currency code (defaults to store currency)' })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ example: 'Eid campaign — Meta + Instagram' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}

export class ListAdSpendQueryDto {
  @ApiPropertyOptional({ enum: AdSpendDimensionEnum })
  @IsEnum(AdSpendDimensionEnum)
  @IsOptional()
  dimension?: AdSpendDimensionEnum;

  @ApiPropertyOptional({ description: 'Only entries whose period ends on/after this ISO date' })
  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Only entries whose period starts on/before this ISO date' })
  @IsISO8601()
  @IsOptional()
  dateTo?: string;
}

export class SourceSalesQueryDto {
  @ApiPropertyOptional({
    description: 'Breakdown dimension for the report',
    enum: ['channel', 'source', 'campaign'],
    default: 'channel',
  })
  @IsIn(['channel', 'source', 'campaign'])
  @IsOptional()
  groupBy?: 'channel' | 'source' | 'campaign';

  @ApiPropertyOptional({ description: 'Report window start (ISO date)' })
  @IsISO8601()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report window end (ISO date)' })
  @IsISO8601()
  @IsOptional()
  dateTo?: string;
}
