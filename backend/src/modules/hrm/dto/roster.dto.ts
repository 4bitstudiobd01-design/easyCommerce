import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListRosterQueryDto {
  @ApiProperty({ example: '2026-08-24' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-30' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}

export class AssignShiftDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  shiftId: string;

  @ApiProperty({ example: '2026-08-24' })
  @IsDateString()
  date: string;
}

export class RemoveShiftAssignmentQueryDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2026-08-24' })
  @IsDateString()
  date: string;
}
