import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoticePriorityEnum } from '../entities/notice.entity';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Office closed for Eid holidays' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The office will remain closed from...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ enum: NoticePriorityEnum, default: NoticePriorityEnum.NORMAL })
  @IsOptional()
  @IsEnum(NoticePriorityEnum)
  priority?: NoticePriorityEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateNoticeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ enum: NoticePriorityEnum })
  @IsOptional()
  @IsEnum(NoticePriorityEnum)
  priority?: NoticePriorityEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Pass null to clear the expiry' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class ListNoticesQueryDto {
  @ApiPropertyOptional({ default: false, description: 'Include expired notices (management view only)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeExpired?: boolean;
}
