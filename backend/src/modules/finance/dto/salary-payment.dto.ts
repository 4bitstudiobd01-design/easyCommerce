import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { SalaryPaymentMethodEnum, SalaryPaymentStatusEnum } from '../../hrm/entities/payslip.entity';
import { PayrollPaymentStatusEnum } from '../../hrm/entities/payroll-run.entity';

export class DisburseSalaryPaymentDto {
  @ApiProperty({ description: 'The ID of the payslip to disburse payment for' })
  @IsUUID()
  payslipId: string;

  @ApiPropertyOptional({ enum: SalaryPaymentMethodEnum, default: SalaryPaymentMethodEnum.CASH })
  @IsOptional()
  @IsEnum(SalaryPaymentMethodEnum)
  paymentMethod?: SalaryPaymentMethodEnum;

  @ApiPropertyOptional({ description: 'Finance Account ID to disburse from (e.g. Cash account ID)' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Cash hand voucher #1042' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class BulkDisburseSalaryPaymentDto {
  @ApiProperty({ description: 'Payroll Run ID to disburse payments for' })
  @IsUUID()
  payrollRunId: string;

  @ApiPropertyOptional({ description: 'Optional list of payslip IDs to disburse (if omitted, disburses all unpaid in this run)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  payslipIds?: string[];

  @ApiPropertyOptional({ enum: SalaryPaymentMethodEnum, default: SalaryPaymentMethodEnum.CASH })
  @IsOptional()
  @IsEnum(SalaryPaymentMethodEnum)
  paymentMethod?: SalaryPaymentMethodEnum;

  @ApiPropertyOptional({ description: 'Finance Account ID to disburse from' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Monthly salary bulk cash payout' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class ListSalaryPaymentRunsQueryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ example: 9, description: '1-12 month number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ enum: ['ALL', 'UNPAID', 'PARTIALLY_PAID', 'PAID'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class QuerySalaryPaymentSummaryDto {
  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({ example: 9, description: '1-12 month number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}

export class ListSalaryPaymentEmployeesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: ['ALL', 'UNPAID', 'PAID'] })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({ description: 'Search by employee name or code' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SalaryPaymentSummaryResponseDto {
  @ApiProperty({ example: 950000 })
  totalPayrollExpense: number;

  @ApiProperty({ example: 830000 })
  totalSalaryPayable: number;

  @ApiProperty({ example: 650000 })
  totalSalaryPaid: number;

  @ApiProperty({ example: 180000 })
  totalSalaryRemaining: number;

  @ApiProperty({ example: 75 })
  totalEmployeesPaid: number;

  @ApiProperty({ example: 25 })
  totalEmployeesUnpaid: number;

  @ApiProperty({ example: 4 })
  totalApprovedRuns: number;

  @ApiPropertyOptional({ example: 9 })
  selectedMonth?: number;

  @ApiPropertyOptional({ example: 2026 })
  selectedYear?: number;
}
