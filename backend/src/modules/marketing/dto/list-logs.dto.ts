import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketingProviderEnum } from '../entities/marketing-pixel.entity';
import {
  MarketingEventStatusEnum,
  MarketingEventTransportEnum,
} from '../entities/marketing-event-log.entity';

export class ListMarketingLogsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  pixelId?: string;

  @ApiPropertyOptional({ enum: MarketingProviderEnum })
  @IsOptional()
  @IsEnum(MarketingProviderEnum)
  provider?: MarketingProviderEnum;

  @ApiPropertyOptional({ example: 'Purchase' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({ enum: MarketingEventTransportEnum })
  @IsOptional()
  @IsEnum(MarketingEventTransportEnum)
  transport?: MarketingEventTransportEnum;

  @ApiPropertyOptional({ enum: MarketingEventStatusEnum })
  @IsOptional()
  @IsEnum(MarketingEventStatusEnum)
  status?: MarketingEventStatusEnum;

  @ApiPropertyOptional({ description: 'Only rows created on/after this ISO date-time' })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Only rows created on/before this ISO date-time' })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
