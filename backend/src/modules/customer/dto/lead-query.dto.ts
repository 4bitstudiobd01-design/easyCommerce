import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LeadSourceEnum, LeadStageEnum } from '../entities/lead.entity';

export class LeadQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: LeadStageEnum, required: false })
  @IsOptional()
  @IsEnum(LeadStageEnum)
  stage?: LeadStageEnum;

  @ApiProperty({ enum: LeadSourceEnum, required: false })
  @IsOptional()
  @IsEnum(LeadSourceEnum)
  source?: LeadSourceEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @ApiProperty({ required: false, description: 'Filter by follow-up timing: ALL, MISSED, TODAY, TOMORROW, UPCOMING, CUSTOM' })
  @IsOptional()
  @IsString()
  followUpFilter?: string;

  @ApiProperty({ required: false, description: 'Filter by specific follow-up date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  followUpDate?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;
}
