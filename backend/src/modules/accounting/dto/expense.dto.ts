import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ExpensePaymentMethodEnum,
  ExpenseStatusEnum,
} from '../entities/expense.entity';

export class CreateExpenseDto {
  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  vendor?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsEnum(ExpensePaymentMethodEnum)
  paymentMethod: ExpensePaymentMethodEnum;

  @IsEnum(ExpenseStatusEnum)
  status: ExpenseStatusEnum;

  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @IsOptional()
  @IsUUID()
  paidFromAccountId?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  vendor?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(ExpensePaymentMethodEnum)
  paymentMethod?: ExpensePaymentMethodEnum;

  @IsOptional()
  @IsEnum(ExpenseStatusEnum)
  status?: ExpenseStatusEnum;

  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @IsOptional()
  @IsUUID()
  paidFromAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  receiptUrl?: string;
}

export class ListExpensesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(ExpensePaymentMethodEnum)
  paymentMethod?: ExpensePaymentMethodEnum;

  @IsOptional()
  @IsEnum(ExpenseStatusEnum)
  status?: ExpenseStatusEnum;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
