import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { LeaveStatusEnum, LeaveTypeEnum } from '../entities/leave-request.entity';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  employeeId: string;

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

export class ReviewLeaveRequestDto {
  @ApiProperty({ enum: [LeaveStatusEnum.APPROVED, LeaveStatusEnum.REJECTED] })
  @IsEnum(LeaveStatusEnum)
  status: LeaveStatusEnum.APPROVED | LeaveStatusEnum.REJECTED;

  @ApiPropertyOptional({ example: 'Approved — enjoy your time off.' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

export class ListLeaveRequestsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: LeaveStatusEnum })
  @IsOptional()
  @IsEnum(LeaveStatusEnum)
  status?: LeaveStatusEnum;

  @ApiPropertyOptional({ enum: LeaveTypeEnum })
  @IsOptional()
  @IsEnum(LeaveTypeEnum)
  leaveType?: LeaveTypeEnum;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
