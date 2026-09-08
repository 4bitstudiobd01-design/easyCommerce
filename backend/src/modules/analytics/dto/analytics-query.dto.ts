import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Custom start date ISO string' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Custom end date ISO string' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Comparison window: preceding period of equal length, or same dates last year',
    enum: ['previous', 'previousYear'],
  })
  @IsOptional()
  @IsIn(['previous', 'previousYear'])
  compare?: 'previous' | 'previousYear';

  @ApiPropertyOptional({
    description: 'Traffic-source breakdown dimension (traffic-sources endpoint only)',
    enum: ['channel', 'source', 'campaign'],
    default: 'channel',
  })
  @IsOptional()
  @IsIn(['channel', 'source', 'campaign'])
  groupBy?: 'channel' | 'source' | 'campaign';
}
