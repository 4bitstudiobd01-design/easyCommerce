import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceStatusEnum } from '../entities/attendance.entity';

export class CheckInDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({
    example: '2026-01-15',
    description: "The calendar day being checked into, as the caller's local date — the server does not guess a timezone.",
  })
  @IsDateString()
  date: string;
}

export class CheckOutDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  date: string;
}

export class MarkAttendanceStatusDto {
  @ApiProperty({ example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatusEnum })
  @IsEnum(AttendanceStatusEnum)
  status: AttendanceStatusEnum;

  @ApiPropertyOptional({ example: 'Approved sick leave' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListAttendanceQueryDto {
  @ApiPropertyOptional({ example: '2026-01-15', description: 'Defaults to today if omitted' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
