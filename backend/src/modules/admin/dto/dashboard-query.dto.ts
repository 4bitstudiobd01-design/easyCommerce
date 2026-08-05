import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum DateRangePreset {
  TODAY = 'today',
  SEVEN_DAYS = '7d',
  THIRTY_DAYS = '30d',
  NINETY_DAYS = '90d',
  ONE_YEAR = '1y',
}

export enum Currency {
  BDT = 'BDT',
  USD = 'USD',
}

export class DashboardSummaryQueryDto {
  @ApiPropertyOptional({ enum: DateRangePreset, default: DateRangePreset.THIRTY_DAYS })
  @IsOptional()
  @IsEnum(DateRangePreset)
  dateRangePreset?: DateRangePreset = DateRangePreset.THIRTY_DAYS;

  @ApiPropertyOptional({ enum: Currency, default: Currency.BDT })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency = Currency.BDT;
}

export class DashboardAnalyticsQueryDto {
  @ApiPropertyOptional({ enum: DateRangePreset, default: DateRangePreset.THIRTY_DAYS })
  @IsOptional()
  @IsEnum(DateRangePreset)
  timeframe?: DateRangePreset = DateRangePreset.THIRTY_DAYS;
}

export class DashboardOperationsQueryDto {
  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
