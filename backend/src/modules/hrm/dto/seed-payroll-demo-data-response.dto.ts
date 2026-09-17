import { ApiProperty } from '@nestjs/swagger';

export class SeedPayrollDemoDataResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully seeded realistic payroll demo records.' })
  message: string;

  @ApiProperty({ example: 6 })
  departmentsCreated: number;

  @ApiProperty({ example: 8 })
  employeesCreated: number;

  @ApiProperty({ example: 6 })
  taxSlabsCreated: number;

  @ApiProperty({ example: 8 })
  salaryStructuresCreated: number;

  @ApiProperty({ example: 4 })
  payrollRunsCreated: number;

  @ApiProperty({ example: 32 })
  payslipsCreated: number;
}
