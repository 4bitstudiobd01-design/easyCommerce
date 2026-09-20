import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateAttendanceDeductionPolicyDto {
  @ApiPropertyOptional({ example: 4, description: 'Every N LATE-marked attendance days in the payroll month = 1 deducted day.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  lateArrivalsPerDeductedDay?: number;

  @ApiPropertyOptional({ example: true, description: 'Deduct a full day\'s pay for each ABSENT-marked attendance day not covered by an approved leave.' })
  @IsOptional()
  @IsBoolean()
  deductUnmarkedAbsences?: boolean;
}
