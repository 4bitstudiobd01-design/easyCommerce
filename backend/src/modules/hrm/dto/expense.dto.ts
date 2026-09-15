import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ExpenseCategoryEnum, ExpenseStatusEnum } from '../entities/expense.entity';

export class CreateExpenseDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: ExpenseCategoryEnum })
  @IsEnum(ExpenseCategoryEnum)
  category: ExpenseCategoryEnum;

  @ApiProperty({ example: '1250.00' })
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({ example: 'BDT' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class ReviewExpenseDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export class ListExpensesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ enum: ExpenseStatusEnum })
  @IsOptional()
  @IsEnum(ExpenseStatusEnum)
  status?: ExpenseStatusEnum;

  @ApiPropertyOptional({ enum: ExpenseCategoryEnum })
  @IsOptional()
  @IsEnum(ExpenseCategoryEnum)
  category?: ExpenseCategoryEnum;

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
