import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumberString, IsOptional, Max, Min } from 'class-validator';

export class SetSalaryStructureDto {
  @ApiProperty({ example: '35000.00' })
  @IsNumberString()
  basicSalary: string;

  @ApiPropertyOptional({ example: '10000.00' })
  @IsOptional()
  @IsNumberString()
  houseRentAllowance?: string;

  @ApiPropertyOptional({ example: '2000.00' })
  @IsOptional()
  @IsNumberString()
  medicalAllowance?: string;

  @ApiPropertyOptional({ example: '1500.00' })
  @IsOptional()
  @IsNumberString()
  conveyanceAllowance?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  otherAllowance?: string;

  @ApiPropertyOptional({ example: '0.00' })
  @IsOptional()
  @IsNumberString()
  providentFundDeduction?: string;
}

export class GeneratePayrollRunDto {
  @ApiProperty({ example: 8, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  year: number;
}

export class ListPayrollRunsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;
}
