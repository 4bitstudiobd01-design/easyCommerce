import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

export class CustomerAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by date range preset in days (e.g. 7, 30, 90, 365 or ALL)', default: '30' })
  @IsOptional()
  @IsString()
  dateRange?: string;

  @ApiPropertyOptional({ description: 'Custom start date ISO string' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Custom end date ISO string' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: CustomerSourceEnum })
  @IsOptional()
  @IsEnum(CustomerSourceEnum)
  source?: CustomerSourceEnum;

  @ApiPropertyOptional({ enum: CustomerStatusEnum })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;
}
