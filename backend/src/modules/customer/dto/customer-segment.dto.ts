import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SegmentRuleConditionDto {
  @ApiProperty({ enum: ['ordersCount', 'totalSpent', 'status', 'source', 'origin', 'daysSinceLastOrder'] })
  @IsString()
  field: 'ordersCount' | 'totalSpent' | 'status' | 'source' | 'origin' | 'daysSinceLastOrder';

  @ApiProperty({ enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in'] })
  @IsString()
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';

  @ApiProperty({ description: 'Value to compare against' })
  @IsNotEmpty()
  value: any;
}

export class SegmentRuleGroupDto {
  @ApiProperty({ enum: ['ALL', 'ANY'], default: 'ALL' })
  @IsEnum(['ALL', 'ANY'])
  matchType: 'ALL' | 'ANY';

  @ApiProperty({ type: [SegmentRuleConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentRuleConditionDto)
  conditions: SegmentRuleConditionDto[];
}

export class CreateCustomerSegmentDto {
  @ApiProperty({ description: 'Segment name (e.g. VIP High Value)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ description: 'Segment description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: SegmentRuleGroupDto })
  @ValidateNested()
  @Type(() => SegmentRuleGroupDto)
  rules: SegmentRuleGroupDto;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCustomerSegmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: SegmentRuleGroupDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SegmentRuleGroupDto)
  rules?: SegmentRuleGroupDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
