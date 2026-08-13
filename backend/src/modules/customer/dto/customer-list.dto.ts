import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerStatusEnum, CustomerSourceEnum } from '../entities/customer.entity';

export const ALLOWED_CUSTOMER_SORT_FIELDS = [
  'createdAt',
  'firstName',
  'lastName',
  'name',
  'ordersCount',
  'totalSpent',
  'lastOrderAt',
] as const;

export type CustomerSortField = typeof ALLOWED_CUSTOMER_SORT_FIELDS[number];

export class CustomerListDto {
  @ApiPropertyOptional({ description: 'Page number, starts from 1', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of records per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term for name, email or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerStatusEnum, description: 'Filter by customer status' })
  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum;

  @ApiPropertyOptional({ enum: CustomerSourceEnum, description: 'Filter by customer source' })
  @IsOptional()
  @IsEnum(CustomerSourceEnum)
  source?: CustomerSourceEnum;

  @ApiPropertyOptional({ description: 'Filter by Customer Segment ID' })
  @IsOptional()
  @IsString()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'Start date for creation filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for creation filter (ISO string)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Preset date range in days (e.g. 7, 30, 90)' })
  @IsOptional()
  @IsString()
  dateRange?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_CUSTOMER_SORT_FIELDS, {
    message: `sortBy must be one of: ${ALLOWED_CUSTOMER_SORT_FIELDS.join(', ')}`,
  })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
