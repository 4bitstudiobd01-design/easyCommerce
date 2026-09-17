import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveTypeEnum } from '../entities/leave-request.entity';

export class CreateMyLeaveRequestDto {
  @ApiProperty({ enum: LeaveTypeEnum })
  @IsEnum(LeaveTypeEnum)
  leaveType: LeaveTypeEnum;

  @ApiProperty({ example: '2026-02-10' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-02-12' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Family emergency' })
  @IsOptional()
  @IsString()
  reason?: string;
}
